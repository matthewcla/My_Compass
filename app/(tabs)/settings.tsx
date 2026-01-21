import { Text, View } from 'react-native';

import { useSession } from '../ctx';

export default function SettingsScreen() {
    const { signOut } = useSession();
    return (
        <View className="flex-1 items-center justify-center bg-white dark:bg-black">
            <Text className="text-xl font-bold dark:text-white" onPress={() => signOut()}>
                Sign Out
            </Text>
        </View>
    );
}
