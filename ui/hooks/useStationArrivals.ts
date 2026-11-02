import {useCallback, useRef, useState} from "react";
import {AppState} from "react-native";
import {useFocusEffect} from "expo-router";
import {getMTRRealTimeData, retryAfter} from "../../api/MTRApi";
import {mtrStationInfo} from "../../data/MTRStationInfo";
import {MTRRealTimeData} from "../../data/type/MTRRealTimeData";

export interface ArrivalResult {
    response?: MTRRealTimeData;
    error?: string;
    updatedAt?: string;
}

export function useStationArrivals(stationCode?: string) {
    const [results, setResults] = useState<Record<string, ArrivalResult>>({});
    const [refreshing, setRefreshing] = useState(false);
    const refreshRef = useRef<() => Promise<void>>(async () => {});
    const cooldown = useRef<Record<string, number>>({});
    useFocusEffect(useCallback(() => {
        let active = true;
        let controller: AbortController | undefined;
        let pending: Promise<void> | undefined;
        let generation = 0;
        const cancel = () => {
            generation++;
            controller?.abort();
            pending = undefined;
            setRefreshing(false);
        };
        const refresh = (): Promise<void> => {
            if (!active || AppState.currentState !== "active" || !stationCode) return Promise.resolve();
            if (pending) return pending;
            const id = ++generation;
            controller = new AbortController();
            const signal = controller.signal;
            setRefreshing(true);
            pending = Promise.all(mtrStationInfo[stationCode].line.map(async line => {
                const key = `${line}-${stationCode}`;
                if ((cooldown.current[key] ?? 0) > Date.now()) return;
                try {
                    const response = await getMTRRealTimeData(line, stationCode, signal);
                    if (!active || id !== generation) return;
                    setResults(previous => ({...previous, [key]: {response,
                        updatedAt: new Date().toISOString()}}));
                } catch (error) {
                    if (!active || id !== generation || signal.aborted) return;
                    cooldown.current[key] = retryAfter(error);
                    setResults(previous => ({...previous, [key]: {...previous[key],
                        error: "無法下載列車資料，請重試。"}}));
                }
            })).then(() => {}).finally(() => {
                if (active && id === generation) {
                    pending = undefined;
                    setRefreshing(false);
                }
            });
            return pending;
        };
        refreshRef.current = refresh;
        void refresh();
        const timer = setInterval(() => void refresh(), 10000);
        const subscription = AppState.addEventListener("change", state => {
            if (state === "active") void refresh();
            else cancel();
        });
        return () => {
            active = false;
            cancel();
            clearInterval(timer);
            subscription?.remove();
            refreshRef.current = async () => {};
        };
    }, [stationCode]));
    const refresh = useCallback(() => refreshRef.current(), []);
    return {results, refreshing, refresh};
}
