import { DrawerMenuContent } from '@/components/navigation/DrawerMenuContent';
import { useScrollContextSafe } from '@/components/navigation/ScrollControlContext';
import { SpotlightResults } from '@/components/spotlight/SpotlightResults';
import { useGlobalSpotlightHeaderSearch } from '@/hooks/useGlobalSpotlightHeaderSearch';
import { BottomSheetState, useBottomSheetStore } from '@/store/useBottomSheetStore';
import { useHeaderStore } from '@/store/useHeaderStore';
import { useSpotlightStore } from '@/store/useSpotlightStore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { BackHandler, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, useWindowDimensions, View } from 'react-native';
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

    const searchConfig = useGlobalSpotlightHeaderSearch({ placeholder: 'Spotlight Search' });

    const searchInputRef = React.useRef<TextInput>(null);
    const globalSearchRowRef = React.useRef<View>(null);
    const spotlightIsOpen = useSpotlightStore((state) => state.isOpen);
    const router = useRouter();
    const setGlobalSearchFrame = useHeaderStore((state) => state.setGlobalSearchFrame);
    const triggerGlobalSearchDismiss = useHeaderStore((state) => state.triggerGlobalSearchDismiss);
    const triggerGlobalSearchSubmit = useHeaderStore((state) => state.triggerGlobalSearchSubmit);
    const registerGlobalSearchBlur = useHeaderStore((state) => state.registerGlobalSearchBlur);

    // Sync Spotlight open state with drawer expansion
    useEffect(() => {
        if (spotlightIsOpen && sheetState !== 1) {
            setSheetState(1); // Force drawer fully open when Spotlight activates
        }
    }, [spotlightIsOpen, sheetState, setSheetState]);

    const handleGlobalSearchLayout = React.useCallback(() => {
        if (!globalSearchRowRef.current) return;
        globalSearchRowRef.current.measureInWindow((x, y, width, height) => {
            const nextBottom = y + height;
            if (
                !Number.isFinite(x) ||
                !Number.isFinite(y) ||
                !Number.isFinite(width) ||
                !Number.isFinite(height) ||
                !Number.isFinite(nextBottom)
            ) {
                return;
            }
            setGlobalSearchFrame({
                x,
                y,
                width,
                height,
                bottom: nextBottom,
                borderRadius: 27, // matches styles.searchBar height/2
                measuredAt: Date.now(),
            });
        });
    }, [setGlobalSearchFrame]);

    const focusGlobalSearchInput = React.useCallback(() => {
        handleGlobalSearchLayout();
        searchInputRef.current?.focus();
        searchConfig.onPress?.();
    }, [handleGlobalSearchLayout, searchConfig]);

    React.useEffect(() => {
        const blurInput = () => searchInputRef.current?.blur();
        registerGlobalSearchBlur(blurInput);
        return () => registerGlobalSearchBlur(null);
    }, [registerGlobalSearchBlur]);

    React.useEffect(() => {
        if (spotlightIsOpen) {
            searchInputRef.current?.focus();
        }
    }, [spotlightIsOpen]);

    // Tap into the global scroll control for CollapsibleScaffold background lists
    const scrollContext = useScrollContextSafe();
    const scrollCollapseY = scrollContext?.translateY;

    // --- Mathematical Constants for the Pill Morph Engine ---
    const HEIGHT_COLLAPSED = 72;
    // Base floating margin dynamically scaled if standard insets (like Home Indicator) are present
    const COLLAPSED_BOTTOM_MARGIN = insets.bottom > 0 ? insets.bottom : 16;
    const RESTING_TOP_OFFSET_FROM_BOTTOM = HEIGHT_COLLAPSED + COLLAPSED_BOTTOM_MARGIN;

    // Report global space used so the scaffold clears the resting pill correctly
    useEffect(() => {
        setTabBarHeight(RESTING_TOP_OFFSET_FROM_BOTTOM);
    }, [RESTING_TOP_OFFSET_FROM_BOTTOM]);

    // Extended Drawer Heights
    const HEIGHT_FULL = SCREEN_HEIGHT - (insets.top + 10);

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

        // Multiply the global scroll collapse translation by 1.5 to guarantee 
        // the Floating Pill plus its bottom margins/shadows push 100% off screen.
        const scrollOffset = scrollCollapseY ? (scrollCollapseY.value * 1.5) : 0;

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
            style={[styles.masterContainer, { top: SCREEN_HEIGHT - RESTING_TOP_OFFSET_FROM_BOTTOM, height: HEIGHT_FULL }]}
            pointerEvents="box-none"
        >
            {/* Background Tap Dismissal overlay when Expanded */}
            {sheetState === 1 && (
                <Pressable
                    onPress={() => {
                        Keyboard.dismiss();
                        if (spotlightIsOpen) triggerGlobalSearchDismiss();
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
                            intensity={isDark ? 50 : 80}
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    backgroundColor: isDark ? 'rgba(20, 20, 22, 0.75)' : 'rgba(255, 255, 255, 0.6)'
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
                                    borderColor: isDark ? '#FFFFFF' : '#D1D5DB',
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
                                <View style={[styles.grabber, { backgroundColor: isDark ? '#636366' : '#C7C7CC', width: 42, height: 4, marginTop: 4 }]} />
                            </View>

                            <View style={styles.pillIconRow}>
                                <TouchableOpacity style={styles.tabItem} onPress={() => { setSheetState(0); router.push('/(hub)' as any); }}>
                                    <Ionicons name="home" size={26} color={isDark ? '#fff' : '#000'} />
                                    <Text style={[styles.tabLabel, { color: isDark ? '#fff' : '#000' }]}>Home</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.tabItem} onPress={() => { setSheetState(0); router.push('/calendar' as any); }}>
                                    <Ionicons name="calendar-clear" size={26} color={isDark ? '#fff' : '#000'} />
                                    <Text style={[styles.tabLabel, { color: isDark ? '#fff' : '#000' }]}>Calendar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.tabItem} onPress={() => { setSheetState(0); router.push('/inbox' as any); }}>
                                    <Ionicons name="mail" size={26} color={isDark ? '#fff' : '#000'} />
                                    <Text style={[styles.tabLabel, { color: isDark ? '#fff' : '#000' }]}>Inbox</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.tabItem} onPress={() => { setSheetState(0); router.push('/(profile)' as any); }}>
                                    <Ionicons name="person-circle" size={28} color={isDark ? '#fff' : '#000'} />
                                    <Text style={[styles.tabLabel, { color: isDark ? '#fff' : '#000' }]}>Me</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        {/* --- STATE 1 & 2: THE EXPANDED DRAWER --- */}
                        <Animated.View style={[StyleSheet.absoluteFill, styles.drawerContents, drawerContentStyle]}>
                            <TouchableOpacity
                                style={{ width: '100%', alignItems: 'center', paddingVertical: 10 }}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    if (spotlightIsOpen) triggerGlobalSearchDismiss();
                                    setSheetState(0);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.grabber, { backgroundColor: isDark ? '#636366' : '#C7C7CC', marginTop: 0 }]} />
                            </TouchableOpacity>

                            <Animated.View style={[{ flex: 1, width: '100%', alignItems: 'center' }]}>
                                <View style={{ width: '100%', paddingHorizontal: 24 }}>
                                    <View
                                        ref={globalSearchRowRef}
                                        onLayout={handleGlobalSearchLayout}
                                        className={`flex-row items-center mt-6 w-full`}
                                        style={[
                                            styles.searchBar,
                                            {
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                            }
                                        ]}
                                        accessibilityRole="search"
                                    >
                                        {spotlightIsOpen ? (
                                            <Pressable
                                                onPress={() => {
                                                    Keyboard.dismiss();
                                                    triggerGlobalSearchDismiss();
                                                    setSheetState(0);
                                                }}
                                                hitSlop={10}
                                                accessibilityRole="button"
                                                accessibilityLabel="Close search"
                                            >
                                                <X
                                                    size={20}
                                                    color={isDark ? '#94a3b8' : '#64748b'}
                                                    strokeWidth={2.5}
                                                    style={{ marginRight: 16 }}
                                                />
                                            </Pressable>
                                        ) : (
                                            <Pressable onPress={focusGlobalSearchInput} onPressIn={handleGlobalSearchLayout} hitSlop={10}>
                                                <Search
                                                    size={20}
                                                    color={isDark ? '#fff' : '#000'}
                                                    strokeWidth={2.5}
                                                    style={{ marginRight: 16 }}
                                                    className="opacity-70"
                                                />
                                            </Pressable>
                                        )}

                                        <TextInput
                                            ref={searchInputRef}
                                            value={searchConfig.value || ''}
                                            onChangeText={searchConfig.onChangeText}
                                            onFocus={focusGlobalSearchInput}
                                            placeholder={searchConfig.placeholder}
                                            placeholderTextColor={isDark ? '#8E8E93' : '#C7C7CC'}
                                            style={{
                                                flex: 1,
                                                color: isDark ? 'white' : 'black',
                                                fontSize: 16,
                                                outline: 'none'
                                            } as any}
                                            autoCorrect={false}
                                            autoCapitalize="none"
                                            returnKeyType="search"
                                            showSoftInputOnFocus={true}
                                            onSubmitEditing={() => {
                                                if (spotlightIsOpen) triggerGlobalSearchSubmit();
                                            }}
                                        />
                                        {!spotlightIsOpen && Platform.OS === 'web' && (
                                            <View className="px-2 py-1 ml-2 rounded-md border border-slate-300 dark:border-slate-700">
                                                <Text className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    ⌘K
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {spotlightIsOpen ? (
                                    <Animated.View
                                        entering={FadeIn.duration(200)}
                                        exiting={FadeOut.duration(200)}
                                        style={{ flex: 1, width: '100%', marginTop: 16 }}
                                    >
                                        <SpotlightResults />
                                    </Animated.View>
                                ) : (
                                    <Animated.View
                                        entering={FadeIn.duration(200)}
                                        exiting={FadeOut.duration(200)}
                                        style={{ flex: 1, width: '100%', marginTop: 16 }}
                                    >
                                        <DrawerMenuContent />
                                    </Animated.View>
                                )}
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
        width: 54,
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
