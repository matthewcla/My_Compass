import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { ThemeMode, useUIStore } from '@/store/useUIStore';
import * as Haptics from 'expo-haptics';
import { Monitor, Moon, Sun } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const SEGMENTS: { label: string; mode: ThemeMode; icon: any }[] = [
    { label: 'Day', mode: 'light', icon: Sun },
    { label: 'System', mode: 'system', icon: Monitor },
    { label: 'Tactical', mode: 'dark', icon: Moon },
];

export function ThemeToggle() {
    const themeMode = useUIStore((state) => state.themeMode);
    const setThemeMode = useUIStore((state) => state.setThemeMode);
    const setThemeTransitionColor = useUIStore((state) => state.setThemeTransitionColor);
    const effectiveScheme = useColorScheme();
    const isDark = effectiveScheme === 'dark';
    const theme = Colors[effectiveScheme];

    // Explicit bounding box state for the sliding indicator
    const [containerWidth, setContainerWidth] = useState(0);

    const handleSelect = (mode: ThemeMode) => {
        if (mode === themeMode) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Pure CSS Color Crossfade
        // Capture the EXACT old background color right now, before the CSS variables swap
        // MenuHubScreen uses '#000000' for dark, '#F2F2F7' for light
        const oldColor = isDark ? '#000000' : '#F2F2F7';

        // Instantly mount the solid overlay to mask the jarring CSS swap
        setThemeTransitionColor(oldColor);

        // Update the theme underneath the dissolving mask
        setThemeMode(mode);
    };

    // Calculate precise width of 1/3 segment minus container padding (p-1 = 4px per side = 8px total)
    const segmentWidth = containerWidth > 0 ? (containerWidth - 8) / SEGMENTS.length : 0;
    const activeIndex = SEGMENTS.findIndex(s => s.mode === themeMode);

    // Evaluate if the switch is currently transiting to apply a stretch effect
    const prevIndex = useSharedValue(activeIndex);
    const isMoving = useSharedValue(false);

    useEffect(() => {
        if (prevIndex.value !== activeIndex) {
            isMoving.value = true;
            setTimeout(() => { isMoving.value = false; }, 200);
            prevIndex.value = activeIndex;
        }
    }, [activeIndex]);

    // Smooth un-interrupted sliding animation with premium physics
    const indicatorStyle = useAnimatedStyle(() => {
        // Apply microscopic stretch when moving, settle back to 1 when docked
        const stretch = withSpring(isMoving.value ? 1.08 : 1, { damping: 15, stiffness: 200 });

        return {
            transform: [
                { translateX: withSpring(activeIndex * segmentWidth, { damping: 22, stiffness: 250, mass: 0.6 }) },
                { scaleX: stretch }
            ]
        };
    });

    return (
        <View>
            <Text className="text-xs uppercase tracking-[1px] font-bold mb-2 ml-1" style={{ color: theme.text, opacity: 0.6 }}>
                App Appearance
            </Text>

            <View
                onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    height: 52,
                    borderRadius: 12,
                    padding: 4,
                    position: 'relative',
                }}
            >
                {/* Elegant Continuous Sliding Indicator */}
                {containerWidth > 0 && (
                    <Animated.View
                        style={[
                            {
                                position: 'absolute',
                                left: 4,
                                top: 4,
                                bottom: 4,
                                width: segmentWidth,
                                backgroundColor: themeMode === 'dark' ? '#C9A227' : (isDark ? '#334155' : '#ffffff'),
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                zIndex: 0,
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
                            style={{
                                flex: 1,
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                zIndex: 10,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
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
                                    minimumFontScale={0.85}
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
