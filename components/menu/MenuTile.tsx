import { Lock } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';

interface MenuTileProps {
    label: string;
    icon: any; // Lucide icon component
    onPress: () => void;
    locked?: boolean;
}

export const MenuTile: React.FC<MenuTileProps> = ({
    label,
    icon: Icon,
    onPress,
    locked = false
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            disabled={locked}
            style={{
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
            }}
            className={`rounded-3xl p-3 w-full flex-1 justify-between shadow-sm border ${locked ? 'opacity-50' : ''}`}
        >
            <View className="flex-row justify-between items-start">
                <View
                    style={{ backgroundColor: isDark ? (locked ? '#334155' : 'rgba(59, 130, 246, 0.2)') : (locked ? '#F1F5F9' : '#EFF6FF') }}
                    className="p-3 rounded-full"
                >
                    <Icon size={24} color={locked ? '#94A3B8' : '#3B82F6'} strokeWidth={2.5} />
                </View>
                {locked && (
                    <Lock size={16} color="#CBD5E1" />
                )}
            </View>

            <Text
                style={{
                    color: isDark ? (locked ? '#94A3B8' : '#FFFFFF') : (locked ? '#94A3B8' : '#0F172A'),
                    lineHeight: 22
                }}
                className="font-bold text-[17px] mt-2"
                numberOfLines={2}
            >
                {label}
            </Text>
        </TouchableOpacity >
    );
};
