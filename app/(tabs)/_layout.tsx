import {Tabs} from "expo-router/js-tabs";
import {BottomNavigation, useTheme} from "react-native-paper";
import LittleTwinStarsTabIcon from "../../ui/component/LittleTwinStarsTabIcon";
import {useAppearance} from "../../ui/context/AppearanceContext";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const tabItems: Record<string, {label: string; icon: "star" | "train" | "wheelchair-accessibility"}> = {
    index: {label: "收藏", icon: "star"},
    search: {label: "搜尋", icon: "train"},
    facilities: {label: "設施", icon: "wheelchair-accessibility"}
};

export default function TabLayout() {
    const {colors} = useTheme();
    const {preference} = useAppearance();
    return (
        <Tabs screenOptions={{headerShown: false}} tabBar={({emitter, navigateToTab, state, insets}) => (
            <BottomNavigation.Bar navigationState={state} safeAreaInsets={insets} labeled
                style={{backgroundColor: colors.surface}}
                getLabelText={({route}) => tabItems[route.name]?.label ?? route.name}
                getAccessibilityLabel={({route}) => tabItems[route.name]?.label ?? route.name}
                renderIcon={({route, color}) => preference === "little-twin-stars"
                    ? <LittleTwinStarsTabIcon name={tabItems[route.name]?.icon ?? "train"}/>
                    : <MaterialCommunityIcons
                    name={tabItems[route.name]?.icon ?? "train"} size={24} color={color}/>}
                onTabPress={({route, preventDefault}) => {
                    const event = emitter.emit({type: "tabPress", target: route.key, canPreventDefault: true});
                    if (event.defaultPrevented) preventDefault();
                    else navigateToTab(route.key);
                }}
            />
        )}>
            <Tabs.Screen name="index" options={{title: "收藏"}}/>
            <Tabs.Screen name="search" options={{title: "搜尋"}}/>
            <Tabs.Screen name="facilities" options={{title: "設施"}}/>
        </Tabs>
    );
}
