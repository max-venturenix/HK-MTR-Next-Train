import {useState} from "react";
import {Linking, Platform, SectionList, View} from "react-native";
import {Stack, useIsFocused} from "expo-router";
import {ActivityIndicator, Button, Divider, Searchbar, SegmentedButtons, Text, useTheme} from "react-native-paper";
import {SafeAreaView} from "react-native-safe-area-context";
import {facilityInformationUrl} from "../../../api/FacilityOutageApi";
import {formatFacilityTimestamp, groupFacilityOutages} from "../../../data/facilityOutages";
import {mtrStationInfo} from "../../../data/MTRStationInfo";
import LineMarkers from "../../component/LineMarkers";
import {useFacilityOutages} from "../../hooks/useFacilityOutages";
import {layout} from "../../theme";

export default function FacilityOutageScreen({stationCode}: {stationCode?: string}) {
    const {colors} = useTheme();
    const focused = useIsFocused();
    const {feed, error, refreshing, refresh} = useFacilityOutages();
    const [filter, setFilter] = useState("accessible");
    const [query, setQuery] = useState("");
    const [linkError, setLinkError] = useState<string>();
    const sections = groupFacilityOutages(feed?.notices ?? [], filter === "accessible", query, stationCode);
    const count = sections.reduce((total, section) => total + section.data.length, 0);
    const open = (url: string) => {
        setLinkError(undefined);
        void Linking.openURL(url).catch(() => setLinkError("無法開啟連結，請稍後再試。"));
    };
    const web = Platform.OS === "web";
    const emptyMessage = !feed ? error ? "設施資料暫時無法載入。" : "正在載入設施資料…" :
        feed.notices.length === 0 ? "港鐵資料來源目前未列出設施暫停服務通告。" :
            "沒有符合目前篩選條件的設施通告。";
    return <SafeAreaView edges={stationCode ? ["left", "right", "bottom"] : ["top", "left", "right"]}
        style={[layout.screen, {backgroundColor: colors.background, display: focused ? "flex" : "none"}]}>
        {stationCode && <Stack.Screen options={{title: `${mtrStationInfo[stationCode].chineseName}設施`}}/>}
        <SectionList sections={web ? [] : sections} keyExtractor={item => item.id}
            stickySectionHeadersEnabled={false} keyboardShouldPersistTaps="handled"
            contentContainerStyle={layout.content} refreshing={refreshing}
            onRefresh={web ? undefined : () => void refresh()}
            ListHeaderComponent={<View style={layout.section}>
                <Text variant="headlineLarge" accessibilityRole="header">設施服務狀況</Text>
                {stationCode && <Text variant="titleLarge">{mtrStationInfo[stationCode].chineseName}</Text>}
                {web ? <>
                    <Text variant="bodyLarge">網頁版請前往港鐵網站查閱設施資訊。即時設施通告可於本應用程式的 iOS 或 Android 版本查看。</Text>
                    <Button mode="contained" icon="open-in-new" contentStyle={layout.button}
                        onPress={() => open(facilityInformationUrl)}>開啟港鐵設施資訊</Button>
                </> : <>
                    <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>港鐵資料更新：{formatFacilityTimestamp(feed?.updatedAt)}</Text>
                    <Button icon="reload" mode="outlined" loading={refreshing} disabled={refreshing}
                        contentStyle={layout.button} onPress={() => void refresh()}>重新整理</Button>
                    <SegmentedButtons value={filter} onValueChange={setFilter} buttons={[
                        {value: "accessible", label: "無障礙", accessibilityLabel: "只顯示無障礙設施", style: {minHeight: 48}},
                        {value: "all", label: "全部", accessibilityLabel: "顯示全部設施", style: {minHeight: 48}}
                    ]}/>
                    {!stationCode && <Searchbar placeholder="搜尋車站名稱或編號" accessibilityLabel="搜尋車站名稱或編號"
                        value={query} onChangeText={setQuery}/>}
                    {error && <Text accessibilityRole="alert" style={{color: colors.error}}>{error}{feed ? " 以下為上次載入的資料，可能已過時。" : ""}</Text>}
                    {feed && <Text variant="titleMedium">{count} 項設施通告</Text>}
                </>}
                {linkError && <Text accessibilityRole="alert" style={{color: colors.error}}>{linkError}</Text>}
            </View>}
            ListEmptyComponent={web ? undefined : <View style={layout.section}>
                {!feed && !error && <ActivityIndicator accessibilityLabel="正在載入設施資料"/>}
                <Text variant="bodyLarge">{emptyMessage}</Text>
                {feed && <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>未列出通告不代表所有設施均正常運作。如需協助，請聯絡車站職員。</Text>}
            </View>}
            renderSectionHeader={({section}) => {
                const station = Object.hasOwn(mtrStationInfo, section.code) ? mtrStationInfo[section.code] : undefined;
                return <View style={layout.section}>
                    <Text variant="titleLarge" accessibilityRole="header">{station?.chineseName ?? section.code}</Text>
                    {station && <LineMarkers lines={station.line}/>}
                </View>;
            }}
            renderItem={({item}) => <View style={{gap: 12, padding: 20, borderRadius: 16, backgroundColor: colors.surface}}>
                <Text variant="titleMedium" accessibilityRole="header">{item.name}</Text>
                {!!item.location && <Text variant="bodyLarge">{item.location}</Text>}
                <Text variant="bodyLarge">{item.message}</Text>
                {!!item.alternative && <Text variant="bodyLarge">其他安排：{item.alternative}</Text>}
                {!!item.remarks && <Text variant="bodyLarge">備註：{item.remarks}</Text>}
                <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>通告更新：{formatFacilityTimestamp(item.updatedAt)}</Text>
                {item.phone && <View style={{gap: 8}}>
                    <Text variant="bodyLarge">電話：{item.phone}</Text>
                    <Button icon="phone" contentStyle={layout.button} accessibilityLabel={`聯絡車站，${item.phone}`}
                        onPress={() => open(`tel:${item.phone}`)}>聯絡車站</Button>
                </View>}
            </View>}
            ListFooterComponent={web ? undefined : <View style={layout.section}>
                <Divider/>
                <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>資料來源：港鐵。工程及恢復服務安排以港鐵最新公布為準。</Text>
                <Button icon="open-in-new" contentStyle={layout.button} onPress={() => open(facilityInformationUrl)}>港鐵設施資訊</Button>
            </View>}/>
    </SafeAreaView>;
}
