import { ScreenGradient } from '@/components/ScreenGradient';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { Text, View } from 'react-native';

export default function PcsMove() {
    useScreenHeader("MOVE", "Move Cycle");
    return (
        <ScreenGradient>
            {/* <ScreenHeader title="MOVE" subtitle="Move Cycle" /> */}
            <View className="flex-1 items-center justify-center">
                <Text className="text-slate-900 dark:text-white text-xl font-bold">Move Cycle</Text>
            </View>
        </ScreenGradient>
    );
}
