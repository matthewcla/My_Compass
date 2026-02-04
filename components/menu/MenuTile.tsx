import { Lock } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            disabled={locked}
            className={`bg-white rounded-[16px] p-4 m-2 flex-grow basis-[45%] aspect-square justify-between shadow-sm relative ${locked ? 'opacity-60' : ''}`}
        >
            <View className="flex-row justify-between items-start">
                <Icon size={28} color="#0F172A" strokeWidth={2} />
                {locked && (
                    <Lock size={16} color="#94A3B8" />
                )}
            </View>

            <Text className="text-slate-900 font-bold text-base leading-5">
                {label}
            </Text>
        </TouchableOpacity>
    );
};
