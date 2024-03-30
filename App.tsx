import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import HomeScreen from "./ui/screen/HomeScreen";
import NextTrainScreen from "./ui/screen/NextTrainScreen";
import {Pressable} from "react-native";

export default function App() {
    const Stack = createNativeStackNavigator();

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home" screenOptions={{
                statusBarColor: "black",
                headerTintColor: "white",
                headerStyle: {
                    backgroundColor: "#1E90FF"
                }
            }}>
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        title: "MTR Next Train",
                    }}
                />
                <Stack.Screen
                    name="NextTrain"
                    component={NextTrainScreen}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

