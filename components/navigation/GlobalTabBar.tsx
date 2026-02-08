import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUIStore } from '@/store/useUIStore';
import { getShadow } from '@/utils/getShadow';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter, useSegments } from 'expo-router';
import {
    ClipboardList,
    Compass,
    FileText,
    LayoutGrid,
    Map as MapIcon,
    Settings,
    Shield,
    Target
} from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type GlobalTabRoute = 'home' | 'calendar' | 'inbox';

type GlobalTabBarProps = {
    activeRoute: GlobalTabRoute;
};

type TabItem = {
    route: GlobalTabRoute;
    label: string;
    href: '/(hub)' | '/calendar' | '/inbox';
    solidIcon: React.ComponentProps<typeof Ionicons>['name'];
    outlineIcon: React.ComponentProps<typeof Ionicons>['name'];
};

const TABS: TabItem[] = [
    {
        route: 'home',
        label: 'Home',
        href: '/(hub)',
        solidIcon: 'home',
        outlineIcon: 'home-outline',
    },
    {
        route: 'calendar',
        label: 'Calendar',
        href: '/calendar',
        solidIcon: 'calendar',
        outlineIcon: 'calendar-outline',
    },
    {
        route: 'inbox',
        label: 'Inbox',
        href: '/inbox',
        solidIcon: 'mail',
        outlineIcon: 'mail-outline',
    },
];

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

export default function GlobalTabBar({ activeRoute }: GlobalTabBarProps) {
    const router = useRouter();
    const segments = useSegments();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const currentSpoke = segments[0] as string;
    const { activeSpoke, setActiveSpoke } = useUIStore();

    React.useEffect(() => {
        const KNOWN_SPOKES = ['(assignment)', '(pcs)', '(admin)', '(profile)', '(career)', '(calendar)'];

        if (KNOWN_SPOKES.includes(currentSpoke)) {
            setActiveSpoke(currentSpoke);
        } else if (currentSpoke === '(hub)') {
            setActiveSpoke(null);
        } else if (currentSpoke === 'leave') {
            setActiveSpoke('(admin)');
        }
    }, [currentSpoke, setActiveSpoke]);

    const lastSegment = segments[segments.length - 1];
    const isHidden =
        currentSpoke === 'sign-in' ||
        currentSpoke === 'leave' ||
        lastSegment === 'discovery' ||
        lastSegment === 'cycle' ||
        lastSegment === 'MenuHubModal' ||
        (segments as string[]).includes('MenuHubModal');

    if (isHidden) return null;

    const targetSpoke = SPOKE_CONFIG[currentSpoke]
        ? currentSpoke
        : (activeSpoke && SPOKE_CONFIG[activeSpoke] ? activeSpoke : null);
    const config = targetSpoke ? SPOKE_CONFIG[targetSpoke] : null;
    const isHubMode = !config;
    const isDark = colorScheme === 'dark';

    const primaryColor = colors.tint;
    const inactiveColor = colorScheme === 'dark' ? '#64748B' : '#9CA3AF';
    const dynamicActiveColor = isDark ? '#FFFFFF' : '#0F172A';
    const dynamicInactiveColor = isDark ? '#64748B' : '#94A3B8';
    const HEIGHT = Platform.select({ web: 60, default: 49 });

    const renderFixedTab = (item: TabItem) => {
        const isActive =
            item.route === 'home'
                ? activeRoute === 'home' && currentSpoke === '(hub)' && !pathname.includes('inbox') && !pathname.includes('menu')
                : activeRoute === item.route;

        const iconName = isActive ? item.solidIcon : item.outlineIcon;
        const iconColor = isActive ? primaryColor : inactiveColor;

        return (
            <Pressable
                key={item.route}
                onPress={() => router.push(item.href as any)}
                className={`${isHubMode ? 'w-24' : 'flex-1'} h-full items-center justify-center gap-1 ${isActive ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
            >
                <Ionicons name={iconName} size={22} color={iconColor} />
                <Text style={{ color: iconColor, fontSize: 11, fontWeight: isActive ? '600' : '400' }}>
                    {item.label}
                </Text>
            </Pressable>
        );
    };

    const renderDynamicTab = (
        label: string,
        route: string,
        Icon: any,
        isActiveOverride?: boolean
    ) => {
        const isActive = isActiveOverride !== undefined
            ? isActiveOverride
            : (
                pathname === route ||
                pathname.includes(route.replace(/\/\([^)]+\)/g, ''))
            );

        const color = isActive ? dynamicActiveColor : dynamicInactiveColor;

        return (
            <Pressable
                key={route}
                onPress={() => router.push(route as any)}
                className={`${isHubMode ? 'w-24' : 'flex-1'} items-center justify-center gap-1 h-full ${isActive ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
            >
                <Icon size={24} color={color} strokeWidth={isActive ? 2.5 : 2} />
                <Text style={{ color, fontSize: 11, fontWeight: isActive ? '600' : '400' }}>
                    {label}
                </Text>
            </Pressable>
        );
    };

    return (
        <View
            style={{
                paddingBottom: insets.bottom,
                height: HEIGHT + insets.bottom,
                ...getShadow({
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 5,
                }),
            }}
            className={`flex-row w-full border-t border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 ${isHubMode ? 'justify-around' : ''}`}
        >
            {renderFixedTab(TABS[0])}
            {renderFixedTab(TABS[1])}
            {config && renderDynamicTab(config.primary.label, config.primary.route, config.primary.icon)}
            {renderFixedTab(TABS[2])}
            {config && renderDynamicTab(config.secondary.label, config.secondary.route, config.secondary.icon)}
            {renderDynamicTab('Menu', '/menu', LayoutGrid, pathname.includes('menu'))}
        </View>
    );
}
