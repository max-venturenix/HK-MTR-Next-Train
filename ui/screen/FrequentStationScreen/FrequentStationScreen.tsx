import {RefreshControl, ScrollView, View} from "react-native";
import {useCallback, useRef, useState} from "react";
import {useFocusEffect, router, useIsFocused} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";
import {ActivityIndicator, Button, Icon, Text, TouchableRipple, useTheme} from "react-native-paper";
import * as FrequentStationsApi from "../../../api/FrequentStationsApi";
import {mtrStationInfo} from "../../../data/MTRStationInfo";
import {useStationArrivals} from "../../hooks/useStationArrivals";
import StationArrivals from "../../component/StationArrivals";
import LineMarkers from "../../component/LineMarkers";
import {layout} from "../../theme";

export default function FrequentStationScreen() {
    const [stations, setStations] = useState<string[]>([]);
    const [expanded, setExpanded] = useState<string>();
    const initialized = useRef(false);
    const [loading, setLoading] = useState(true);
    const [reloading, setReloading] = useState(false);
    const [error, setError] = useState<string>();
    const {colors} = useTheme();
    const focused = useIsFocused();
    const {results, refreshing, refresh} = useStationArrivals(expanded);
    const applyFavorites = useCallback((saved: string[]) => {
        const valid = [...new Set(saved)].filter(code => code && mtrStationInfo[code]);
        setStations(valid);
        if (!initialized.current) {
            setExpanded(valid[0]);
            initialized.current = true;
        } else {
            setExpanded(previous => previous && valid.includes(previous) ? previous : undefined);
        }
        setError(undefined);
    }, []);
    useFocusEffect(useCallback(() => {
        let active = true;
        void FrequentStationsApi.getFavoriteStations().then(saved => {
            if (active) applyFavorites(saved);
        }).catch(() => {
            if (active) setError("無法讀取收藏車站，請重新整理。");
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [applyFavorites]));
    const reload = async () => {
        setReloading(true);
        try {
            applyFavorites(await FrequentStationsApi.getFavoriteStations());
            await refresh();
        } catch {
            setError("無法讀取收藏車站，請重新整理。");
        } finally { setReloading(false); }
    };
    const busy = refreshing || reloading;
    return <SafeAreaView edges={["top", "left", "right"]} style={[layout.screen, {backgroundColor: colors.background, display: focused ? "flex" : "none"}]}>
        <ScrollView contentContainerStyle={layout.content}
            refreshControl={<RefreshControl refreshing={busy} tintColor={colors.primary} onRefresh={() => void reload()}/> }>
            <View style={layout.heading}>
                <Text variant="headlineLarge" accessibilityRole="header" style={layout.grow}>收藏車站</Text>
                <Button icon="reload" loading={busy} disabled={busy} contentStyle={layout.button}
                    onPress={() => void reload()}>重新整理</Button>
            </View>
            <Text variant="bodyLarge" style={{color: colors.onSurfaceVariant}}>常搭的車站，下一班車一眼掌握。</Text>
            {error && <Text accessibilityRole="alert" style={{color: colors.error}}>{error}</Text>}
            {loading && <View style={layout.section}><ActivityIndicator/><Text>正在讀取收藏車站…</Text></View>}
            {!loading && !stations.length && !error && <View style={[layout.section, {paddingVertical: 32}]}>
                <Icon source="star-outline" size={40} color={colors.primary}/>
                <Text variant="titleLarge">把常搭的車站放在這裡</Text>
                <Text variant="bodyLarge" style={{color: colors.onSurfaceVariant}}>搜尋車站後，點選星號加入收藏，下次開啟就能快速查看。</Text>
                <Button mode="contained" icon="train" contentStyle={layout.button} onPress={() => router.navigate("/search")}>搜尋車站</Button>
            </View>}
            {stations.map(code => <View key={code} style={{backgroundColor: colors.surface, borderRadius: 16, overflow: "hidden"}}>
                <TouchableRipple accessibilityRole="button" accessibilityLabel={`${mtrStationInfo[code].chineseName}，${expanded === code ? "收起" : "展開"}到站資料`}
                    accessibilityState={{expanded: expanded === code}}
                    onPress={() => setExpanded(expanded === code ? undefined : code)}>
                    <View style={[layout.heading, {padding: 20}]}>
                        <View style={[layout.grow, {gap: 8}]}>
                            <Text variant="titleLarge">{mtrStationInfo[code].chineseName}</Text>
                            <LineMarkers lines={mtrStationInfo[code].line}/>
                        </View>
                        <Icon source={expanded === code ? "chevron-up" : "chevron-down"} size={24} color={colors.onSurfaceVariant}/>
                    </View>
                </TouchableRipple>
                {expanded === code && <View style={{paddingHorizontal: 20, paddingBottom: 16, gap: 16}}>
                    <StationArrivals stationCode={code} results={results} compact/>
                    <Button mode="outlined" contentStyle={layout.button} icon="arrow-right"
                        onPress={() => router.push({pathname: "/station/[stationCode]", params: {stationCode: code}})}>查看車站詳情</Button>
                </View>}
            </View>)}
        </ScrollView>
    </SafeAreaView>;
}
