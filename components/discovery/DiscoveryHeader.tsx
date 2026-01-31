import { useColorScheme } from '@/components/useColorScheme';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { FolderHeart, SlidersHorizontal, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';

interface DiscoveryHeaderProps {
    mode: 'real' | 'sandbox';
    onToggleMode: () => void;
    onOpenFilters: () => void;
    onOpenShortlist: () => void;
    savedCount: number;
    showProjected: boolean;
    onToggleProjected: () => void;
}

export function DiscoveryHeader({
    mode,
    onToggleMode,
    onOpenFilters,
    onOpenShortlist,
    savedCount,
    showProjected,
    onToggleProjected,
}: DiscoveryHeaderProps) {
    const isSandbox = mode === 'sandbox';
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const handleToggle = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggleMode();
    };

    const handlePressExit = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Ensure we can navigate back. If explicit /hub exists, go there.
        // Or just router.back() if pushed.
        // User requested "Exit Control", typically implies closing the flow.
        router.push('/(hub)');
    };

    const handlePressFilter = () => {
        Haptics.selectionAsync();
        onOpenFilters();
    };

    const handlePressShortlist = () => {
        Haptics.selectionAsync();
        onOpenShortlist();
    };

    // Colors
    const containerBg = isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200';
    const iconBtnBg = isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200';
    const iconColor = isDark ? '#cbd5e1' : '#64748b'; // Slate-300 vs Slate-500
    const toggleTrackBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200';

    // Toggle Text Colors
    const activeText = 'text-white';
    const inactiveText = isDark ? 'text-slate-500' : 'text-slate-400';

    return (
        <View className={`flex-row items-center justify-between px-6 pt-2 pb-4 border-b z-50 ${containerBg}`}>
            {/* Left Action: Exit */}
            <TouchableOpacity
                onPress={handlePressExit}
                className={`w-10 h-10 items-center justify-center rounded-full border active:opacity-80 ${iconBtnBg}`}
            >
                <X size={20} color={iconColor} strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Center: Animated Mode Toggle */}
            <Pressable
                onPress={handleToggle}
                className={`relative flex-row items-center rounded-full border h-10 w-[200px] ${toggleTrackBg}`}
            >
                {/* Sliding Pill Background of the Active Tab */}
                <MotiView
                    animate={{
                        translateX: isSandbox ? 100 : 0,
                    }}
                    transition={{
                        type: 'spring',
                        damping: 20,
                        stiffness: 300,
                        mass: 0.8
                    }}
                    style={{
                        position: 'absolute',
                        width: 96,
                        height: 32,
                        left: 2,
                        borderRadius: 9999,
                        backgroundColor: isSandbox ? '#4f46e5' : (isDark ? '#2563eb' : '#0f172a'),
                    }}
                />

                {/* Text Labels (Overlay) */}
                <View className="flex-1 items-center justify-center z-10">
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${!isSandbox ? activeText : inactiveText}`}>
                        My Path
                    </Text>
                </View>
                <View className="flex-1 items-center justify-center z-10">
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${isSandbox ? activeText : inactiveText}`}>
                        Sandbox
                    </Text>
                </View>
            </Pressable>

            {/* Right Action: Group (Filters + Shortlist) */}
            <View className="flex-row items-center gap-2">
                {/* Projected Toggle (Text Button) */}
                <TouchableOpacity
                    onPress={onToggleProjected}
                    className={`h-10 px-3 items-center justify-center rounded-full border active:opacity-80 ${showProjected ? 'bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' : iconBtnBg}`}
                >
                    <Text className={`text-[10px] font-bold uppercase tracking-wider ${showProjected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500'}`}>
                        {showProjected ? 'Projected' : 'Open Only'}
                    </Text>
                </TouchableOpacity>

                {/* Filters (Mini) */}
                <TouchableOpacity
                    onPress={handlePressFilter}
                    className={`w-10 h-10 items-center justify-center rounded-full border active:opacity-80 ${iconBtnBg}`}
                >
                    <SlidersHorizontal size={18} color={iconColor} strokeWidth={2.5} />
                </TouchableOpacity>

                {/* Shortlist */}
                <TouchableOpacity
                    onPress={handlePressShortlist}
                    className={`w-10 h-10 items-center justify-center rounded-full border active:opacity-80 relative ${iconBtnBg}`}
                >
                    <FolderHeart size={18} color={iconColor} strokeWidth={2.5} />
                    {savedCount > 0 && (
                        <View className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
