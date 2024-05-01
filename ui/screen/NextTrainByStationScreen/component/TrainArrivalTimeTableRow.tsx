import {StyleSheet, Text, View} from "react-native";
import {DataTable} from "react-native-paper";
import moment from "moment";
import {TrainArrivalData} from "../../../../data/type/MTRRealTimeData";
import {mtrStationInfo} from "../../../../data/MTRStationInfo";

type Props = {
    data: TrainArrivalData
}

export default function TrainArrivalTimeTableRow({data}: Props) {
    const calMinusDiff = (dateTime?: string) => {
        return Math.ceil(moment.duration(moment(dateTime, 'YYYY-MM-DD HH:mm:ss').diff(moment())).asMinutes());
    }

    const renderEstTime = () => {
        const estTime = calMinusDiff(data.time);
        if (estTime > 1) {
            return estTime;
        } else if (estTime == 1) {
            return "正在抵達";
        } else {
            return "正在離開";
        }
    }

    return (
        <DataTable.Row centered>
            <DataTable.Cell
                style={styles.cellDest}>{mtrStationInfo[data.dest] ? mtrStationInfo[data.dest].chineseName : data.dest}</DataTable.Cell>
            <DataTable.Cell style={styles.cellPlatform}>{data.plat}</DataTable.Cell>
            <DataTable.Cell style={styles.cellTime}>{renderEstTime()}</DataTable.Cell>
        </DataTable.Row>
    )
}

const styles = StyleSheet.create({
    cellDest: {
        justifyContent: "flex-start",
        alignItems: "center"
    },
    cellPlatform: {
        justifyContent: "center",
        alignItems: "center"
    },
    cellTime: {
        justifyContent: "flex-end",
        alignItems: "center"
    }
})