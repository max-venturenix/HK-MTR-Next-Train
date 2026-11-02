import {View} from "react-native";
import {Divider} from "react-native-paper";
import TrainArrivalTimeTableRow from "./TrainArrivalTimeTableRow";
import {LineStaData} from "../../../../data/type/MTRRealTimeData";

type Props = {lineCode: string; stationCode: string; data: LineStaData};
export default function TrainArrivalTimeTable({data}: Props) {
    return <View>
        {[data.UP, data.DOWN].filter(trains => trains?.length).map((trains, index) => <View key={index}>
            {index > 0 && <Divider bold/>}
            {trains?.map((train, trainIndex) => <TrainArrivalTimeTableRow key={train.seq} data={train} prominent={trainIndex === 0}/>)}
        </View>)}
    </View>;
}
