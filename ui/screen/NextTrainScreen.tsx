import {GenerateStyles} from "../../styles/GenerateStyles";
import {Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View} from "react-native";
import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {NextTrainProps} from "../../data/navigation/NavigationData";
import {stationInfoData} from "../../data/StationInfoData";

import EstTimeItemContainer from "../component/EstTimeItemContainer";
import {FontAwesomeIcon} from "@fortawesome/react-native-fontawesome";
import {faRotate} from "@fortawesome/free-solid-svg-icons";
import moment from "moment/moment";

export default function NextTrainScreen({route, navigation}: NextTrainProps) {
    const {stationCode} = route.params;
    const [updatedTime, setUpdateTime] = useState<string>(
        moment().format("YYYY-MM-DD HH:mm:ss")
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            title: stationInfoData[stationCode].chineseName,
            headerRight: () => (
                <Pressable onPress={() => navigation.replace("NextTrain", {
                    stationCode: stationCode
                })}>
                    <FontAwesomeIcon icon={faRotate} size={24} style={{color: "#ffffff",}}/>
                </Pressable>
            )
        })
    }, [navigation, stationCode]);

    return (
        <SafeAreaView style={[GenerateStyles.droidSafeArea]}>
            <Text style={styles.updateTime}>最後更新: {updatedTime}</Text>
            <ScrollView>
                {
                    stationInfoData[stationCode].line.map((lineCode) => (
                        <View key={lineCode + stationCode}>
                            <EstTimeItemContainer lineCode={lineCode} stationCode={stationCode}/>
                        </View>
                    ))
                }
            </ScrollView>
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