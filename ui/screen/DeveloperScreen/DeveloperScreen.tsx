import {useCallback, useRef, useState} from "react";
import {AppState, FlatList, Platform, View} from "react-native";
import {useFocusEffect} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {Button, Divider, Text, useTheme} from "react-native-paper";
import {FacilityActivity, getFacilityActivity} from "../../../services/facilityActivityLog";
import {sendTestNotification} from "../../../services/facilityNotifications";
import {formatFacilityTimestamp} from "../../../data/facilityOutages";
import {mtrStationInfo} from "../../../data/MTRStationInfo";
import {layout} from "../../theme";

const stageLabels = {started: "已開始，尚未完成", requesting: "已開始 API 請求，尚未完成",
    "feed-read": "已讀取設施資料，尚未完成", success: "檢查完成", skipped: "已略過", failed: "檢查失敗"};

export default function DeveloperScreen() {
    const {colors} = useTheme();
    const [rows, setRows] = useState<FacilityActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [feedback, setFeedback] = useState<string>();
    const [testDelay, setTestDelay] = useState<0 | 10>();
    const testing = useRef(false);
    const load = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try { setRows(await getFacilityActivity()); }
        catch { setError("無法讀取背景活動記錄，請重新整理。"); }
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
            setFeedback(delay ? "已安排測試通知，將於 10 秒後發送。你可以先離開應用程式。" : "已傳送測試通知。");
        } catch (reason) {
            setFeedback(reason instanceof Error ? reason.message : "無法傳送測試通知，請重試。");
        } finally { testing.current = false; setTestDelay(undefined); }
    };
    return <SafeAreaView edges={["left", "right", "bottom"]} style={[layout.screen, {backgroundColor: colors.background}]}>
        {Platform.OS !== "android" ? <View style={layout.content}>
            <Text variant="bodyLarge">通知測試及背景活動診斷現時支援 Android。</Text>
        </View> : <FlatList data={rows} keyExtractor={item => item.id} contentContainerStyle={layout.content}
            ListHeaderComponent={<View style={layout.section}>
                <Text variant="titleLarge" accessibilityRole="header">通知測試</Text>
                <Button mode="outlined" icon="bell-outline" contentStyle={layout.button}
                    loading={testDelay === 0} disabled={testDelay !== undefined} onPress={() => void test(0)}>測試通知</Button>
                <Button mode="outlined" icon="bell-outline" contentStyle={layout.button}
                    loading={testDelay === 10} disabled={testDelay !== undefined} onPress={() => void test(10)}>10 秒後測試通知</Button>
                {feedback && <Text accessibilityLiveRegion="polite">{feedback}</Text>}
                <Text variant="titleLarge" accessibilityRole="header">過去 6 小時背景活動</Text>
                <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>
                    Android 決定背景執行時間，可能因電池或網絡狀態延遲。記錄從更新後首次背景執行開始。時間均為香港時間。
                </Text>
                <Button icon="reload" loading={loading} disabled={loading} contentStyle={layout.button}
                    onPress={() => void load()}>重新整理</Button>
                {error && <Text accessibilityRole="alert" style={{color: colors.error}}>{error}</Text>}
            </View>}
            ListEmptyComponent={!loading && !error ? <Text variant="bodyLarge">過去 6 小時尚未有背景活動記錄。</Text> : undefined}
            renderItem={({item}) => <View style={layout.section}>
                <Divider/>
                <Text variant="titleMedium" accessibilityRole="header">{formatFacilityTimestamp(new Date(item.startedAt).toISOString())}</Text>
                <Text variant="bodyLarge">{stageLabels[item.stage]}{item.reason ? ` · ${item.reason}` : ""}</Text>
                <Text>監察範圍 · {item.scope === "all" ? "所有車站" : item.scope === "favorites" ? "收藏車站" : "尚未讀取"}</Text>
                <Text>MTR 設施 API · {item.apiCalled ? "已開始呼叫" : "未呼叫"}</Text>
                {item.stationsChecked !== undefined && <Text>已讀取設施資料 · 檢查 {item.stationsChecked} 個車站</Text>}
                <Text>已提交通知 · {item.notifications} 則</Text>
                {item.facilities?.length === 0 && <Text>未有相關停用通告</Text>}
                {item.facilities?.map((facility, index) => <View key={index} style={{gap: 4}}>
                    <Text variant="titleSmall">{mtrStationInfo[facility.stationCode]?.chineseName ?? facility.stationCode}站 · {facility.name}</Text>
                    {!!facility.location && <Text>{facility.location}</Text>}
                    <Text style={{color: colors.onSurfaceVariant}}>{facility.message}</Text>
                </View>)}
            </View>}/>}
    </SafeAreaView>;
}
