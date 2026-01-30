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
    return (
        <View className="flex-row items-center justify-center gap-6 w-full pb-8 pt-4 bg-transparent">
            {/* Undo (Small) */}
            <TouchableOpacity
                onPress={onUndo}
                disabled={!canUndo}
                className={`w-12 h-12 rounded-full bg-white shadow-md items-center justify-center ${!canUndo ? 'opacity-50' : ''}`}
            >
                <RotateCcw size={20} color="#EAB308" />
            </TouchableOpacity>

            {/* Pass (Large) */}
            <TouchableOpacity
                onPress={onPass}
                className="w-16 h-16 rounded-full bg-white shadow-md items-center justify-center"
            >
                <X size={32} color="#EF4444" />
            </TouchableOpacity>

            {/* Top 5 / SuperLike (Small) */}
            <TouchableOpacity
                onPress={onSuperLike}
                className="w-12 h-12 rounded-full bg-white shadow-md items-center justify-center"
            >
                <Star size={20} color="#3B82F6" />
            </TouchableOpacity>

            {/* Save (Large) */}
            <TouchableOpacity
                onPress={onSave}
                className="w-16 h-16 rounded-full bg-white shadow-md items-center justify-center"
            >
                <Heart size={32} color="#22C55E" />
            </TouchableOpacity>
        </View>
    );
}
