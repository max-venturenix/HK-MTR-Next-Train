import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View} from "react-native";
import {IconButton} from "react-native-paper";
import {NextTrainByStationProps} from "../../../data/navigation/NavigationData";
import moment from "moment/moment";
import {getMTRRealTimeData} from "../../../api/MTRApi";
import * as FrequentStationsApi from "../../../api/FrequentStationsApi";
import TrainArrivalTimeTable from "./component/TrainArrivalTimeTable";
import LoadingContainer from "../../component/LoadingContainer";
import {LineStaData, MTRRealTimeData} from "../../../data/type/MTRRealTimeData";
import {mtrStationInfo} from "../../../data/MTRStationInfo";

export default function NextTrainByStationScreen({route, navigation}: NextTrainByStationProps) {
    const {stationCode} = route.params;

    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [dataList, setDataList] = useState<MTRRealTimeData[] | undefined>(undefined);
    const [updatedTime, setUpdateTime] = useState<string | undefined>(undefined);
    const [refreshing, setRefreshing] = useState<boolean>(false);


    const fetchData = async () => {
        setDataList(undefined);
        const apiPromises: Promise<MTRRealTimeData>[] = [];
        for (const lineCode of mtrStationInfo[stationCode].line) {
            apiPromises.push(getMTRRealTimeData(lineCode, stationCode));
        }
        setDataList(await Promise.all(apiPromises));
        setUpdateTime(moment().format("YYYY-MM-DD HH:mm:ss"));
    }

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [])

    const getIsFavorite = async () => {
        setIsFavorite(await FrequentStationsApi.isFavoriteStation(stationCode));
    }

    const handleFavoritePress = async () => {
        try {
            if (isFavorite) {
                await FrequentStationsApi.removeFavoriteStation(stationCode);
                setIsFavorite(false);
            } else {
                await FrequentStationsApi.addFavoriteStation(stationCode);
                setIsFavorite(true);
            }
        } catch (error) {
            console.log(error);
        }
    }


    useLayoutEffect(() => {
        getIsFavorite();
        navigation.setOptions({
            title: mtrStationInfo[stationCode].chineseName,
            headerRight: () => (
                <IconButton
                    icon={isFavorite ? "star" : "star-outline"}
                    iconColor="white"
                    onPress={handleFavoritePress}
                />
            )
        })
    }, [navigation, stationCode, isFavorite]);

    useEffect(() => {
        fetchData();
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
                        mtrStationInfo[stationCode].line.map((lineCode) => {
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
                                <TrainArrivalTimeTable
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