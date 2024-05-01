import axios from "axios";
import {MTRRealTimeData} from "../data/type/MTRRealTimeData";

export const getMTRRealTimeData = async (lineCode: string, stationCode: string) => {
    try {
        const response = await axios.get<MTRRealTimeData>(
            `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${lineCode}&sta=${stationCode}`
        );
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}