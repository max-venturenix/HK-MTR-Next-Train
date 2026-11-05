import LittleTwinStarsBackground, {LittleTwinStarsRailway} from "../../component/LittleTwinStarsBackground";
import {router, useIsFocused} from "expo-router";
import {useState} from "react";
import {ScrollView, View} from "react-native";
import {Button, Text, useTheme} from "react-native-paper";
import {SafeAreaView} from "react-native-safe-area-context";
import LinePicker from "./component/LinePicker";
import StationPicker from "./component/StationPicker";
import {layout} from "../../theme";
import LittleTwinStarsArtwork from "../../component/LittleTwinStarsArtwork";

export default function SelectStationScreen() {
    const [lineCode, setLineCode] = useState("KTL");
    const [stationCode, setStationCode] = useState("DIH");
    const {colors} = useTheme();
    const focused = useIsFocused();
    return <SafeAreaView edges={["top", "left", "right"]} style={[layout.screen, {backgroundColor: colors.background, display: focused ? "flex" : "none"}]}>
        <LittleTwinStarsBackground/>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={layout.content}>
            <View style={layout.section}>
                <Text variant="headlineLarge" accessibilityRole="header">搜尋車站</Text>
                <Text variant="bodyLarge" style={{color: colors.onSurfaceVariant}}>選擇車線與車站，查看下一班列車。</Text>
            </View>
            <LittleTwinStarsArtwork cover="search"/>
            <View style={[layout.section, {padding: 20, borderRadius: 16, backgroundColor: colors.surface}]}>
                <LinePicker lineCode={lineCode} setLineCode={setLineCode} setStationCode={setStationCode}/>
                <StationPicker lineCode={lineCode} stationCode={stationCode} setStationCode={setStationCode}/>
                <Button mode="contained" icon="arrow-right" contentStyle={layout.button}
                    onPress={() => router.push({pathname: "/station/[stationCode]", params: {stationCode}})}>查看到站時間</Button>
            </View>
            <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>在車站頁面點選星號，即可加入收藏。</Text>
        </ScrollView>
        <LittleTwinStarsRailway/>
    </SafeAreaView>;
}
