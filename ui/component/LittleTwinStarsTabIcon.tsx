import {View} from "react-native";
import Svg, {Circle, G, Path, Polygon} from "react-native-svg";
import {littleTwinStarsDecoration as colors, littleTwinStarsTheme} from "../theme";

type TabIconName = "star" | "train" | "wheelchair-accessibility";
const ink = littleTwinStarsTheme.colors.onSurface;

// The scalloped fringe and dot eyes stay legible without shrinking a full character portrait.
function TwinFace({lala = false}: {lala?: boolean}) {
    return <>
        <Circle cx={8} cy={8} r={6} fill={colors.star}/>
        <Path d={lala
            ? "M1 10 Q0 4 4 2 Q9 -1 13 3 Q15 5 15 10 L16 13 Q14 15 12 13 L12 7 Q10 9 8 6 Q6 9 4 7 L4 11 Q3 14 1 12Z"
            : "M1 9 Q0 5 3 2 Q5 0 7 1 Q11 -1 14 4 Q16 7 14 9 Q12 10 11 7 Q9 10 7 7 Q5 10 4 8 Q3 12 1 9Z"}
            fill={lala ? colors.pink : colors.sky}/>
        <G fill={ink} stroke="none">
            <Circle cx={6.3} cy={10} r={0.8}/><Circle cx={10.5} cy={10} r={0.8}/>
        </G>
    </>;
}

export default function LittleTwinStarsTabIcon({name}: {name: TabIconName}) {
    return <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={24} height={24} viewBox="0 0 24 24">
            <G stroke={ink} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
                {name === "star" && <>
                    <Polygon points="12,1 15.4,7.8 23,9 17.6,14.5 19,22 12,18.5 5,22 6.4,14.5 1,9 8.6,7.8"
                        fill={colors.star}/>
                    <G transform="translate(6.25 5.8) scale(.72)"><TwinFace/></G>
                </>}
                {name === "train" && <>
                    <Path d="M14 16 L20.3 22.3 Q22.5 23.2 23 20.7 L16.8 14.4Z" fill={colors.pink}/>
                    <Circle cx={10} cy={10} r={8.6} fill={colors.cloud}/>
                    <G transform="translate(3.3 3.3) scale(.84)"><TwinFace lala/></G>
                </>}
                {name === "wheelchair-accessibility" && <>
                    <Path d="M7 11 A6.2 6.2 0 1 0 14.4 18.6" strokeWidth={2} fill="none"/>
                    <Path d="M10 10 L11 15 H16.2 L19.5 21 H22" fill="none" strokeWidth={2.2}/>
                    <Path d="M10.7 12 H16" strokeWidth={1.8}/>
                    <G transform="translate(5.3 .8) scale(.68)"><TwinFace/></G>
                </>}
            </G>
        </Svg>
    </View>;
}
