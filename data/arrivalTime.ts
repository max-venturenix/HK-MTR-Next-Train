import moment from "moment";
import {TrainArrivalData} from "./type/MTRRealTimeData";

export function formatArrival(data: TrainArrivalData, now = Date.now()): string {
    const time = moment.parseZone(`${data.time}+08:00`, "YYYY-MM-DD HH:mm:ssZ", true);
    if (!time.isValid()) return "時間暫未提供";
    const minutes = Math.ceil((time.valueOf() - now) / 60000);
    if (minutes > 1) return `${minutes} 分鐘`;
    if (minutes === 1) return data.timetype === "D" ? "即將開出" : "正在抵達";
    return data.timetype === "A" ? "正在抵達" : "正在離開";
}
