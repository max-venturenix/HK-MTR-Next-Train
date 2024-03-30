import {Button, View} from "react-native";

type Props = {
    fetchData: () => void
}

export default function ReloadButton({fetchData}: Props) {
    return (
        <View>
            <Button
                title="Reload"
                onPress={fetchData}
            />
        </View>
    )
}