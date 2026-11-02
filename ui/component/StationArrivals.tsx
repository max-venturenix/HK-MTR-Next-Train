import {Linking, View} from "react-native";
import {ActivityIndicator, Button, Text, useTheme} from "react-native-paper";
import moment from "moment";
import {ArrivalResult} from "../hooks/useStationArrivals";
import {mtrStationInfo} from "../../data/MTRStationInfo";
import TrainArrivalTimeTable from "../screen/NextTrainByStationScreen/component/TrainArrivalTimeTable";
import LineMarkers from "./LineMarkers";

export default function StationArrivals({stationCode, results, compact = false}: {
    stationCode: string; compact?: boolean; results: Record<string, ArrivalResult>;
}) {
    const {colors} = useTheme();
    return <View style={{gap: 24}}>{mtrStationInfo[stationCode].line.map(line => {
        const key = `${line}-${stationCode}`;
        const result = results[key];
        const response = result?.response;
        const data = response?.data?.[key];
        return <View key={key} style={{padding: compact ? 0 : 20, borderRadius: 16, backgroundColor: colors.surface, gap: 12}}>
            <LineMarkers lines={[line]}/>
            {result?.updatedAt && <Text variant="bodySmall" style={{color: colors.onSurfaceVariant}}>
                最後更新 {moment(result.updatedAt).utcOffset(480).format("MM-DD HH:mm:ss")}</Text>}
            {result?.error && <Text accessibilityRole="alert" style={{color: colors.error}}>
                {result.error}{response ? " 現有資料可能已過時。" : ""}</Text>}
            {!result && <View style={{flexDirection: "row", gap: 12, paddingVertical: 20}}>
                <ActivityIndicator size="small"/><Text>正在載入列車資料…</Text>
            </View>}
            {response?.status === 0 && <View style={{gap: 8}}>
                <Text>{response.message || "列車服務暫未提供"}</Text>
                {response.url && <Button onPress={() => void Linking.openURL(response.url!).catch(() => {})}>查看服務安排</Button>}
            </View>}
            {response?.isdelay === "Y" && <Text style={{color: colors.error}}>列車服務有所延誤</Text>}
            {data && (data.UP?.length || data.DOWN?.length) ?
                <TrainArrivalTimeTable lineCode={line} stationCode={stationCode} data={compact ? {...data, UP: data.UP?.slice(0, 1), DOWN: data.DOWN?.slice(0, 1)} : data}/> :
                response?.status === 1 ? <Text style={{paddingVertical: 16}}>暫無列車到站資料</Text> : null}
        </View>;
    })}</View>;
}
