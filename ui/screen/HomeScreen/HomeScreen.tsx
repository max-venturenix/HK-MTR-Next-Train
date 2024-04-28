import {StyleSheet} from "react-native";
import {HomeScreenProps} from "../../../data/navigation/NavigationData";
import SelectStationScreen from "../SelectStationScreen/SelectStationScreen";
import FavoriteStationScreen from "../FavoriteStationScreen/FavoriteStationScreen";
import {DefaultTheme} from "@react-navigation/native";
import {createMaterialBottomTabNavigator} from "react-native-paper/react-navigation";

const Tab = createMaterialBottomTabNavigator();

export default function HomeScreen() {
    return (
        <Tab.Navigator
            labeled={false}
            barStyle={{
                backgroundColor: DefaultTheme.colors.background
            }}
        >
            <Tab.Screen
                name="SelectStation"
                component={SelectStationScreen}
                options={{
                    tabBarIcon: "train"
                }}
            />
            <Tab.Screen
                name="FavoriteStations"
                component={FavoriteStationScreen}
                options={{
                    tabBarIcon: "star",
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 32,
        justifyContent: "center",
    },
    label: {
        fontWeight: "bold",
        fontSize: 16
    }
});