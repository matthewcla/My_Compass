import { useColorScheme } from '@/components/useColorScheme';
import { Heart, RotateCcw, Star, X } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface BilletControlBarProps {
    onUndo: () => void;
    onPass: () => void;
    onSave: () => void;
    onSuperLike: () => void;
    canUndo: boolean;
}

export function BilletControlBar({
    onUndo,
    onPass,
    onSave,
    onSuperLike,
    canUndo
}: BilletControlBarProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // "My Path" Dark Mode Glow Style
    const shadowStyle = isDark ? {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
        backgroundColor: '#1E293B',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1
    } : {};

    const btnClass = "items-center justify-center rounded-full bg-white shadow-md dark:bg-slate-800 dark:border-slate-700 dark:border";

    return (
        <View className="flex-row items-center justify-center gap-6 w-full pb-8 pt-4 bg-transparent">
            {/* Undo (Small) */}
            <TouchableOpacity
                onPress={onUndo}
                disabled={!canUndo}
                className={`w-12 h-12 ${btnClass} ${!canUndo ? 'opacity-50' : ''}`}
                style={shadowStyle}
            >
                <RotateCcw size={20} color={isDark ? '#FACC15' : "#EAB308"} />
            </TouchableOpacity>

            {/* Pass (Large) */}
            <TouchableOpacity
                onPress={onPass}
                className={`w-16 h-16 ${btnClass}`}
                style={shadowStyle}
            >
                <X size={32} color="#EF4444" />
            </TouchableOpacity>

            {/* Top 5 / SuperLike (Small) */}
            <TouchableOpacity
                onPress={onSuperLike}
                className={`w-12 h-12 ${btnClass}`}
                style={shadowStyle}
            >
                <Star size={20} color="#3B82F6" />
            </TouchableOpacity>

            {/* Save (Large) */}
            <TouchableOpacity
                onPress={onSave}
                className={`w-16 h-16 ${btnClass}`}
                style={shadowStyle}
            >
                <Heart size={32} color="#22C55E" />
            </TouchableOpacity>
        </View>
    );
}
