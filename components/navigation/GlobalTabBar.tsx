import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUIStore } from '@/store/useUIStore';
import { getShadow } from '@/utils/getShadow';
import { usePathname, useRouter, useSegments } from 'expo-router';
import {
    ClipboardList,
    Compass,
    DollarSign,
    FileText,
    Home,
    Inbox,
    Map as MapIcon,
    Settings,
    Target,
    UserCircle
} from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SpokeConfig = {
    primary: { label: string; route: string; icon: any };
    secondary: { label: string; route: string; icon: any };
};

const SPOKE_CONFIG: Record<string, SpokeConfig> = {
    '(assignment)': {
        primary: { label: 'Explore', route: '/(assignment)/assignments', icon: Compass },
        secondary: { label: 'Cycle', route: '/(assignment)/cycle', icon: Target },
    },
    '(pcs)': {
        primary: { label: 'Orders', route: '/(pcs)/orders', icon: FileText },
        secondary: { label: 'Move', route: '/(pcs)/move', icon: MapIcon },
    },
    '(admin)': {
        primary: { label: 'Requests', route: '/(admin)/requests', icon: FileText },
        secondary: { label: 'Pay', route: '/(admin)/pay-status', icon: DollarSign },
    },
    '(profile)': {
        primary: { label: 'Preferences', route: '/(profile)/preferences', icon: Settings },
        secondary: { label: 'Surveys', route: '/(profile)/surveys', icon: ClipboardList },
    },
};

export default function GlobalTabBar() {
    const router = useRouter();
    const segments = useSegments();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Current Spoke (root segment)
    const currentSpoke = segments[0] as string; // e.g., '(assignment)', '(hub)'

    // Hide on Sign In
    if (currentSpoke === 'sign-in') return null;

    // Configuration for the current spoke (fallback to null implies we are in Hub or unknown)
    const config = SPOKE_CONFIG[currentSpoke];

    // Colors
    const isDark = colorScheme === 'dark';
    const activeColor = isDark ? '#FFFFFF' : '#0F172A'; // White vs Slate-900
    const inactiveColor = isDark ? '#64748B' : '#94A3B8'; // Slate-500 vs Slate-400
    // const activeBg = isDark ? '#1E293B' : '#F1F5F9'; // Slate-800 vs Slate-100 (Not used directly, but good for ref)

    // Helper to render a tab item
    const renderTab = (
        label: string,
        route: string,
        Icon: any,
        isActiveOverride?: boolean
    ) => {
        // Check if this route is currently active
        // Simple logic: Does the current pathname start with this route?
        // Exception: For Home, we want exact match or just being in (hub) root
        const isActive = isActiveOverride !== undefined
            ? isActiveOverride
            : (
                // 1. Exact match (ignoring groups if needed, but router.push uses groups)
                pathname === route ||
                // 2. Pathname includes route (but we need to strip groups from route to match pathname)
                pathname.includes(route.replace(/\/\([^)]+\)/g, '')) ||
                // 3. Special handling for Home/Hub root
                (route === '/(hub)' && currentSpoke === '(hub)' && !pathname.includes('inbox'))
            );

        const color = isActive ? activeColor : inactiveColor;

        return (
            <Pressable
                onPress={() => router.push(route as any)}
                className={`flex-1 items-center justify-center gap-1 h-full ${isActive ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
            >
                <Icon
                    size={24}
                    color={color}
                    strokeWidth={isActive ? 2.5 : 2}
                />
                <Text style={{ color, fontSize: 10, fontWeight: isActive ? '600' : '400' }}>
                    {label}
                </Text>
            </Pressable>
        );
    };

    return (
        <View
            style={{
                paddingBottom: insets.bottom,
                height: 60 + insets.bottom, // Standard height + safe area
                ...styles.shadow
            }}
            className="flex-row bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
        >
            {/* 1. HOME (Fixed) */}
            {renderTab('Home', '/(hub)', Home, currentSpoke === '(hub)' && !pathname.includes('inbox'))}

            {/* 2. SPOKE PRIMARY (Dynamic) */}
            {config ? (
                renderTab(config.primary.label, config.primary.route, config.primary.icon)
            ) : (
                <View className="flex-1" /> // Placeholder to maintain spacing in Hub
            )}

            {/* 3. INBOX (Fixed - Center) */}
            {renderTab('Inbox', '/inbox', Inbox, pathname.includes('/inbox'))}

            {/* 4. SPOKE SECONDARY (Dynamic) */}
            {config ? (
                renderTab(config.secondary.label, config.secondary.route, config.secondary.icon)
            ) : (
                <View className="flex-1" /> // Placeholder
            )}

            {/* 5. PROFILE (Fixed - User Menu) */}
            <Pressable
                onPress={() => useUIStore.getState().openAccountDrawer()}
                className="flex-1 items-center justify-center gap-1 h-full"
            >
                <UserCircle size={24} color={inactiveColor} />
                <Text style={{ color: inactiveColor, fontSize: 10 }}>Profile</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    shadow: getShadow({
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 5,
    })
});
