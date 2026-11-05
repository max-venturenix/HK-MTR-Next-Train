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
export const littleTwinStarsTheme = {
    ...MD3LightTheme, fonts,
    colors: {...MD3LightTheme.colors,
        primary: "#71518F", onPrimary: "#FFFFFF", primaryContainer: "#EEDFF8", onPrimaryContainer: "#352046",
        secondary: "#466879", onSecondary: "#FFFFFF", secondaryContainer: "#DCEFF6", onSecondaryContainer: "#253F4C",
        tertiary: "#895267", onTertiary: "#FFFFFF", tertiaryContainer: "#F9DFE9", onTertiaryContainer: "#4F293A",
        background: "#FFF5F8", onBackground: "#392D43", surface: "#FFFBFF", onSurface: "#392D43",
        surfaceVariant: "#F3E6F2", onSurfaceVariant: "#66536C", outline: "#8C7591", outlineVariant: "#DDCCDF",
        surfaceDisabled: "rgba(57, 45, 67, 0.12)", onSurfaceDisabled: "rgba(57, 45, 67, 0.38)",
        error: "#BA1A1A", onError: "#FFFFFF", errorContainer: "#FFDAD6", onErrorContainer: "#410002",
        inverseSurface: "#392D43", inverseOnSurface: "#FFF0F7", inversePrimary: "#DAB9F3",
        shadow: "#000000", scrim: "#000000", backdrop: "rgba(57, 45, 67, 0.4)",
        elevation: {level0: "transparent", level1: "#FAF3FB", level2: "#F6EDF9",
            level3: "#F2E7F6", level4: "#F0E4F5", level5: "#EDE0F3"}}
};
export const littleTwinStarsDecoration = {
    mist: "#FFF5F8", rail: "#C3ADC9", sky: "#DCEFF6", pink: "#F9DFE9", cloud: "#FFFBFF", star: "#FFF2B9", starOutline: "#B58A56"
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
