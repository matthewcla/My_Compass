import React from 'react';
import { Platform, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PcsScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    return (
        <View
            className="flex-1 bg-slate-50 dark:bg-black items-center justify-center"
            style={{
                paddingTop: Platform.OS !== 'web' ? insets.top + 60 : 0,
                backgroundColor: colorScheme === 'dark' ? '#000000' : '#f8fafc' // Force Deep Ocean
            }}
        >
            <Text className="text-xl font-bold text-slate-900 dark:text-white">My PCS</Text>
        </View>
    );
}
