import { Colors } from '@/constants/Colors';
import { Application, Billet } from '@/types/schema';
import { ChevronDown, ChevronUp, Lock, Unlock, X } from 'lucide-react-native';
import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, Layout } from 'react-native-reanimated';

interface SlateSlotProps {
    rank: number;
    application?: Application | null;
    billet?: Billet | null;
    isFirst: boolean;
    isLast: boolean;
    onRemove?: (appId: string) => void;
    onLock?: () => void;
    onMoveUp?: (rank: number) => void;
    onMoveDown?: (rank: number) => void;
}

export const SlateSlot = memo(({
    rank,
    application,
    billet,
    isFirst,
    isLast,
    onRemove,
    onLock,
    onMoveUp,
    onMoveDown
}: SlateSlotProps) => {
    const isFilled = !!billet;
    const isLocked = application?.status === 'submitted';

    const handleMoveUp = () => onMoveUp?.(rank);
    const handleMoveDown = () => onMoveDown?.(rank);
    const handleRemove = () => application && onRemove?.(application.id);

    return (
        <Animated.View
            entering={FadeInRight.duration(250).springify()}
            exiting={FadeOutLeft.duration(200)}
            layout={Layout.springify()}
        >
            <View className="mb-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-row items-center h-20">
                {/* RANK STRIP */}
                <View className="w-10 h-full bg-slate-100 dark:bg-slate-700/50 justify-center items-center border-r border-slate-200 dark:border-slate-700">
                    <Text className="text-slate-400 font-bold text-lg">{rank}</Text>
                </View>

                {/* CONTENT */}
                <View className="flex-1 px-4 justify-center">
                    {isFilled && billet ? (
                        <View>
                            <Text className="font-bold text-slate-900 dark:text-white text-base leading-tight" numberOfLines={1}>
                                {billet.title}
                            </Text>
                            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {billet.location} • {billet.payGrade}
                            </Text>
                            {application?.status === 'submitted' && (
                                <Text className="text-[10px] text-green-600 font-bold mt-1">SUBMITTED</Text>
                            )}
                        </View>
                    ) : (
                        <Text className="text-slate-400 dark:text-slate-600 italic">Empty Slot</Text>
                    )}
                </View>

                {/* ACTIONS */}
                {isFilled && (
                    <View className="flex-row items-center pr-3 gap-1">
                        {/* Reorder Controls */}
                        {!isLocked && (
                            <View className="flex-col mr-2">
                                {onMoveUp && !isFirst && (
                                    <TouchableOpacity
                                        onPress={handleMoveUp}
                                        className="p-1 active:bg-slate-100 dark:active:bg-slate-700 rounded"
                                        accessibilityLabel="Move up"
                                        accessibilityRole="button"
                                    >
                                        <ChevronUp size={16} color={Colors.light.systemGray} />
                                    </TouchableOpacity>
                                )}
                                {onMoveDown && !isLast && (
                                    <TouchableOpacity
                                        onPress={handleMoveDown}
                                        className="p-1 active:bg-slate-100 dark:active:bg-slate-700 rounded"
                                        accessibilityLabel="Move down"
                                        accessibilityRole="button"
                                    >
                                        <ChevronDown size={16} color={Colors.light.systemGray} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {onLock && (
                            <TouchableOpacity
                                onPress={onLock}
                                disabled={isLocked}
                                className={`p-2 rounded-full ${isLocked ? 'opacity-50' : 'active:bg-slate-100 dark:active:bg-slate-700'}`}
                                accessibilityLabel={isLocked ? "Locked" : "Lock application"}
                                accessibilityRole="button"
                            >
                                {isLocked ? (
                                    <Lock size={18} color={Colors.light.systemGray} />
                                ) : (
                                    <Unlock size={18} color={Colors.light.systemGray} />
                                )}
                            </TouchableOpacity>
                        )}

                        {onRemove && !isLocked && (
                            <TouchableOpacity
                                onPress={handleRemove}
                                className="p-2 rounded-full active:bg-red-50 dark:active:bg-red-900/20"
                                accessibilityLabel="Remove application"
                                accessibilityRole="button"
                            >
                                <X size={18} color={Colors.light.status.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </Animated.View>
    );
});
