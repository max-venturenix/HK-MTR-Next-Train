import {RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View} from "react-native";
import React, {useCallback, useEffect, useLayoutEffect, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";
import * as FavoriteStationsApi from "../../../api/FavoriteStationsApi";
import {FavoriteStationsScreenProps} from "../../../data/navigation/NavigationData";
import {LineStaData, MTRRealTimeDataType} from "../../../data/type/MTRRealTimeData.type";
import EstTimeItemContainer from "../NextTrainByStationScreen/component/EstTimeItemContainer";
import LoadingContainer from "../../component/LoadingContainer";
import MTRLineJson from "../../../data/json/station_info.json";
import {MTRStationInfo} from "../../../data/type/MTRStationInfo.type";
import {getMTRRealTimeData} from "../../../api/MTRApi";
import moment from "moment";
import FavStaEstTimeItemContainer from "./component/FavStaEstTimeItemContainer";


export default function FavoriteStationScreen({navigation}: FavoriteStationsScreenProps) {
    const [favoriteStations, setFavoriteStations] = useState<string[]>([]);

    const [dataList, setDataList] = useState<MTRRealTimeDataType[] | undefined>(undefined);
    const [updatedTime, setUpdateTime] = useState<string | undefined>(undefined);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const mtrStationInfo = MTRLineJson as MTRStationInfo;

    const fetchData = useCallback(async () => {
        console.log("hihi")
        setDataList(undefined);
        const favoriteStations = await FavoriteStationsApi.getFavoriteStations();
        setFavoriteStations(favoriteStations);

        const apiPromises: Promise<MTRRealTimeDataType>[] = [];
        for (const stationCode of favoriteStations) {
            for (const lineCode of mtrStationInfo[stationCode].line) {
                apiPromises.push(getMTRRealTimeData(lineCode, stationCode));
            }
        }
        setDataList(await Promise.all(apiPromises));

        setUpdateTime(moment().format("YYYY-MM-DD HH:mm:ss"));
    }, [])

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [])

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            fetchData();
        });

        return unsubscribe;
    }, [navigation]);

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
                        favoriteStations.map((stationCode) => {
                            return mtrStationInfo[stationCode].line.map((lineCode) => {
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
                                    <FavStaEstTimeItemContainer
                                        lineCode={lineCode}
                                        stationCode={stationCode}
                                        data={lineStationData!}
                                    />
                                </View>
                            })
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