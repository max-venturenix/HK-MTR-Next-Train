import axios from "axios";
import {MTRRealTimeData, TrainArrivalData} from "../data/type/MTRRealTimeData";

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

function serviceUrl(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    try {
        const url = new URL(value);
        return url.protocol === "https:" && url.hostname && !url.username && !url.password ? url.href : undefined;
    } catch { return undefined; }
}

export function parseMTRResponse(value: unknown, key: string): MTRRealTimeData {
    if (!isRecord(value) || (value.status !== 0 && value.status !== 1) || typeof value.message !== "string") {
        throw new Error("Invalid MTR response");
    }
    if (value.status === 0) return {status: 0, message: value.message,
        url: serviceUrl(value.url)};
    if (!isRecord(value.data) || !isRecord(value.data[key])) throw new Error("Missing station data");
    const station = value.data[key];
    for (const direction of ["UP", "DOWN"]) {
        const rows = station[direction];
        if (rows !== undefined && (!Array.isArray(rows) || !rows.every(row => isRecord(row) &&
            ["seq", "dest", "plat", "time"].every(field => typeof row[field] === "string") &&
            ["route", "timetype"].every(field => row[field] === undefined || typeof row[field] === "string")))) {
            throw new Error("Invalid train data");
        }
    }
    return {status: 1, message: value.message, isdelay: value.isdelay === "Y" ? "Y" : "N",
        data: {[key]: {UP: station.UP as TrainArrivalData[] | undefined,
            DOWN: station.DOWN as TrainArrivalData[] | undefined}}};
}

export const getMTRRealTimeData = async (lineCode: string, stationCode: string, signal?: AbortSignal) => {
    const response = await axios.get<unknown>("https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php", {
        params: {line: lineCode, sta: stationCode, lang: "TC"}, timeout: 10000, signal
    });
    return parseMTRResponse(response.data, `${lineCode}-${stationCode}`);
};

export function retryAfter(error: unknown): number {
    if (!axios.isAxiosError(error) || error.response?.status !== 429) return 0;
    const value = error.response.headers["retry-after"];
    const seconds = Number(value);
    return Date.now() + (value && Number.isFinite(seconds) ? Math.max(0, seconds * 1000) :
        typeof value === "string" && Number.isFinite(Date.parse(value)) ? Math.max(0, Date.parse(value) - Date.now()) : 30000);
}
