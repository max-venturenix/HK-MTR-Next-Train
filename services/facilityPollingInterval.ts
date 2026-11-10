import AsyncStorage from "@react-native-async-storage/async-storage";

export const facilityPollingIntervals = [1, 5, 10, 15, 30] as const;
export type FacilityPollingInterval = typeof facilityPollingIntervals[number];
export const defaultFacilityPollingInterval: FacilityPollingInterval = 15;
const storageKey = "facility_polling_interval";

export async function getFacilityPollingInterval(): Promise<FacilityPollingInterval> {
    const value = await AsyncStorage.getItem(storageKey);
    return facilityPollingIntervals.find(interval => String(interval) === value) ?? defaultFacilityPollingInterval;
}

export function saveFacilityPollingInterval(interval: FacilityPollingInterval) {
    return AsyncStorage.setItem(storageKey, String(interval));
}
