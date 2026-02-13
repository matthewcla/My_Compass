import { Anchor, Archive, Ship } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * PCS Archive State — "Digital Sea Bag"
 *
 * Shown when no active PCS orders exist.
 * Displays a dormant/ready state with a prompt.
 *
 * This component has NO internal scroll — scroll is
 * delegated to the parent CollapsibleScaffold.
 */
export function PCSArchiveState() {


    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
        >
            <View className="px-4 pt-8 pb-12">

                {/* Header */}
                <View className="items-center mb-8">
                    <View className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4 border-2 border-slate-200 dark:border-slate-700">
                        <Anchor size={36} className="text-slate-400 dark:text-slate-500" />
                    </View>
                    <Text className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-2">
                        Digital Sea Bag
                    </Text>
                    <Text className="text-sm text-slate-500 dark:text-slate-400 text-center leading-5 max-w-[280px]">
                        No active PCS orders. When you receive orders, your relocation roadmap will appear here.
                    </Text>
                </View>

                {/* Info Cards */}
                <View className="gap-4">
                    <View className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <View className="flex-row items-center gap-3 mb-3">
                            <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center">
                                <Ship size={20} className="text-blue-600 dark:text-blue-400" />
                            </View>
                            <Text className="text-base font-bold text-slate-900 dark:text-white">
                                Ready to Move
                            </Text>
                        </View>
                        <Text className="text-sm text-slate-600 dark:text-slate-300 leading-5">
                            Once your orders are issued, we'll build a personalized PCS checklist, calculate your entitlements, and guide you through every step.
                        </Text>
                    </View>

                    <View className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <View className="flex-row items-center gap-3 mb-3">
                            <View className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 items-center justify-center">
                                <Archive size={20} className="text-amber-600 dark:text-amber-400" />
                            </View>
                            <Text className="text-base font-bold text-slate-900 dark:text-white">
                                Past Moves
                            </Text>
                        </View>
                        <Text className="text-sm text-slate-600 dark:text-slate-300 leading-5">
                            Your previous PCS history and travel claims will be archived here for reference.
                        </Text>
                    </View>
                </View>

            </View>
        </Animated.View>
    );
}
