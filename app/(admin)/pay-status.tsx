import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function AdminPayStatus() {
    return (
        <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-black">
            <Stack.Screen options={{ title: "Pay & Status" }} />
            <Text className="text-slate-900 dark:text-white text-xl font-bold">Pay & Status</Text>
        </View>
    );
}
