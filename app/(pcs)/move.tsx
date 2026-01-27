import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function PcsMove() {
    return (
        <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-black">
            <Stack.Screen options={{ title: "Move Cycle" }} />
            <Text className="text-slate-900 dark:text-white text-xl font-bold">Move Cycle</Text>
        </View>
    );
}
