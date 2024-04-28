import {StyleSheet, Text, View} from "react-native";
import {Picker} from "@react-native-picker/picker";
import React, {JSX, useState} from "react";
import mtrLineInfoJson from "../../../../data/json/line_info.json";
import {MTRLineInfo} from "../../../../data/type/MTRLineInfo.type";

type Props = {
    lineCode: string
    setLineCode: React.Dispatch<React.SetStateAction<string>>
    setStationCode: React.Dispatch<React.SetStateAction<string>>
}

export default function LinePicker({lineCode, setLineCode, setStationCode}: Props) {
    const mtrLineInfo = mtrLineInfoJson as MTRLineInfo;

    const renderLinePickerItems = () => {
        const linePickerItems: JSX.Element[] = [];
        for (const lineCode in mtrLineInfo) {
            linePickerItems.push(
                <Picker.Item
                    key={lineCode}
                    label={mtrLineInfo[lineCode].chineseName}
                    value={lineCode}
                />
            )
        }
        return linePickerItems;
    }

    const handleLineChange = (itemValue: string) => {
        setLineCode(itemValue);
        setStationCode(mtrLineInfo[itemValue].stations[0]);
    }

    return (
        <View>
            <Text style={styles.label}>請選擇車線</Text>
            <Picker
                selectedValue={lineCode}
                onValueChange={handleLineChange}
            >
                {
                    renderLinePickerItems()
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