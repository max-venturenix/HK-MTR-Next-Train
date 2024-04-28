import React from "react";
import {StyleSheet, Text, View} from "react-native";
import {Picker} from "@react-native-picker/picker";
import lineInfoJson from "../../../../data/json/line_info.json";
import stationInfoJson from "../../../../data/json/station_info.json";
import {MTRStationInfo} from "../../../../data/type/MTRStationInfo.type";
import {MTRLineInfo} from "../../../../data/type/MTRLineInfo.type";

type Props = {
    lineCode: string,
    stationCode: string
    setStationCode: React.Dispatch<React.SetStateAction<string>>
}

export default function StationPicker({lineCode, stationCode, setStationCode}: Props) {
    const mtrLineInfo = lineInfoJson as MTRLineInfo;
    const mtrStationInfo = stationInfoJson as MTRStationInfo;

    const renderStationPickerItems = () => {
        return mtrLineInfo[lineCode].stations.map((item) => (
            <Picker.Item
                key={item}
                label={mtrStationInfo[item].chineseName}
                value={item}
            />
        ))
    }

    return (
        <View>
            <Text style={styles.label}>請選擇車站</Text>
            <Picker
                selectedValue={stationCode}
                onValueChange={(itemValue, itemIndex) =>
                    setStationCode(itemValue)
                }
            >
                {
                    renderStationPickerItems()
                }
            </Picker>
        </View>
    )
}

const styles = StyleSheet.create({
        label: {
            fontWeight: "bold",
            fontSize: 16
        }
    }
)