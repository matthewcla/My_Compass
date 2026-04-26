import { AliveInput } from '@/components/ui/AliveInput';
import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { CreateLeaveRequestPayload } from '@/types/api';
import * as Haptics from 'expo-haptics';
import { Bus, Car, Globe2, MapPin, Phone, Plane, Train } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeIn, FadeOut, LinearTransition, ZoomIn } from 'react-native-reanimated';

interface Step2ContactProps {
    formData: Partial<CreateLeaveRequestPayload>;
    onUpdate: (field: keyof CreateLeaveRequestPayload, value: unknown) => void;
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
                    <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 ml-1">
                        Leave Area
                    </Text>

                    <Animated.View layout={LinearTransition} className="bg-surface-container rounded-none border border-outline-variant overflow-hidden">
                        {/* CONUS Toggle */}
                        <View className="flex-row items-center justify-between p-4 border-b border-outline-variant">
                            <View className="flex-row items-center flex-1 mr-4">
                                <View className="w-10 h-10 rounded-none bg-primary-container items-center justify-center mr-3">
                                    <MapPin size={20} color={isDark ? '#338EF7' : '#000A23'} className="text-primary" />
                                </View>
                                <View>
                                    <Text className="text-base font-bold text-on-surface">Leave inside CONUS?</Text>
                                    <Text className="text-xs text-on-surface-variant mt-0.5">Continental United States</Text>
                                </View>
                            </View>
                            <Switch
                                value={formData.leaveInConus}
                                onValueChange={(val) => {
                                    Haptics.selectionAsync();
                                    onUpdate('leaveInConus', val);
                                }}
                                trackColor={{ false: '#767577', true: themeColors.primary }}
                                thumbColor={'#FFFFFF'}
                            />
                        </View>

                        {/* Destination Country (Conditional) */}
                        {!formData.leaveInConus && (
                            <Animated.View entering={FadeIn} exiting={FadeOut}>
                                <View className="p-4 bg-surface">
                                    <AliveInput
                                        value={formData.destinationCountry}
                                        onChangeText={(text) => onUpdate('destinationCountry', text)}
                                        placeholder="e.g. Japan, Germany, Italy"
                                        icon={<Globe2 size={20} color={isDark ? '#6C5200' : '#6D5200'} className="text-on-secondary-container" />}
                                        containerClassName="border-outline-variant bg-secondary-container"
                                    />
                                </View>
                            </Animated.View>
                        )}
                    </Animated.View>
                </View>

                {/* 1. Address & Phone */}
                <View className="gap-4">
                    <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
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
                    <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                        Mode of Travel
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 40, gap: 12 }}
                    >
                        {MODES.map((mode, index) => {
                            const isSelected = formData.modeOfTravel === mode.id;
                            const Icon = mode.icon;

                            const activeBg = 'bg-primary-container';
                            const activeBorder = 'border-primary';

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
                                        className={`w-28 h-28 p-3 rounded-none border-2 justify-between ${isSelected
                                            ? `${activeBg} ${activeBorder}`
                                            : 'bg-surface-container border-outline-variant'
                                            }`}
                                    >
                                        <View className={`w-10 h-10 rounded-none items-center justify-center ${isSelected ? 'bg-primary' : 'bg-surface-variant'
                                            }`}>
                                            <Icon
                                                size={20}
                                                color={isSelected ? (isDark ? '#003258' : '#FFFFFF') : (isDark ? '#C4C6D0' : '#44474F')}
                                                strokeWidth={2.5}
                                            />
                                        </View>
                                        <View>
                                            <Text className={`font-bold text-base ${isSelected ? 'text-on-primary-container' : 'text-on-surface-variant'
                                                }`}>
                                                {mode.label}
                                            </Text>
                                            {isSelected && (
                                                <Animated.View entering={FadeIn} className="w-1.5 h-1.5 rounded-none bg-primary mt-1" />
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
