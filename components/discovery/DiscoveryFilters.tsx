import Colors from '@/constants/Colors';
import { getShadow } from '@/utils/getShadow';
import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, Switch, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface DiscoveryFiltersProps {
    visible: boolean;
    onClose: () => void;
    showProjected: boolean;
    onToggleProjected: () => void;
}

export function DiscoveryFilters({
    visible,
    onClose,
    showProjected,
    onToggleProjected,
}: DiscoveryFiltersProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                {/* Backdrop tap to close */}
                <TouchableOpacity className="absolute inset-0" onPress={onClose} activeOpacity={1}>
                    <View className="flex-1 bg-black/30" />
                </TouchableOpacity>

                {/* Drawer Content */}
                <View
                    className="rounded-t-3xl p-5"
                    style={[
                        { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
                        getShadow({
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 4,
                            elevation: 5,
                        })
                    ]}
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-xl font-bold" style={{ color: theme.text }}>
                            Discovery Settings
                        </Text>
                        <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
                            <X size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View className="gap-6 mb-8">
                        {/* Projected Billets Toggle */}
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1 pr-4">
                                <Text className="text-base font-semibold mb-1" style={{ color: theme.text }}>
                                    Show Projected Billets
                                </Text>
                                <Text className="text-sm text-slate-500 dark:text-slate-400">
                                    Include billets that open in future cycles (9-12 months out).
                                </Text>
                            </View>
                            <Switch
                                value={showProjected}
                                onValueChange={onToggleProjected}
                                trackColor={{ false: '#767577', true: '#2563eb' }}
                                thumbColor={Platform.OS === 'ios' ? '#fff' : (showProjected ? '#fff' : '#f4f3f4')}
                            />
                        </View>
                    </View>

                    {/* Bottom Safe Area Spacer */}
                    <View style={{ height: 20 }} />
                </View>
            </View>
        </Modal>
    );
}

import { Platform } from 'react-native';
