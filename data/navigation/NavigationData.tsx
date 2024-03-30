import {NativeStackNavigationProp, NativeStackScreenProps} from "@react-navigation/native-stack";

export type RootStackParamList = {
    Home: undefined;
    NextTrain: {
        stationCode: string
    };
};

export type StackNavigation = NativeStackNavigationProp<RootStackParamList>;

export type HomeScreenProps = NativeStackScreenProps<
    RootStackParamList,
    "Home"
>;

export type NextTrainProps = NativeStackScreenProps<
    RootStackParamList,
    "NextTrain"
>;