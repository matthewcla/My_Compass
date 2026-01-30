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
    // In dark mode, we want a blue glow (Lighter Shadow) and a dark background
    const shadowStyle = isDark ? {
        shadowColor: '#3B82F6', // Blue-500 Glow
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
        backgroundColor: '#1E293B', // Slate-800
        borderColor: 'rgba(59, 130, 246, 0.3)', // Subtle blue border
        borderWidth: 1
    } : {}; // Light mode uses default Tailwind shadow-md

    // Base classes
    // We use dark:bg-slate-800 in className as fallback/base, but style overrides it if set.
    // We intentionally remove shadow-md in dark mode via style override (shadowColor in style takes precedence)
    const btnClass = "items-center justify-center rounded-full bg-white shadow-md dark:bg-slate-800 dark:border-slate-700 dark:border";

    return (
        <View className="flex-row items-center justify-center gap-6 w-full pb-8 pt-4 bg-transparent">
            {/* Undo (Small) */}
            <TouchableOpacity
                onPress={onUndo}
                disabled={!canUndo}
                className={`w-14 h-14 ${btnClass} ${!canUndo ? 'opacity-50' : ''}`}
                style={shadowStyle}
            >
                <RotateCcw size={24} color={isDark ? '#FACC15' : "#EAB308"} />
            </TouchableOpacity>

            {/* Pass (Large) */}
            <TouchableOpacity
                onPress={onPass}
                className={`w-20 h-20 ${btnClass}`}
                style={shadowStyle}
            >
                <X size={40} color="#EF4444" />
            </TouchableOpacity>

            {/* Top 5 / SuperLike (Small) */}
            <TouchableOpacity
                onPress={onSuperLike}
                className={`w-14 h-14 ${btnClass}`}
                style={shadowStyle}
            >
                <Star size={24} color="#3B82F6" />
            </TouchableOpacity>

            {/* Save (Large) */}
            <TouchableOpacity
                onPress={onSave}
                className={`w-20 h-20 ${btnClass}`}
                style={shadowStyle}
            >
                <Heart size={40} color="#22C55E" />
            </TouchableOpacity>
        </View>
    );
}
