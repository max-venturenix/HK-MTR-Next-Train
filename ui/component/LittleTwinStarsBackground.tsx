import {useId} from "react";
import {StyleSheet, useWindowDimensions, View} from "react-native";
import Svg, {Defs, LinearGradient, Path, Rect, Stop} from "react-native-svg";
import {useAppearance} from "../context/AppearanceContext";
import {littleTwinStarsDecoration as colors} from "../theme";

export default function LittleTwinStarsBackground() {
    const {preference} = useAppearance();
    const gradientId = useId();
    const {width, height} = useWindowDimensions();
    if (preference !== "little-twin-stars") return null;
    return <View pointerEvents="none" aria-hidden accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, styles.background]}>
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={colors.sky}/>
                    <Stop offset="0.45" stopColor={colors.mist}/>
                    <Stop offset="1" stopColor={colors.pink}/>
                </LinearGradient>
            </Defs>
            <Rect width={width} height={height} fill={`url(#${gradientId})`}/>
        </Svg>

    </View>;
}

export function LittleTwinStarsRailway() {
    const {preference} = useAppearance();
    if (preference !== "little-twin-stars") return null;
    return <View pointerEvents="none" aria-hidden accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants" style={styles.strip}>
        <Svg width="100%" height={88} viewBox="0 0 400 112" preserveAspectRatio="none" style={styles.railway}>
            <Path d="M0 34 Q12 12 34 28 C34 0 80 0 84 27 Q112 8 132 32
                Q157 13 180 36 Q204 8 229 32 Q257 14 280 33 C290 0 332 1 338 29
                Q370 6 400 32 V112 H0Z" fill={colors.cloud}/>
            <Path d="M0 72 H400 M0 90 H400" fill="none" stroke={colors.rail} strokeWidth={3}/>
            <Path d="M12 70 V92 M44 70 V92 M76 70 V92 M108 70 V92 M140 70 V92
                M172 70 V92 M204 70 V92 M236 70 V92 M268 70 V92 M300 70 V92
                M332 70 V92 M364 70 V92 M396 70 V92"
                fill="none" stroke={colors.rail} strokeWidth={2}/>
        </Svg>
    </View>;
}

const styles = StyleSheet.create({
    background: {overflow: "hidden"},
    strip: {height: 88, flexShrink: 0},
    railway: {position: "absolute", bottom: 0, left: 0}
});
