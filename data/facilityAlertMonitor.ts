import {FacilityOutage} from "./type/FacilityOutage";
import {isAccessibleFacility} from "./facilityOutages";

export type AlertScope = "favorites" | "all";
export type FacilityAlertEvent = "outage" | "recovery";
export type FacilityAlertDetails = Pick<FacilityOutage, "name" | "location">;
export interface FacilityAlertState {
    enabled: boolean;
    scope: AlertScope;
    stations: Record<string, string[]>;
    details?: Record<string, FacilityAlertDetails>;
}
export const initialAlertState = (): FacilityAlertState => ({enabled: false, scope: "favorites", stations: {}});
export const facilityKey = (notice: FacilityOutage) =>
    JSON.stringify([notice.stationCode, notice.facilityId || notice.id]);

export function retainAlertStations(state: FacilityAlertState, monitored: string[]): FacilityAlertState {
    const stations: Record<string, string[]> = Object.assign(Object.create(null),
        Object.fromEntries(Object.entries(state.stations).filter(([code]) => monitored.includes(code))));
    const keys = new Set(Object.values(stations).flat());
    return {...state, stations, details: Object.fromEntries(Object.entries(state.details ?? {}).filter(([key]) => keys.has(key)))};
}

// Reserve each event separately so a failed delivery does not repeat another successful event.
export async function compareFacilityAlerts(state: FacilityAlertState, notices: FacilityOutage[],
    monitored: string[], save: (state: FacilityAlertState) => Promise<void>,
    notify: (station: string, facilities: (FacilityAlertDetails | undefined)[], event: FacilityAlertEvent) => Promise<void>): Promise<void> {
    let failed = false;
    const next = retainAlertStations(state, monitored);
    const details = next.details!;
    const persist = () => save(retainAlertStations(next, monitored));
    await persist();
    for (const code of monitored) {
        const current = new Map(notices.filter(notice => notice.stationCode === code).map(notice => [facilityKey(notice), notice]));
        const accessible = [...current].filter(([, notice]) => isAccessibleFacility(notice));
        const previous = next.stations[code];
        if (previous === undefined) next.stations[code] = accessible.map(([key]) => key);
        for (const [key, notice] of current) {
            if (next.stations[code].includes(key)) details[key] = {name: notice.name, location: notice.location};
        }
        await persist();
        if (previous === undefined) continue;
        const fresh = accessible.filter(([key]) => !previous.includes(key));
        const recovered = previous.filter(key => !current.has(key));
        for (const event of ["outage", "recovery"] as const) {
            const keys = event === "outage" ? fresh.map(([key]) => key) : recovered;
            if (!keys.length) continue;
            const facilities = event === "outage" ? fresh.map(([, notice]) => ({name: notice.name, location: notice.location})) :
                keys.map(key => details[key]);
            const before = next.stations[code];
            next.stations[code] = event === "outage" ? [...before, ...keys] : before.filter(key => !keys.includes(key));
            if (event === "outage") keys.forEach((key, index) => { details[key] = facilities[index]!; });
            await persist();
            try {
                await notify(code, facilities, event);
            } catch {
                next.stations[code] = before;
                await persist();
                failed = true;
            }
        }
    }
    if (failed) throw new Error("Facility alert delivery failed");
}
