import { DrawerMenuContent } from '@/components/navigation/DrawerMenuContent';
import { useScrollContextSafe } from '@/components/navigation/ScrollControlContext';
import { BottomSheetState, useBottomSheetStore } from '@/store/useBottomSheetStore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { BackHandler, Keyboard, Pressable, StyleSheet, Text, TouchableOpacity, useColorScheme, useWindowDimensions, View } from 'react-native';
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

    // Tap into the global scroll control for CollapsibleScaffold background lists
    const scrollContext = useScrollContextSafe();
    const scrollCollapseY = scrollContext?.translateY;

    // --- Mathematical Constants for the Pill Morph Engine ---
    const HEIGHT_COLLAPSED = 82;
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

    // Sync global JS state -> local shared UI values
    useEffect(() => {
        if (activeState.value !== sheetState) {
            activeState.value = sheetState;
            const targetY = sheetState === 1
                ? -HEIGHT_FULL + RESTING_TOP_OFFSET_FROM_BOTTOM
                : 0;
            translateY.value = withSpring(targetY, SPRING_CONFIG);
        }
    }, [sheetState]);

    const panGesture = Gesture.Pan()
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

        const marginH = interpolate(morphProgress, [0, 1], [16, 0]);
        const bottomRadius = interpolate(morphProgress, [0, 1], [36, 0]);
        const topRadius = 36;

        // Ensure the drawer stretches cleanly to the absolute bottom of the device screen when pulled up
        const stretchDownHeight = HEIGHT_COLLAPSED + COLLAPSED_BOTTOM_MARGIN - translateY.value;
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
        pointerEvents: translateY.value < -40 ? 'none' : 'auto'
    }));

    const drawerContentStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateY.value, [-40, -80], [0, 1], Extrapolation.CLAMP),
        pointerEvents: translateY.value > -40 ? 'none' : 'auto'
    }));


    return (
        <View
            style={[
                styles.masterContainer,
                { top: SCREEN_HEIGHT - RESTING_TOP_OFFSET_FROM_BOTTOM, height: HEIGHT_FULL },
                isHidden ? { display: 'none' } : {}
            ]}
            pointerEvents={isHidden ? "none" : "box-none"}
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

            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.translateContainer, animatedContainerStyle]} pointerEvents="box-none">

                    {/* The Morphing Glass Shape */}
                    <Animated.View
                        style={[
                            styles.glassShape,
                            glassStyle,
                            {
                                shadowColor: isDark ? '#000000' : '#1e293b',
                            }
                        ]}
                    >
                        <BlurView
                            tint={isDark ? 'dark' : 'light'}
                            intensity={isDark ? 80 : 80}
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.5)'
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
                                    borderWidth: StyleSheet.hairlineWidth,
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                                },
                                // Replicate radii internally so the stroke honors the corners
                                useAnimatedStyle(() => {
                                    const morphProgress = interpolate(translateY.value, [0, -65], [0, 1], Extrapolation.CLAMP);
                                    const bottomRadius = interpolate(morphProgress, [0, 1], [36, 0]);
                                    return {
                                        borderTopLeftRadius: 36,
                                        borderTopRightRadius: 36,
                                        borderBottomLeftRadius: bottomRadius,
                                        borderBottomRightRadius: bottomRadius,
                                    };
                                })
                            ]}
                        />


                        {/* --- STATE 0: THE FLOATING PILL NAV --- */}
                        <Animated.View style={[StyleSheet.absoluteFill, styles.pillContents, pillContentStyle]}>

                            {/* Visual Drag Indicator inside the Pill */}
                            <View style={styles.pillGrabberContainer}>
                                <View style={[
                                    styles.grabber,
                                    {
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                                        width: 36,
                                        height: 4,
                                        marginTop: 6
                                    }
                                ]} />
                            </View>

                            <View style={styles.pillIconRow}>
                                {[
                                    { route: '/(hub)', iconUnselected: 'home-outline', iconSelected: 'home', label: 'Home' },
                                    { route: '/(admin)', iconUnselected: 'briefcase-outline', iconSelected: 'briefcase', label: 'Admin' },
                                    { route: '/calendar', iconUnselected: 'calendar-clear-outline', iconSelected: 'calendar-clear', label: 'Calendar' },
                                    { route: '/inbox', iconUnselected: 'mail-outline', iconSelected: 'mail', label: 'Inbox' },
                                    { route: '/(tabs)/(profile)', iconUnselected: 'person-circle-outline', iconSelected: 'person-circle', label: 'Me' },
                                ].map((tab) => {
                                    const segs = segments as string[];
                                    const isActive =
                                        pathname === tab.route ||
                                        (tab.route === '/(admin)' && segs.includes('(admin)')) ||
                                        (tab.route === '/(hub)' && (pathname === '/' || pathname === '/(hub)' || segs.includes('(hub)')) && !segs.includes('(profile)') && !segs.includes('(calendar)') && !segs.includes('inbox') && !segs.includes('(admin)')) ||
                                        (tab.route === '/(tabs)/(profile)' && segs.includes('(profile)'));
                                    const activeColor = isDark ? '#60A5FA' : '#0ea5e9';
                                    const inactiveColor = isDark ? '#94A3B8' : '#64748B';
                                    const iconColor = isActive ? activeColor : inactiveColor;
                                    const iconName = isActive ? tab.iconSelected : tab.iconUnselected;

                                    return (
                                        <TouchableOpacity
                                            key={tab.route}
                                            style={styles.tabItem}
                                            onPress={() => { setSheetState(0); router.push(tab.route as any); }}
                                        >
                                            <Ionicons name={iconName as any} size={24} color={iconColor} />
                                            <Text style={[styles.tabLabel, { color: iconColor, fontWeight: isActive ? '800' : '600' }]}>{tab.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </Animated.View>

                        {/* --- STATE 1 & 2: THE EXPANDED DRAWER --- */}
                        <Animated.View style={[StyleSheet.absoluteFill, styles.drawerContents, drawerContentStyle]}>
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
                </Animated.View>
            </GestureDetector>
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
        borderWidth: StyleSheet.hairlineWidth,

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
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        height: 54,
        borderRadius: 16,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
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
