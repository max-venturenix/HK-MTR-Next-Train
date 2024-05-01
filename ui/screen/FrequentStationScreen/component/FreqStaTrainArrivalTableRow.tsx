import {StyleSheet, Text, View} from "react-native";
import {DataTable} from "react-native-paper";
import moment from "moment";
import {TrainArrivalData} from "../../../../data/type/MTRRealTimeData";
import {mtrStationInfo} from "../../../../data/MTRStationInfo";
import {mtrLineInfo} from "../../../../data/MTRLineInfo";
import React from "react";

type Props = {
    lineCode: string,
    data: TrainArrivalData
}

export default function FreqStaTrainArrivalTableRow({lineCode, data}: Props) {
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
            <DataTable.Cell style={styles.cellLine}>
                <Text
                    key={lineCode}
                    style={{
                        color: "white",
                        borderRadius: 4,
                        padding: 4,
                        backgroundColor: mtrLineInfo[lineCode].colorCode,
                    }}
                >
                    {mtrLineInfo[lineCode].chineseName}
                </Text>
            </DataTable.Cell>
            <DataTable.Cell
                style={styles.cellDest}>{mtrStationInfo[data.dest] ? mtrStationInfo[data.dest].chineseName : data.dest}</DataTable.Cell>
            <DataTable.Cell style={styles.cellPlatform}>{data.plat}</DataTable.Cell>
            <DataTable.Cell style={styles.cellTime}>{renderEstTime()}</DataTable.Cell>
        </DataTable.Row>
    )
}

const styles = StyleSheet.create({
    cellLine: {
        // fontWeight: "bold",
        justifyContent: "flex-start",
        alignItems: "center",
        flex:2
    },
    cellDest: {
        // fontWeight: "bold",
        justifyContent: "flex-start",
        alignItems: "center",
        flex:3
    },
    cellPlatform: {
        // fontWeight: "bold",
        justifyContent: "center",
        alignItems: "center",
        flex:1
    },
    cellTime: {
        // fontWeight: "bold",
        justifyContent: "flex-end",
        alignItems: "center",
        flex:2
    }
})