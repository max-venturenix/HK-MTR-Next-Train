import {type ComponentRef, useEffect, useRef, useState} from "react";
import {AccessibilityInfo, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View} from "react-native";
import {Button, Icon, IconButton, Text, TextInput, TouchableRipple, useTheme} from "react-native-paper";
import {useIsFocused} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export interface SelectionOption {
    value: string;
    label: string;
    color?: string;
    searchText?: string;
}

type Props = {
    label: string;
    title: string;
    subtitle?: string;
    value: string;
    options: SelectionOption[];
    searchable?: boolean;
    onSelect: (value: string) => void;
};

export default function SelectionSheet({label, title, subtitle, value, options, searchable = false, onSelect}: Props) {
    const theme = useTheme();
    const {colors} = theme;
    const insets = useSafeAreaInsets();
    const focused = useIsFocused();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const trigger = useRef<ComponentRef<typeof View>>(null);
    const heading = useRef<ComponentRef<typeof View>>(null);
    const list = useRef<ComponentRef<typeof ScrollView>>(null);
    const selectedY = useRef(0);
    const wasOpen = useRef(false);
    const selected = options.find(option => option.value === value);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = options.filter(option => !normalizedQuery ||
        `${option.label} ${option.value} ${option.searchText ?? ""}`.toLocaleLowerCase().includes(normalizedQuery));
    const dismiss = () => {
        Keyboard.dismiss();
        setOpen(false);
    };
    useEffect(() => {
        if (!focused) { setOpen(false); Keyboard.dismiss(); }
    }, [focused]);
    const restoreFocus = () => {
        if (!focused) return;
        trigger.current?.focus();
        if (Platform.OS !== "web" && trigger.current) AccessibilityInfo.sendAccessibilityEvent(trigger.current, "focus");
    };
    useEffect(() => {
        if (Platform.OS === "android" && wasOpen.current && !open && focused) {
            const frame = requestAnimationFrame(() => {
                trigger.current?.focus();
                if (Platform.OS !== "web" && trigger.current) AccessibilityInfo.sendAccessibilityEvent(trigger.current, "focus");
            });
            wasOpen.current = open;
            return () => cancelAnimationFrame(frame);
        }
        wasOpen.current = open;
    }, [open, focused]);
    const revealSelected = () => {
        if (!normalizedQuery) list.current?.scrollTo({y: Math.max(0, selectedY.current - 12), animated: false});
    };
    return <View style={styles.fieldGroup}>
        <Text variant="labelLarge" style={{color: colors.onSurfaceVariant}}>{label}</Text>
        <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel={`${label}：${selected?.label ?? "請選擇"}`}
            accessibilityHint={`開啟${title}`} accessibilityState={{expanded: open}}
            style={({pressed}) => [styles.field, {borderColor: open ? colors.primary : colors.outline, backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1}]}
            onPress={() => { setQuery(""); selectedY.current = 0; setOpen(true); }}>
            <View style={styles.fieldContent}>
                {selected?.color && <View accessible={false} style={[styles.marker, {backgroundColor: selected.color}]}/>}
                <Text variant="bodyLarge" style={styles.grow}>{selected?.label ?? "請選擇"}</Text>
                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <Icon source="chevron-down" size={24} color={colors.onSurfaceVariant}/>
                </View>
            </View>
        </Pressable>
        <Modal visible={open && focused} transparent animationType={theme.animation.scale === 0 ? "none" : "fade"}
            supportedOrientations={["portrait", "landscape"]} onRequestClose={dismiss} onDismiss={restoreFocus}
            onShow={() => {
                revealSelected();
                if (Platform.OS !== "web" && heading.current) AccessibilityInfo.sendAccessibilityEvent(heading.current, "focus");
            }}>
            <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <Pressable accessible={false} focusable={false} onPress={dismiss}
                    style={[StyleSheet.absoluteFill, {backgroundColor: colors.backdrop}]}/>
                <View accessibilityViewIsModal style={[styles.sheet, {backgroundColor: colors.surface,
                    paddingBottom: Math.max(insets.bottom, 16), paddingLeft: insets.left, paddingRight: insets.right}]}>
                    <View style={styles.header}>
                        <View ref={heading} accessible accessibilityRole="header" accessibilityLabel={title} style={styles.grow}>
                            <Text variant="headlineSmall">{title}</Text>
                            {subtitle && <Text variant="bodyMedium" style={{color: colors.onSurfaceVariant, marginTop: 4}}>{subtitle}</Text>}
                        </View>
                        <IconButton icon="close" accessibilityLabel={`關閉${title}`} onPress={dismiss} style={styles.close}/>
                    </View>
                    {searchable && <View style={styles.search}>
                        <TextInput mode="outlined" label="搜尋車站名稱或編號" accessibilityLabel="搜尋車站名稱或編號"
                            value={query} onChangeText={setQuery} autoCorrect={false} autoCapitalize="none"
                            right={query ? <TextInput.Icon icon="close" style={styles.close} accessibilityLabel="清除搜尋" onPress={() => setQuery("")}/> : undefined}/>
                    </View>}
                    <ScrollView ref={list} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.options}
                        onContentSizeChange={revealSelected}>
                        {filtered.map(option => <TouchableRipple key={option.value} accessibilityRole="button"
                            accessibilityLabel={option.label} accessibilityState={{selected: option.value === value}}
                            onLayout={event => { if (option.value === value) { selectedY.current = event.nativeEvent.layout.y; revealSelected(); } }}
                            onPress={() => { onSelect(option.value); dismiss(); }}
                            style={[styles.option, {backgroundColor: option.value === value ? colors.secondaryContainer : colors.surface}]}>
                            <View style={styles.fieldContent}>
                                {option.color && <View accessible={false} style={[styles.marker, {backgroundColor: option.color}]}/>}
                                <Text variant="bodyLarge" style={[styles.grow, {color: option.value === value ? colors.onSecondaryContainer : colors.onSurface}]}>{option.label}</Text>
                                {option.value === value && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                                    <Icon source="check" size={24} color={colors.onSecondaryContainer}/>
                                </View>}
                            </View>
                        </TouchableRipple>)}
                        {!filtered.length && <View style={styles.empty}>
                            <Text accessibilityLiveRegion="polite" variant="bodyLarge">找不到符合的車站，請嘗試其他名稱或編號。</Text>
                            <Button onPress={() => setQuery("")} contentStyle={styles.close}>清除搜尋</Button>
                        </View>}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    </View>;
}

const styles = StyleSheet.create({
    fieldGroup: {gap: 8},
    field: {borderWidth: 1, borderRadius: 12, overflow: "hidden"},
    fieldContent: {minHeight: 56, padding: 16, flexDirection: "row", alignItems: "center", gap: 12},
    marker: {width: 12, height: 12, borderRadius: 6},
    grow: {flex: 1, flexShrink: 1},
    overlay: {flex: 1, justifyContent: "flex-end"},
    sheet: {width: "100%", maxWidth: 720, height: "85%", maxHeight: "85%", alignSelf: "center",
        borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden"},
    header: {flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 24, paddingRight: 12, paddingVertical: 12},
    close: {minWidth: 48, minHeight: 48},
    search: {paddingHorizontal: 20, paddingBottom: 16},
    options: {paddingHorizontal: 12, paddingBottom: 12, gap: 4},
    option: {borderRadius: 12, overflow: "hidden"},
    empty: {padding: 24, gap: 16}
});
