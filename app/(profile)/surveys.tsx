import { useScreenHeader } from '@/hooks/useScreenHeader';
import { Text, View } from 'react-native';

export default function ProfileSurveys() {
    useScreenHeader("PROFILE", "Surveys");
    return (
        <View className="flex-1 bg-slate-50 dark:bg-black">
            {/* <ScreenHeader title="PROFILE" subtitle="Surveys" /> */}
            <View className="flex-1 items-center justify-center">
                <Text className="text-slate-900 dark:text-white text-xl font-bold">Surveys</Text>
            </View>
        </View>
    );
}
