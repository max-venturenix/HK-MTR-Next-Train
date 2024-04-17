import {GenerateStyles} from "../../../styles/GenerateStyles";
import {Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View} from "react-native";
import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {NextTrainProps} from "../../../data/navigation/NavigationData";
import {stationInfoData} from "../../../data/StationInfoData";

import EstTimeItemContainer from "./component/EstTimeItemContainer";
import {FontAwesomeIcon} from "@fortawesome/react-native-fontawesome";
import {faRotate} from "@fortawesome/free-solid-svg-icons";
import moment from "moment/moment";
import {LineStaData, MtrRealTimeDataType} from "../../../data/type/MtrRealTimeData.type";
import {getMTRRealTimeData} from "../../../api/MTRApi";
import LoadingContainer from "../../component/LoadingContainer";
import {ActivityIndicator} from "react-native-paper";

export default function NextTrainByStationScreen({route, navigation}: NextTrainProps) {
    const {stationCode} = route.params;

    const [dataList, setDataList] = useState<MtrRealTimeDataType[] | undefined>(undefined);
    const [updatedTime, setUpdateTime] = useState<string | undefined>(undefined);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const fetchData = async () => {
        setDataList(undefined);
        const responseDataList: MtrRealTimeDataType[] = [];
        for (const lineCode of stationInfoData[stationCode].line) {
            const responseData = await getMTRRealTimeData(lineCode, stationCode);
            responseDataList.push(responseData);
        }
        // console.log(responseDataList);
        setDataList(responseDataList);
        setUpdateTime(moment().format("YYYY-MM-DD HH:mm:ss"));
    }

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [])

    useLayoutEffect(() => {
        navigation.setOptions({
            title: stationInfoData[stationCode].chineseName,
        })
    }, [navigation, stationCode]);

    useEffect(() => {
        // setTimeout(() => {
        fetchData();
        // }, 2000);
    }, []);

    const renderScrollView = () => {
        if (dataList) {
            return (
                <ScrollView refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }>
                    {
                        stationInfoData[stationCode].line.map((lineCode) => {
                            let lineStationData: LineStaData;
                            if (dataList) {
                                for (let data of dataList) {
                                    if (data.data[`${lineCode}-${stationCode}`]) {
                                        lineStationData = data.data[`${lineCode}-${stationCode}`];
                                        break;
                                    }
                                }
                            }

                            return <View key={lineCode + stationCode}>
                                <EstTimeItemContainer
                                    lineCode={lineCode}
                                    stationCode={stationCode}
                                    data={lineStationData!}
                                />
                            </View>
                        })
                    }
                </ScrollView>
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
        <SafeAreaView style={{flex: 1}}>
            <Text style={styles.updateTime}>
                {
                    updatedTime ? "最後更新: " + updatedTime : "下載中..."
                }
            </Text>
            {
                renderScrollView()
            }
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    updateTime: {
        backgroundColor: "lightgrey",
        paddingVertical: 4,
        textAlign: "center",
        color: "black",
    }
})