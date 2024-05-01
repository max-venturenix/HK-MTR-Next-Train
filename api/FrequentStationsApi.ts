import AsyncStorage from "@react-native-async-storage/async-storage";

export const getFavoriteStations = async (): Promise<string[]> => {
    try {
        const favoriteStationListString = await AsyncStorage.getItem("favorite_station_list");
        if (favoriteStationListString) {
            return JSON.parse(favoriteStationListString) as string[];
        } else {
            return [];
        }
    } catch (error) {
        throw error;
    }
}

export const isFavoriteStation = async (stationCode: string): Promise<boolean> => {
    try {
        const favoriteStations = await getFavoriteStations();
        return favoriteStations.includes(stationCode);
    } catch (error) {
        console.log(error);
        return false;
    }
}

export const addFavoriteStation = async (stationCode: string): Promise<void> => {
    try {
        const favoriteStations = await getFavoriteStations();
        favoriteStations.push(stationCode);
        await AsyncStorage.setItem("favorite_station_list", JSON.stringify(favoriteStations));
    } catch (error) {
        throw error;
    }
}

export const removeFavoriteStation = async (stationCode: string): Promise<void> => {
    try {
        const favoriteStations = await getFavoriteStations();
        const updatedFavoriteStationList = favoriteStations.filter(item => item !== stationCode);
        await AsyncStorage.setItem("favorite_station_list", JSON.stringify(updatedFavoriteStationList));
    } catch (error) {
        throw error;
    }
}