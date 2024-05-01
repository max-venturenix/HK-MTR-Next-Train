import {RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View} from "react-native";
import React, {useCallback, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";
import * as FrequentStationsApi from "../../../api/FrequentStationsApi";
import {FavoriteStationsScreenProps} from "../../../data/navigation/NavigationData";
import {LineStaData, MTRRealTimeData} from "../../../data/type/MTRRealTimeData";
import LoadingContainer from "../../component/LoadingContainer";
import {getMTRRealTimeData} from "../../../api/MTRApi";
import moment from "moment";
import {mtrStationInfo} from "../../../data/MTRStationInfo";
import {List} from "react-native-paper";
import FreqStaListAccordion from "./component/FreqStaListAccordion";


export default function FrequentStationScreen({navigation}: FavoriteStationsScreenProps) {
    const [favoriteStations, setFavoriteStations] = useState<string[]>([]);

    const [dataList, setDataList] = useState<MTRRealTimeData[] | undefined>(undefined);
    const [updatedTime, setUpdateTime] = useState<string | undefined>(undefined);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const [open, setOpen] = useState<boolean>(false);

    const fetchData = useCallback(async () => {
        // setDataList(undefined);
        const favoriteStations = await FrequentStationsApi.getFavoriteStations();
        setFavoriteStations(favoriteStations);

        const apiPromises: Promise<MTRRealTimeData>[] = [];
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

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    const renderScrollView = () => {
        if (dataList) {
            return (
                <ScrollView refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }>
                    <List.AccordionGroup>
                        {
                            favoriteStations.map((stationCode) => {
                                return (
                                    <FreqStaListAccordion
                                        key={stationCode}
                                        stationCode={stationCode}
                                        dataList={dataList}
                                        navigation={navigation}
                                    />
                                )
                            })
                        }
                    </List.AccordionGroup>
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