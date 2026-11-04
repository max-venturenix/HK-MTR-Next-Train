import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import {getFacilityOutages, InvalidFacilityFeedError} from "../api/FacilityOutageApi";
import {getFavoriteStations} from "../api/FrequentStationsApi";
import {mtrStationInfo} from "../data/MTRStationInfo";
import {AlertScope, compareFacilityAlerts, FacilityAlertState, initialAlertState} from "../data/facilityAlertMonitor";

import {isAccessibleFacility} from "../data/facilityOutages";
import {FacilityActivity, saveFacilityActivity} from "./facilityActivityLog";

const storageKey = "facility_alert_state_v1";
const taskName = "facility-outage-check";
const channelId = "accessible-facility-outages";
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
    return parsed;
}
const save = (state: FacilityAlertState) => AsyncStorage.setItem(storageKey, JSON.stringify(state));
const permitted = async () => (await Notifications.getPermissionsAsync()).granted;
async function channel() {
    // Omitting sound selects Android's default. A string is treated as a bundled filename.
    await Notifications.setNotificationChannelAsync(channelId, {name: "無障礙設施停用通知",
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
async function register() {
    if (!(await TaskManager.isTaskRegisteredAsync(taskName))) {
        await BackgroundTask.registerTaskAsync(taskName, {minimumInterval: 15});
    }
}
async function unregister() {
    if (await TaskManager.isTaskRegisteredAsync(taskName)) await BackgroundTask.unregisterTaskAsync(taskName);
}
async function check(activity?: FacilityActivity) {
    const progress = async (update: Partial<FacilityActivity>) => {
        if (activity) {
            Object.assign(activity, update);
            await saveFacilityActivity(activity);
        }
    };
    const state = await read();
    await progress({scope: state.scope});
    if (!state.enabled || !(await permitted())) {
        await progress({stage: "skipped", reason: !state.enabled ? "通知監察已關閉" : "通知權限未開啟"});
        return;
    }
    const favorites = await getFavoriteStations();
    await progress({stage: "requesting", apiCalled: true});
    const feed = await getFacilityOutages();
    const monitored = state.scope === "favorites" ? [...new Set(favorites)] :
        [...new Set([...Object.keys(mtrStationInfo), ...feed.notices.map(notice => notice.stationCode)])];
    await progress({stage: "feed-read", stationsChecked: monitored.length,
        facilities: feed.notices.filter(notice => monitored.includes(notice.stationCode) && isAccessibleFacility(notice))
            .map(({stationCode, name, location, message, english}) => ({stationCode, name, location, message, english}))});
    await compareFacilityAlerts(state, feed.notices, monitored, save, async (stationCode, notices) => {
        const name = Object.hasOwn(mtrStationInfo, stationCode) ? mtrStationInfo[stationCode].chineseName : stationCode;
        await Notifications.scheduleNotificationAsync({content: {title: `${name}站無障礙設施停用`,
            body: notices.map(notice => `${notice.name}${notice.location ? `（${notice.location}）` : ""}`).join("、"),
            sound: true, data: {kind: "facility-outage", stationCode}}, trigger: {channelId}});
        await progress({notifications: (activity?.notifications ?? 0) + 1});
    });
    await progress({stage: "success"});
}
TaskManager.defineTask(taskName, () => serialize(async () => {
    const activity: FacilityActivity = {id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        startedAt: Date.now(), stage: "started", apiCalled: false, notifications: 0};
    await saveFacilityActivity(activity);
    try {
        await check(activity);
        return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
        activity.reason = error instanceof InvalidFacilityFeedError ? "設施資料格式無效" :
            activity.stage === "requesting" ? "API 請求失敗" :
            activity.stage === "feed-read" ? "讀取設施資料後處理失敗" : "無法開始檢查";
        activity.stage = "failed";
        return BackgroundTask.BackgroundTaskResult.Failed;
    } finally {
        activity.finishedAt = Date.now();
        await saveFacilityActivity(activity);
    }
}));
Notifications.setNotificationHandler({handleNotification: async () => ({shouldPlaySound: true,
    shouldShowBanner: true, shouldShowList: true, shouldSetBadge: false})});

export const getAlertSettings = () => serialize(async () => ({...await read(), permitted: await permitted(),
    available: await BackgroundTask.getStatusAsync() === BackgroundTask.BackgroundTaskStatus.Available,
    empty: (await getFavoriteStations()).length === 0}));
export const setAlertSettings = (enabled: boolean, scope: AlertScope) => serialize(async () => {
    const state = await read();
    if (enabled) {
        await requestNotificationPermission();
        if (await BackgroundTask.getStatusAsync() !== BackgroundTask.BackgroundTaskStatus.Available) {
            throw new Error("背景檢查暫時受限制，請檢查 Android 的電池及背景活動設定。");
        }
    }
    const favorites = await getFavoriteStations();
    const stations = enabled && state.enabled ? Object.fromEntries(Object.entries(state.stations)
        .filter(([code]) => scope === "all" || favorites.includes(code))) : {};
    await save({enabled, scope, stations});
    if (!enabled) { await unregister(); return; }
    await register();
    try { await check(); } catch { throw new Error("已啟用通知，暫時無法完成檢查，稍後會自動重試。"); }
});
export const bookmarksChanged = () => serialize(async () => {
    const state = await read();
    if (state.scope !== "favorites") return;
    const favorites = await getFavoriteStations();
    await save({...state, stations: Object.fromEntries(Object.entries(state.stations).filter(([code]) => favorites.includes(code)))});
});
export const initializeFacilityNotifications = () => serialize(async () => {
    const state = await read();
    if (!state.enabled) { await unregister(); return; }
    await channel();
    await register();
    await check();
});
export function subscribeToFacilityNotifications(listener: () => void) {
    let active = true;
    let lastId: string | undefined;
    const handle = (response: Notifications.NotificationResponse | null) => {
        if (!active || !response) return;
        const kind = response.notification.request.content.data?.kind;
        if (kind !== "facility-outage" && kind !== "facility-test") return;
        if (lastId === response.notification.request.identifier) return;
        lastId = response.notification.request.identifier;
        listener();
        void Notifications.clearLastNotificationResponseAsync().catch(() => {});
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    void Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
    return () => { active = false; subscription.remove(); };
}
