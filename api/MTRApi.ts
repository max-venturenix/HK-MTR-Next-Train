import axios from "axios";
import {MTRRealTimeDataType} from "../data/type/MTRRealTimeData.type";

export const getMTRRealTimeData = async (lineCode: string, stationCode: string) => {
    const response = await axios.get<MTRRealTimeDataType>(
        `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${lineCode}&sta=${stationCode}`
    );
    return response.data;
}