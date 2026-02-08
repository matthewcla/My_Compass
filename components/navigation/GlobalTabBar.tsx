import { useScrollContext } from '@/components/navigation/ScrollControlContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUIStore } from '@/store/useUIStore';
import { getShadow } from '@/utils/getShadow';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { usePathname, useRouter, useSegments } from 'expo-router';
import {
    ClipboardList,
    Compass,
    FileText,
    LayoutGrid,
    Map as MapIcon,
    Settings,
    Shield,
    Target,
} from 'lucide-react-native';
import React from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type GlobalTabRoute = 'home' | 'calendar' | 'inbox';

type GlobalTabBarProps = {
    activeRoute: GlobalTabRoute;
    useBlur?: boolean;
};

type TabItem = {
    route: GlobalTabRoute;
    label: string;
    href: '/(hub)' | '/calendar' | '/inbox';
    solidIcon: React.ComponentProps<typeof Ionicons>['name'];
    outlineIcon: React.ComponentProps<typeof Ionicons>['name'];
};

type LucideIcon = React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
}>;

type SpokeConfig = {
    primary: { label: string; route: string; icon: LucideIcon };
    secondary: { label: string; route: string; icon: LucideIcon };
};

type TabDescriptor = {
    key: string;
    label: string;
    href: string;
    isActive: boolean;
    activeColor: string;
    inactiveColor: string;
    icon:
    | {
        kind: 'ion';
        name: React.ComponentProps<typeof Ionicons>['name'];
        size: number;
    }
    | {
        kind: 'lucide';
        Component: LucideIcon;
        size: number;
        activeStrokeWidth: number;
        inactiveStrokeWidth: number;
    };
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

const BAR_HEIGHT = Platform.select({ web: 60, default: 56 });
const PILL_HORIZONTAL_INSET = 6;
const PILL_VERTICAL_INSET = 6;

type AnimatedTabButtonProps = {
    item: TabDescriptor;
    onPress: (item: TabDescriptor) => void;
};

const AnimatedTabButton = React.memo(function AnimatedTabButton({
    item,
    onPress,
}: AnimatedTabButtonProps) {
    const iconScale = useSharedValue(1);

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    const handlePress = React.useCallback(() => {
        iconScale.value = withSequence(
            withTiming(0.9, { duration: 80 }),
            withSpring(1, { damping: 15, stiffness: 260, mass: 0.35 })
        );
        onPress(item);
    }, [iconScale, item, onPress]);

    const iconColor = item.isActive ? item.activeColor : item.inactiveColor;

    return (
        <Pressable
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityState={{ selected: item.isActive }}
            style={styles.tabButton}
        >
            <Animated.View style={iconStyle}>
                {item.icon.kind === 'ion' ? (
                    <Ionicons name={item.icon.name} size={item.icon.size} color={iconColor} />
                ) : (
                    <item.icon.Component
                        size={item.icon.size}
                        color={iconColor}
                        strokeWidth={item.isActive ? item.icon.activeStrokeWidth : item.icon.inactiveStrokeWidth}
                    />
                )}
            </Animated.View>
            <Text style={[styles.tabLabel, { color: iconColor, fontWeight: item.isActive ? '600' : '500' }]}>
                {item.label}
            </Text>
        </Pressable>
    );
});

export function AnimatedGlobalTabBar({ activeRoute, useBlur = Platform.OS === 'ios' }: GlobalTabBarProps) {
    const router = useRouter();
    const segments = useSegments();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { translateY, resetBar, setTabBarMetrics } = useScrollContext();

    const [barWidth, setBarWidth] = React.useState(0);
    const pillTranslateX = useSharedValue(0);

    const currentSpoke = (segments[0] === '(tabs)' ? segments[1] : segments[0]) as string;
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

    const targetSpoke = SPOKE_CONFIG[currentSpoke]
        ? currentSpoke
        : activeSpoke && SPOKE_CONFIG[activeSpoke]
            ? activeSpoke
            : null;
    const config = targetSpoke ? SPOKE_CONFIG[targetSpoke] : null;
    const isDark = colorScheme === 'dark';
    const shouldUseBlur = useBlur && Platform.OS !== 'web';


    const fixedActiveColor = colors.tint;
    const fixedInactiveColor = isDark ? '#64748B' : '#9CA3AF';
    const dynamicActiveColor = isDark ? '#FFFFFF' : '#0F172A';
    const dynamicInactiveColor = isDark ? '#64748B' : '#94A3B8';

    const buildFixedTab = React.useCallback(
        (item: TabItem): TabDescriptor => {
            const isActive =
                item.route === 'home'
                    ? activeRoute === 'home' &&
                    currentSpoke === '(hub)' &&
                    !pathname.includes('inbox') &&
                    !pathname.includes('menu')
                    : activeRoute === item.route;

            return {
                key: item.route,
                label: item.label,
                href: item.href,
                isActive,
                activeColor: fixedActiveColor,
                inactiveColor: fixedInactiveColor,
                icon: {
                    kind: 'ion',
                    name: isActive ? item.solidIcon : item.outlineIcon,
                    size: 22,
                },
            };
        },
        [activeRoute, currentSpoke, fixedActiveColor, fixedInactiveColor, pathname]
    );

    const buildDynamicTab = React.useCallback(
        (label: string, route: string, Icon: LucideIcon, isActiveOverride?: boolean): TabDescriptor => {
            const isActive =
                isActiveOverride !== undefined
                    ? isActiveOverride
                    : pathname === route || pathname.includes(route.replace(/\/\([^)]+\)/g, ''));

            return {
                key: route,
                label,
                href: route,
                isActive,
                activeColor: dynamicActiveColor,
                inactiveColor: dynamicInactiveColor,
                icon: {
                    kind: 'lucide',
                    Component: Icon,
                    size: 22,
                    activeStrokeWidth: 2.5,
                    inactiveStrokeWidth: 2,
                },
            };
        },
        [dynamicActiveColor, dynamicInactiveColor, pathname]
    );

    const tabItems = React.useMemo(() => {
        const nextTabs: TabDescriptor[] = [];
        nextTabs.push(buildFixedTab(TABS[0]));
        nextTabs.push(buildFixedTab(TABS[1]));

        if (config) {
            nextTabs.push(buildDynamicTab(config.primary.label, config.primary.route, config.primary.icon));
        }

        nextTabs.push(buildFixedTab(TABS[2]));

        if (config) {
            nextTabs.push(buildDynamicTab(config.secondary.label, config.secondary.route, config.secondary.icon));
        }

        nextTabs.push(buildDynamicTab('Menu', '/menu', LayoutGrid, pathname.includes('menu')));
        return nextTabs;
    }, [buildDynamicTab, buildFixedTab, config, pathname]);

    const activeIndex = React.useMemo(
        () => tabItems.findIndex((item) => item.isActive),
        [tabItems]
    );

    const tabWidth = tabItems.length > 0 ? barWidth / tabItems.length : 0;
    const pillWidth = Math.max(tabWidth - PILL_HORIZONTAL_INSET * 2, 0);
    const hasActiveTab = activeIndex >= 0 && tabWidth > 0;

    React.useEffect(() => {
        if (tabWidth <= 0) {
            return;
        }

        const clampedIndex = Math.max(activeIndex, 0);
        pillTranslateX.value = withSpring(clampedIndex * tabWidth + PILL_HORIZONTAL_INSET, {
            damping: 20,
            stiffness: 240,
            mass: 0.55,
        });
    }, [activeIndex, pillTranslateX, tabWidth]);

    // Ensure bar is visible when switching tabs
    React.useEffect(() => {
        resetBar();
    }, [activeIndex, resetBar]);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const pillStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: pillTranslateX.value }],
        opacity: hasActiveTab ? 1 : 0,
    }));

    const handleTabPress = React.useCallback(
        (item: TabDescriptor) => {
            void Haptics.selectionAsync().catch(() => undefined);
            resetBar();
            router.push(item.href as any);
        },
        [resetBar, router]
    );

    const handleTabBarLayout = React.useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setBarWidth(width);
        setTabBarMetrics(height, insets.bottom);
    }, [insets.bottom, setTabBarMetrics]);

    if (isHidden) {
        return null;
    }

    return (
        <Animated.View
            pointerEvents="auto"
            style={[
                styles.root,
                containerStyle,
            ]}
        >
            <Animated.View
                style={[
                    styles.shadowContainer,
                    {
                        backgroundColor: 'transparent',
                        ...getShadow({
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: isDark ? 0.3 : 0.1,
                            shadowRadius: 8,
                            elevation: 8,
                        }),
                    }
                ]}
            >
                <View
                    onLayout={handleTabBarLayout}
                    style={[
                        styles.tabBarShell,
                        {
                            height: BAR_HEIGHT + insets.bottom,
                            paddingBottom: insets.bottom,
                            borderColor: isDark ? '#334155' : '#E2E8F0', // Slate-700 : Slate-200
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        },
                    ]}
                >
                    {shouldUseBlur && (
                        <BlurView
                            pointerEvents="none"
                            intensity={35}
                            tint={isDark ? 'dark' : 'light'}
                            style={StyleSheet.absoluteFillObject}
                        />
                    )}

                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.pill,
                            pillStyle,
                            {
                                width: pillWidth,
                                top: PILL_VERTICAL_INSET,
                                height: BAR_HEIGHT - (PILL_VERTICAL_INSET * 2),
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.08)',
                            },
                        ]}
                    />

                    {tabItems.map((item) => (
                        <AnimatedTabButton key={item.key} item={item} onPress={handleTabPress} />
                    ))}
                </View>
            </Animated.View>
        </Animated.View>
    );
}

export default AnimatedGlobalTabBar;

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabBarShell: {
        width: '100%',
        borderTopWidth: 1, // Docked: Top border only
        // borderRadius: 18, // Docked: No radius (or top only if desired, but sticking to flat for now)
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'stretch',
        position: 'relative',
    },
    shadowContainer: {
        width: '100%',
        backgroundColor: 'transparent',
    },
    pill: {
        position: 'absolute',
        top: 0, // Re-align pill if needed? logic uses INSET constants.
        borderRadius: 14, // Keep pill rounded
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        zIndex: 1,
    },
    tabLabel: {
        fontSize: 11,
        letterSpacing: 0.2,
    },
});
