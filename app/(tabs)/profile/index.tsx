import { useUserStore } from '@/store/useUserStore';
import { DUTY_TYPES, PREFERENCE_REGIONS } from '@/types/user';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

// Define the form schema using Zod
const PreferencesFormSchema = z.object({
    regions: z.array(z.string()).min(1, 'Select at least one region'),
    dutyTypes: z.array(z.string()).min(1, 'Select at least one duty type'),
});

type PreferencesFormData = z.infer<typeof PreferencesFormSchema>;

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const user = useUserStore((state) => state.user);
    const updatePreferences = useUserStore((state) => state.updatePreferences);

    const { control, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<PreferencesFormData>({
        resolver: zodResolver(PreferencesFormSchema),
        defaultValues: {
            regions: user?.preferences?.regions || [],
            dutyTypes: user?.preferences?.dutyTypes || [],
        },
    });

    // Update form values if user data changes (e.g. initial load)
    useEffect(() => {
        if (user?.preferences) {
            if (user.preferences.regions) setValue('regions', user.preferences.regions);
            if (user.preferences.dutyTypes) setValue('dutyTypes', user.preferences.dutyTypes);
        }
    }, [user, setValue]);

    const onSubmit = (data: PreferencesFormData) => {
        try {
            updatePreferences({
                regions: data.regions,
                dutyTypes: data.dutyTypes,
            });
            Alert.alert('Success', 'Preferences updated successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to update preferences');
            console.error(error);
        }
    };

    const toggleSelection = (
        currentList: string[],
        item: string,
        onChange: (value: string[]) => void
    ) => {
        if (currentList.includes(item)) {
            onChange(currentList.filter((i) => i !== item));
        } else {
            onChange([...currentList, item]);
        }
    };

    if (!user) {
        return (
            <View className="flex-1 bg-slate-50 dark:bg-black justify-center items-center">
                <Text className="text-slate-500 dark:text-gray-400">Please sign in to view your profile.</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50 dark:bg-black">
            <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={{ paddingTop: Platform.OS !== 'web' ? insets.top + 60 : 0 }}
            >
                <View className="mb-6 mt-4">
                    <Text className="text-2xl font-bold text-slate-900 dark:text-white">Profile & Preferences</Text>
                    <Text className="text-slate-500 dark:text-gray-400">
                        {user.displayName} • {user.rank}
                    </Text>
                </View>

                <View className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm mb-6 border border-slate-200 dark:border-slate-800">
                    <Text className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                        Preferred Regions
                    </Text>
                    <Text className="text-sm text-slate-500 dark:text-gray-400 mb-3">
                        Select the regions you are interested in for future assignments.
                    </Text>

                    <Controller
                        control={control}
                        name="regions"
                        render={({ field: { value, onChange } }) => (
                            <View className="flex-row flex-wrap gap-2">
                                {PREFERENCE_REGIONS.map((region) => {
                                    const isSelected = value.includes(region);
                                    return (
                                        <Pressable
                                            key={region}
                                            onPress={() => toggleSelection(value, region, onChange)}
                                            className={`px-4 py-2 rounded-full border ${isSelected
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                                                }`}
                                        >
                                            <Text
                                                className={`font-medium ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                                                    }`}
                                            >
                                                {region}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                    />
                    {errors.regions && (
                        <Text className="text-red-500 text-sm mt-2">{errors.regions.message}</Text>
                    )}
                </View>

                <View className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm mb-8 border border-slate-200 dark:border-slate-800">
                    <Text className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                        Duty Type Interface
                    </Text>
                    <Text className="text-sm text-slate-500 dark:text-gray-400 mb-3">
                        Select your preferred duty types.
                    </Text>

                    <Controller
                        control={control}
                        name="dutyTypes"
                        render={({ field: { value, onChange } }) => (
                            <View className="flex-row flex-wrap gap-2">
                                {DUTY_TYPES.map((type) => {
                                    const isSelected = value.includes(type);
                                    return (
                                        <Pressable
                                            key={type}
                                            onPress={() => toggleSelection(value, type, onChange)}
                                            className={`px-4 py-2 rounded-full border ${isSelected
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                                                }`}
                                        >
                                            <Text
                                                className={`font-medium ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                                                    }`}
                                            >
                                                {type}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                    />
                    {errors.dutyTypes && (
                        <Text className="text-red-500 text-sm mt-2">{errors.dutyTypes.message}</Text>
                    )}
                </View>

                <View className="mb-10">
                    <Pressable
                        onPress={handleSubmit(onSubmit)}
                        className={`w-full py-4 rounded-xl items-center shadow-sm ${isDirty ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                        disabled={!isDirty}
                    >
                        <Text className="text-white font-bold text-lg">
                            Save Preferences
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}
