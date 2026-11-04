import AsyncStorage from "@react-native-async-storage/async-storage";
import {AlertScope} from "../data/facilityAlertMonitor";

export interface FacilityActivity {
    id: string;
    startedAt: number;
    finishedAt?: number;
    scope?: AlertScope;
    stage: "started" | "requesting" | "feed-read" | "success" | "skipped" | "failed";
    apiCalled: boolean;
    reason?: string;
    stationsChecked?: number;
    facilities?: {stationCode: string; name: string; location: string; message: string; english?: {name: string; location: string; message: string}}[];
    notifications: number;
}
const storageKey = "facility_activity_log_v1";
const retention = 6 * 60 * 60 * 1000;
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation);
    queue = result.catch(() => {});
    return result;
}
async function read(): Promise<FacilityActivity[]> {
    const raw = await AsyncStorage.getItem(storageKey);
    const rows: FacilityActivity[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(rows)) throw new Error("Invalid activity history");
    return rows.filter(row => row && Number.isFinite(row.startedAt) && row.startedAt >= Date.now() - retention);
}
export const getFacilityActivity = () => serialize(async () => {
    const rows = await read();
    await AsyncStorage.setItem(storageKey, JSON.stringify(rows));
    return rows.sort((a, b) => b.startedAt - a.startedAt);
});
// Diagnostic storage must never change the monitor's success, failure or retry outcome.
export const saveFacilityActivity = (entry: FacilityActivity) => serialize(async () => {
    const rows = await read();
    const current = rows.filter(row => row.id !== entry.id);
    if (entry.startedAt >= Date.now() - retention) current.push(entry);
    await AsyncStorage.setItem(storageKey, JSON.stringify(current));
}).catch(() => {});
