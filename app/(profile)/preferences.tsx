import { useColorScheme } from '@/components/useColorScheme';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { useUserStore } from '@/store/useUserStore';
import { DUTY_TYPES, PREFERENCE_REGIONS } from '@/types/user';
import { Check, Info, MapPin, Shield, Ship } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

export default function ProfilePreferences() {
    useScreenHeader("PROFILE", "Preferences");
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const { user, updateUser, updatePreferences } = useUserStore(
        useShallow((state) => ({
            user: state.user,
            updateUser: state.updateUser,
            updatePreferences: state.updatePreferences,
        }))
    );

    const preferences = user?.preferences || { regions: [], dutyTypes: [] };
    const privacyMode = user?.privacyMode ?? false;

    const toggleRegion = (region: string) => {
        const currentRegions = preferences.regions || [];
        const newRegions = currentRegions.includes(region)
            ? currentRegions.filter(r => r !== region)
            : [...currentRegions, region];
        updatePreferences({ ...preferences, regions: newRegions });
    };

    const toggleDutyType = (type: string) => {
        const currentTypes = preferences.dutyTypes || [];
        const newTypes = currentTypes.includes(type)
            ? currentTypes.filter(t => t !== type)
            : [...currentTypes, type];
        updatePreferences({ ...preferences, dutyTypes: newTypes });
    };

    const togglePrivacyMode = (value: boolean) => {
        updateUser({ privacyMode: value });
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
                <View className="bg-blue-600 rounded-full p-1">
                    <Check size={12} color="white" strokeWidth={3} />
                </View>
            )}
        </Pressable>
    );

    return (
        <ScrollView
            className="flex-1 bg-slate-50 dark:bg-black"
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        >
            {/* Privacy Section */}
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 mb-6 shadow-sm">
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                        <View className="flex-row items-center gap-2 mb-1">
                            <Shield size={18} color={isDark ? "#60A5FA" : "#2563EB"} />
                            <Text className="text-slate-900 dark:text-white font-bold text-base">Privacy Mode</Text>
                        </View>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm leading-5">
                            Hide your specific rank and name from the home dashboard greeting.
                        </Text>
                    </View>
                    <Switch
                        value={privacyMode}
                        onValueChange={togglePrivacyMode}
                        trackColor={{ true: '#2563EB', false: '#CBD5E1' }}
                        thumbColor={'white'}
                    />
                </View>
            </View>

            <View className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 mb-2">
                <View className="flex-row items-start gap-3">
                    <Info size={20} color={isDark ? "#60A5FA" : "#2563EB"} className="mt-0.5" />
                    <Text className="text-blue-800 dark:text-blue-200 text-sm flex-1 leading-5">
                        These preferences help Compass recommend the most relevant billets for your next assignment.
                    </Text>
                </View>
            </View>

            {/* Duty Types */}
            {renderSectionHeader("Duty Preference", <Ship size={20} color={isDark ? "#94A3B8" : "#475569"} />)}
            <View>
                {DUTY_TYPES.map((type) => (
                    renderOption(
                        type, // key
                        type,
                        preferences.dutyTypes?.includes(type) ?? false,
                        () => toggleDutyType(type)
                    )
                ))}
            </View>

            {/* Regions */}
            {renderSectionHeader("Preferred Regions", <MapPin size={20} color={isDark ? "#94A3B8" : "#475569"} />)}
            <View>
                {PREFERENCE_REGIONS.map((region) => (
                    renderOption(
                        region, // key
                        region,
                        preferences.regions?.includes(region) ?? false,
                        () => toggleRegion(region)
                    )
                ))}
            </View>

        </ScrollView>
    );
}
