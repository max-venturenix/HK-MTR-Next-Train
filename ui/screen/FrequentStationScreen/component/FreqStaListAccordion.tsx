import {List, TouchableRipple} from "react-native-paper";
import {mtrStationInfo} from "../../../../data/MTRStationInfo";
import {mtrLineInfo} from "../../../../data/MTRLineInfo";
import {Dimensions, Text, TouchableOpacity, View} from "react-native";
import FreqStaTrainArrivalTable from "./FreqStaTrainArrivalTable";
import React from "react";
import {MTRRealTimeData} from "../../../../data/type/MTRRealTimeData";
import {router} from "expo-router";

type Props = {
    stationCode: string,
    dataList: MTRRealTimeData[]
}

export default function FreqStaListAccordion({stationCode, dataList}: Props) {
    const renderTitle = () => {
        return (
            <View style={{
                flexDirection: "row",
            }}>
                <View style={{minWidth: 80}}>
                    <Text
                        style={{
                            padding: 4,
                            fontSize: 16,
                        }}>
                        {mtrStationInfo[stationCode].chineseName}
                    </Text>
                </View>
                <View style={{flexDirection: "row"}}>
                    {
                        mtrStationInfo[stationCode].line.map((lineCode) => (
                            <Text
                                key={lineCode}
                                style={{
                                    // fontSize: 12,
                                    color: "white",
                                    borderRadius: 4,
                                    padding: 4,
                                    backgroundColor: mtrLineInfo[lineCode].colorCode,
                                    marginLeft: 8,
                                }}
                            >
                                {mtrLineInfo[lineCode].chineseName}
                            </Text>
                        ))
                    }
                </View>
            </View>
        )
    }

    const renderTable = () => {
        return (
            <TouchableRipple
                onLongPress={() => {
                    router.push({pathname: "/station/[stationCode]", params: {stationCode}})
                }}
            >
                <FreqStaTrainArrivalTable
                    stationCode={stationCode}
                    dataList={dataList}
                />
            </TouchableRipple>
        )
    }


    return (
        <List.Accordion
            title={renderTitle()}
            id={stationCode}
            theme={{colors: {primary: "black"}}}
        >
            {
                renderTable()
            }

        </List.Accordion>
    )
}