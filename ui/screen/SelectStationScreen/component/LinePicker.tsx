import SelectionSheet from "../../../component/SelectionSheet";
import {mtrLineInfo} from "../../../../data/MTRLineInfo";

type Props = {
    lineCode: string;
    setLineCode: (value: string) => void;
    setStationCode: (value: string) => void;
};

export default function LinePicker({lineCode, setLineCode, setStationCode}: Props) {
    return <SelectionSheet label="車線" title="選擇車線" value={lineCode}
        options={Object.entries(mtrLineInfo).map(([value, line]) => ({value, label: line.chineseName, color: line.colorCode}))}
        onSelect={value => {
            if (value !== lineCode) {
                setLineCode(value);
                setStationCode(mtrLineInfo[value].stations[0]);
            }
        }}/>
}
