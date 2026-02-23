import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { ThemeMode, useUIStore } from '@/store/useUIStore';
import * as Haptics from 'expo-haptics';
import { Monitor, Moon, Sun } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Layout } from 'react-native-reanimated';

const SEGMENTS: { label: string; mode: ThemeMode; icon: any }[] = [
    { label: 'Day', mode: 'light', icon: Sun },
    { label: 'System', mode: 'system', icon: Monitor },
    { label: 'Tactical', mode: 'dark', icon: Moon },
];

export function ThemeToggle() {
    const themeMode = useUIStore((state) => state.themeMode);
    const setThemeMode = useUIStore((state) => state.setThemeMode);
    const effectiveScheme = useColorScheme();
    const isDark = effectiveScheme === 'dark';
    const theme = Colors[effectiveScheme];

    const handleSelect = (mode: ThemeMode) => {
        if (mode !== themeMode) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setThemeMode(mode);
        }
    };

    return (
        <View className="mb-4">
            <Text className="text-xs uppercase tracking-[1px] font-bold mb-2 ml-1" style={{ color: theme.text, opacity: 0.6 }}>
                App Appearance
            </Text>

            <View
                className="flex-row items-center rounded-xl p-1"
                style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    minHeight: 52
                }}
            >
                {SEGMENTS.map((segment) => {
                    const isActive = themeMode === segment.mode;
                    const Icon = segment.icon;
                    return (
                        <Pressable
                            key={segment.mode}
                            onPress={() => handleSelect(segment.mode)}
                            className="flex-1 items-center justify-center py-2"
                            style={{ minHeight: 44 }}
                        >
                            {isActive && (
                                <Animated.View
                                    layout={Layout.springify().damping(15)}
                                    className="absolute inset-0 rounded-lg shadow-sm w-full h-full"
                                    style={{
                                        backgroundColor: segment.mode === 'dark' ? '#C9A227' : (isDark ? '#334155' : '#ffffff'),
                                        borderWidth: 1,
                                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                    }}
                                />
                            )}
                            <View className="flex-row items-center gap-1.5 z-10 w-full justify-center">
                                <Icon
                                    size={14}
                                    color={isActive ? (segment.mode === 'dark' ? '#0A1628' : theme.text) : (isDark ? '#94a3b8' : '#64748b')}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <Text
                                    className={`text-sm tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}
                                    style={{
                                        color: isActive ? (segment.mode === 'dark' ? '#0A1628' : theme.text) : (isDark ? '#94a3b8' : '#64748b'),
                                    }}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {segment.label}
                                </Text>
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
