import {StyleSheet, Text, View} from "react-native";
import EstTimeItem from "./EstTimeItem";
import {DataTable} from "react-native-paper";
import {LineStaData, MtrRealTimeData} from "../../../../data/type/MtrRealTimeData";
import {mtrLineData, mtrLineInfo} from "../../../../data/LineData";

type Props = {
    lineCode: string,
    stationCode: string,
    data: LineStaData
}

export default function EstTimeItemContainer({lineCode, stationCode, data}: Props) {
    return (
        <View>
            <Text style={[styles.lineTitle, {backgroundColor: mtrLineInfo[lineCode].colorCode}]}>{mtrLineData[lineCode]}</Text>
            <DataTable style={{paddingHorizontal: 4}}>
                <DataTable.Header>
                    <DataTable.Title style={styles.cellDest}>目的地</DataTable.Title>
                    <DataTable.Title style={styles.cellPlatform}>月台</DataTable.Title>
                    <DataTable.Title style={styles.cellTime}>下一班車</DataTable.Title>
                </DataTable.Header>

                {
                    data.UP.map((value) => (
                        <EstTimeItem data={value} key={value.time}/>
                    ))
                }
            </DataTable>

            <DataTable style={{paddingHorizontal: 4}}>
                <DataTable.Header>
                    <DataTable.Title style={styles.cellDest}>目的地</DataTable.Title>
                    <DataTable.Title style={styles.cellPlatform}>月台</DataTable.Title>
                    <DataTable.Title style={styles.cellTime}>下一班車</DataTable.Title>
                </DataTable.Header>

                {
                    data.DOWN.map((value) => (
                        <EstTimeItem data={value} key={value.time}/>
                    ))
                }
            </DataTable>
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