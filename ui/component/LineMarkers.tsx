import {View} from "react-native";
import {Text, useTheme} from "react-native-paper";
import {mtrLineInfo} from "../../data/MTRLineInfo";

export default function LineMarkers({lines}: {lines: string[]}) {
    const {colors} = useTheme();
    return <View style={{flexDirection: "row", flexWrap: "wrap", gap: 12}}>
        {lines.map(line => <View key={line} style={{flexDirection: "row", alignItems: "center", gap: 6}}>
            <View accessible={false} style={{width: 10, height: 10, borderRadius: 5,
                backgroundColor: mtrLineInfo[line].colorCode}}/>
            <Text variant="labelLarge" style={{color: colors.onSurfaceVariant}}>{mtrLineInfo[line].chineseName}</Text>
        </View>)}
    </View>;
}
