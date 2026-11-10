import Slider from "@react-native-community/slider";
import {useEffect, useRef, useState} from "react";
import {AccessibilityInfo, Platform, View} from "react-native";
import {Button, Text, TouchableRipple, useTheme} from "react-native-paper";
import {setFacilityPollingInterval} from "../../services/facilityNotifications";
import {defaultFacilityPollingInterval, facilityPollingIntervals, FacilityPollingInterval,
    getFacilityPollingInterval} from "../../services/facilityPollingInterval";
import {layout} from "../theme";

const labels = facilityPollingIntervals.map(String);
const title = "設施資料更新頻率";

export default function FacilityPollingSettings() {
    const {colors} = useTheme();
    const [selected, setSelected] = useState<FacilityPollingInterval>(defaultFacilityPollingInterval);
    const [preview, setPreview] = useState<FacilityPollingInterval>();
    const [ready, setReady] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>();
    const busy = useRef(false);
    const dragging = useRef(false);
    const committed = useRef<FacilityPollingInterval | undefined>(undefined);

    useEffect(() => {
        if (Platform.OS === "web") return;
        let mounted = true;
        void getFacilityPollingInterval().then(interval => {
            if (!mounted) return;
            committed.current = interval;
            setSelected(interval);
        }).catch(() => {
            if (mounted) setError("無法讀取更新頻率，請重新選擇以儲存設定。");
        }).finally(() => { if (mounted) setReady(true); });
        return () => { mounted = false; };
    }, []);

    const change = async (interval: FacilityPollingInterval) => {
        if (!ready || busy.current) return;
        setPreview(undefined);
        if (interval === committed.current) return;
        busy.current = true;
        setSelected(interval);
        setSaving(true);
        setError(undefined);
        try {
            await setFacilityPollingInterval(interval);
            committed.current = interval;
            AccessibilityInfo.announceForAccessibility(`已儲存，每 ${interval} 分鐘更新`);
        } catch {
            committed.current = undefined;
            setError("無法套用更新頻率或背景排程，請重試。");
        } finally {
            busy.current = false;
            setSaving(false);
        }
    };
    const disabled = !ready || saving;
    const value = preview ?? selected;

    return <View style={layout.section}>
        <Text variant="titleLarge" accessibilityRole="header">{title}</Text>
        {Platform.OS === "web" ? <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>
            網頁版使用港鐵官方設施資訊，更新頻率適用於手機應用程式。
        </Text> : <>
            <View style={{backgroundColor: colors.surface, borderRadius: 12, padding: 12}}>
                <Text variant="titleMedium" style={{color: colors.onSurface, marginHorizontal: 4}}>
                    {ready ? `每 ${value} 分鐘` : "正在讀取更新頻率…"}
                </Text>
                <Slider style={{height: 48}} minimumValue={0} maximumValue={4} step={1}
                    hitSlop={{top: 15, bottom: 15}}
                    value={facilityPollingIntervals.indexOf(selected)} disabled={disabled} tapToSeek
                    accessibilityLabel={title} accessibilityUnits="分鐘" accessibilityIncrements={labels}
                    accessibilityValue={{text: `${value} 分鐘`}}
                    minimumTrackTintColor={disabled ? colors.onSurfaceDisabled : colors.primary}
                    maximumTrackTintColor={disabled ? colors.surfaceDisabled : colors.outline}
                    thumbTintColor={disabled ? colors.onSurfaceDisabled : colors.primary}
                    onSlidingStart={() => { dragging.current = true; }}
                    onValueChange={index => {
                        const interval = facilityPollingIntervals[Math.round(index)];
                        if (interval === undefined) return;
                        if (dragging.current) setPreview(interval);
                        else void change(interval);
                    }}
                    onSlidingComplete={index => {
                        dragging.current = false;
                        const interval = facilityPollingIntervals[Math.round(index)];
                        if (interval !== undefined) void change(interval);
                    }}/>
                <View style={{flexDirection: "row", flexWrap: "wrap"}}>
                    {facilityPollingIntervals.map(interval => (
                        <TouchableRipple key={interval} accessibilityRole="button"
                            accessibilityLabel={`${interval} 分鐘`} accessibilityState={{selected: interval === value, disabled}}
                            disabled={disabled} onPress={() => void change(interval)}
                            style={{flexGrow: 1, minWidth: 48, minHeight: 48, justifyContent: "center", borderRadius: 8,
                                backgroundColor: interval === value ? colors.primaryContainer : colors.surface}}>
                            <Text variant="bodyMedium" style={{textAlign: "center", paddingHorizontal: 8,
                                color: interval === value ? colors.onPrimaryContainer : colors.onSurfaceVariant}}>{interval}</Text>
                        </TouchableRipple>
                    ))}
                </View>
            </View>
            <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>
                自動更新適用於設施頁面。{Platform.OS === "android" &&
                    "啟用設施通知後亦會按此頻率檢查。Android 可能延遲背景檢查；強制停止應用程式後，須重新開啟才會恢復。"}
            </Text>
            {saving && <Text accessibilityLiveRegion="polite">正在儲存更新頻率…</Text>}
            {error && <>
                <Text accessibilityRole="alert" style={{color: colors.error}}>{error}</Text>
                <Button disabled={disabled} onPress={() => void change(selected)} contentStyle={layout.button}>重試</Button>
            </>}
        </>}
    </View>;
}
