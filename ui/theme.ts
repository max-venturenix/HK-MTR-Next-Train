import {MD3DarkTheme, MD3LightTheme, configureFonts} from "react-native-paper";
import {Platform, StyleSheet} from "react-native";

const fonts = configureFonts({config: {fontFamily: Platform.OS === "ios" ? "System" : "sans-serif"}});
export const lightTheme = {
    ...MD3LightTheme, fonts,
    colors: {...MD3LightTheme.colors,
        primary: "#203C58", onPrimary: "#FFFFFF", primaryContainer: "#DCE8F3", onPrimaryContainer: "#162D44",
        secondary: "#4C6174", secondaryContainer: "#DCE8F3", onSecondaryContainer: "#162D44",
        background: "#F5F6F7", onBackground: "#19232D", surface: "#FFFFFF", onSurface: "#19232D",
        surfaceVariant: "#E9EDF0", onSurfaceVariant: "#4C5965", outline: "#73808C", outlineVariant: "#D4DBE1"}
};
export const darkTheme = {
    ...MD3DarkTheme, fonts,
    colors: {...MD3DarkTheme.colors,
        primary: "#B3D1ED", onPrimary: "#143149", primaryContainer: "#2B465E", onPrimaryContainer: "#DCE8F3",
        secondary: "#B5C8D9", secondaryContainer: "#2B465E", onSecondaryContainer: "#DCE8F3",
        background: "#11171D", onBackground: "#E3EAF0", surface: "#1B232B", onSurface: "#E3EAF0",
        surfaceVariant: "#2C3640", onSurfaceVariant: "#BDC9D3", outline: "#8C9AA6", outlineVariant: "#414D58"}
};
export const layout = StyleSheet.create({
    screen: {flex: 1},
    content: {width: "100%", maxWidth: 720, alignSelf: "center", padding: 20, gap: 24, paddingBottom: 32},
    heading: {flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16},
    grow: {flex: 1, flexShrink: 1},
    section: {gap: 16},
    muted: {fontSize: 14},
    button: {minHeight: 48, justifyContent: "center"}
});
