import { ScreenGradient } from '@/components/ScreenGradient';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text, View } from 'react-native';

export default function AdminPayStatus() {
    const router = useRouter();
    useScreenHeader("ADMIN", "Requests & Status", undefined, null, {
        icon: ChevronLeft,
        onPress: () => router.back()
    });
    return (
        <ScreenGradient>
            {/* <ScreenHeader title="PAY" subtitle="Pay & Status" /> */}
            <View className="flex-1 items-center justify-center">
                <Text className="text-slate-900 dark:text-white text-xl font-bold">Requests & Status</Text>
            </View>
        </ScreenGradient>
    );
}
