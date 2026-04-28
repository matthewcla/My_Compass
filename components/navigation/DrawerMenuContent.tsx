import { ThemeToggle } from '@/components/ThemeToggle';
import { useSession } from '@/lib/ctx';
import { useDemoStore } from '@/store/useDemoStore';
import Constants from 'expo-constants';
import { LogOut } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export const DrawerMenuContent = React.memo(function DrawerMenuContent() {
    const { signOut } = useSession();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const enableDevSettings = Constants.expoConfig?.extra?.enableDevSettings ?? __DEV__;
    const showDevFloatingIcons = useDemoStore((s) => s.showDevFloatingIcons);
    const toggleDevFloatingIcons = useDemoStore((s) => s.toggleDevFloatingIcons);

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, paddingTop: 24 }}
        >

            <Animated.View entering={FadeIn.duration(300).delay(100)} style={{ gap: 16 }}>
                {/* Visual Settings Card */}
                <View className="rounded-3xl overflow-hidden bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50">
                    <View className="p-5">
                        <ThemeToggle />
                    </View>
                </View>

                {/* Dev Tools Card */}
                {enableDevSettings && (
                    <View className="rounded-3xl overflow-hidden bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/50">
                        <View className="flex-row items-center justify-between p-5">
                            <View className="flex-row items-center gap-3 flex-1 mr-4">
                                <View className="p-2 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/40">
                                    <Text style={{ fontSize: 18 }}>🧪</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="font-semibold text-base text-slate-900 dark:text-white">Dev Tools</Text>
                                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Show diagnostic icons</Text>
                                </View>
                            </View>
                            <Switch
                                value={showDevFloatingIcons}
                                onValueChange={toggleDevFloatingIcons}
                                trackColor={{ false: isDark ? '#3f3f46' : '#d1d5db', true: '#10B981' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>
                )}

                {/* Danger Zone: Log Out Isolated Card */}
                <View style={{ marginTop: 24 }}>
                    <TouchableOpacity
                        className="rounded-3xl overflow-hidden flex-row items-center justify-center py-5 bg-red-500/10 dark:bg-red-900/20 border border-red-500/20"
                        onPress={() => signOut()}
                        activeOpacity={0.7}
                    >
                        <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
                        <Text className="text-red-600 font-bold text-base ml-3">Log Out Securely</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </ScrollView>
    );
});
