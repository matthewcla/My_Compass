import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Bell } from 'lucide-react-native';
import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
    title: string;
    subtitle: string | React.ReactNode;
    withSafeArea?: boolean;
}

export function ScreenHeader({ title, subtitle, withSafeArea = true }: ScreenHeaderProps) {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleAlert = () => {
        Alert.alert("Notifications", "No new alerts at this time.");
    };

    return (
        <View
            style={{
                paddingTop: (withSafeArea ? insets.top : 0) + 20,
                paddingHorizontal: 20,
                paddingBottom: 20
            }}
            className="flex-row justify-between items-start z-50 bg-gray-100 dark:bg-black"
        >
            <View className="flex-1 mr-4">
                <Text className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {title}
                </Text>
                <Text className="text-blue-700 dark:text-blue-100 font-bold uppercase tracking-widest text-xs mt-1">
                    {subtitle}
                </Text>
            </View>

            <Pressable
                onPress={handleAlert}
                accessibilityLabel="Notifications"
                hitSlop={8}
                className="mt-2"
            >
                {({ pressed }) => (
                    <Bell
                        color={colors.text}
                        size={24}
                        style={{ opacity: pressed ? 0.7 : 1 }}
                    />
                )}
            </Pressable>
        </View>
    );
}
