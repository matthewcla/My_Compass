import { DrawerMenuContent } from '@/components/navigation/DrawerMenuContent';
import { useScrollContextSafe } from '@/components/navigation/ScrollControlContext';
import { BottomSheetState, useBottomSheetStore } from '@/store/useBottomSheetStore';
import { Ionicons } from '@expo/vector-icons';

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler, Keyboard, Platform, Pressable, StyleSheet, Text, TouchableOpacity, useColorScheme, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    FadeIn,
    FadeOut,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Premium Apple-style spring physics
const SPRING_CONFIG = {
    damping: 24,
    mass: 0.6,
    stiffness: 250,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 2,
};

const TAB_CONFIG = [
    { route: '/(hub)', iconUnselected: 'home-outline', iconSelected: 'home', label: 'Home' },
    { route: '/(admin)', iconUnselected: 'briefcase-outline', iconSelected: 'briefcase', label: 'Admin' },
    { route: '/calendar', iconUnselected: 'calendar-clear-outline', iconSelected: 'calendar-clear', label: 'Calendar' },
    { route: '/inbox', iconUnselected: 'mail-outline', iconSelected: 'mail', label: 'Inbox' },
    { route: '/(tabs)/(profile)', iconUnselected: 'person-circle-outline', iconSelected: 'person-circle', label: 'Me' },
] as const;

const MemoizedTabItem = React.memo(({
    tab,
    isActive,
    isDark,
    onPress
}: {
    tab: typeof TAB_CONFIG[number];
    isActive: boolean;
    isDark: boolean;
    onPress: (route: string) => void;
}) => {
    // Premium Naval Glass Cockpit palette
    const inactiveColor = isDark ? '#64748B' : '#64748B'; // Deepen inactive dark mode contrast
    const activeSolidHex = isDark ? '#FFFFFF' : '#0F172A';

    // In light mode, a solid bright white background prevents shadow bleed and pops.
    // In dark mode, we use a stronger translucent white to ensure it doesn't look dark against the blur map.
    const activeBgRgba = isDark ? 'rgba(255, 255, 255, 0.35)' : '#FFFFFF';
    const activeBorderRgba = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.05)';

    const iconName = isActive ? tab.iconSelected : tab.iconUnselected;

    return (
        <TouchableOpacity
            style={[
                {
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 54,
                    borderRadius: 16,
                },
                isActive ? {
                    flexDirection: 'row',
                    flex: 1.8,
                    backgroundColor: activeBgRgba,
                    borderColor: activeBorderRgba,
                    borderWidth: 1,
                    borderRadius: 14,
                    height: 44,
                    marginHorizontal: 4,
                    // Note: No shadow/elevation on translucent backgrounds to prevent dark bleed-through underneath
                    ...(isDark ? {} : {
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2
                    })
                } : {
                    flex: 1
                }
            ]}
            onPress={() => onPress(tab.route)}
        >
            <Ionicons name={iconName as any} size={isActive ? 22 : 24} color={isActive ? activeSolidHex : inactiveColor} />
            {isActive ? (
                <Text style={[styles.tabLabel, { color: activeSolidHex, fontWeight: '800', marginLeft: 6, marginTop: 0 }]}>
                    {tab.label}
                </Text>
            ) : (
                <Text style={[styles.tabLabel, { color: inactiveColor, fontWeight: '600', opacity: 0.8, textAlign: 'center' }]}>
                    {tab.label}
                </Text>
            )}
        </TouchableOpacity>
    );
});

export default function ExpandableBottomDrawer() {
    const insets = useSafeAreaInsets();
    const isDark = useColorScheme() === 'dark';
    const { height: SCREEN_HEIGHT } = useWindowDimensions();
    const { sheetState, setSheetState, setTabBarHeight } = useBottomSheetStore();

    // Android Hardware Back Button Interception
    useEffect(() => {
        const onBackPress = () => {
            if (sheetState === 1) {
                setSheetState(0); // Step down from Full to Collapsed
                return true; // Prevent default router pop
            }
            return false; // Let the router handle it if we are already collapsed
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
    }, [sheetState, setSheetState]);

    const router = useRouter();
    const pathname = usePathname();
    const segments = useSegments();

    const handleTabPress = React.useCallback((route: string) => {
        setSheetState(0);
        // Defer routing to the end of the event loop. 
        // This ensures the JS thread clears the tap's visual release (TouchableOpacity opacity) 
        // and gives the UI thread a pristine frame to begin the sheet closing animation (if open) 
        // before locking up to render the new screen.
        setTimeout(() => {
            router.push(route as any);
        }, 0);
    }, [setSheetState, router]);

    // Tap into the global scroll control for CollapsibleScaffold background lists
    const scrollContext = useScrollContextSafe();

    // --- Mathematical Constants for the Pill Morph Engine ---
    const HEIGHT_COLLAPSED = 90;
    // Base floating margin dynamically scaled if standard insets (like Home Indicator) are present
    const COLLAPSED_BOTTOM_MARGIN = insets.bottom > 0 ? insets.bottom : 16;
    const RESTING_TOP_OFFSET_FROM_BOTTOM = HEIGHT_COLLAPSED + COLLAPSED_BOTTOM_MARGIN;
    const isHidden = pathname?.includes('/discovery') || pathname?.includes('/manifest') || pathname?.includes('/cycle');

    // Report global space used so the scaffold clears the resting pill correctly
    useEffect(() => {
        if (isHidden) {
            setTabBarHeight(0);
        } else {
            setTabBarHeight(RESTING_TOP_OFFSET_FROM_BOTTOM);
        }
    }, [RESTING_TOP_OFFSET_FROM_BOTTOM, isHidden, setTabBarHeight]);

    // Extended Drawer Heights (50% Viewport Constraint)
    const HEIGHT_FULL = SCREEN_HEIGHT * 0.5;

    const activeState = useSharedValue<BottomSheetState>(sheetState);
    const translateY = useSharedValue(0);
    const contextStartY = useSharedValue(0);

    useEffect(() => {
        if (isHidden) {
            if (sheetState !== 0) {
                setSheetState(0);
            }

            activeState.value = 0;
            translateY.value = 0;
            scrollContext?.resetBar();
            return;
        }

        scrollContext?.resetBar();
    }, [isHidden, activeState, translateY, sheetState, setSheetState, scrollContext]);

    // Sync global JS state -> local shared UI values
    useEffect(() => {
        if (activeState.value !== sheetState) {
            activeState.value = sheetState;
            const targetY = sheetState === 1
                ? -HEIGHT_FULL + RESTING_TOP_OFFSET_FROM_BOTTOM
                : 0;
            translateY.value = withSpring(targetY, SPRING_CONFIG);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sheetState]);

    const panGesture = Gesture.Pan()
        .activeOffsetY([-10, 10])
        .failOffsetX([-24, 24])
        .onStart(() => {
            contextStartY.value = translateY.value;
        })
        .onUpdate((event) => {
            let nextY = contextStartY.value + event.translationY;

            // Maximum upper bound (Full Height translation)
            const maxBound = -HEIGHT_FULL + RESTING_TOP_OFFSET_FROM_BOTTOM;
            // Maximum lower bound (Collapsed translation)
            const minBound = 0;

            // Rubber-banding resistance
            if (nextY < maxBound) {
                const overdrag = nextY - maxBound;
                nextY = maxBound + (overdrag * 0.2); // 80% resistance going up
            } else if (nextY > minBound) {
                const overdrag = nextY - minBound;
                nextY = minBound + (overdrag * 0.2); // 80% resistance pulling down
            }

            translateY.value = nextY;
        })
        .onEnd((event) => {
            const currentY = translateY.value;
            const velocity = event.velocityY;

            const SNAP_COLLAPSED = 0;
            const SNAP_FULL = -HEIGHT_FULL + RESTING_TOP_OFFSET_FROM_BOTTOM;

            // Project landing spot based on velocity
            const projectedY = currentY + (velocity * 0.2);

            let targetY = SNAP_COLLAPSED;
            let nextState: BottomSheetState = 0;

            if (projectedY < (SNAP_COLLAPSED + SNAP_FULL) / 2) {
                targetY = SNAP_FULL;
                nextState = 1;
            } else {
                targetY = SNAP_COLLAPSED;
                nextState = 0;
            }

            translateY.value = withSpring(targetY, SPRING_CONFIG);
            activeState.value = nextState;

            runOnJS(setSheetState)(nextState);
        });

    // GPU-Accelerated Core Translation Container (the "Ghost Box")
    const animatedContainerStyle = useAnimatedStyle(() => {
        // Only apply the background scroll offset when the drawer is in the resting "pill" state.
        // We fade the scroll effect out using the morphProgress interpolation.

        let scrollOffset = 0;
        if (scrollContext?.translateY && scrollContext?.tabBarMaxHeight) {
            // How much space we need to push the pill completely off the bottom edge (plus 20px for shadow clearance)
            const targetDrop = RESTING_TOP_OFFSET_FROM_BOTTOM + 20;
            const maxScroll = Math.max(scrollContext.tabBarMaxHeight.value, 1);

            // Mathematically map the global scroll 0->max to 0->targetDrop
            scrollOffset = interpolate(
                scrollContext.translateY.value,
                [0, maxScroll],
                [0, targetDrop],
                Extrapolation.CLAMP
            );
        }

        const progressLock = interpolate(translateY.value, [0, -65], [1, 0], Extrapolation.CLAMP);

        return {
            transform: [{ translateY: translateY.value + (scrollOffset * progressLock) }],
        };
    });

    // The Glass Morphing Engine (Transforms shape from Pill to Drawer)
    const glassStyle = useAnimatedStyle(() => {
        // morphProgress: 0 (Floating Pill) -> 1 (Docked Drawer)
        // Transition fully within the first 65px of drag
        const morphProgress = interpolate(translateY.value, [0, -65], [0, 1], Extrapolation.CLAMP);

        // Floating Island Metaphor: Maintain margins and bottom inset so it never gets clipped by device bezels
        const marginH = 16;
        const bottomRadius = 40;
        const topRadius = 40;

        // Keep the bottom edge precisely hovering above the home indicator safe area
        const stretchDownHeight = HEIGHT_COLLAPSED - translateY.value;
        const mappedHeight = interpolate(morphProgress, [0, 1], [HEIGHT_COLLAPSED, stretchDownHeight]);

        return {
            left: marginH,
            right: marginH,
            height: mappedHeight,
            borderTopLeftRadius: topRadius,
            borderTopRightRadius: topRadius,
            borderBottomLeftRadius: bottomRadius,
            borderBottomRightRadius: bottomRadius,
        };
    });

    // Content Opacity Triggers
    const pillContentStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateY.value, [0, -40], [1, 0], Extrapolation.CLAMP),
    }));

    const drawerContentStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateY.value, [-40, -80], [0, 1], Extrapolation.CLAMP),
    }));


    // Static border radii — no animated interpolation needed (P0 fix: eliminates wasted worklet mapper)

    if (isHidden) {
        return null;
    }

    return (
        <View
            style={[
                styles.masterContainer,
                { top: SCREEN_HEIGHT - RESTING_TOP_OFFSET_FROM_BOTTOM, height: HEIGHT_FULL },
            ]}
            pointerEvents="box-none"
        >
            {/* Background Tap Dismissal overlay when Expanded */}
            {sheetState === 1 && (
                <Pressable
                    onPress={() => {
                        Keyboard.dismiss();
                        setSheetState(0);
                    }}
                    style={{ position: 'absolute', top: -SCREEN_HEIGHT, bottom: 0, left: 0, right: 0 }}
                />
            )}

            <Animated.View style={[styles.translateContainer, animatedContainerStyle]} pointerEvents="box-none">

                {/* Progressive Gradient Footer (Fallback for MaskedView native module crash) */}
                <Animated.View
                    style={[
                        { position: 'absolute', top: -10, left: 0, right: 0, height: 250 },
                        pillContentStyle
                    ]}
                    pointerEvents="none"
                >
                    <LinearGradient
                        colors={[
                            'transparent',
                            isDark ? 'rgba(2, 6, 23, 0.8)' : 'rgba(248, 250, 252, 0.8)',
                            isDark ? 'rgba(2, 6, 23, 1)' : 'rgba(248, 250, 252, 1)'
                        ]}
                        locations={[0, 0.6, 1]}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>

                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        style={[
                            styles.glassShape,
                            glassStyle,
                            {
                                shadowColor: isDark ? '#000000' : '#1e293b',
                                borderColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)',
                            }
                        ]}
                    >
                        <BlurView
                            tint={isDark ? 'dark' : 'light'}
                            intensity={Platform.OS === 'android'
                                ? (isDark ? 30 : 35)
                                : (isDark ? 80 : 80)
                            }
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    backgroundColor: isDark
                                        ? (Platform.OS === 'android' ? 'rgba(15, 23, 42, 0.75)' : 'rgba(15, 23, 42, 0.45)')
                                        : (Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.82)' : 'rgba(255, 255, 255, 0.5)')
                                }
                            ]}
                        />

                        {/* Interior Border Overlay: Inset by 1px to escape overflow clipping */}
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    top: 1, left: 1, right: 1, bottom: 1,
                                    borderWidth: 1,
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.6)',
                                },
                                // Replicate radii internally so the stroke honors the corners
                                styles.innerBorder
                            ]}
                        />


                        {/* --- STATE 0: THE FLOATING PILL NAV --- */}
                        <Animated.View
                            style={[StyleSheet.absoluteFill, styles.pillContents, pillContentStyle]}
                            pointerEvents={sheetState === 0 ? 'auto' : 'none'}
                        >

                            {/* Visual Drag Indicator inside the Pill */}
                            <View style={styles.pillGrabberContainer}>
                                <View style={[
                                    styles.grabber,
                                    {
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                                        width: 36,
                                        height: 4,
                                        marginTop: 10
                                    }
                                ]} />
                            </View>

                            <View style={styles.pillIconRow}>
                                {TAB_CONFIG.map((tab) => {
                                    const segs = segments as string[];
                                    const isActive =
                                        pathname === tab.route ||
                                        (tab.route === '/(admin)' && segs.includes('(admin)')) ||
                                        (tab.route === '/(hub)' && (pathname === '/' || pathname === '/(hub)' || segs.includes('(hub)')) && !segs.includes('(profile)') && !segs.includes('(calendar)') && !segs.includes('inbox') && !segs.includes('(admin)')) ||
                                        (tab.route === '/calendar' && (pathname === '/calendar' || segs.includes('(calendar)'))) ||
                                        (tab.route === '/inbox' && (pathname === '/inbox' || segs.includes('inbox'))) ||
                                        (tab.route === '/(tabs)/(profile)' && segs.includes('(profile)'));

                                    return (
                                        <MemoizedTabItem
                                            key={tab.route}
                                            tab={tab}
                                            isActive={isActive}
                                            isDark={isDark}
                                            onPress={handleTabPress}
                                        />
                                    );
                                })}
                            </View>
                        </Animated.View>

                        {/* --- STATE 1 & 2: THE EXPANDED DRAWER --- */}
                        <Animated.View
                            style={[StyleSheet.absoluteFill, styles.drawerContents, drawerContentStyle]}
                            pointerEvents={sheetState === 1 ? 'auto' : 'none'}
                        >
                            <TouchableOpacity
                                style={{ width: '100%', alignItems: 'center', paddingVertical: 10 }}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    setSheetState(0);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.grabber, { backgroundColor: isDark ? '#636366' : '#C7C7CC', marginTop: 0 }]} />
                            </TouchableOpacity>

                            <Animated.View style={[{ flex: 1, width: '100%', alignItems: 'center' }]}>
                                <Animated.View
                                    entering={FadeIn.duration(200)}
                                    exiting={FadeOut.duration(200)}
                                    style={{ flex: 1, width: '100%', marginTop: 16 }}
                                >
                                    <DrawerMenuContent />
                                </Animated.View>
                            </Animated.View>
                        </Animated.View>

                    </Animated.View>
                </GestureDetector>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    masterContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 9999,
    },
    translateContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    glassShape: {
        position: 'absolute',
        top: 0, // Anchored to the top of translateContainer, expands downwards
        overflow: 'hidden',
        borderWidth: 1,

        // Deep shadow for isolation
        elevation: 20,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
    },
    pillContents: {
        width: '100%',
        height: '100%',
    },
    pillGrabberContainer: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 2,
    },
    pillIconRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        paddingHorizontal: 8,
    },
    tabItem: {
        // Obsolete (absorbed dynamically in component logic)
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    innerBorder: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.1)',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    drawerContents: {
        alignItems: 'center',
    },
    grabber: {
        width: 36,
        height: 5,
        borderRadius: 2.5,
        marginTop: 10,
    },
    searchBar: {
        width: '100%',
        height: 54,
        borderRadius: 27,
        paddingHorizontal: 20,
        fontSize: 16,
    }
});
