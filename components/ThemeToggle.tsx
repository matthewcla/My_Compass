import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { ThemeMode, useUIStore } from '@/store/useUIStore';
import * as Haptics from 'expo-haptics';
import { Monitor, Moon, Sun } from 'lucide-react-native';
import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

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

    // Explicit bounding box state for the sliding indicator
    const [containerWidth, setContainerWidth] = useState(0);

    const handleSelect = (mode: ThemeMode) => {
        if (mode !== themeMode) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setThemeMode(mode);
        }
    };

    // Calculate precise width of 1/3 segment minus container padding (p-1 = 4px per side = 8px total)
    const segmentWidth = containerWidth > 0 ? (containerWidth - 8) / SEGMENTS.length : 0;
    const activeIndex = SEGMENTS.findIndex(s => s.mode === themeMode);

    // Smooth un-interrupted sliding animation
    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: withSpring(activeIndex * segmentWidth, { damping: 20, stiffness: 200 }) }]
        };
    });

    return (
        <View className="mb-4">
            <Text className="text-xs uppercase tracking-[1px] font-bold mb-2 ml-1" style={{ color: theme.text, opacity: 0.6 }}>
                App Appearance
            </Text>

            <View
                onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
                className="flex-row items-center rounded-xl p-1 relative"
                style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    height: 52
                }}
            >
                {/* Elegant Continuous Sliding Indicator */}
                {containerWidth > 0 && (
                    <Animated.View
                        className="absolute rounded-lg shadow-sm"
                        style={[
                            {
                                left: 4,
                                top: 4,
                                bottom: 4,
                                width: segmentWidth,
                                backgroundColor: themeMode === 'dark' ? '#C9A227' : (isDark ? '#334155' : '#ffffff'),
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            },
                            indicatorStyle
                        ]}
                    />
                )}

                {/* Touch Targets overlaid securely via z-10 */}
                {SEGMENTS.map((segment) => {
                    const isActive = themeMode === segment.mode;
                    const Icon = segment.icon;
                    return (
                        <Pressable
                            key={segment.mode}
                            onPress={() => handleSelect(segment.mode)}
                            // h-full forces the hit target to consume the full (52 - 8 = 44px) inner height
                            className="flex-1 items-center justify-center h-full z-10"
                        >
                            <View className="flex-row items-center justify-center gap-1.5 w-full">
                                <Icon
                                    size={16}
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
