import { AliveInput } from '@/components/ui/AliveInput';
import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import * as Haptics from 'expo-haptics';
import { Bus, Car, Globe2, MapPin, Phone, Plane, Train } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, ZoomIn } from 'react-native-reanimated';

interface Step2ContactProps {
    formData: Partial<CreateLeaveRequestPayload>;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: any) => void;
    embedded?: boolean;
}

export function Step2Contact({ formData, onUpdate, embedded = false }: Step2ContactProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const handleTextChange = (field: keyof CreateLeaveRequestPayload, value: string) => {
        onUpdate(field, value);
    };

    const MODES = [
        { id: 'Air', label: 'Air', icon: Plane, color: 'blue' },
        { id: 'Car', label: 'Car', icon: Car, color: 'orange' },
        { id: 'Train', label: 'Train', icon: Train, color: 'purple' },
        { id: 'Bus', label: 'Bus', icon: Bus, color: 'green' },
    ];

    return (
        <WizardCard title="Location & Travel" scrollable={!embedded}>
            <View className="gap-8">

                {/* 0. Location & Legal */}
                <View>
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
                        Deployment Status
                    </Text>

                    <Animated.View layout={LinearTransition} className="bg-inputBackground rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* CONUS Toggle */}
                        <View className="flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50">
                            <View className="flex-row items-center flex-1 mr-4">
                                <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
                                    <MapPin size={20} className="text-blue-600 dark:text-blue-400" />
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
                                <View className="p-4 bg-white dark:bg-slate-900/30">
                                    <AliveInput
                                        value={formData.destinationCountry}
                                        onChangeText={(text) => onUpdate('destinationCountry', text)}
                                        placeholder="e.g. Japan, Germany, Italy"
                                        icon={<Globe2 size={20} className="text-orange-600 dark:text-orange-400" />}
                                        containerClassName="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20"
                                    />
                                </View>
                            </Animated.View>
                        )}
                    </Animated.View>
                </View>

                {/* 1. Address & Phone */}
                <View className="gap-4">
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                        Contact Info
                    </Text>

                    <AliveInput
                        value={formData.leaveAddress}
                        onChangeText={(text) => handleTextChange('leaveAddress', text)}
                        placeholder="Full address where you can be reached..."
                        multiline
                        textAlignVertical="top"
                        autoCapitalize="words"
                        icon={<MapPin size={20} color={themeColors.tint} />}
                        containerClassName="min-h-[100px]"
                    />

                    <AliveInput
                        value={formData.leavePhoneNumber}
                        onChangeText={(text) => handleTextChange('leavePhoneNumber', text)}
                        placeholder="555-123-4567"
                        keyboardType="phone-pad"
                        icon={<Phone size={20} color={themeColors.tint} />}
                    />
                </View>

                {/* 3. Mode of Travel (Visual Cards) */}
                <View className="gap-3">
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                        Mode of Travel
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 20, gap: 12 }}
                    >
                        {MODES.map((mode, index) => {
                            const isSelected = formData.modeOfTravel === mode.id;
                            const Icon = mode.icon;

                            // Dynamic Colors based on selection
                            const activeBg = isDark ? 'bg-slate-800' : 'bg-white';
                            const activeBorder = isDark ? 'border-blue-500' : 'border-blue-500';

                            return (
                                <Animated.View
                                    key={mode.id}
                                    entering={ZoomIn.delay(index * 50)}
                                >
                                    <TouchableOpacity
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            onUpdate('modeOfTravel', mode.id);
                                        }}
                                        activeOpacity={0.7}
                                        className={`w-28 h-28 p-3 rounded-2xl border-2 justify-between ${isSelected
                                                ? `${activeBg} ${activeBorder}`
                                                : 'bg-inputBackground border-transparent'
                                            }`}
                                    >
                                        <View className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                                            }`}>
                                            <Icon
                                                size={20}
                                                color={isSelected ? 'white' : (isDark ? '#94a3b8' : '#64748b')}
                                                strokeWidth={2.5}
                                            />
                                        </View>
                                        <View>
                                            <Text className={`font-bold text-base ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                                                }`}>
                                                {mode.label}
                                            </Text>
                                            {isSelected && (
                                                <Animated.View entering={FadeIn} className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </ScrollView>
                </View>

            </View >
        </WizardCard >
    );
}
