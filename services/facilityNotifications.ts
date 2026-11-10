import {AlertScope, initialAlertState} from "../data/facilityAlertMonitor";
import {saveFacilityPollingInterval} from "./facilityPollingInterval";

// Metro selects the Android implementation only on Android.
export const initializeFacilityNotifications = async () => {};
export const stopFacilityForegroundChecks = () => {};
export const setFacilityPollingInterval = saveFacilityPollingInterval;
export const bookmarksChanged = async () => {};
export const sendTestNotification = async (_delaySeconds: 0 | 10 = 0) => {};
export const getAlertSettings = async () => ({...initialAlertState(), permitted: false, available: false, empty: true});
export const setAlertSettings = async (_enabled: boolean, _scope: AlertScope) => {};
export const subscribeToFacilityNotifications = (_listener: () => void) => () => {};
