const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(
    fs.readFileSync(filename, "utf8"), {compilerOptions: {module: ts.ModuleKind.CommonJS,
        esModuleInterop: true}}).outputText, filename);
const api = require("../api/FacilityOutageApi.ts");
const {groupFacilityOutages, formatFacilityTimestamp} = require("../data/facilityOutages.ts");
const notice = (id = "001", code = "DIH", type = "AJ3") => `<outagemessage id="${id}" lastupdate="02-11-2026 14:11:39">
<stationcode>${code}</stationcode><facilitytype>${type}</facilitytype><facilityid>001</facilityid>
<facilityname_tc><![CDATA[&#x5347;&#38477;&#27231;]]></facilityname_tc><message_tc><![CDATA[&#32173;&#20462;]]></message_tc>
<location>Concourse</location><phonenumber>2928 2300</phonenumber></outagemessage>`;
const xml = rows => `<outagemessages lastupdate="02-11-2026 14:11:39">${rows}<outagefacilities><outagefacility><id>001</id></outagefacility></outagefacilities></outagemessages>`;
const feed = api.parseFacilityOutageFeed(xml(notice()));
assert.equal(feed.notices.length, 1);
assert.equal(feed.notices[0].name, "升降機");
assert.equal(feed.notices[0].message, "維修");
assert.equal(feed.notices[0].facilityId, "001");
assert.equal(feed.notices[0].id, "001");
assert.equal(feed.notices[0].phone, "29282300");
assert.equal(feed.notices[0].location, "Concourse");
const bilingualFeed = api.parseFacilityOutageFeed(xml(notice().replace("<location>",
    "<facilityname>Lift</facilityname><message>Under maintenance</message><location>")));
assert.equal(bilingualFeed.notices[0].name, "升降機");
assert.deepEqual(bilingualFeed.notices[0].english, {name: "Lift", location: "Concourse", message: "Under maintenance"});
assert.equal(feed.notices[0].english.name, ""); // Old feeds remain readable without English fields.
assert.equal(feed.updatedAt, "2026-11-02T06:11:39.000Z");
assert.equal(api.parseFacilityOutageFeed(xml("")).notices.length, 0);
assert.equal(api.parseFacilityOutageFeed("<outagemessages/>").notices.length, 0);
for (const value of ["", "<html/>", "<outagemessages>", xml("<outagemessage/>"), "<!DOCTYPE x><outagemessages/>"]) {
    assert.throws(() => api.parseFacilityOutageFeed(value));
}
assert.equal(api.parseFacilityTimestamp("31-02-2026 00:00:00"), undefined);
for (const timezone of ["UTC", "America/New_York", "Asia/Hong_Kong"]) {
    process.env.TZ = timezone;
    assert.equal(formatFacilityTimestamp(feed.updatedAt), "2026-11-02 14:11:39（香港時間）");
}
const multiple = api.parseFacilityOutageFeed(xml(notice() + notice("2", "XYZ", "UNKNOWN") + notice("3", "DIH", "ESCAINT")));
assert.equal(groupFacilityOutages(multiple.notices, true).length, 1);
assert.equal(groupFacilityOutages(multiple.notices, false).length, 2);
for (const query of ["鑽石", "diamond", "DIH"]) assert.equal(groupFacilityOutages(multiple.notices, false, query)[0].data.length, 2);
assert.equal(groupFacilityOutages(multiple.notices, false, "", "XYZ")[0].code, "XYZ");
assert.equal(groupFacilityOutages(multiple.notices, true, "missing").length, 0);
assert.equal(api.parseFacilityOutageFeed(xml(notice().replace("2928 2300", "javascript:1"))).notices[0].phone, undefined);
console.log("Facility XML, classification, filtering, fallback and timezone assertions passed.");

(async () => {
    const Module = require("node:module");
    const originalLoad = Module._load;
    const originalInterval = global.setInterval, originalClear = global.clearInterval;
    const originalGet = api.getFacilityOutages;
    let effect, tick, change, removed = false, cleared = false;
    const state = [], requests = [];
    const appState = {currentState: "active", addEventListener: (_, callback) => {
        change = callback; return {remove() { removed = true; }};
    }};
    Module._load = function (name, ...args) {
        if (name === "react") return {useCallback: fn => fn, useRef: value => ({current: value}),
            useState: initial => { const index = state.length; state.push(initial);
                return [initial, value => { state[index] = typeof value === "function" ? value(state[index]) : value; }]; }};
        if (name === "react-native") return {AppState: appState, Platform: {OS: "ios"}};
        if (name === "@react-native-async-storage/async-storage") return {getItem: async () => null};
        if (name === "expo-router") return {useFocusEffect: fn => { effect = fn; }};
        return originalLoad.call(this, name, ...args);
    };
    global.setInterval = (fn, duration) => { assert.equal(duration, 900000); tick = fn; return 1; };
    global.clearInterval = () => { cleared = true; };
    api.getFacilityOutages = signal => new Promise((resolve, reject) => requests.push({signal, resolve, reject}));
    const settle = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
    try {
        const {useFacilityOutages} = require("../ui/hooks/useFacilityOutages.ts");
        const hook = useFacilityOutages();
        const cleanup = effect();
        assert.equal(requests.length, 1);
        await settle();
        tick(); void hook.refresh();
        assert.equal(requests.length, 1);
        requests[0].resolve(feed); await settle();
        assert.equal(state[0], feed);
        tick(); requests[1].reject(new Error("offline")); await settle();
        assert.equal(state[0], feed); assert.ok(state[1]);
        tick(); appState.currentState = "background"; change("background");
        assert.ok(requests[2].signal.aborted);
        tick(); assert.equal(requests.length, 3);
        appState.currentState = "active"; change("active");
        assert.equal(requests.length, 4);
        const empty = {notices: []}; requests[3].resolve(empty); await settle();
        requests[2].resolve(feed); await settle();
        assert.equal(state[0], empty); assert.equal(state[1], undefined);
        tick(); cleanup(); assert.ok(requests[4].signal.aborted);
        requests[4].resolve(feed); await settle(); assert.equal(state[0], empty);
        assert.ok(removed && cleared);
        await hook.refresh(); assert.equal(requests.length, 5);
        console.log("Facility overlap, failure retention, background/resume, stale-result and blur assertions passed.");
    } finally {
        Module._load = originalLoad; global.setInterval = originalInterval; global.clearInterval = originalClear;
        api.getFacilityOutages = originalGet;
        delete require.cache[require.resolve("../services/facilityPollingInterval.ts")];
    }
})().catch(error => { console.error(error); process.exitCode = 1; });

async function verifyAlerts() {
    const Module = require("node:module");
    const originalLoad = Module._load;
    let stored;
    const historyStore = new Map();
    let failLog = false;
    let invalidFeed = false;
    let favorites = ["DIH", "HOK"];
    let notices = [feed.notices[0]];
    let failFetch = false;
    let failStation;
    let task;
    let registered = false;
    let expoInterval, alarmOptions, headless, alarmTimeout, blockedRequest;
    let failSchedule = false;
    let expoRegistrations = 0, alarmRegistrations = 0, fetches = 0;
    const finished = [];
    const appState = {currentState: "background"};
    let granted = true;
    let responseListener;
    let lastResponse = null;
    let responseRemoved = false;
    const deliveries = [];
    const triggers = [];
    const mocks = {
        "@react-native-async-storage/async-storage": {
            getItem: async key => key === "facility_alert_state_v1" ? stored ?? null : historyStore.get(key) ?? null,
            setItem: async (key, value) => {
                if (key === "facility_alert_state_v1") stored = value;
                else { if (failLog && key === "facility_activity_log_v1") throw new Error("Storage full"); historyStore.set(key, value); }
            },
            removeItem: async key => historyStore.delete(key)
        },
        "expo": {isRunningInExpoGo: () => false},
        "react-native": {AppState: appState},
        "react-native-background-fetch": {default: {
            STATUS_AVAILABLE: 2,
            configure: async (_, callback, timeout) => { alarmTimeout = timeout; return 2; },
            scheduleTask: async options => {
                assert.equal(registered, false, "cancel Expo before registering AlarmManager");
                if (failSchedule) return false;
                assert.equal(options.forceAlarmManager, true);
                assert.equal(options.periodic, true);
                assert.equal(options.enableHeadless, true);
                assert.equal(options.startOnBoot, true);
                assert.equal(options.stopOnTerminate, false);
                alarmOptions = options;
                alarmRegistrations++;
                return true;
            },
            stop: async id => {
                if (alarmOptions?.taskId === id) alarmOptions = undefined;
                return true;
            },
            finish: id => finished.push(id),
            registerHeadlessTask: fn => { headless = fn; }
        }},
        "expo-background-task": {BackgroundTaskResult: {Success: 1, Failed: 2},
            BackgroundTaskStatus: {Available: 1}, getStatusAsync: async () => 1,
            registerTaskAsync: async (_, options) => {
                assert.equal(alarmOptions, undefined, "cancel AlarmManager before registering Expo");
                expoInterval = options.minimumInterval; registered = true; expoRegistrations++;
            },
            unregisterTaskAsync: async () => { registered = false; }},
        "expo-task-manager": {defineTask: (_, fn) => { task = fn; }, isTaskRegisteredAsync: async () => registered,
            getTaskOptionsAsync: async () => ({minimumInterval: expoInterval})},
        "expo-notifications": {
            addNotificationResponseReceivedListener: listener => { responseListener = listener; return {remove: () => { responseRemoved = true; }}; },
            getLastNotificationResponseAsync: async () => lastResponse,
            clearLastNotificationResponseAsync: async () => {},
            AndroidImportance: {HIGH: 4},
            SchedulableTriggerInputTypes: {TIME_INTERVAL: "timeInterval"}, setNotificationHandler: () => {},
            setNotificationChannelAsync: async (_, options) => {
                assert.equal(Object.hasOwn(options, "sound"), false,
                    "omit channel sound to use Android's default without a missing custom-sound error");
                assert.equal(options.importance, 4);
            }, getPermissionsAsync: async () => ({granted}),
            requestPermissionsAsync: async () => ({granted}), scheduleNotificationAsync: async ({content, trigger}) => {
                if (failStation && content.data.stationCode === failStation) throw new Error("Delivery failed");
                deliveries.push(content);
                triggers.push(trigger);
            }},
        "../api/FrequentStationsApi": {getFavoriteStations: async () => favorites},
        "../api/FacilityOutageApi": {InvalidFacilityFeedError: api.InvalidFacilityFeedError, getFacilityOutages: async signal => {
            fetches++;
            if (blockedRequest) return new Promise((resolve, reject) => {
                blockedRequest(signal);
                signal.addEventListener("abort", () => reject(new Error("Aborted")), {once: true});
            });
            if (invalidFeed) throw new api.InvalidFacilityFeedError("Invalid XML");
            if (failFetch) throw new Error("Offline or invalid XML");
            return {notices};
        }}
    };
    Module._load = function (request, parent, main) {
        if ((parent?.filename.endsWith("facilityNotifications.android.ts") || parent?.filename.endsWith("facilityActivityLog.ts") || parent?.filename.endsWith("facilityPollingInterval.ts")) && mocks[request]) return mocks[request];
        return originalLoad.call(this, request, parent, main);
    };
    let monitor;
    try { monitor = require("../services/facilityNotifications.android.ts"); }
    finally { Module._load = originalLoad; }
    const history = () => JSON.parse(historyStore.get("facility_activity_log_v1") ?? "[]");
    await monitor.setAlertSettings(true, "favorites");
    assert.equal(history().length, 0, "settings checks do not enter background history");
    assert.equal(registered, true);
    assert.equal(deliveries.length, 0, "first check is silent");
    notices[0] = {...notices[0], english: bilingualFeed.notices[0].english};
    const second = {...feed.notices[0], id: "2", facilityId: "2"};
    const third = {...second, id: "3", facilityId: "3"};
    notices.push(second, third);
    await Promise.all([task(), task()]);
    assert.equal(history().length, 2);
    assert.equal(history()[0].stage, "success");
    assert.equal(history()[0].facilities.length, 3);
    assert.deepEqual(history()[0].facilities[0].english, bilingualFeed.notices[0].english);
    assert.equal(history().find(row => row.notifications)?.notifications, 1);
    assert.equal(history()[0].stationsChecked, 2);
    assert.equal(deliveries.length, 1, "overlapping checks produce one station alert");
    assert.equal(deliveries[0].data.stationCode, "DIH");
    assert.ok(deliveries[0].body.includes("、"), "multiple facilities share one notification");
    notices = notices.map(row => ({...row, id: "changed", updatedAt: "2030-01-01", message: "Changed"}));
    await monitor.initializeFacilityNotifications();
    assert.equal(deliveries.length, 1, "wording/timestamp changes and restart stay silent");
    assert.equal(history().length, 2, "foreground resume does not enter history");
    const before = stored;
    failFetch = true;
    assert.equal(await task(), 2);
    assert.equal(stored, before, "failed feed preserves observations");
    assert.equal(history()[0].reason, "API 請求失敗");
    failFetch = false;
    invalidFeed = true;
    assert.equal(await task(), 2);
    assert.equal(history()[0].reason, "設施資料格式無效");
    invalidFeed = false;
    notices = [];
    await task();
    assert.deepEqual(history()[0].facilities, []);
    assert.equal(deliveries.at(-1).data.kind, "facility-recovery");
    assert.equal(deliveries.at(-1).title, "鑽石山站無障礙設施已恢復服務");
    assert.ok(deliveries.at(-1).body.includes("升降機（Concourse）"));
    assert.ok(deliveries.at(-1).body.endsWith("已恢復服務。"));
    assert.equal(history()[0].notifications, 1);
    await task();
    assert.equal(deliveries.length, 2, "recovery is not repeated");
    notices = [second];
    await task();
    assert.equal(deliveries.length, 3, "outage returning after clearance alerts again");
    favorites = ["HOK"];
    await monitor.bookmarksChanged();
    favorites = ["HOK", "DIH"];
    await monitor.bookmarksChanged();
    await task();
    assert.equal(deliveries.length, 3, "newly added bookmark gets a silent baseline");
    notices.push({...second, stationCode: "AIR"});
    await monitor.setAlertSettings(true, "all");
    assert.equal(deliveries.length, 3, "expanded scope baselines new stations");
    notices.push(third, {...third, stationCode: "HOK"});
    failStation = "HOK";
    assert.equal(await task(), 2);
    assert.equal(deliveries.length, 4);
    assert.equal(history()[0].reason, "讀取設施資料後處理失敗");
    assert.equal(history()[0].notifications, 1);
    failStation = undefined;
    await task();
    assert.equal(deliveries.length, 5, "failed station retries without repeating successful station");
    assert.equal(deliveries.at(-1).data.stationCode, "HOK");
    granted = false;
    notices.push({...third, facilityId: "4"});
    await task();
    assert.equal(history()[0].stage, "skipped");
    assert.equal(history()[0].apiCalled, false);
    assert.equal(deliveries.length, 5, "revoked permission prevents delivery");
    await monitor.setAlertSettings(false, "favorites");
    assert.equal(registered, false);
    await assert.rejects(monitor.setAlertSettings(true, "favorites"));
    assert.equal(JSON.parse(stored).enabled, false, "permission denial keeps alerts off");
    granted = true;
    await monitor.setAlertSettings(true, "favorites");
    assert.equal(deliveries.length, 5, "re-enable silently baselines again");
    failLog = true;
    assert.equal(await task(), 1, "log write failure preserves enabled check success");
    failLog = false;
    await monitor.setAlertSettings(false, "favorites");
    await task();
    assert.equal(history()[0].reason, "通知監察已關閉");
    failLog = true;
    assert.equal(await task(), 1, "log write failure does not fail a skipped monitor");
    failLog = false;
    const beforeTest = stored;
    await monitor.sendTestNotification();
    assert.equal(deliveries.length, 6, "test notification sends immediately with monitoring off");
    assert.equal(deliveries.at(-1).title, "樂富站升降機停用（測試）");
    assert.equal(deliveries.at(-1).body, "這是測試訊息，模擬樂富站升降機暫停服務。");
    assert.equal(deliveries.at(-1).sound, true);
    assert.equal(deliveries.at(-1).data.kind, "facility-test");
    assert.equal(stored, beforeTest, "test leaves settings and observations unchanged");
    assert.equal(registered, false, "test does not register background monitoring");
    assert.deepEqual(triggers.at(-1), {channelId: "accessible-facility-outages"});
    await monitor.sendTestNotification(10);
    assert.equal(deliveries.length, 7, "delayed test is submitted to Android's scheduler");
    assert.equal(deliveries.at(-1).title, "樂富站升降機停用（測試）");
    assert.equal(deliveries.at(-1).body, "這是測試訊息，模擬樂富站升降機暫停服務。");
    assert.deepEqual(triggers.at(-1), {type: "timeInterval", seconds: 10, repeats: false,
        channelId: "accessible-facility-outages"});
    assert.equal(stored, beforeTest, "delayed test leaves monitoring unchanged");
    granted = false;
    await assert.rejects(monitor.sendTestNotification());
    assert.equal(deliveries.length, 7, "permission denial prevents a test notification");
    const log = require("../services/facilityActivityLog.ts");
    const now = Date.now();
    historyStore.set("facility_activity_log_v1", JSON.stringify([...history(),
        {id: "expired", startedAt: now - 6 * 3600000 - 1, stage: "started", apiCalled: false, notifications: 0}]));
    await log.saveFacilityActivity({id: "interrupted", startedAt: now, stage: "requesting", apiCalled: true, notifications: 0});
    delete require.cache[require.resolve("../services/facilityActivityLog.ts")];
    Module._load = function (request, parent, main) {
        if (request === "@react-native-async-storage/async-storage") return mocks[request];
        return originalLoad.call(this, request, parent, main);
    };
    let reloaded;
    try { reloaded = require("../services/facilityActivityLog.ts"); } finally { Module._load = originalLoad; }
    const logs = await reloaded.getFacilityActivity();
    assert.equal(logs.find(row => row.id === "interrupted").stage, "requesting", "persisted request stage survives module restart");
    assert.equal(logs.find(row => row.id === "interrupted").finishedAt, undefined);
    assert.ok(logs.every((row, index) => !index || logs[index - 1].startedAt >= row.startedAt));
    assert.ok(logs.some(row => row.id === "expired"), "history is retained regardless of age");
    const count = logs.length;
    await reloaded.getFacilityActivity();
    assert.equal(history().length, count, "viewing history adds no run");
    granted = true;
    favorites = ["DIH"];
    stored = JSON.stringify({enabled: true, scope: "favorites", stations: {DIH: [JSON.stringify(["DIH", "legacy"])]}});
    notices = [];
    await task();
    assert.equal(deliveries.at(-1).body, "已記錄的無障礙設施已恢復服務。");
    assert.equal(deliveries.at(-1).data.kind, "facility-recovery");
    notices = [{...second, stationCode: "UNKNOWN"}];
    await monitor.setAlertSettings(true, "all");
    const beforeUnknownRecovery = deliveries.length;
    notices = [];
    await task();
    assert.equal(deliveries.length, beforeUnknownRecovery + 1, "all-stations retains previously observed unknown stations");
    assert.equal(deliveries.at(-1).data.stationCode, "UNKNOWN");
    assert.equal(history()[0].notifications, 1);
    await monitor.initializeFacilityNotifications();
    assert.equal(deliveries.length, beforeUnknownRecovery + 1, "restart does not repeat recovery");
    const response = (identifier, kind) => ({notification: {request: {identifier, content: {data: {kind}}}}});
    lastResponse = response("cold", "facility-recovery");
    let navigations = 0;
    const unsubscribe = monitor.subscribeToFacilityNotifications(() => { navigations++; });
    await Promise.resolve();
    assert.equal(navigations, 1, "cold-start recovery response opens facilities");
    responseListener(lastResponse);
    assert.equal(navigations, 1, "duplicate response is ignored");
    for (const kind of ["facility-recovery", "facility-outage", "facility-test"]) responseListener(response(kind, kind));
    assert.equal(navigations, 4, "all supported notification kinds open facilities");
    responseListener(response("unrelated", "other"));
    assert.equal(navigations, 4);
    unsubscribe();
    assert.equal(responseRemoved, true);
    responseListener(response("after-unsubscribe", "facility-recovery"));
    assert.equal(navigations, 4);
    const historyKey = "facility_activity_log_v1";
    historyStore.delete(historyKey);
    assert.deepEqual(await reloaded.getFacilityActivity(), []);
    const seed = Array.from({length: 31}, (_, i) => ({id: `run-${i}`, startedAt: now - i * 86400000,
        stage: "started", apiCalled: false, notifications: 0}));
    historyStore.set(historyKey, JSON.stringify(seed.toReversed()));
    assert.deepEqual(await reloaded.getFacilityActivity(), seed.slice(0, 30));
    assert.equal(history().length, 30);
    await reloaded.saveFacilityActivity({...seed[3], stage: "success"});
    assert.equal(history().find(row => row.id === seed[3].id).stage, "success");
    assert.equal(history().length, 30);
    await reloaded.saveFacilityActivity({...seed[0], id: "new", startedAt: now + 1});
    assert.deepEqual(history().map(row => row.id), ["new", ...seed.slice(0, 29).map(row => row.id)]);
    console.log("Background activity stages, 30-run retention, old records and storage isolation assertions passed.");

    const intervals = require("../services/facilityPollingInterval.ts");
    assert.equal(await intervals.getFacilityPollingInterval(), 15);
    historyStore.set("facility_polling_interval", "12");
    assert.equal(await intervals.getFacilityPollingInterval(), 15);
    const originalBaseline = stored;
    let oldAlarmId;
    for (const interval of [1, 5, 10, 30, 15]) {
        await monitor.setFacilityPollingInterval(interval);
        assert.equal(await intervals.getFacilityPollingInterval(), interval);
        assert.equal(registered, interval >= 15);
        if (registered) assert.equal(expoInterval, interval);
        else assert.equal(alarmOptions.delay, interval * 60000);
        const schedules = expoRegistrations + alarmRegistrations;
        await monitor.setFacilityPollingInterval(interval);
        assert.equal(expoRegistrations + alarmRegistrations, schedules, "unchanged interval is idempotent");
        if (oldAlarmId) {
            const beforeFetch = fetches;
            await headless({taskId: oldAlarmId, timeout: false});
            assert.equal(fetches, beforeFetch, "obsolete alarm does not fetch");
        }
        oldAlarmId = alarmOptions?.taskId;
    }
    assert.equal(stored, originalBaseline, "switches retain outage baselines");
    failSchedule = true;
    await assert.rejects(monitor.setFacilityPollingInterval(1));
    assert.equal(await intervals.getFacilityPollingInterval(), 1);
    failSchedule = false;
    await monitor.initializeFacilityNotifications();
    assert.equal(alarmOptions.delay, 60000, "resume repairs failed registration");
    const taskId = alarmOptions.taskId;
    const beforeFetch = fetches;
    await task();
    assert.equal(fetches, beforeFetch, "obsolete Expo task does not fetch");
    await headless({taskId, timeout: false});
    assert.equal(finished.at(-1), taskId);
    assert.equal(history()[0].interval, 1);
    assert.equal(history()[0].scheduler, "alarm");

    let signal;
    const started = new Promise(resolve => { blockedRequest = current => { signal = current; resolve(); }; });
    const run = headless({taskId, timeout: false});
    await started;
    const finishesBeforeTimeout = finished.length;
    alarmTimeout(taskId);
    await run;
    blockedRequest = undefined;
    assert.equal(signal.aborted, true);
    assert.equal(finished.length, finishesBeforeTimeout + 1, "timed-out run finishes exactly once");
    assert.equal(history()[0].reason, "背景檢查逾時");

    const setIntervalOriginal = global.setInterval, clearIntervalOriginal = global.clearInterval;
    let foregroundTick, timerCleared = false;
    global.setInterval = (fn, delay) => { assert.equal(delay, 300000); foregroundTick = fn; return 100; };
    global.clearInterval = id => { if (id === 100) timerCleared = true; };
    try {
        appState.currentState = "active";
        await monitor.setFacilityPollingInterval(5);
        const beforeTick = fetches;
        foregroundTick();
        await monitor.getAlertSettings();
        assert.equal(fetches, beforeTick + 1);
        await monitor.setAlertSettings(false, "all");
        assert.equal(timerCleared, true);
        assert.equal(alarmOptions, undefined);
        assert.equal(registered, false);
    } finally {
        global.setInterval = setIntervalOriginal;
        global.clearInterval = clearIntervalOriginal;
    }
    console.log("Intervals, scheduler switches, idempotence, repair, obsolete callbacks, timeout and foreground checks passed.");
    console.log("Android monitor baselines, grouping, deduplication, failures, scope, permission and cancellation assertions passed.");
}
async function verifyRecoveryComparison() {
    const {compareFacilityAlerts, facilityKey, retainAlertStations, initialAlertState} = require("../data/facilityAlertMonitor.ts");
    let state = {...initialAlertState(), enabled: true};
    const events = [];
    let rejectEvent;
    const a = feed.notices[0];
    const b = {...a, facilityId: "B", name: "輪椅升降台"};
    const c = {...a, facilityId: "C"};
    const save = async value => { state = JSON.parse(JSON.stringify(value)); };
    const check = (rows, monitored = ["DIH"]) => compareFacilityAlerts(state, rows, monitored, save,
        async (station, facilities, event) => {
            if (event === rejectEvent) throw new Error("Rejected");
            events.push({station, facilities, event});
        });
    await check([a, b, b]);
    assert.equal(events.length, 0);
    await check([{...a, facilityType: "ES", message: "Changed", id: "changed"}, b]);
    assert.equal(events.length, 0, "classification and notice wording do not imply recovery");
    await check([b]);
    assert.equal(events.at(-1).event, "recovery");
    assert.deepEqual(events.at(-1).facilities, [{name: a.name, location: a.location}]);
    await check([b]);
    assert.equal(events.length, 1);
    rejectEvent = "recovery";
    await assert.rejects(check([c, c]));
    assert.equal(events.at(-1).event, "outage");
    assert.ok(state.stations.DIH.includes(facilityKey(c)));
    assert.ok(state.stations.DIH.includes(facilityKey(b)), "failed recovery stays pending");
    rejectEvent = undefined;
    await check([c]);
    assert.equal(events.filter(row => row.event === "outage").length, 1, "successful outage is not repeated on recovery retry");
    assert.equal(events.at(-1).event, "recovery");
    rejectEvent = "outage";
    await assert.rejects(check([a]));
    assert.ok(!state.stations.DIH.includes(facilityKey(c)), "successful recovery stays committed when outage fails");
    rejectEvent = undefined;
    await check([a]);
    assert.equal(events.at(-1).event, "outage");
    await check([]);
    assert.deepEqual(state.details, {});
    await check([a]);
    assert.equal(events.at(-1).event, "outage", "recurrence alerts again");
    const beforeRemoval = events.length;
    await check([], []);
    assert.equal(events.length, beforeRemoval, "scope removal is silent");
    assert.deepEqual(state.details, {});
    await check([a]);
    assert.equal(events.length, beforeRemoval, "re-added station baselines silently");
    assert.deepEqual(retainAlertStations(state, []).details, {});
    state = {enabled: true, scope: "favorites", stations: {DIH: [facilityKey(a)]}};
    await check([]);
    assert.deepEqual(events.at(-1).facilities, [undefined], "legacy keys recover without metadata");
    console.log("Recovery baseline, identity, metadata, scope and independent event retry assertions passed.");
}
async function verifySharedRequests() {
    const axios = require("axios");
    const get = axios.get;
    const requests = [];
    axios.get = (_, {signal}) => new Promise((resolve, reject) => {
        requests.push({signal, resolve});
        signal.addEventListener("abort", () => reject(new Error("Aborted")), {once: true});
    });
    try {
        const screen = new AbortController();
        const page = api.getFacilityOutages(screen.signal);
        const monitor = api.getFacilityOutages();
        assert.equal(requests.length, 1);
        screen.abort();
        await assert.rejects(page);
        assert.equal(requests[0].signal.aborted, false, "leaving the page keeps the monitor's request alive");
        requests[0].resolve({data: xml(notice())});
        assert.equal((await monitor).notices.length, 1);
        const last = new AbortController();
        const request = api.getFacilityOutages(last.signal);
        last.abort();
        await assert.rejects(request);
        assert.equal(requests[1].signal.aborted, true, "cancel the network request when the last reader leaves");
        console.log("Shared facility fetch and per-reader cancellation assertions passed.");
    } finally { axios.get = get; }
}
verifyRecoveryComparison().then(verifyAlerts).then(verifySharedRequests)
    .catch(error => { console.error(error); process.exitCode = 1; });
