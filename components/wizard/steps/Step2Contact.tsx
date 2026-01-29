import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import * as Haptics from 'expo-haptics';
import { Bus, Car, Globe2, MapPin, Phone, Plane, Train } from 'lucide-react-native';
import React from 'react';
import { Switch, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface Step2ContactProps {
    formData: Partial<CreateLeaveRequestPayload>;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: any) => void;
}

export function Step2Contact({ formData, onUpdate }: Step2ContactProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const handleTextChange = (field: keyof CreateLeaveRequestPayload, value: string) => {
        onUpdate(field, value);
    };

    const MODES = [
        { id: 'Air', label: 'Air', icon: Plane },
        { id: 'Car', label: 'Car', icon: Car },
        { id: 'Train', label: 'Train', icon: Train },
        { id: 'Bus', label: 'Bus', icon: Bus },
    ];

    return (
        <WizardCard title="Location & Travel">
            <View className="gap-6">

                {/* 0. Location & Legal (Moved from Step 1) */}
                <View>
                    <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 ml-1">
                        Deployment Status
                    </Text>

                    <View className="bg-inputBackground rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* CONUS Toggle */}
                        <View className="flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50">
                            <View className="flex-row items-center flex-1 mr-4">
                                <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
                                    <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                                </View>
                                <View>
                                    <Text className="text-base font-bold text-labelPrimary dark:text-white">Leave inside CONUS?</Text>
                                    <Text className="text-xs text-slate-500 mt-0.5">Continental United States</Text>
                                </View>
                            </View>
                            <Switch
                                value={formData.leaveInConus}
                                onValueChange={(val) => {
                                    Haptics.selectionAsync();
                                    onUpdate('leaveInConus', val);
                                }}
                                trackColor={{ false: '#767577', true: '#2563EB' }}
                                thumbColor={'#FFFFFF'}
                            />
                        </View>

                        {/* Destination Country (Conditional) */}
                        {!formData.leaveInConus && (
                            <Animated.View entering={FadeIn} exiting={FadeOut}>
                                <View className="flex-row items-center p-4 bg-slate-50 dark:bg-slate-900/30">
                                    <View className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 items-center justify-center mr-3">
                                        <Globe2 size={16} className="text-orange-600 dark:text-orange-400" />
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-sm font-bold text-slate-700 dark:text-slate-200">Destination Country</Text>
                                            <Text className="text-xs text-orange-600 dark:text-orange-400 font-medium">OCONUS Required</Text>
                                        </View>
                                        <TextInput
                                            className="h-10 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-labelPrimary dark:text-white"
                                            placeholder="e.g. Japan, Germany, Italy"
                                            value={formData.destinationCountry}
                                            onChangeText={(text) => onUpdate('destinationCountry', text)}
                                            placeholderTextColor={Colors.gray[500]}
                                        />
                                    </View>
                                </View>
                            </Animated.View>
                        )}
                    </View>
                </View>

                {/* 1. Leave Address */}
                <View className="gap-3">
                    <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                        LEAVE ADDRESS
                    </Text>

                    <View className="flex-row items-start bg-inputBackground rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                        <MapPin
                            size={20}
                            color={themeColors.tint}
                            className="mr-3 mt-1"
                            strokeWidth={2}
                        />
                        <TextInput
                            className="flex-1 text-base text-labelPrimary dark:text-white min-h-[80px]"
                            placeholder="Full address where you can be reached..."
                            placeholderTextColor={Colors.gray[500]}
                            value={formData.leaveAddress}
                            onChangeText={(text) => handleTextChange('leaveAddress', text)}
                            multiline
                            textAlignVertical="top"
                            autoCapitalize="words"
                        />
                    </View>
                </View>

                {/* 2. Leave Phone */}
                <View className="gap-3">
                    <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                        LEAVE PHONE NUMBER
                    </Text>

                    <View className="flex-row items-center bg-inputBackground rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                        <Phone
                            size={20}
                            color={themeColors.tint}
                            className="mr-3"
                            strokeWidth={2}
                        />
                        <TextInput
                            className="flex-1 text-base text-labelPrimary dark:text-white"
                            placeholder="555-123-4567"
                            placeholderTextColor={Colors.gray[500]}
                            value={formData.leavePhoneNumber}
                            onChangeText={(text) => handleTextChange('leavePhoneNumber', text)}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* 3. Mode of Travel */}
                <View className="gap-3">
                    <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                        MODE OF TRAVEL
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                        {MODES.map((mode) => {
                            const isSelected = formData.modeOfTravel === mode.id;
                            const Icon = mode.icon;

                            return (
                                <TouchableOpacity
                                    key={mode.id}
                                    onPress={() => onUpdate('modeOfTravel', mode.id)}
                                    className={`flex-1 min-w-[45%] flex-row items-center justify-center py-4 px-3 rounded-xl border ${isSelected
                                        ? 'bg-blue-500 border-blue-600 dark:bg-blue-600 dark:border-blue-500'
                                        : 'bg-inputBackground border-slate-200 dark:border-slate-700'
                                        }`}
                                >
                                    <Icon
                                        size={18}
                                        color={isSelected ? 'white' : (isDark ? '#94a3b8' : '#64748b')}
                                        strokeWidth={2}
                                    />
                                    <Text
                                        className={`ml-2 font-medium ${isSelected
                                            ? 'text-white'
                                            : 'text-gray-600 dark:text-slate-300'
                                            }`}
                                    >
                                        {mode.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

            </View >
        </WizardCard >
    );
}
