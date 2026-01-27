import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InboxScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-black">
            <View className="p-4 items-end">
                <Pressable
                    onPress={() => router.back()}
                    className="bg-slate-200 dark:bg-slate-800 p-2 rounded-lg"
                >
                    <Text className="text-slate-900 dark:text-white font-medium">Close</Text>
                </Pressable>
            </View>
            <View className="flex-1 items-center justify-center">
                <Text className="text-slate-900 dark:text-white text-xl font-bold">Inbox</Text>
            </View>
        </SafeAreaView>
    );
}
