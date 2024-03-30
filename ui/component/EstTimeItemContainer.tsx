import {ScrollView, StyleSheet, Text, View} from "react-native";
import EstTimeItem from "./EstTimeItem";
import {DataTable} from "react-native-paper";
import {useEffect, useState} from "react";
import {MtrRealTimeData} from "../../data/type/MtrRealTimeData";
import {getMTRRealTimeData} from "../../api/MTRApi";
import {mtrLineData} from "../../data/LineData";
import mockData from "../screen/response.json";
import LoadingContainer from "./LoadingContainer";

type Props = {
    lineCode: string,
    stationCode: string
}

export default function EstTimeItemContainer({lineCode, stationCode}: Props) {
    const [data, setData] = useState<MtrRealTimeData | null | undefined>(undefined);

    const fetchData = async (lineCode: string, stationCode: string) => {
        const responseData = await getMTRRealTimeData(lineCode, stationCode);
        // console.log(responseData);
        setData(responseData);
    }

    useEffect(() => {
        fetchData(lineCode, stationCode);
        // setData(mockData);
    }, []);

    const renderTable = () => {
        if (data) {
            return (
                <View>
                    <Text style={styles.lineTitle}>{mtrLineData[lineCode]}</Text>
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title style={styles.cellDest}>目的地</DataTable.Title>
                            <DataTable.Title style={styles.cellPlatform}>月台</DataTable.Title>
                            <DataTable.Title style={styles.cellTime}>下一班車</DataTable.Title>
                        </DataTable.Header>

                        {
                            data.data[`${lineCode}-${stationCode}`].UP.map((value, index, array) => (
                                <EstTimeItem data={value} key={value.time}/>
                            ))
                        }
                    </DataTable>

                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title style={styles.cellDest}>目的地</DataTable.Title>
                            <DataTable.Title style={styles.cellPlatform}>月台</DataTable.Title>
                            <DataTable.Title style={styles.cellTime}>下一班車</DataTable.Title>
                        </DataTable.Header>

                        {
                            data.data[`${lineCode}-${stationCode}`].DOWN.map((value, index, array) => (
                                <EstTimeItem data={value} key={value.time}/>
                            ))
                        }
                    </DataTable>
                </View>
            )
        } else {
            return (
                <View>
                    <LoadingContainer/>
                </View>
            )
        }
    }

    return (
        renderTable()
    )
}

const styles = StyleSheet.create({
    lineTitle: {
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 14,
        backgroundColor: "grey",
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