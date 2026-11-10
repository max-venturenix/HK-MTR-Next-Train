import {useCallback, useRef, useState} from "react";
import {AppState, Platform} from "react-native";
import {useFocusEffect} from "expo-router";
import {getFacilityOutages} from "../../api/FacilityOutageApi";
import {retryAfter} from "../../api/MTRApi";
import {FacilityOutageFeed} from "../../data/type/FacilityOutage";
import {defaultFacilityPollingInterval, getFacilityPollingInterval} from "../../services/facilityPollingInterval";

export function useFacilityOutages() {
    const [feed, setFeed] = useState<FacilityOutageFeed>();
    const [error, setError] = useState<string>();
    const [refreshing, setRefreshing] = useState(false);
    const refreshRef = useRef<() => Promise<void>>(async () => {});
    const cooldown = useRef(0);
    useFocusEffect(useCallback(() => {
        if (Platform.OS === "web") return;
        let active = true, generation = 0;
        let controller: AbortController | undefined;
        let pending: Promise<void> | undefined;
        const cancel = () => {
            generation++;
            controller?.abort();
            pending = undefined;
            setRefreshing(false);
        };
        const refresh = (): Promise<void> => {
            if (!active || AppState.currentState !== "active" || Date.now() < cooldown.current) return Promise.resolve();
            if (pending) return pending;
            const id = ++generation;
            controller = new AbortController();
            const signal = controller.signal;
            setRefreshing(true);
            pending = getFacilityOutages(signal).then(value => {
                if (!active || id !== generation) return;
                setFeed(value);
                setError(undefined);
            }).catch(reason => {
                if (!active || id !== generation || signal.aborted) return;
                cooldown.current = retryAfter(reason);
                setError(cooldown.current > Date.now() ? "請求過於頻密，請稍後再試。" : "無法下載設施資料，請重新整理再試。");
            }).finally(() => {
                if (active && id === generation) { pending = undefined; setRefreshing(false); }
            });
            return pending;
        };
        refreshRef.current = refresh;
        void refresh();
        let timer: ReturnType<typeof setInterval> | undefined;
        void getFacilityPollingInterval().catch(() => defaultFacilityPollingInterval).then(interval => {
            if (active) timer = setInterval(() => void refresh(), interval * 60000);
        });
        const subscription = AppState.addEventListener("change", state => {
            if (state === "active") void refresh();
            else cancel();
        });
        return () => {
            active = false;
            cancel();
            clearInterval(timer);
            subscription.remove();
            refreshRef.current = async () => {};
        };
    }, []));
    const refresh = useCallback(() => refreshRef.current(), []);
    return {feed, error, refreshing, refresh};
}
