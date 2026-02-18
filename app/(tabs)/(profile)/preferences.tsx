import { ScreenGradient } from '@/components/ScreenGradient';
import { useColorScheme } from '@/components/useColorScheme';
import { useUserStore } from '@/store/useUserStore';
import { DUTY_TYPES, PREFERENCE_REGIONS } from '@/types/user';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft, Info, MapPin, Ship } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

export function ProfilePreferences() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const { user, updatePreferences } = useUserStore(
        useShallow((state) => ({
            user: state.user,
            updatePreferences: state.updatePreferences,
        }))
    );

    const preferences = user?.preferences || { regions: [], dutyTypes: [] };

    // ── Summary strip text ──────────────────────────────────────
    const summaryText = useMemo(() => {
        const parts: string[] = [];
        const dt = preferences.dutyTypes ?? [];
        const rg = preferences.regions ?? [];
        if (dt.length > 0) parts.push(dt.join(', '));
        if (rg.length > 0) parts.push(rg.join(', '));
        return parts.length > 0 ? parts.join(' · ') : 'No preferences set';
    }, [preferences.dutyTypes, preferences.regions]);

    const haptic = () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const toggleRegion = (region: string) => {
        haptic();
        const currentRegions = preferences.regions || [];
        const newRegions = currentRegions.includes(region)
            ? currentRegions.filter(r => r !== region)
            : [...currentRegions, region];
        updatePreferences({ ...preferences, regions: newRegions });
    };

    const toggleDutyType = (type: string) => {
        haptic();
        const currentTypes = preferences.dutyTypes || [];
        const newTypes = currentTypes.includes(type)
            ? currentTypes.filter(t => t !== type)
            : [...currentTypes, type];
        updatePreferences({ ...preferences, dutyTypes: newTypes });
    };

    const renderSectionHeader = (title: string, icon: React.ReactNode) => (
        <View className="flex-row items-center gap-2 mb-3 mt-6 px-1">
            {icon}
            <Text className="text-slate-900 dark:text-slate-100 font-bold text-lg">{title}</Text>
        </View>
    );

    const renderOption = (key: string, label: string, isSelected: boolean, onPress: () => void) => (
        <Pressable
            key={key}
            onPress={onPress}
            style={{ minHeight: 44 }}
            className={`flex-row items-center justify-between p-4 mb-2 rounded-xl border ${isSelected
                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'
                }`}
        >
            <Text className={`font-medium ${isSelected
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-slate-700 dark:text-slate-300'
                }`}>
                {label}
            </Text>
            {isSelected && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    className="bg-blue-600 rounded-full p-1"
                >
                    <Check size={12} color="white" strokeWidth={3} />
                </Animated.View>
            )}
        </Pressable>
    );

    return (
        <ScreenGradient>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* ── Flow Header ──────────────────────────────────── */}
                <View className="px-4 py-2">
                    <View className="flex-row items-start justify-between mb-1">
                        <View>
                            <Text
                                style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }}
                                className="text-slate-400 dark:text-gray-500 mb-0"
                            >
                                PROFILE
                            </Text>
                            <Text
                                style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}
                                className="text-slate-900 dark:text-white"
                            >
                                Preferences
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => router.back()}
                            className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
                        >
                            <ChevronLeft size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Selection Summary Strip ─────────────────── */}
                    <View className="bg-slate-100 dark:bg-slate-800/60 rounded-lg px-3.5 py-2.5 mb-4">
                        <Text
                            className="text-slate-600 dark:text-slate-300 text-xs font-semibold"
                            numberOfLines={2}
                        >
                            {summaryText}
                        </Text>
                    </View>

                    {/* ── Info Banner ─────────────────────────────── */}
                    <View className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200/60 dark:border-amber-700/40 mb-2">
                        <View className="flex-row items-start gap-3">
                            <Info size={20} color={isDark ? '#C9A227' : '#92400e'} />
                            <Text className="text-amber-900 dark:text-amber-200 text-sm flex-1 leading-5">
                                These preferences help Compass recommend the most relevant billets for your next assignment.
                            </Text>
                        </View>
                    </View>

                    {/* ── Duty Types ──────────────────────────────── */}
                    {renderSectionHeader("Duty Preference", <Ship size={20} color={isDark ? "#94A3B8" : "#475569"} />)}
                    <View>
                        {DUTY_TYPES.map((type) => (
                            renderOption(
                                type,
                                type,
                                preferences.dutyTypes?.includes(type) ?? false,
                                () => toggleDutyType(type)
                            )
                        ))}
                    </View>

                    {/* ── Regions ─────────────────────────────────── */}
                    {renderSectionHeader("Preferred Regions", <MapPin size={20} color={isDark ? "#94A3B8" : "#475569"} />)}
                    <View>
                        {PREFERENCE_REGIONS.map((region) => (
                            renderOption(
                                region,
                                region,
                                preferences.regions?.includes(region) ?? false,
                                () => toggleRegion(region)
                            )
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ScreenGradient>
    );
}

export default ProfilePreferences;
