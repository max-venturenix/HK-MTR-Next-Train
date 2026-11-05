import {Image, StyleSheet, View} from "react-native";
import Svg, {Path, Polygon} from "react-native-svg";
import {useAppearance} from "../context/AppearanceContext";
import {littleTwinStarsDecoration as colors} from "../theme";

const characterImage = require("../../assets/themes/little-twin-stars/kiki-lala.png");
const covers = {
    favorites: require("../../assets/themes/little-twin-stars/favorites-cover.png"),
    search: require("../../assets/themes/little-twin-stars/search-cover.png"),
    facilities: require("../../assets/themes/little-twin-stars/facilities-cover.png")
};

function CreamStar({size, trailing = false}: {size: number; trailing?: boolean}) {
    return <Svg width={size} height={size} viewBox="0 0 50 50" style={trailing ? styles.trailingStar : styles.leadingStar}>
        <Polygon points="25,2 32,17 48,19 36,31 39,47 25,39 10,47 13,31 2,19 18,17"
            fill={colors.star} stroke={colors.starOutline} strokeWidth={2} strokeLinejoin="round"/>
    </Svg>;
}

export function LittleTwinStarsThumbnail() {
    return <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Image source={characterImage} resizeMode="contain" accessible={false} style={styles.thumbnail}/>
    </View>;
}

export default function LittleTwinStarsArtwork({compact = false, cover}: {compact?: boolean; cover?: keyof typeof covers}) {
    const {preference} = useAppearance();
    if (preference !== "little-twin-stars") return null;
    if (cover) return <View pointerEvents="none" aria-hidden accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants" style={styles.cover}>
        <Image source={covers[cover]} resizeMode="contain" accessible={false} style={styles.coverImage}/>
    </View>;
    return <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={[styles.panel, compact && styles.compact]}>
        <Svg width="100%" height="100%" viewBox="0 0 640 180" preserveAspectRatio="xMidYMid slice"
            style={StyleSheet.absoluteFill}>
            <Path d="M0 125 Q65 90 130 120 T260 120 T390 120 T520 120 T650 120 V180 H0Z" fill={colors.pink}/>
            <Path d="M0 155 Q15 120 48 138 C45 95 100 86 116 122 C141 96 177 109 177 138
                Q216 124 230 158 Q275 131 300 159 Q340 130 370 158 Q404 125 437 147
                C430 112 474 96 494 125 C514 85 564 98 563 131 Q603 111 640 152 V180 H0Z" fill={colors.cloud}/>
            <Polygon points="180,70 184,79 194,80 187,87 188,97 180,92 171,97 173,87 166,80 176,79" fill={colors.cloud}/>
            <Polygon points="457,17 460,24 468,25 462,31 464,39 457,35 450,39 451,31 446,25 454,24" fill={colors.cloud}/>
        </Svg>
        <CreamStar size={compact ? 26 : 38}/>
        <CreamStar size={compact ? 22 : 32} trailing/>
        <Image source={characterImage} resizeMode="contain" accessible={false}
            style={[styles.characters, compact && styles.compactCharacters]}/>
    </View>;
}

const styles = StyleSheet.create({
    panel: {height: 160, borderRadius: 16, overflow: "hidden", backgroundColor: colors.sky,
        alignItems: "center", justifyContent: "center"},
    compact: {height: 104},
    leadingStar: {position: "absolute", left: "9%", top: "16%"},
    trailingStar: {position: "absolute", right: "9%", top: "30%"},
    characters: {width: 234, maxWidth: "80%", height: 156},
    compactCharacters: {width: 150, height: 100},
    cover: {width: "100%", aspectRatio: 3, borderRadius: 14, overflow: "hidden"},
    coverImage: {width: "100%", height: "100%"},
    thumbnail: {width: 54, height: 36}
});
