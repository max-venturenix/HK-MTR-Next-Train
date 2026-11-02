// Focused regression checks using installed TypeScript and Node assertions; no test framework.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(
    fs.readFileSync(filename, "utf8"), {compilerOptions: {module: ts.ModuleKind.CommonJS,
        esModuleInterop: true}}).outputText, filename);
const {parseMTRResponse, retryAfter} = require("../api/MTRApi.ts");
const {formatArrival} = require("../data/arrivalTime.ts");
const train = {seq: "1", dest: "DIS", plat: "3", time: "2026-10-30 00:01:00"};
const schedule = data => ({status: 1, message: "successful", data: {"DRL-SUN": data}});
for (const data of [{UP: [train]}, {DOWN: [train]}, {UP: [], DOWN: []}, {}]) {
    assert.equal(parseMTRResponse(schedule(data), "DRL-SUN").status, 1);
}
assert.equal(parseMTRResponse({status: 0, message: "暫停服務"}, "EAL-LOW").data, undefined);
assert.equal(parseMTRResponse({status: 0, message: "alert", url: "javascript:alert(1)"}, "x").url, undefined);
assert.equal(parseMTRResponse({...schedule({}), isdelay: "Y"}, "DRL-SUN").isdelay, "Y");
for (const payload of [null, {}, {status: 1, message: "ok"}, schedule({UP: [undefined]}),
    schedule({UP: [{...train, time: 123}]}), schedule({DOWN: "invalid"})]) {
    assert.throws(() => parseMTRResponse(payload, "DRL-SUN"));
}
const now = Date.parse("2026-10-29T23:58:00+08:00");
for (const timezone of ["Asia/Hong_Kong", "America/New_York", "UTC"]) {
    process.env.TZ = timezone;
    assert.equal(formatArrival(train, now), "3 分鐘");
}
assert.equal(formatArrival({...train, time: "-"}, now), "時間暫未提供");
assert.equal(formatArrival({...train, timetype: "D"}, now + 120000), "即將開出");
assert.equal(formatArrival({...train, timetype: "A"}, now + 180000), "正在抵達");
const rateError = value => ({isAxiosError: true, response: {status: 429, headers: {"retry-after": value}}});
assert.ok(Math.abs(retryAfter(rateError("45")) - Date.now() - 45000) < 100);
assert.ok(Math.abs(retryAfter(rateError(undefined)) - Date.now() - 30000) < 100);
assert.equal(retryAfter(new Error()), 0);
const lines = require("../data/json/line_info.json");
const stations = require("../data/json/station_info.json");
for (const [line, info] of Object.entries(lines)) for (const code of info.stations) {
    assert.ok(stations[code].line.includes(line), `${line}-${code}`);
}
for (const [code, info] of Object.entries(stations)) if (code) for (const line of info.line) {
    assert.ok(lines[line].stations.includes(code), `${line}-${code}`);
}
assert.deepEqual(lines.DRL.stations, ["SUN", "DIS"]);
assert.ok(lines.EAL.stations.includes("RAC"));
console.log("API fixtures, timezone/countdown, cooldown, and metadata assertions passed.");

// Exercise the hook lifecycle with controlled requests and timers.
(async () => {
    const Module = require("node:module");
    const originalLoad = Module._load;
    const originalInterval = global.setInterval;
    const originalClear = global.clearInterval;
    const api = require("../api/MTRApi.ts");
    const originalGet = api.getMTRRealTimeData;
    let effect, tick, change, cleared = false;
    const state = [];
    const requests = [];
    const appState = {currentState: "active", addEventListener: (_, callback) => {
        change = callback; return {remove() { change = undefined; }};
    }};
    Module._load = function (name, ...args) {
        if (name === "react") return {useCallback: fn => fn, useRef: value => ({current: value}),
            useState: initial => { const index = state.length; state.push(initial);
                return [initial, value => {state[index] = typeof value === "function" ? value(state[index]) : value;}]; }};
        if (name === "react-native") return {AppState: appState};
        if (name === "expo-router") return {useFocusEffect: fn => { effect = fn; }};
        return originalLoad.call(this, name, ...args);
    };
    global.setInterval = fn => { tick = fn; return 1; };
    global.clearInterval = () => { cleared = true; };
    api.getMTRRealTimeData = (line, station, signal) => new Promise((resolve, reject) => {
        requests.push({line, station, signal, resolve, reject});
    });
    try {
        const {useStationArrivals} = require("../ui/hooks/useStationArrivals.ts");
        const hook = useStationArrivals("DIH");
        const cleanup = effect();
        assert.equal(requests.length, 2);
        tick(); void hook.refresh();
        assert.equal(requests.length, 2, "overlapping refresh is reused");
        requests[0].resolve({status: 1, message: "ok", data: {}});
        requests[1].reject(new Error("offline"));
        await hook.refresh();
        assert.ok(state[0][`${requests[0].line}-DIH`].response);
        assert.ok(state[0][`${requests[1].line}-DIH`].error);
        tick();
        assert.equal(requests.length, 4);
        appState.currentState = "background"; change("background");
        assert.ok(requests[2].signal.aborted);
        tick(); assert.equal(requests.length, 4);
        requests[2].resolve({status: 0, message: "stale"});
        requests[3].resolve({status: 0, message: "stale"});
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(state[0][`${requests[0].line}-DIH`].response.status, 1);
        appState.currentState = "active"; change("active");
        assert.equal(requests.length, 6);
        cleanup();
        assert.ok(cleared && requests[4].signal.aborted && !change);
        console.log("Polling overlap, partial failure, background/resume, cancellation, and stale-result assertions passed.");
    } finally {
        Module._load = originalLoad;
        global.setInterval = originalInterval;
        global.clearInterval = originalClear;
        api.getMTRRealTimeData = originalGet;
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
