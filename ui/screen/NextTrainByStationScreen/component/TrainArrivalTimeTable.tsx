import {StyleSheet, Text, View} from "react-native";
import TrainArrivalTimeTableRow from "./TrainArrivalTimeTableRow";
import {DataTable} from "react-native-paper";
import {LineStaData} from "../../../../data/type/MTRRealTimeData";
import {mtrLineInfo} from "../../../../data/MTRLineInfo";

type Props = {
    lineCode: string,
    stationCode: string,
    data: LineStaData
}

export default function TrainArrivalTimeTable({lineCode, stationCode, data}: Props) {
    const renderUpTable = () => {
        if (data.UP) {
            return (
                <DataTable style={{paddingHorizontal: 4}}>
                    <DataTable.Header>
                        <DataTable.Title style={styles.cellDest}>目的地</DataTable.Title>
                        <DataTable.Title style={styles.cellPlatform}>月台</DataTable.Title>
                        <DataTable.Title style={styles.cellTime}>下一班車</DataTable.Title>
                    </DataTable.Header>

                    {
                        data.UP.map((value) => (
                            <TrainArrivalTimeTableRow data={value} key={value.time}/>
                        ))
                    }
                </DataTable>
            )
        }
    }

    const renderDownTable = () => {
        if (data.DOWN) {
            return (
                <DataTable style={{paddingHorizontal: 4}}>
                    <DataTable.Header>
                        <DataTable.Title style={styles.cellDest}>目的地</DataTable.Title>
                        <DataTable.Title style={styles.cellPlatform}>月台</DataTable.Title>
                        <DataTable.Title style={styles.cellTime}>下一班車</DataTable.Title>
                    </DataTable.Header>

                    {
                        data.DOWN.map((value) => (
                            <TrainArrivalTimeTableRow data={value} key={value.time}/>
                        ))
                    }
                </DataTable>
            )
        }
    }

    return (
        <View>
            <Text
                style={[styles.lineTitle, {backgroundColor: mtrLineInfo[lineCode].colorCode}]}>
                {mtrLineInfo[lineCode].chineseName}
            </Text>

            {
                renderUpTable()
            }
            {
                renderDownTable()
            }
        </View>
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
    cellDest: {
        // fontWeight: "bold",
        justifyContent: "flex-start",
        alignItems: "center",
    },
    cellPlatform: {
        // fontWeight: "bold",
        justifyContent: "center",
        alignItems: "center"
    },
    cellTime: {
        // fontWeight: "bold",
        justifyContent: "flex-end",
        alignItems: "center"
    }
})