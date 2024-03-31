import {View} from "react-native";
import {ActivityIndicator} from "react-native-paper";

export default function LoadingContainer() {
    return (
        <View style={{height: "98%", justifyContent: "center"}}>
            <ActivityIndicator animating={true} size={"large"} color={"black"}/>
        </View>
    )
}