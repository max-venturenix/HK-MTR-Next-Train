import {View} from "react-native";
import {Text, useTheme} from "react-native-paper";
import {formatArrival} from "../../../../data/arrivalTime";
import {TrainArrivalData} from "../../../../data/type/MTRRealTimeData";
import {mtrStationInfo} from "../../../../data/MTRStationInfo";

export default function TrainArrivalTimeTableRow({data, prominent = false}: {data: TrainArrivalData; prominent?: boolean}) {
    const {colors} = useTheme();
    return <View style={{paddingVertical: prominent ? 16 : 12, gap: 8,
        borderTopWidth: prominent ? 0 : 1, borderColor: colors.outlineVariant}}>
        <View style={{flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 12}}>
            <Text variant={prominent ? "titleLarge" : "bodyLarge"} style={{flexShrink: 1}}>
                往 {mtrStationInfo[data.dest]?.chineseName ?? data.dest}{data.route === "RAC" ? "（經馬場）" : ""}
            </Text>
            <Text variant={prominent ? "headlineMedium" : "titleMedium"}
                style={{color: prominent ? colors.primary : colors.onSurface, fontVariant: ["tabular-nums"]}}>{formatArrival(data)}</Text>
        </View>
        <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>
            {data.plat} 號月台{data.timetype === "A" ? " · 到站" : data.timetype === "D" ? " · 開出" : ""}
        </Text>
    </View>;
}
