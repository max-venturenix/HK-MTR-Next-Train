import {StyleSheet, Text, Touchable, TouchableOpacity, View} from "react-native";
import {DataTable, List} from "react-native-paper";
import {LineStaData, MTRRealTimeData} from "../../../../data/type/MTRRealTimeData";
import FreqStaTrainArrivalTableRow from "./FreqStaTrainArrivalTableRow";
import {mtrLineInfo} from "../../../../data/MTRLineInfo";
import {mtrStationInfo} from "../../../../data/MTRStationInfo";

type Props = {
    stationCode: string,
    dataList: MTRRealTimeData[],
}

export default function FreqStaTrainArrivalTable({stationCode, dataList}: Props) {
    const renderUpTable = () => {
        return (
            <DataTable style={{paddingHorizontal: 4}}>
                <DataTable.Header>
                    <DataTable.Title style={{...styles.cellLine}}>路線</DataTable.Title>
                    <DataTable.Title style={styles.cellDest}>目的地</DataTable.Title>
                    <DataTable.Title style={styles.cellPlatform}>月台</DataTable.Title>
                    <DataTable.Title style={styles.cellTime}>下一班車</DataTable.Title>
                </DataTable.Header>
                {
                    mtrStationInfo[stationCode].line.map((lineCode) => {
                        for (let data of dataList) {
                            if (data.data[`${lineCode}-${stationCode}`]) {
                                const lineStationData = data.data[`${lineCode}-${stationCode}`];
                                return (
                                    <>
                                        {lineStationData.UP && <FreqStaTrainArrivalTableRow lineCode={lineCode} data={lineStationData.UP[0]}/>}
                                        {lineStationData.DOWN && <FreqStaTrainArrivalTableRow lineCode={lineCode} data={lineStationData.DOWN[0]}/>}
                                    </>
                                )
                            }
                        }
                    })
                }

            </DataTable>
        )
    }

    return (
        <>
            {
                renderUpTable()
            }
        </>
    )
}

const styles = StyleSheet.create({
    lineTitle: {
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 14,
        // backgroundColor: "grey",
        paddingVertical: 8,
        color: "white"
    },
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