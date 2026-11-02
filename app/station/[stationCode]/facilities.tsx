import {Link, Stack, useLocalSearchParams} from "expo-router";
import {View} from "react-native";
import {Text, useTheme} from "react-native-paper";
import {mtrStationInfo} from "../../../data/MTRStationInfo";
import FacilityOutageScreen from "../../../ui/screen/FacilityOutageScreen/FacilityOutageScreen";

export default function StationFacilitiesRoute() {
    const {colors} = useTheme();
    const {stationCode} = useLocalSearchParams<{stationCode?: string | string[]}>();
    if (typeof stationCode !== "string" || !Object.hasOwn(mtrStationInfo, stationCode)) {
        return <View style={{flex: 1, padding: 24, gap: 16, justifyContent: "center", backgroundColor: colors.background}}>
            <Stack.Screen options={{title: "找不到車站"}}/>
            <Text>無效的車站編號</Text>
            <Link href="/search" dismissTo style={{color: colors.primary, padding: 16}}>返回搜尋</Link>
        </View>;
    }
    return <FacilityOutageScreen key={stationCode} stationCode={stationCode}/>;
}
