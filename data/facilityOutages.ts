import {mtrStationInfo} from "./MTRStationInfo";
import {FacilityOutage} from "./type/FacilityOutage";

export function isAccessibleFacility(notice: FacilityOutage): boolean {
    return /^(AJ|VJ|HJ|MJ)/.test(notice.facilityType);
}

export function groupFacilityOutages(notices: FacilityOutage[], accessibleOnly: boolean, query = "", stationCode?: string) {
    const search = query.trim().toLowerCase();
    const groups = new Map<string, FacilityOutage[]>();
    for (const notice of notices) {
        const station = Object.hasOwn(mtrStationInfo, notice.stationCode) ? mtrStationInfo[notice.stationCode] : undefined;
        if (stationCode && notice.stationCode !== stationCode) continue;
        if (accessibleOnly && !isAccessibleFacility(notice)) continue;
        if (search && ![notice.stationCode, station?.chineseName, station?.englishName]
            .some(value => value?.toLowerCase().includes(search))) continue;
        const rows = groups.get(notice.stationCode) ?? [];
        rows.push(notice);
        groups.set(notice.stationCode, rows);
    }
    return [...groups].sort(([a], [b]) => (mtrStationInfo[a]?.englishName ?? a)
        .localeCompare(mtrStationInfo[b]?.englishName ?? b)).map(([code, data]) => ({code,
        data: data.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "") || a.id.localeCompare(b.id))}));
}

export function formatFacilityTimestamp(value?: string): string {
    if (!value) return "暫未提供";
    const local = new Date(Date.parse(value) + 8 * 3600000).toISOString();
    return `${local.slice(0, 10)} ${local.slice(11, 19)}（香港時間）`;
}
