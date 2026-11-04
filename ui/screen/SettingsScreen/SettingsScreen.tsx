import Constants from "expo-constants";
import {Platform, ScrollView, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Icon, Text, TouchableRipple, useTheme} from "react-native-paper";
import {useAppearance} from "../../context/AppearanceContext";
import {layout} from "../../theme";

import FacilityNotificationSettings from "../../component/FacilityNotificationSettings";

export default function SettingsScreen() {
    const {colors} = useTheme();
    const {preference, ready, saving, error, setPreference} = useAppearance();
    return <SafeAreaView edges={["left", "right", "bottom"]}
        style={[layout.screen, {backgroundColor: colors.background}]}>
        <ScrollView contentContainerStyle={[layout.content, {flexGrow: 1}]}>
            <View style={layout.section}>
                <Text variant="titleLarge" accessibilityRole="header">外觀</Text>
                <Text variant="bodyLarge" style={{color: colors.onSurfaceVariant}}>選擇應用程式的顯示模式。</Text>
                <View accessibilityRole="radiogroup" accessibilityLabel="外觀"
                    style={{backgroundColor: colors.surface, borderRadius: 12, overflow: "hidden"}}>
                    {([{value: "system", label: "跟隨系統"}, {value: "light", label: "淺色"},
                        {value: "dark", label: "深色"}] as const).map(({value, label}) => (
                        <TouchableRipple key={value} accessibilityRole="radio" accessibilityLabel={label}
                            accessibilityState={{checked: preference === value, disabled: !ready || saving}}
                            aria-checked={preference === value} disabled={!ready || saving}
                            onKeyDown={Platform.OS === "web" ? event => {
                                if (event.nativeEvent.key === " ") {
                                    event.preventDefault();
                                    void setPreference(value);
                                }
                            } : undefined}
                            onPress={() => void setPreference(value)}>
                            <View style={[layout.heading, {minHeight: 56, padding: 16}]}>
                                <Text variant="bodyLarge" style={layout.grow}>{label}</Text>
                                <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                                    <Icon source={preference === value ? "radiobox-marked" : "radiobox-blank"}
                                        size={24} color={preference === value ? colors.primary : colors.onSurfaceVariant}/>
                                </View>
                            </View>
                        </TouchableRipple>
                    ))}
                </View>
                {!ready && <Text accessibilityLiveRegion="polite" accessibilityRole={Platform.OS === "web" ? "status" : undefined}>正在讀取外觀設定…</Text>}
                {error && <Text accessibilityRole="alert" style={{color: colors.error}}>{error}</Text>}
            </View>
            <FacilityNotificationSettings/>
            <View style={{marginTop: "auto", paddingTop: 24, gap: 8, alignItems: "center"}}>
                <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>版本 {Constants.expoConfig?.version ?? "—"}</Text>
                <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant}}>Development by Max Wong</Text>
            </View>
        </ScrollView>
    </SafeAreaView>;
}
