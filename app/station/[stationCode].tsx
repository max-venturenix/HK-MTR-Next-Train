import {Link, Stack, useLocalSearchParams} from "expo-router";
import {View} from "react-native";
import {Text, useTheme} from "react-native-paper";
import {mtrStationInfo} from "../../data/MTRStationInfo";
import NextTrainByStationScreen from "../../ui/screen/NextTrainByStationScreen/NextTrainByStationScreen";

export default function StationRoute() {
    const {colors} = useTheme();
    const {stationCode} = useLocalSearchParams<{stationCode?: string | string[]}>();
    if (typeof stationCode !== "string" || !Object.hasOwn(mtrStationInfo, stationCode)) {
        return (
            <View style={{flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24, backgroundColor: colors.background}}>
                <Stack.Screen options={{title: "找不到車站"}}/>
                <Text>無效的車站編號</Text>
                <Link style={{color: colors.primary, padding: 16}} href="/search" dismissTo>返回搜尋</Link>
            </View>
        );
    }
    return <NextTrainByStationScreen key={stationCode} stationCode={stationCode}/>;
}
