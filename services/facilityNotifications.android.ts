import AsyncStorage from "@react-native-async-storage/async-storage";
import {isRunningInExpoGo} from "expo";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import {AppState} from "react-native";
import {retryAfter} from "../api/MTRApi";
import {getFacilityOutages, InvalidFacilityFeedError} from "../api/FacilityOutageApi";
import {getFavoriteStations} from "../api/FrequentStationsApi";
import {mtrStationInfo} from "../data/MTRStationInfo";
import {AlertScope, compareFacilityAlerts, FacilityAlertState, initialAlertState, retainAlertStations} from "../data/facilityAlertMonitor";

import {isAccessibleFacility} from "../data/facilityOutages";
import {FacilityActivity, saveFacilityActivity} from "./facilityActivityLog";
import {FacilityPollingInterval, getFacilityPollingInterval, saveFacilityPollingInterval} from "./facilityPollingInterval";

const storageKey = "facility_alert_state_v1";
const taskName = "facility-outage-check";
const alarmMarkerKey = "facility_alarm_pending";
const channelId = "accessible-facility-outages";
type AlarmInterval = Extract<FacilityPollingInterval, 1 | 5 | 10>;
const isAlarmInterval = (interval: unknown): interval is AlarmInterval => interval === 1 || interval === 5 || interval === 10;
const alarmTaskName = (interval: AlarmInterval) => `com.sps99133.mtrnexttrain.facility-outage-check.${interval}`;
// Loading the optional Android native module would otherwise crash Expo Go on startup.
const alarm: typeof import("react-native-background-fetch").default | undefined =
    isRunningInExpoGo() ? undefined : require("react-native-background-fetch").default;
let configured = false;
let scheduledAlarm: AlarmInterval | undefined;
let foregroundTimer: ReturnType<typeof setInterval> | undefined;
let foregroundInterval: FacilityPollingInterval | undefined;
let foregroundPending = false;
let cooldown = 0;
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation);
    queue = result.catch(() => {});
    return result;
}
async function read(): Promise<FacilityAlertState> {
    const value = await AsyncStorage.getItem(storageKey);
    if (!value) return initialAlertState();
    const parsed = JSON.parse(value) as FacilityAlertState;
    if (typeof parsed.enabled !== "boolean" || !["favorites", "all"].includes(parsed.scope) ||
        !parsed.stations || typeof parsed.stations !== "object" || Array.isArray(parsed.stations) ||
        !Object.values(parsed.stations).every(keys => Array.isArray(keys) && keys.every(key => typeof key === "string"))) {
        throw new Error("Invalid facility alert settings");
    }
    if (parsed.details !== undefined && (!parsed.details || typeof parsed.details !== "object" || Array.isArray(parsed.details) ||
        !Object.values(parsed.details).every(detail => detail && typeof detail.name === "string" && typeof detail.location === "string"))) {
        throw new Error("Invalid facility alert details");
    }
    return parsed;
}
const save = (state: FacilityAlertState) => AsyncStorage.setItem(storageKey, JSON.stringify(state));
const permitted = async () => (await Notifications.getPermissionsAsync()).granted;
async function channel() {
    // Omitting sound selects Android's default. A string is treated as a bundled filename.
    await Notifications.setNotificationChannelAsync(channelId, {name: "無障礙設施停用及恢復通知",
        importance: Notifications.AndroidImportance.HIGH});
}
async function requestNotificationPermission() {
    await channel();
    if (!(await permitted()) && !(await Notifications.requestPermissionsAsync()).granted) {
        throw new Error("通知權限未開啟，請到 Android 設定允許通知。");
    }
}
export async function sendTestNotification(delaySeconds: 0 | 10 = 0): Promise<void> {
    await requestNotificationPermission();
    await Notifications.scheduleNotificationAsync({content: {title: "樂富站升降機停用（測試）",
        body: "這是測試訊息，模擬樂富站升降機暫停服務。", sound: true,
        data: {kind: "facility-test"}}, trigger: delaySeconds ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: delaySeconds, repeats: false, channelId
        } : {channelId}});
}
const schedulingError = () => new Error("無法更新背景檢查排程，請重試。");
async function scheduleAlarm(interval: AlarmInterval) {
    if (!await alarm?.scheduleTask({taskId: alarmTaskName(interval), delay: interval * 60000, periodic: true,
        forceAlarmManager: true, startOnBoot: true, stopOnTerminate: false, enableHeadless: true})) {
        throw schedulingError();
    }
    scheduledAlarm = interval;
}
async function cancelAlarm() {
    const previous = Number(await AsyncStorage.getItem(alarmMarkerKey));
    if (!scheduledAlarm && !isAlarmInterval(previous)) return;
    // The Android library only cancels tasks it knows in this process. Reuse the same
    // PendingIntent to replace a persisted alarm before stopping it after a cold start.
    if (!scheduledAlarm && isAlarmInterval(previous)) await scheduleAlarm(previous);
    if (!scheduledAlarm || !await alarm?.stop(alarmTaskName(scheduledAlarm))) throw schedulingError();
    scheduledAlarm = undefined;
    await AsyncStorage.removeItem(alarmMarkerKey);
}
async function reconcileSchedule(enabled: boolean, interval: FacilityPollingInterval) {
    const expoRegistered = await TaskManager.isTaskRegisteredAsync(taskName);
    if (!enabled) {
        if (expoRegistered) await BackgroundTask.unregisterTaskAsync(taskName);
        await cancelAlarm();
        return;
    }
    if (isAlarmInterval(interval)) {
        if (expoRegistered) await BackgroundTask.unregisterTaskAsync(taskName);
        if (!alarm) throw schedulingError();
        if (scheduledAlarm === interval) return;
        if (scheduledAlarm || Number(await AsyncStorage.getItem(alarmMarkerKey)) !== interval) await cancelAlarm();
        if (!configured) {
            const status = await alarm.configure({}, id => { void onAlarm(id); }, onAlarmTimeout);
            // configure also starts the library's default fetch. Only our custom task should run.
            if (!await alarm.stop("react-native-background-fetch") || status !== alarm.STATUS_AVAILABLE) throw schedulingError();
            configured = true;
        }
        await AsyncStorage.setItem(alarmMarkerKey, String(interval));
        await scheduleAlarm(interval);
        return;
    }
    await cancelAlarm();
    if (expoRegistered) {
        const options = await TaskManager.getTaskOptionsAsync<BackgroundTask.BackgroundTaskOptions>(taskName);
        if (options?.minimumInterval === interval) return;
        await BackgroundTask.unregisterTaskAsync(taskName);
    }
    if (await BackgroundTask.getStatusAsync() !== BackgroundTask.BackgroundTaskStatus.Available) throw schedulingError();
    await BackgroundTask.registerTaskAsync(taskName, {minimumInterval: interval});
    if (!await TaskManager.isTaskRegisteredAsync(taskName)) throw schedulingError();
}

async function check(state: FacilityAlertState, activity?: FacilityActivity, signal?: AbortSignal) {
    const progress = async (update: Partial<FacilityActivity>) => {
        if (activity) {
            Object.assign(activity, update);
            await saveFacilityActivity(activity);
        }
    };
    const ensureRunning = () => {
        if (signal?.aborted) throw new Error("Background check timed out");
    };
    ensureRunning();
    if (!state.enabled || !(await permitted())) {
        await progress({stage: "skipped", reason: !state.enabled ? "通知監察已關閉" : "通知權限未開啟"});
        return;
    }
    if (Date.now() < cooldown) {
        await progress({stage: "skipped", reason: "API 暫停接受請求"});
        return;
    }
    const favorites = await getFavoriteStations();
    ensureRunning();
    await progress({stage: "requesting", apiCalled: true});
    const feed = await getFacilityOutages(signal).catch(error => {
        cooldown = retryAfter(error);
        throw error;
    });
    ensureRunning();
    const monitored = state.scope === "favorites" ? [...new Set(favorites)] :
        [...new Set([...Object.keys(mtrStationInfo), ...Object.keys(state.stations), ...feed.notices.map(notice => notice.stationCode)])];
    await progress({stage: "feed-read", stationsChecked: monitored.length,
        facilities: feed.notices.filter(notice => monitored.includes(notice.stationCode) && isAccessibleFacility(notice))
            .map(({stationCode, name, location, message, english}) => ({stationCode, name, location, message, english}))});
    await compareFacilityAlerts(state, feed.notices, monitored, save, async (stationCode, facilities, event) => {
        ensureRunning();
        const name = Object.hasOwn(mtrStationInfo, stationCode) ? mtrStationInfo[stationCode].chineseName : stationCode;
        const labels = facilities.map(facility => facility ?
            `${facility.name}${facility.location ? `（${facility.location}）` : ""}` : "已記錄的無障礙設施").join("、");
        await Notifications.scheduleNotificationAsync({content: {
            title: `${name}站無障礙設施${event === "recovery" ? "已恢復服務" : "停用"}`,
            body: event === "recovery" ? `${labels}已恢復服務。` : labels,
            sound: true, data: {kind: event === "recovery" ? "facility-recovery" : "facility-outage", stationCode}}, trigger: {channelId}});
        await progress({notifications: (activity?.notifications ?? 0) + 1});
    });
    ensureRunning();
    await progress({stage: "success"});
}
const runBackground = (scheduler: "alarm" | "expo", signal?: AbortSignal, alarmId?: string) => serialize(async () => {
    const activity: FacilityActivity = {id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        startedAt: Date.now(), stage: "started", apiCalled: false, notifications: 0, scheduler};
    await saveFacilityActivity(activity);
    try {
        const state = await read();
        activity.scope = state.scope;
        activity.interval = await getFacilityPollingInterval();
        const selectedAlarm = isAlarmInterval(activity.interval) ? alarmTaskName(activity.interval) : undefined;
        const obsolete = scheduler === "expo" ? selectedAlarm !== undefined : selectedAlarm !== alarmId;
        if (obsolete && state.enabled) {
            activity.stage = "skipped";
            activity.reason = "背景排程已變更";
        } else {
            await check(state, activity, signal);
        }
        return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
        activity.reason = signal?.aborted ? "背景檢查逾時" :
            error instanceof InvalidFacilityFeedError ? "設施資料格式無效" :
            activity.stage === "requesting" ? "API 請求失敗" :
            activity.stage === "feed-read" ? "讀取設施資料後處理失敗" : "無法開始檢查";
        activity.stage = "failed";
        return BackgroundTask.BackgroundTaskResult.Failed;
    } finally {
        activity.finishedAt = Date.now();
        await saveFacilityActivity(activity);
    }
});
TaskManager.defineTask(taskName, () => runBackground("expo"));

let alarmRun: {id: string; controller: AbortController} | undefined;
function onAlarmTimeout(id: string) {
    if (alarmRun?.id === id) {
        alarmRun.controller.abort();
        alarmRun = undefined;
    }
    alarm?.finish(id);
}
async function onAlarm(id: string) {
    if (![1, 5, 10].some(interval => isAlarmInterval(interval) && alarmTaskName(interval) === id) ||
        AppState.currentState === "active" || alarmRun) { alarm?.finish(id); return; }
    const controller = new AbortController();
    alarmRun = {id, controller};
    try { await runBackground("alarm", controller.signal, id); }
    finally {
        if (alarmRun?.controller === controller) {
            alarmRun = undefined;
            alarm?.finish(id);
        }
    }
}
alarm?.registerHeadlessTask(async ({taskId, timeout}) => {
    if (timeout) onAlarmTimeout(taskId);
    else await onAlarm(taskId);
});

export function stopFacilityForegroundChecks() {
    clearInterval(foregroundTimer);
    foregroundTimer = undefined;
    foregroundInterval = undefined;
}
function reconcileForeground(enabled: boolean, interval: FacilityPollingInterval) {
    if (enabled && AppState.currentState === "active" && foregroundInterval === interval) return;
    stopFacilityForegroundChecks();
    if (!enabled || AppState.currentState !== "active") return;
    foregroundInterval = interval;
    foregroundTimer = setInterval(() => {
        if (foregroundPending || AppState.currentState !== "active") return;
        foregroundPending = true;
        void serialize(async () => {
            if (AppState.currentState === "active") await check(await read());
        }).catch(error => console.warn("Facility monitor", error)).finally(() => { foregroundPending = false; });
    }, interval * 60000);
}
Notifications.setNotificationHandler({handleNotification: async () => ({shouldPlaySound: true,
    shouldShowBanner: true, shouldShowList: true, shouldSetBadge: false})});

export const getAlertSettings = () => serialize(async () => ({...await read(), permitted: await permitted(),
    available: isAlarmInterval(await getFacilityPollingInterval()) ? !!alarm :
        await BackgroundTask.getStatusAsync() === BackgroundTask.BackgroundTaskStatus.Available,
    empty: (await getFavoriteStations()).length === 0}));
export const setAlertSettings = (enabled: boolean, scope: AlertScope) => serialize(async () => {
    const state = await read();
    const interval = await getFacilityPollingInterval();
    if (enabled) {
        await requestNotificationPermission();
        if (isAlarmInterval(interval) ? !alarm : await BackgroundTask.getStatusAsync() !== BackgroundTask.BackgroundTaskStatus.Available) {
            throw new Error("背景檢查暫時受限制，請檢查 Android 的電池及背景活動設定。");
        }
    }
    const favorites = await getFavoriteStations();
    const stations = enabled && state.enabled ? Object.fromEntries(Object.entries(state.stations)
        .filter(([code]) => scope === "all" || favorites.includes(code))) : {};
    const next = retainAlertStations({...state, enabled, scope, stations}, Object.keys(stations));
    await save(next);
    reconcileForeground(enabled, interval);
    await reconcileSchedule(enabled, interval);
    if (!enabled) return;
    try { await check(next); } catch { throw new Error("已啟用通知，暫時無法完成檢查，稍後會自動重試。"); }
});
export const bookmarksChanged = () => serialize(async () => {
    const state = await read();
    if (state.scope !== "favorites") return;
    const favorites = await getFavoriteStations();
    await save(retainAlertStations(state, favorites));
});
export const initializeFacilityNotifications = () => serialize(async () => {
    const state = await read();
    const interval = await getFacilityPollingInterval();
    reconcileForeground(state.enabled, interval);
    if (state.enabled) await channel();
    await reconcileSchedule(state.enabled, interval);
    if (state.enabled) await check(state);
});
export const setFacilityPollingInterval = (interval: FacilityPollingInterval) => serialize(async () => {
    const state = await read();
    await saveFacilityPollingInterval(interval);
    reconcileForeground(state.enabled, interval);
    await reconcileSchedule(state.enabled, interval);
});
export function subscribeToFacilityNotifications(listener: () => void) {
    let active = true;
    let lastId: string | undefined;
    const handle = (response: Notifications.NotificationResponse | null) => {
        if (!active || !response) return;
        const kind = response.notification.request.content.data?.kind;
        if (kind !== "facility-outage" && kind !== "facility-recovery" && kind !== "facility-test") return;
        if (lastId === response.notification.request.identifier) return;
        lastId = response.notification.request.identifier;
        listener();
        void Notifications.clearLastNotificationResponseAsync().catch(() => {});
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    void Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
    return () => { active = false; subscription.remove(); };
}
