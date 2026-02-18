import Colors from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import { Lock } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Text, TouchableOpacity, useColorScheme, View, ViewStyle } from 'react-native';

interface MenuTileProps {
    label: string;
    subtitle?: string;
    icon: any; // Lucide icon component
    onPress: () => void;
    locked?: boolean;
    /** Accent color for active/important state — adds a left border accent and tinted icon bubble */
    accent?: string;
    className?: string;
    style?: ViewStyle;
}

export const MenuTile: React.FC<MenuTileProps> = ({
    label,
    subtitle,
    icon: Icon,
    onPress,
    locked = false,
    accent,
    className,
    style
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const colors = Colors[colorScheme ?? 'light'];

    const isAccented = !!accent && !locked;

    const handlePress = useCallback(() => {
        Haptics.selectionAsync();
        onPress();
    }, [onPress]);

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.7}
            disabled={locked}
            style={[{
                backgroundColor: colors.surface,
                borderColor: isAccented ? accent : colors.surfaceBorder,
                borderLeftWidth: isAccented ? 3 : 1,
            }, style]}
            className={`rounded-3xl p-3 w-full flex-1 justify-between shadow-sm border ${locked ? 'opacity-50' : ''} ${className || ''}`}
        >
            <View className="flex-row justify-between items-start">
                <View
                    style={{
                        backgroundColor: isAccented
                            ? (isDark ? `${accent}33` : `${accent}18`)
                            : (locked ? colors.iconBubbleLocked : colors.iconBubble),
                    }}
                    className="p-3 rounded-full"
                >
                    <Icon
                        size={24}
                        // Changed default from Blue-500 (#3B82F6) to Slate-900 (#0F172A)
                        color={isAccented ? accent : (locked ? '#94A3B8' : '#0F172A')}
                        strokeWidth={2.5}
                    />
                </View>
                {locked && (
                    <Lock size={16} color="#CBD5E1" />
                )}
                {isAccented && (
                    <View
                        style={{ backgroundColor: accent, width: 8, height: 8, borderRadius: 4 }}
                    />
                )}
            </View>

            <View className="mt-2">
                <Text
                    style={{
                        color: isDark ? (locked ? '#94A3B8' : '#FFFFFF') : (locked ? '#94A3B8' : '#0F172A'),
                        lineHeight: 20
                    }}
                    className="font-bold text-[15px]"
                    numberOfLines={2}
                >
                    {label}
                </Text>
                {subtitle && (
                    <Text
                        style={isAccented ? { color: accent } : undefined}
                        className={`text-xs mt-0.5 font-semibold ${isAccented ? '' : 'text-slate-500 dark:text-slate-400 font-medium'}`}
                        numberOfLines={1}
                    >
                        {subtitle}
                    </Text>
                )}
            </View>
        </TouchableOpacity >
    );
};

