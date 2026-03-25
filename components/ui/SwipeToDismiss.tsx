import React from 'react';
import { Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DISMISS_THRESHOLD = SCREEN_WIDTH * 0.35;

interface SwipeToDismissProps {
    onDismiss: () => void;
    enabled?: boolean;
    children: React.ReactNode;
}

/**
 * Reusable horizontal swipe-to-dismiss wrapper.
 * Translates child on X-axis during pan, fades opacity proportionally.
 * Commits dismiss at 35% screen width; below that, springs back.
 * After fly-off animation, collapses height to 0 to prevent layout jump.
 */
export function SwipeToDismiss({ onDismiss, enabled = true, children }: SwipeToDismissProps) {
    const translateX = useSharedValue(0);
    const height = useSharedValue<number | undefined>(undefined);
    const marginBottom = useSharedValue<number | undefined>(undefined);
    const isDismissing = useSharedValue(false);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-15, 15]) // Require 15px horizontal movement before activating (prevents conflict with vertical scroll)
        .failOffsetY([-10, 10])   // Fail if vertical movement exceeds 10px first
        .enabled(enabled)
        .onUpdate((event) => {
            if (isDismissing.value) return;
            translateX.value = event.translationX;
        })
        .onEnd((event) => {
            if (isDismissing.value) return;

            const shouldDismiss = Math.abs(event.translationX) > DISMISS_THRESHOLD;

            if (shouldDismiss) {
                isDismissing.value = true;
                const direction = event.translationX > 0 ? 1 : -1;

                // Fly off screen
                translateX.value = withTiming(
                    direction * SCREEN_WIDTH * 1.2,
                    { duration: 250 },
                    () => {
                        // Collapse height after fly-off to prevent layout jump
                        height.value = withTiming(0, { duration: 200 });
                        marginBottom.value = withTiming(0, { duration: 200 }, () => {
                            runOnJS(onDismiss)();
                        });
                    },
                );
            } else {
                // Snap back with spring
                translateX.value = withSpring(0, {
                    damping: 20,
                    stiffness: 200,
                    mass: 0.8,
                });
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        const progress = Math.min(Math.abs(translateX.value) / SCREEN_WIDTH, 1);
        return {
            transform: [{ translateX: translateX.value }],
            opacity: 1 - progress * 0.6,
            height: height.value,
            marginBottom: marginBottom.value,
            overflow: 'hidden' as const,
        };
    });

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={animatedStyle}>
                {children}
            </Animated.View>
        </GestureDetector>
    );
}
