import {FacilityOutage} from "./type/FacilityOutage";
import {isAccessibleFacility} from "./facilityOutages";

export type AlertScope = "favorites" | "all";
export interface FacilityAlertState {
    enabled: boolean;
    scope: AlertScope;
    stations: Record<string, string[]>;
}
export const initialAlertState = (): FacilityAlertState => ({enabled: false, scope: "favorites", stations: {}});
export const facilityKey = (notice: FacilityOutage) =>
    JSON.stringify([notice.stationCode, notice.facilityId || notice.id]);

// Persist each station independently, including silent baselines and successful deliveries.
export async function compareFacilityAlerts(state: FacilityAlertState, notices: FacilityOutage[],
    monitored: string[], save: (state: FacilityAlertState) => Promise<void>,
    notify: (station: string, notices: FacilityOutage[]) => Promise<void>): Promise<void> {
    let failed = false;
    const stations: Record<string, string[]> = Object.assign(Object.create(null),
        Object.fromEntries(Object.entries(state.stations).filter(([code]) => monitored.includes(code))));
    await save({...state, stations});
    for (const code of monitored) {
        const current = notices.filter(notice => notice.stationCode === code && isAccessibleFacility(notice));
        const keys = [...new Set(current.map(facilityKey))];
        const previous = stations[code];
        const fresh = previous === undefined ? [] : current.filter((notice, index) =>
            !previous.includes(facilityKey(notice)) && current.findIndex(row => facilityKey(row) === facilityKey(notice)) === index);
        stations[code] = keys;
        // Reserve before presenting to prevent a process restart from repeating a delivered alert.
        await save({...state, stations});
        if (!fresh.length) continue;
        try {
            await notify(code, fresh);
        } catch {
            stations[code] = previous;
            await save({...state, stations});
            failed = true;
        }
    }
    if (failed) throw new Error("Facility alert delivery failed");
}
