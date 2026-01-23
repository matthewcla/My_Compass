import React from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PcsScreen() {
    const insets = useSafeAreaInsets();
    return (
        <View
            className="flex-1 bg-white items-center justify-center"
            style={{ paddingTop: Platform.OS === 'ios' ? insets.top + 60 : 0 }}
        >
            <Text className="text-xl font-bold">My PCS</Text>
        </View>
    );
}
