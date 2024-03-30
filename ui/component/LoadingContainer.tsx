import {View} from "react-native";
import {ActivityIndicator} from "react-native-paper";

export default function LoadingContainer() {
    return (
        <View>
            <ActivityIndicator animating={true} size={"large"}/>
        </View>
    )
}