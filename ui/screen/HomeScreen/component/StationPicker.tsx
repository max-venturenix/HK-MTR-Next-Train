import React from "react";
import {StyleSheet, Text, View} from "react-native";
import {Picker} from "@react-native-picker/picker";
import {stationInfoData} from "../../../../data/StationInfoData";
import {mtrLineInfo} from "../../../../data/LineData";

type Props = {
    lineCode: string,
    stationCode: string
    setStationCode: React.Dispatch<React.SetStateAction<string>>
}

export default function StationPicker({lineCode, stationCode, setStationCode}: Props) {
    const renderStationPickerItems = () => {
        const stationPickerItems: JSX.Element[] = [];
        let isFirstStation = true;
        for (const stationCode in stationInfoData) {
            stationInfoData[stationCode].line.forEach((value) => {
                if (value === lineCode) {
                    stationPickerItems.push(
                        <Picker.Item
                            key={stationCode}
                            label={stationInfoData[stationCode].chineseName}
                            value={stationCode}
                        />
                    );
                }
            })
        }
        return stationPickerItems;
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