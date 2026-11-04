import {useCallback, useRef, useState} from "react";
import {AppState, Linking, Platform, View} from "react-native";
import {useFocusEffect} from "expo-router";
import {Button, RadioButton, Switch, Text, TouchableRipple, useTheme} from "react-native-paper";
import {getAlertSettings, setAlertSettings} from "../../services/facilityNotifications";
import {AlertScope} from "../../data/facilityAlertMonitor";
import {layout} from "../theme";

export default function FacilityNotificationSettings() {
    const {colors} = useTheme();
    const [settings, setSettings] = useState<Awaited<ReturnType<typeof getAlertSettings>>>();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string>();
    const working = useRef(false);
    const load = useCallback(async () => {
        try { setSettings(await getAlertSettings()); }
        catch { setError("無法讀取通知設定，請重試。"); }
    }, []);
    useFocusEffect(useCallback(() => {
        if (Platform.OS !== "android") return;
        void load();
        const subscription = AppState.addEventListener("change", state => { if (state === "active") void load(); });
        return () => subscription.remove();
    }, [load]));
    const change = async (enabled: boolean, scope: AlertScope) => {
        if (working.current) return;
        working.current = true;
        setBusy(true);
        setError(undefined);
        try { await setAlertSettings(enabled, scope); }
        catch (reason) { setError(reason instanceof Error ? reason.message : "無法儲存通知設定，請重試。"); }
        finally { await load(); working.current = false; setBusy(false); }
    };
    if (Platform.OS !== "android") return <View style={layout.section}>
        <Text variant="titleLarge" accessibilityRole="header">通知</Text>
        <Text variant="bodyLarge" style={{color: colors.onSurfaceVariant}}>無障礙設施停用通知現時支援 Android。</Text>
    </View>;
    return <View style={layout.section}>
        <Text variant="titleLarge" accessibilityRole="header">通知</Text>
        <TouchableRipple accessibilityRole="switch" accessibilityLabel="無障礙設施停用通知"
            accessibilityState={{checked: settings?.enabled ?? false, disabled: !settings || busy}}
            disabled={!settings || busy} onPress={() => void change(!settings?.enabled, settings?.scope ?? "favorites")}>
            <View style={[layout.heading, {minHeight: 64, backgroundColor: colors.surface, padding: 16, gap: 16}]}>
                <Text variant="bodyLarge" style={layout.grow}>無障礙設施停用通知</Text>
                <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <Switch value={settings?.enabled ?? false} disabled={!settings || busy}/>
                </View>
            </View>
        </TouchableRipple>
        <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>
            約每 15 分鐘檢查一次，實際時間會受電池及網絡狀態影響。首次檢查只記錄現有停用設施，其後每次新停用只通知一次。
        </Text>
        <Text variant="titleMedium">通知範圍</Text>
        <RadioButton.Group value={settings?.scope ?? "favorites"}
            onValueChange={value => void change(settings?.enabled ?? false, value as AlertScope)}>
            <RadioButton.Item label="收藏車站" value="favorites" disabled={!settings || busy} style={{minHeight: 56}}/>
            <RadioButton.Item label="所有車站" value="all" disabled={!settings || busy} style={{minHeight: 56}}/>
        </RadioButton.Group>
        {settings?.scope === "favorites" && settings.empty && <Text variant="bodyMedium">
            你尚未收藏車站。新增收藏後，系統會開始監察該車站，首次檢查只記錄現有停用設施。
        </Text>}
        {settings && !settings.permitted && <>
            <Text variant="bodyMedium">Android 通知權限尚未開啟。啟用通知時會要求權限，也可到系統設定允許。</Text>
            <Button onPress={() => void Linking.openSettings().catch(() => setError("無法開啟 Android 設定，請手動開啟。"))}
                contentStyle={{minHeight: 48}}>開啟 Android 設定</Button>
        </>}
        {settings && !settings.available && <Text variant="bodyMedium">背景檢查受限制，請檢查 Android 的電池及背景活動設定。</Text>}
        {busy && <Text accessibilityLiveRegion="polite">正在更新通知設定…</Text>}
        {!settings && !error && <Text accessibilityLiveRegion="polite">正在讀取通知設定…</Text>}
        {error && <Text accessibilityRole="alert" style={{color: colors.error}}>{error}</Text>}
        {error && <Button disabled={busy} onPress={() => { setError(undefined); void load(); }} contentStyle={{minHeight: 48}}>重新讀取設定</Button>}
    </View>;
}
