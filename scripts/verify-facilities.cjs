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
        if (name === "expo-router") return {useFocusEffect: fn => { effect = fn; }};
        return originalLoad.call(this, name, ...args);
    };
    global.setInterval = (fn, duration) => { assert.equal(duration, 60000); tick = fn; return 1; };
    global.clearInterval = () => { cleared = true; };
    api.getFacilityOutages = signal => new Promise((resolve, reject) => requests.push({signal, resolve, reject}));
    const settle = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
    try {
        const {useFacilityOutages} = require("../ui/hooks/useFacilityOutages.ts");
        const hook = useFacilityOutages();
        const cleanup = effect();
        assert.equal(requests.length, 1);
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
    }
})().catch(error => { console.error(error); process.exitCode = 1; });

async function verifyAlerts() {
    const Module = require("node:module");
    const originalLoad = Module._load;
    let stored;
    let favorites = ["DIH", "HOK"];
    let notices = [feed.notices[0]];
    let failFetch = false;
    let failStation;
    let task;
    let registered = false;
    let granted = true;
    const deliveries = [];
    const triggers = [];
    const mocks = {
        "@react-native-async-storage/async-storage": {
            getItem: async () => stored ?? null, setItem: async (_, value) => { stored = value; }
        },
        "expo-background-task": {BackgroundTaskResult: {Success: 1, Failed: 2},
            BackgroundTaskStatus: {Available: 1}, getStatusAsync: async () => 1,
            registerTaskAsync: async (_, options) => { assert.equal(options.minimumInterval, 15); registered = true; },
            unregisterTaskAsync: async () => { registered = false; }},
        "expo-task-manager": {defineTask: (_, fn) => { task = fn; }, isTaskRegisteredAsync: async () => registered},
        "expo-notifications": {AndroidImportance: {HIGH: 4},
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
        "../api/FacilityOutageApi": {getFacilityOutages: async () => {
            if (failFetch) throw new Error("Offline or invalid XML");
            return {notices};
        }}
    };
    Module._load = function (request, parent, main) {
        if (parent?.filename.endsWith("facilityNotifications.android.ts") && mocks[request]) return mocks[request];
        return originalLoad.call(this, request, parent, main);
    };
    let monitor;
    try { monitor = require("../services/facilityNotifications.android.ts"); }
    finally { Module._load = originalLoad; }
    await monitor.setAlertSettings(true, "favorites");
    assert.equal(registered, true);
    assert.equal(deliveries.length, 0, "first check is silent");
    const second = {...feed.notices[0], id: "2", facilityId: "2"};
    const third = {...second, id: "3", facilityId: "3"};
    notices.push(second, third);
    await Promise.all([task(), task()]);
    assert.equal(deliveries.length, 1, "overlapping checks produce one station alert");
    assert.equal(deliveries[0].data.stationCode, "DIH");
    assert.ok(deliveries[0].body.includes("、"), "multiple facilities share one notification");
    notices = notices.map(row => ({...row, id: "changed", updatedAt: "2030-01-01", message: "Changed"}));
    await monitor.initializeFacilityNotifications();
    assert.equal(deliveries.length, 1, "wording/timestamp changes and restart stay silent");
    const before = stored;
    failFetch = true;
    assert.equal(await task(), 2);
    assert.equal(stored, before, "failed feed preserves observations");
    failFetch = false;
    notices = [];
    await task();
    notices = [second];
    await task();
    assert.equal(deliveries.length, 2, "outage returning after clearance alerts again");
    favorites = ["HOK"];
    await monitor.bookmarksChanged();
    favorites = ["HOK", "DIH"];
    await monitor.bookmarksChanged();
    await task();
    assert.equal(deliveries.length, 2, "newly added bookmark gets a silent baseline");
    notices.push({...second, stationCode: "AIR"});
    await monitor.setAlertSettings(true, "all");
    assert.equal(deliveries.length, 2, "expanded scope baselines new stations");
    notices.push(third, {...third, stationCode: "HOK"});
    failStation = "HOK";
    assert.equal(await task(), 2);
    assert.equal(deliveries.length, 3);
    failStation = undefined;
    await task();
    assert.equal(deliveries.length, 4, "failed station retries without repeating successful station");
    assert.equal(deliveries.at(-1).data.stationCode, "HOK");
    granted = false;
    notices.push({...third, facilityId: "4"});
    await task();
    assert.equal(deliveries.length, 4, "revoked permission prevents delivery");
    await monitor.setAlertSettings(false, "favorites");
    assert.equal(registered, false);
    await assert.rejects(monitor.setAlertSettings(true, "favorites"));
    assert.equal(JSON.parse(stored).enabled, false, "permission denial keeps alerts off");
    granted = true;
    await monitor.setAlertSettings(true, "favorites");
    assert.equal(deliveries.length, 4, "re-enable silently baselines again");
    await monitor.setAlertSettings(false, "favorites");
    const beforeTest = stored;
    await monitor.sendTestNotification();
    assert.equal(deliveries.length, 5, "test notification sends immediately with monitoring off");
    assert.equal(deliveries.at(-1).title, "樂富站升降機停用（測試）");
    assert.equal(deliveries.at(-1).body, "這是測試訊息，模擬樂富站升降機暫停服務。");
    assert.equal(deliveries.at(-1).sound, true);
    assert.equal(deliveries.at(-1).data.kind, "facility-test");
    assert.equal(stored, beforeTest, "test leaves settings and observations unchanged");
    assert.equal(registered, false, "test does not register background monitoring");
    assert.deepEqual(triggers.at(-1), {channelId: "accessible-facility-outages"});
    await monitor.sendTestNotification(10);
    assert.equal(deliveries.length, 6, "delayed test is submitted to Android's scheduler");
    assert.equal(deliveries.at(-1).title, "樂富站升降機停用（測試）");
    assert.equal(deliveries.at(-1).body, "這是測試訊息，模擬樂富站升降機暫停服務。");
    assert.deepEqual(triggers.at(-1), {type: "timeInterval", seconds: 10, repeats: false,
        channelId: "accessible-facility-outages"});
    assert.equal(stored, beforeTest, "delayed test leaves monitoring unchanged");
    granted = false;
    await assert.rejects(monitor.sendTestNotification());
    assert.equal(deliveries.length, 6, "permission denial prevents a test notification");
    console.log("Android monitor baselines, grouping, deduplication, failures, scope, permission and cancellation assertions passed.");
}
verifyAlerts().catch(error => { console.error(error); process.exitCode = 1; });
