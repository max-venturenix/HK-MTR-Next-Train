import SelectionSheet from "../../../component/SelectionSheet";
import {mtrLineInfo} from "../../../../data/MTRLineInfo";
import {mtrStationInfo} from "../../../../data/MTRStationInfo";

type Props = {
    lineCode: string;
    stationCode: string;
    setStationCode: (value: string) => void;
};

export default function StationPicker({lineCode, stationCode, setStationCode}: Props) {
    return <SelectionSheet label="車站" title="選擇車站" subtitle={mtrLineInfo[lineCode].chineseName}
        value={stationCode} searchable onSelect={setStationCode}
        options={mtrLineInfo[lineCode].stations.map(value => ({value,
            label: mtrStationInfo[value].chineseName, searchText: mtrStationInfo[value].englishName}))}/>;
}
