import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function PcsOrders() {
    return (
        <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-black">
            <Stack.Screen options={{ title: "My Orders" }} />
            <Text className="text-slate-900 dark:text-white text-xl font-bold">Orders List</Text>
        </View>
    );
}
