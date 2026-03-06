import { useScrollContextSafe } from '@/components/navigation/ScrollControlContext';
import { useSpotlightStore } from '@/store/useSpotlightStore';
import { BlurView } from 'expo-blur';
import { Search } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SPRING_CONFIG = {
    damping: 24,
    mass: 0.6,
    stiffness: 250,
};

export function FloatingSpotlightPill() {
    const isDark = useColorScheme() === 'dark';
    const openSpotlight = useSpotlightStore((s) => s.open);
    const insets = useSafeAreaInsets();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    // Tap into scroll context to defensively hide the pill when scrolling lists
    const scrollContext = useScrollContextSafe();

    // The main navigation pill needs 82px height + bottom inset
    const NAV_PILL_HEIGHT = 82;
    const NAV_PILL_MARGIN = insets.bottom > 0 ? insets.bottom : 16;
    const NAV_PILL_TOTAL_SPACE = NAV_PILL_HEIGHT + NAV_PILL_MARGIN;

    // This Spotlight pill will float just above the Nav Pill
    const PILL_BOTTOM_OFFSET = NAV_PILL_TOTAL_SPACE + 12;

    const scale = useSharedValue(1);

    // Extract shared values safely before worklet definition to prevent
    // Reanimated from attempting to capture an undefined closure object
    const translateY = scrollContext?.translateY;
    const tabBarMaxHeight = scrollContext?.tabBarMaxHeight;
    const isOpen = useSpotlightStore((s) => s.isOpen);

    // Coordinate the pill's visibility with the Spotlight Overlay.
    // When opening, fade out quickly. When closing, wait for the overlay to finish falling.
    const spotlightVisibility = useDerivedValue(() => {
        if (isOpen) {
            return withTiming(0, { duration: 150 });
        } else {
            return withDelay(300, withTiming(1, { duration: 250 }));
        }
    });

    const animatedStyle = useAnimatedStyle(() => {
        let scrollOffset = 0;

        // Hide defensively when scrolling down
        if (translateY && tabBarMaxHeight) {
            const maxScroll = Math.max(tabBarMaxHeight.value, 1);
            // Translate it downwards completely out of view
            scrollOffset = interpolate(
                translateY.value,
                [0, maxScroll],
                [0, PILL_BOTTOM_OFFSET + 80],
                Extrapolation.CLAMP
            );
        }

        const scrollOpacity = interpolate(scrollOffset, [0, 40], [1, 0], Extrapolation.CLAMP);

        return {
            transform: [
                { translateY: scrollOffset },
                { scale: scale.value }
            ],
            opacity: scrollOpacity * spotlightVisibility.value
        };
    });

    return (
        <Animated.View
            style={[
                styles.container,
                { bottom: PILL_BOTTOM_OFFSET },
                animatedStyle
            ]}
            pointerEvents="box-none"
        >
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => { scale.value = withSpring(0.95, SPRING_CONFIG); }}
                onPressOut={() => { scale.value = withSpring(1, SPRING_CONFIG); }}
                onPress={() => openSpotlight()}
                style={styles.shadowCaster}
            >
                <Animated.View style={[styles.glassShape, { borderColor: 'transparent' }]}>
                    <BlurView
                        tint={isDark ? 'dark' : 'light'}
                        intensity={isDark ? 50 : 80}
                        style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: isDark ? 'rgba(20, 20, 22, 0.75)' : 'rgba(255, 255, 255, 0.6)' }
                        ]}
                    />

                    {/* Interior Border Overlay to mimic Bottom Pill Bar */}
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                top: 1, left: 1, right: 1, bottom: 1,
                                borderWidth: StyleSheet.hairlineWidth,
                                borderColor: isDark ? '#FFFFFF' : '#D1D5DB',
                                borderRadius: 18,
                            }
                        ]}
                    />

                    <Search
                        size={16}
                        color={isDark ? '#e2e8f0' : '#475569'}
                        strokeWidth={2.5}
                        style={{ marginRight: 6 }}
                    />
                    <Text style={{
                        color: isDark ? '#e2e8f0' : '#475569',
                        fontSize: 14,
                        fontWeight: '600'
                    }}>
                        Search
                    </Text>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998, // Just below main drawer sheet
    },
    shadowCaster: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    glassShape: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        height: 36,
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    }
});
