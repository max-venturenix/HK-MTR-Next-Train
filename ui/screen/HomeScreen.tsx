import {SafeAreaView, View, StyleSheet, Button, Text, Image} from "react-native";
import EstTimeItemContainer from "../component/EstTimeItemContainer";
import {GenerateStyles} from "../../styles/GenerateStyles";
import {Picker} from "@react-native-picker/picker";
import {useState} from "react";
import {HomeScreenProps} from "../../data/navigation/NavigationData";

export default function HomeScreen({navigation}: HomeScreenProps) {
    const [stationName, setStationName] = useState<string>("DIH");

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
                <Text style={styles.label}>請選擇車站</Text>
                <Picker
                    selectedValue={stationName}
                    onValueChange={(itemValue, itemIndex) =>
                        setStationName(itemValue)
                    }
                >
                    <Picker.Item label="樂富" value="LOF"/>
                    <Picker.Item label="油塘" value="YAT"/>
                    <Picker.Item label="鑽石山" value="DIH"/>
                    <Picker.Item label="九龍塘" value="KOT"/>
                    <Picker.Item label="大圍" value="TAW"/>
                </Picker>
                <Button title="搜尋" onPress={() => {
                    navigation.navigate("NextTrain", {
                        stationCode: stationName
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