import axios from "axios";
import {MtrRealTimeData} from "../data/type/MtrRealTimeData";

export const getMTRRealTimeData = async (lineCode: string, stationCode: string) => {
    const response = await axios.get<MtrRealTimeData>(
        `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${lineCode}&sta=${stationCode}`
    );
    return response.data;
}