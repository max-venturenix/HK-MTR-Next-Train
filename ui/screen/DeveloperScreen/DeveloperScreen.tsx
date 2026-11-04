import {useCallback, useRef, useState} from "react";
import {AppState, FlatList, Platform, View} from "react-native";
import {useFocusEffect} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {Button, Divider, Icon, Text, TouchableRipple, useTheme} from "react-native-paper";
import {FacilityActivity, getFacilityActivity} from "../../../services/facilityActivityLog";
import {sendTestNotification} from "../../../services/facilityNotifications";
import {mtrStationInfo} from "../../../data/MTRStationInfo";
import {layout} from "../../theme";

const stageLabels = {started: "Incomplete", requesting: "Incomplete", "feed-read": "Incomplete",
    success: "Check completed", skipped: "Skipped", failed: "Failed"};
const lastStageLabels = {started: "Task started", requesting: "API request started", "feed-read": "Facility feed read",
    success: "Check completed", skipped: "Check skipped", failed: "Check failed"};
const reasonLabels: Record<string, string> = {
    "通知監察已關閉": "Monitoring is off", "通知權限未開啟": "Notification permission is disabled",
    "設施資料格式無效": "Invalid facility feed", "API 請求失敗": "API request failed",
    "讀取設施資料後處理失敗": "Processing failed after reading the feed", "無法開始檢查": "Unable to start check",
    "通知權限未開啟，請到 Android 設定允許通知。": "Notification permission is disabled. Allow notifications in Android Settings."
};
function hongKongTimestamp(timestamp: number) {
    return new Date(timestamp + 8 * 3600000).toISOString().slice(0, 19).replace("T", " ");
}

export default function DeveloperScreen() {
    const {colors} = useTheme();
    const [rows, setRows] = useState<FacilityActivity[]>([]);
    const [expanded, setExpanded] = useState<string>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [feedback, setFeedback] = useState<string>();
    const [testDelay, setTestDelay] = useState<0 | 10>();
    const testing = useRef(false);
    const load = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const history = await getFacilityActivity();
            setRows(history);
            setExpanded(current => history.some(row => row.id === current) ? current : undefined);
        }
        catch { setError("Unable to read background activity. Refresh to try again."); }
        finally { setLoading(false); }
    }, []);
    useFocusEffect(useCallback(() => {
        if (Platform.OS !== "android") return;
        void load();
        const subscription = AppState.addEventListener("change", state => { if (state === "active") void load(); });
        return () => subscription.remove();
    }, [load]));
    const test = async (delay: 0 | 10) => {
        if (testing.current) return;
        testing.current = true;
        setTestDelay(delay);
        setFeedback(undefined);
        try {
            await sendTestNotification(delay);
            setFeedback(delay ? "Test notification scheduled for 10 seconds from now. You can leave the app." : "Test notification submitted.");
        } catch (reason) {
            setFeedback(reason instanceof Error ? reason.message : "無法傳送Test notification，請重試。");
        } finally { testing.current = false; setTestDelay(undefined); }
    };
    return <SafeAreaView edges={["left", "right", "bottom"]} style={[layout.screen, {backgroundColor: colors.background}]}>
        {Platform.OS !== "android" ? <View style={layout.content}>
            <Text variant="bodyLarge">Notification tests and background diagnostics require Android.</Text>
        </View> : <FlatList data={rows} extraData={expanded} keyExtractor={item => item.id} contentContainerStyle={layout.content}
            ListHeaderComponent={<View style={layout.section}>
                <Text variant="titleLarge" accessibilityRole="header">Notification tests</Text>
                <Button mode="outlined" icon="bell-outline" contentStyle={layout.button}
                    loading={testDelay === 0} disabled={testDelay !== undefined} onPress={() => void test(0)}>Test notification</Button>
                <Button mode="outlined" icon="bell-outline" contentStyle={layout.button}
                    loading={testDelay === 10} disabled={testDelay !== undefined} onPress={() => void test(10)}>Test notification in 10 seconds</Button>
                {feedback && <Text accessibilityLiveRegion="polite">{feedback}</Text>}
                <Text variant="titleLarge" accessibilityRole="header">Background activity · Last 6 hours</Text>
                <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>
                    Android controls scheduling and may delay runs due to battery or network conditions. History begins with the first background run after this update. All times are Hong Kong time (UTC+08:00).
                </Text>
                <Button icon="reload" loading={loading} disabled={loading} contentStyle={layout.button}
                    onPress={() => void load()}>Refresh</Button>
                {error && <Text accessibilityRole="alert" style={{color: colors.error}}>{error}</Text>}
            </View>}
            ListEmptyComponent={!loading && !error ? <Text variant="bodyLarge">No background runs recorded in the last 6 hours.</Text> : undefined}
            renderItem={({item}) => {
                const timestamp = hongKongTimestamp(item.startedAt);
                const title = `${timestamp.slice(11)} · ${stageLabels[item.stage]}`;
                const open = expanded === item.id;
                return <View>
                    <Divider/>
                    <TouchableRipple accessibilityRole="button" accessibilityLabel={`${timestamp}, ${stageLabels[item.stage]}`}
                        accessibilityHint={open ? "Hide run details" : "Show run details"}
                        accessibilityState={{expanded: open}} onPress={() => setExpanded(open ? undefined : item.id)}>
                        <View style={[layout.heading, {paddingVertical: 16, minHeight: 56}]}>
                            <Text variant="titleMedium" style={layout.grow}>{title}</Text>
                            <Icon source={open ? "chevron-up" : "chevron-down"} size={24} color={colors.onSurfaceVariant}/>
                        </View>
                    </TouchableRipple>
                    {open && <View style={[layout.section, {paddingBottom: 16}]}>
                        <Text>{timestamp} (Hong Kong time)</Text>
                        <Text>{lastStageLabels[item.stage]}</Text>
                        {!!item.reason && <Text>{reasonLabels[item.reason] ?? item.reason}</Text>}
                        <Text>Monitored scope · {item.scope === "all" ? "All stations" : item.scope === "favorites" ? "Favorite stations" : "Not read yet"}</Text>
                        <Text>MTR facility API · {item.apiCalled ? "Request started" : "Not called"}</Text>
                        {item.stationsChecked !== undefined && <Text>Facility feed read · {item.stationsChecked} stations checked</Text>}
                        <Text>Notifications submitted · {item.notifications}</Text>
                        {item.facilities?.length === 0 && <Text>No relevant outage notices</Text>}
                        {item.facilities?.map((facility, index) => <View key={index} style={{gap: 4}}>
                            <Text variant="titleSmall">{mtrStationInfo[facility.stationCode]?.englishName ?? facility.stationCode} · {facility.english?.name || `Source text · ${facility.name}`}</Text>
                            {!!(facility.english?.location || facility.location) && <Text>{facility.english?.location || `Source text · ${facility.location}`}</Text>}
                            <Text style={{color: colors.onSurfaceVariant}}>{facility.english?.message || `Source text · ${facility.message}`}</Text>
                        </View>)}
                    </View>}
                </View>;
            }}/>}
    </SafeAreaView>;
}
