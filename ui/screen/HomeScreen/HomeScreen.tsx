import {SafeAreaView, View, StyleSheet, Button, Text, Image} from "react-native";
import EstTimeItemContainer from "../NextTrainByStationScreen/component/EstTimeItemContainer";
import {GenerateStyles} from "../../../styles/GenerateStyles";
import {Picker} from "@react-native-picker/picker";
import {useState} from "react";
import {HomeScreenProps} from "../../../data/navigation/NavigationData";
import LinePicker from "./component/LinePicker";
import StationPicker from "./component/StationPicker";

export default function HomeScreen({navigation}: HomeScreenProps) {
    const [lineCode, setLineCode] = useState<string>("KTL");
    const [stationCode, setStationCode] = useState<string>("DIH");

    return (
        <SafeAreaView style={[GenerateStyles.droidSafeArea]}>
            <View style={styles.container}>
                <Image
                    style={{alignSelf: "center", marginBottom: 40}}
                    width={200}
                    height={200 * 400 / 500}
                    resizeMethod="auto"
                    source={{uri: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/HK_MTR_logo.svg/1000px-HK_MTR_logo.svg.png?20210510163406"}}
                />

                <LinePicker lineCode={lineCode} setLineCode={setLineCode} setStationCode={setStationCode}/>

                <StationPicker lineCode={lineCode} stationCode={stationCode} setStationCode={setStationCode}/>

                <Button title="搜尋" onPress={() => {
                    navigation.navigate("NextTrain", {
                        stationCode: stationCode
                    })
                }}/>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 32,
        justifyContent: "center",
    },
    label: {
        fontWeight: "bold",
        fontSize: 16
    }
});