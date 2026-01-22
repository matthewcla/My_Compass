import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function LeaveDetailScreen() {
    const { id } = useLocalSearchParams();

    return (
        <View className="flex-1 bg-white items-center justify-center">
            <Text className="text-xl font-bold text-slate-900">Leave Request</Text>
            <Text className="text-slate-500 mt-2">ID: {id}</Text>
        </View>
    );
}
