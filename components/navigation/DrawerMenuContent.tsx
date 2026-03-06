import { ThemeToggle } from '@/components/ThemeToggle';
import { useSession } from '@/lib/ctx';
import { useDemoStore } from '@/store/useDemoStore';
import Constants from 'expo-constants';
import { LogOut, Settings } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export function DrawerMenuContent() {
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
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, paddingTop: 16 }}
        >
            {/* Header */}
            <View className="mb-6 flex-row items-center gap-3 px-2">
                <View className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <Settings size={22} color={isDark ? '#e2e8f0' : '#475569'} />
                </View>
                <Text className="text-xl font-bold text-slate-900 dark:text-white">Command Center</Text>
            </View>

            <Animated.View entering={FadeIn.duration(300).delay(100)}>
                {/* Visual Settings Group */}
                <View className="mb-6 rounded-3xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <View className="px-5 py-4">
                        <ThemeToggle />
                    </View>
                </View>

                {/* Account & Security Group */}
                {enableDevSettings && (
                    <View className="mb-6 rounded-3xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                        <View className="flex-row items-center justify-between px-5 py-4">
                            <View className="flex-row items-center gap-3 flex-1 mr-4">
                                <View className="p-2 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/30">
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

                {/* Danger Zone */}
                <TouchableOpacity
                    style={{
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                        borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)'
                    }}
                    className="flex-row items-center justify-center py-4 rounded-3xl border"
                    onPress={() => signOut()}
                    activeOpacity={0.7}
                >
                    <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
                    <Text className="text-red-600 font-bold text-base ml-3">Log Out Securely</Text>
                </TouchableOpacity>
            </Animated.View>
        </ScrollView>
    );
}
