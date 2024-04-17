import axios from "axios";
import {MtrRealTimeDataType} from "../data/type/MtrRealTimeData.type";

export const getMTRRealTimeData = async (lineCode: string, stationCode: string) => {
    const response = await axios.get<MtrRealTimeDataType>(
        `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${lineCode}&sta=${stationCode}`
    );
    return response.data;
}