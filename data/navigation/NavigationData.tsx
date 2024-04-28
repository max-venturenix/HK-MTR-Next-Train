import {NativeStackNavigationProp, NativeStackScreenProps} from "@react-navigation/native-stack";

export type RootStackParamList = {
    Home: undefined;
    SelectStation: undefined;
    FavoriteStations: undefined;
    NextTrain: {
        stationCode: string
    };
};

export type StackNavigation = NativeStackNavigationProp<RootStackParamList>;

export type HomeScreenProps = NativeStackScreenProps<
    RootStackParamList,
    "Home"
>;

export type SelectStationScreenProps = NativeStackScreenProps<
    RootStackParamList,
    "SelectStation"
>;

export type FavoriteStationsScreenProps = NativeStackScreenProps<
    RootStackParamList,
    "FavoriteStations"
>;

export type NextTrainByStationProps = NativeStackScreenProps<
    RootStackParamList,
    "NextTrain"
>;