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
