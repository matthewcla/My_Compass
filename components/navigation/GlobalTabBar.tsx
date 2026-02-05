import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUIStore } from '@/store/useUIStore';
import { getShadow } from '@/utils/getShadow';
import { usePathname, useRouter, useSegments } from 'expo-router';
import {
    Calendar as CalendarIcon,
    ClipboardList,
    Compass,
    FileText,
    Home,
    Inbox,
    LayoutGrid,
    Map as MapIcon,
    Settings,
    Shield,
    Target
} from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SpokeConfig = {
    primary: { label: string; route: string; icon: any };
    secondary: { label: string; route: string; icon: any };
};

const SPOKE_CONFIG: Record<string, SpokeConfig> = {

    '(career)': {
        primary: { label: 'Discover', route: '/(career)/discovery', icon: Compass },
        secondary: { label: 'Assignment', route: '/(assignment)', icon: Target },
    },
    '(pcs)': {
        primary: { label: 'Orders', route: '/(pcs)/orders', icon: FileText },
        secondary: { label: 'Move', route: '/(pcs)/move', icon: MapIcon },
    },
    '(admin)': {
        primary: { label: 'Leave', route: '/(admin)/requests', icon: FileText },
        secondary: { label: 'Admin', route: '/(admin)/pay-status', icon: Shield },
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

    // Access store for persistent context
    const { activeSpoke, setActiveSpoke } = useUIStore();

    // Effect to update activeSpoke based on navigation
    React.useEffect(() => {
        // Known spokes list
        const KNOWN_SPOKES = ['(assignment)', '(pcs)', '(admin)', '(profile)', '(career)', '(calendar)'];

        if (KNOWN_SPOKES.includes(currentSpoke)) {
            // If we are in a known spoke, update the store
            setActiveSpoke(currentSpoke);
        } else if (currentSpoke === '(hub)') {
            // If we are in the hub, reset the store
            setActiveSpoke(null);
        } else if (currentSpoke === 'leave') {
            // Special case: Leave screen belongs to Admin context
            setActiveSpoke('(admin)');
        }
        // If 'inbox' or other generic routes, do nothing (keep last active spoke)
    }, [currentSpoke, setActiveSpoke]);

    // Hide logic
    const lastSegment = segments[segments.length - 1];
    const isHidden =
        currentSpoke === 'sign-in' ||
        currentSpoke === 'leave' || // Hide on Leave Wizard
        lastSegment === 'discovery' || // Hide on Discovery
        lastSegment === 'cycle' ||
        lastSegment === 'MenuHubModal' ||
        (segments as string[]).includes('MenuHubModal'); // Redundant but safe

    if (isHidden) return null;

    // Determine target spoke for configuration:
    // 1. If we are in a known spoke, use it.
    // 2. If we are in a generic route (like inbox), use the persistent activeSpoke from store.
    // 3. Fallback to null (Hub)
    const targetSpoke = SPOKE_CONFIG[currentSpoke]
        ? currentSpoke
        : (activeSpoke && SPOKE_CONFIG[activeSpoke] ? activeSpoke : null);

    // Configuration for the target spoke
    const config = targetSpoke ? SPOKE_CONFIG[targetSpoke] : null;

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
        const isHubMode = !config;

        return (
            <Pressable
                onPress={() => router.push(route as any)}
                className={`${isHubMode ? 'w-24' : 'flex-1'} items-center justify-center gap-1 h-full ${isActive ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
            >
                <Icon
                    size={24}
                    color={color}
                    strokeWidth={isActive ? 2.5 : 2}
                />
                <Text style={{ color, fontSize: 11, fontWeight: isActive ? '600' : '400' }}>
                    {label}
                </Text>
            </Pressable>
        );
    };

    const isHubMode = !config;
    const HEIGHT = Platform.select({ web: 60, default: 56 });

    return (
        <View
            style={{
                paddingBottom: insets.bottom,
                height: HEIGHT + insets.bottom,
                ...getShadow({
                    shadowColor: "#000",
                    shadowOffset: {
                        width: 0,
                        height: -2,
                    },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 5,
                })
            }}
            className={`flex-row w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 ${isHubMode ? 'justify-around' : ''}`}
        >
            {/* 1. HOME (Fixed) */}
            {renderTab('Home', '/(hub)', Home, currentSpoke === '(hub)' && !pathname.includes('inbox') && !pathname.includes('menu'))}

            {/* 2. CALENDAR (Generic) */}
            {renderTab('Calendar', '/calendar', CalendarIcon, pathname.includes('/calendar'))}

            {/* 3. SPOKE PRIMARY (Dynamic) */}
            {config && renderTab(config.primary.label, config.primary.route, config.primary.icon)}

            {/* 4. INBOX (Fixed - Center) */}
            {renderTab('Inbox', '/inbox', Inbox, pathname.includes('/inbox'))}

            {/* 5. SPOKE SECONDARY (Dynamic) */}
            {config && renderTab(config.secondary.label, config.secondary.route, config.secondary.icon)}

            {/* 6. MENU (Fixed - User Menu) */}
            {/* 6. MENU (Fixed - User Menu) */}
            {renderTab('Menu', '/menu', LayoutGrid, pathname.includes('menu'))}
        </View>
    );
}
