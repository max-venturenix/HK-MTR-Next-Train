import {useStationArrivals} from "../../hooks/useStationArrivals";
import StationArrivals from "../../component/StationArrivals";
import {useEffect, useState} from "react";
import {RefreshControl, ScrollView, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {router, Stack} from "expo-router";
import {Button, IconButton, Text, useTheme} from "react-native-paper";
import * as FrequentStationsApi from "../../../api/FrequentStationsApi";
import {mtrStationInfo} from "../../../data/MTRStationInfo";
import {layout} from "../../theme";

export default function NextTrainByStationScreen({stationCode}: {stationCode: string}) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [savingFavorite, setSavingFavorite] = useState(false);
    const [favoriteReady, setFavoriteReady] = useState(false);
    const [favoriteError, setFavoriteError] = useState<string>();
    const {colors} = useTheme();
    const {results, refreshing, refresh} = useStationArrivals(stationCode);
    useEffect(() => {
        let active = true;
        void FrequentStationsApi.isFavoriteStation(stationCode).then(value => {
            if (active) { setIsFavorite(value); setFavoriteReady(true); }
        }).catch(() => { if (active) setFavoriteError("無法讀取收藏狀態，請返回後重試。"); });
        return () => { active = false; };
    }, [stationCode]);
    const handleFavoritePress = async () => {
        setSavingFavorite(true);
        setFavoriteError(undefined);
        try {
            if (isFavorite) await FrequentStationsApi.removeFavoriteStation(stationCode);
            else await FrequentStationsApi.addFavoriteStation(stationCode);
            setIsFavorite(!isFavorite);
        } catch {
            setFavoriteError("無法儲存收藏，請再點選星號重試。");
        } finally { setSavingFavorite(false); }
    };
    return <SafeAreaView edges={["left", "right", "bottom"]} style={[layout.screen, {backgroundColor: colors.background}]}>
        <Stack.Screen options={{title: mtrStationInfo[stationCode].chineseName,
            headerRight: () => <IconButton icon={isFavorite ? "star" : "star-outline"} size={24}
                style={{width: 48, height: 48}} iconColor={colors.primary}
                accessibilityLabel={isFavorite ? "取消收藏" : "收藏車站"}
                accessibilityState={{selected: isFavorite, disabled: savingFavorite || !favoriteReady}}
                disabled={savingFavorite || !favoriteReady} onPress={handleFavoritePress}/>
        }}/>
        <ScrollView contentContainerStyle={layout.content}
            refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} onRefresh={() => void refresh()}/> }>
            <View style={layout.heading}>
                <Text variant="headlineSmall" accessibilityRole="header" style={layout.grow}>即時到站</Text>
                <Button icon="reload" loading={refreshing} disabled={refreshing} contentStyle={layout.button}
                    onPress={() => void refresh()}>重新整理</Button>
            </View>
            {favoriteError && <Text accessibilityRole="alert" style={{color: colors.error}}>{favoriteError}</Text>}
            <Button mode="outlined" icon="wheelchair-accessibility" contentStyle={layout.button}
                onPress={() => router.push({pathname: "/station/[stationCode]/facilities", params: {stationCode}})}>查看設施狀況</Button>
            <StationArrivals stationCode={stationCode} results={results}/>
        </ScrollView>
    </SafeAreaView>;
}
