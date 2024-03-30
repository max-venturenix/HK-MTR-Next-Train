import {Platform, StyleSheet} from "react-native";

export const GenerateStyles = StyleSheet.create({
    droidSafeArea: {
        flex: 1,
        // paddingTop: Platform.OS === 'android' ? 25 : 0,
        paddingHorizontal: 16
    },
})