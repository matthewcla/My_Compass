import { useCurrentProfile, useDemoStore } from '@/store/useDemoStore';
import { useUIStore } from '@/store/useUIStore';
import { useRouter } from 'expo-router';
import {
    Briefcase,
    CalendarDays,
    Home,
    LogOut,
    Mail,
    Settings,
    UserCircle
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Drawer only mounts on the Web
export function NavigationDrawer() {
    if (Platform.OS !== 'web') return null;

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { isDrawerOpen, closeDrawer } = useUIStore();
    const user = useCurrentProfile();

    // Reanimated values for drawer slide and scrim fade
    const translateX = useSharedValue(-320);
    const backdropOpacity = useSharedValue(0);

    const [isVisible, setIsVisible] = useState(false);
    const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);

    const showDevFloatingIcons = useDemoStore((s) => s.showDevFloatingIcons);
    const toggleDevFloatingIcons = useDemoStore((s) => s.toggleDevFloatingIcons);

    useEffect(() => {
        if (isDrawerOpen) {
            setIsVisible(true);
            translateX.value = withTiming(0, { duration: 300 });
            backdropOpacity.value = withTiming(0.6, { duration: 300 });
        } else {
            translateX.value = withTiming(-320, { duration: 300 });
            backdropOpacity.value = withTiming(0, { duration: 300 });
            // Unmount after animation
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isDrawerOpen]);

    const drawerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
        pointerEvents: isDrawerOpen ? 'auto' : 'none',
    }));

    const handleNavigate = (path: string) => {
        closeDrawer();
        router.push(path as any);
    };

    if (!isVisible) return null;

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 60, elevation: 60 }]}>
            {/* Scrim Overlay */}
            <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={closeDrawer}
                    className="bg-black"
                />
            </Animated.View>

            {/* Drawer */}
            <Animated.View
                style={[
                    drawerStyle,
                    {
                        width: 320,
                        height: '100%',
                        backgroundColor: '#131313',
                        borderRightWidth: 4,
                        borderRightColor: '#fdc400',
                    }
                ]}
                className="flex-col shadow-[10px_0px_0px_0px_rgba(0,0,0,1)]"
            >
                {/* Header: Profile */}
                <View className="p-6 border-b border-[#44474f] flex flex-col items-start gap-4 bg-[#1c1b1b] relative overflow-hidden" style={{ paddingTop: Math.max(insets.top, 24) }}>
                    {/* Decorative background element */}
                    <View className="absolute top-0 right-0 w-32 h-32 bg-[#aec6fe]/5 rounded-bl-full -mr-10 -mt-10" />
                    <View className="flex flex-col z-10">
                        <Text className="text-[#fdc400] font-headline font-bold text-lg leading-tight uppercase tracking-wide">
                            {user?.displayName ?? 'GUEST USER'}
                        </Text>
                        <Text className="text-[#e5e2e1] text-sm font-medium tracking-wider mt-1 opacity-90">
                            US NAVY - ACTIVE DUTY
                        </Text>
                        <View className="mt-3 flex-row self-start px-2 py-1 bg-[#353534] border border-[#44474f]">
                            <Text className="text-xs text-[#c4c6d0] font-bold tracking-widest uppercase">
                                {user?.rank ?? 'E-1'} | {user?.rating ?? 'UNSPECIFIED'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Navigation Links */}
                <ScrollView className="flex-1 py-4 px-3" showsVerticalScrollIndicator={false}>
                    <DrawerItem
                        icon={<Home size={20} color="#e5e2e1" />}
                        label="HOME HUB"
                        onPress={() => handleNavigate('/(tabs)/(hub)')}
                    />
                    <DrawerItem
                        icon={<Briefcase size={20} color="#e5e2e1" />}
                        label="ADMIN"
                        onPress={() => handleNavigate('/(tabs)/(admin)')}
                    />
                    <DrawerItem
                        icon={<CalendarDays size={20} color="#e5e2e1" />}
                        label="EVENTS"
                        onPress={() => handleNavigate('/(tabs)/(calendar)/calendar')}
                    />
                    <DrawerItem
                        icon={<Mail size={20} color="#e5e2e1" />}
                        label="INBOX"
                        onPress={() => handleNavigate('/(tabs)/inbox')}
                    />
                    <DrawerItem
                        icon={<UserCircle size={20} color="#e5e2e1" />}
                        label="PROFILE"
                        onPress={() => handleNavigate('/(tabs)/(profile)')}
                    />

                    {/* Divider */}
                    <View className="h-px bg-[#44474f] mx-4 my-2" />

                    <DrawerItem
                        icon={<Settings size={20} color="#e5e2e1" />}
                        label="SETTINGS"
                        onPress={() => setSettingsModalVisible(true)}
                    />
                </ScrollView>

                {/* Footer / Logout area */}
                <View className="p-4 border-t border-[#44474f]" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
                    <Pressable
                        onPress={() => {
                            closeDrawer();
                            // Optional: Implement logout logic here
                            router.replace('/sign-in');
                        }}
                        className="w-full flex-row items-center justify-center gap-2 py-3 px-4 border-2 border-[#44474f] hover:bg-[#353534] hover:border-[#aec6fe] transition-colors"
                    >
                        <LogOut size={14} color="#e5e2e1" />
                        <Text className="text-[#e5e2e1] font-headline font-bold uppercase tracking-widest text-sm">
                            SECURE LOGOUT
                        </Text>
                    </Pressable>
                </View>
            </Animated.View>

            {/* Settings Modal */}
            <Modal
                visible={isSettingsModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSettingsModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
                    <View className="bg-[#1c1b1b] p-6 rounded-2xl w-80 border border-[#44474f]">
                        <Text className="text-[#fdc400] font-headline font-bold text-xl mb-4 uppercase tracking-wide">SETTINGS</Text>
                        
                        <View className="flex-row items-center justify-between mb-6">
                            <View className="flex-row items-center gap-3 flex-1 mr-4">
                                <View className="p-2 rounded-xl bg-emerald-100/10 border border-emerald-500/20">
                                    <Text style={{ fontSize: 18 }}>🧪</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#e5e2e1] font-semibold text-base">Dev Tools</Text>
                                    <Text className="text-[#c4c6d0] text-xs mt-1">Show diagnostic icons</Text>
                                </View>
                            </View>
                            <Switch
                                value={showDevFloatingIcons}
                                onValueChange={toggleDevFloatingIcons}
                                trackColor={{ false: '#3f3f46', true: '#10B981' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                        
                        <Pressable 
                            onPress={() => setSettingsModalVisible(false)}
                            className="w-full bg-[#353534] py-3 rounded-xl border border-[#44474f] items-center hover:bg-[#44474f] transition-colors"
                        >
                            <Text className="text-[#e5e2e1] font-headline font-bold uppercase tracking-widest text-sm">CLOSE</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// DrawerItem Component
function DrawerItem({ icon, label, onPress }: { icon: React.ReactNode, label: string, onPress: () => void }) {
    // Basic hover implementation for React Native Web using standard Pressable
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center px-4 py-3 hover:bg-[#353534] transition-colors group relative mb-1"
        >
            <View className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-[#aec6fe] transition-colors" />
            <View className="opacity-80 group-hover:opacity-100 transition-opacity flex-row items-center">
                {icon}
            </View>
            <Text className="text-[#e5e2e1] font-headline font-semibold uppercase tracking-wide ml-4">
                {label}
            </Text>
        </Pressable>
    );
}
