import {router, Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {AccessibilityInfo, AppState} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {useEffect, useState} from "react";
import {PaperProvider, ThemeProvider} from "react-native-paper";
import {darkTheme, lightTheme} from "../ui/theme";
import {AppearanceProvider, useAppearance} from "../ui/context/AppearanceContext";

import {initializeFacilityNotifications, subscribeToFacilityNotifications} from "../services/facilityNotifications";

export const unstable_settings = {anchor: "(tabs)"};

export default function RootLayout() {
    return <AppearanceProvider><ThemedLayout/></AppearanceProvider>;
}

function ThemedLayout() {
    const {dark} = useAppearance();
    const baseTheme = dark ? darkTheme : lightTheme;
    const [reduceMotion, setReduceMotion] = useState(false);
    useEffect(() => {
        const initialize = () => { void initializeFacilityNotifications().catch(error => console.warn("Facility monitor", error)); };
        initialize();
        const appState = AppState.addEventListener("change", state => { if (state === "active") initialize(); });
        const unsubscribe = subscribeToFacilityNotifications(() => router.navigate("/facilities"));
        let active = true;
        void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduceMotion(value); });
        const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
        return () => { active = false; subscription.remove(); appState.remove(); unsubscribe(); };
    }, []);
    const theme = {...baseTheme, animation: {...baseTheme.animation, scale: reduceMotion ? 0 : 1}};
    return (
        <PaperProvider theme={theme} settings={{icon: props => <MaterialCommunityIcons {...props}/>}}>
            <ThemeProvider theme={theme}>
            <StatusBar style={theme.dark ? "light" : "dark"}/>
            <Stack screenOptions={{headerTintColor: theme.colors.onSurface,
                headerStyle: {backgroundColor: theme.colors.surface}, headerShadowVisible: false,
                animation: reduceMotion ? "none" : "default",
                contentStyle: {backgroundColor: theme.colors.background}}}>
                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                <Stack.Screen name="station/[stationCode]" options={{title: "車站"}}/>
                <Stack.Screen name="favorites" options={{headerShown: false}}/>
                <Stack.Screen name="settings" options={{title: "設定", headerBackTitle: "收藏"}}/>
            </Stack>
            </ThemeProvider>
        </PaperProvider>
    );
}
