import { ScreenHeader } from '@/components/ScreenHeader';
import { Text, View } from 'react-native';

export default function AdminRequests() {
    return (
        <View className="flex-1 bg-slate-50 dark:bg-black">
            <ScreenHeader title="ADMIN" subtitle="Requests" />
            <View className="flex-1 items-center justify-center">
                <Text className="text-slate-900 dark:text-white text-xl font-bold">Admin Requests</Text>
            </View>
        </View>
    );
}
