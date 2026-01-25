import { JobCard } from '@/components/JobCard';
import { Billet } from '@/types/schema';
import React, { useCallback } from 'react';
import { Dimensions, View } from 'react-native';
import {
    Gesture,
    GestureDetector,
    GestureUpdateEvent,
    PanGestureHandlerEventPayload
} from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 800;

interface BilletSwipeCardProps {
    billet: Billet;
    onSwipe: (direction: 'left' | 'right' | 'up') => void;
    active: boolean;
    index: number; // 0 = top, 1 = background
}

export function BilletSwipeCard({ billet, onSwipe, active, index }: BilletSwipeCardProps) {
    // Shared Values for Physics
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // Callbacks to external state
    const handleSwipeComplete = useCallback((direction: 'left' | 'right' | 'up') => {
        onSwipe(direction);
    }, [onSwipe]);

    // Gesture Definition
    const pan = Gesture.Pan()
        .enabled(active) // Only top card is swipable
        .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
            // Velocity Check
            const velocityX = event.velocityX;
            const velocityY = event.velocityY;
            const absTranslateX = Math.abs(translateX.value);
            const absTranslateY = Math.abs(translateY.value);

            // UP SWIPE (Super Like)
            if (velocityY < -VELOCITY_THRESHOLD || translateY.value < -200) {
                translateY.value = withTiming(-1000, {}, () => {
                    runOnJS(handleSwipeComplete)('up');
                });
                return;
            }

            // RIGHT SWIPE (Apply)
            if (velocityX > VELOCITY_THRESHOLD || translateX.value > SWIPE_THRESHOLD) {
                translateX.value = withTiming(SCREEN_WIDTH * 1.5, {}, () => {
                    runOnJS(handleSwipeComplete)('right');
                });
                return;
            }

            // LEFT SWIPE (Nope)
            if (velocityX < -VELOCITY_THRESHOLD || translateX.value < -SWIPE_THRESHOLD) {
                translateX.value = withTiming(-SCREEN_WIDTH * 1.5, {}, () => {
                    runOnJS(handleSwipeComplete)('left');
                });
                return;
            }

            // Reset (Spring Back)
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
        });

    // Animated Styles
    const cardStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
            [-15, 0, 15],
            Extrapolation.CLAMP
        );

        // Scale down background card
        const scale = withSpring(index === 0 ? 1 : 0.95);
        const top = withSpring(index === 0 ? 0 : 20); // Stack effect

        // Background card shouldn't move with gesture until it becomes active (handled by parent re-render),
        // but for now, it's static.
        // Active card moves.

        return {
            transform: [
                { translateX: active ? translateX.value : 0 },
                { translateY: active ? translateY.value : top },
                { rotate: active ? `${rotate}deg` : '0deg' },
                { scale },
            ],
            zIndex: active ? 100 : 1,
        };
    });

    // Overlay Opacities
    const likeOpacity = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                translateX.value,
                [0, SCREEN_WIDTH * 0.25],
                [0, 1],
                Extrapolation.CLAMP
            ),
        };
    });

    const nopeOpacity = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                translateX.value,
                [0, -SCREEN_WIDTH * 0.25],
                [0, 1],
                Extrapolation.CLAMP
            ),
        };
    });

    const superOpacity = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                translateY.value,
                [0, -100],
                [0, 1],
                Extrapolation.CLAMP
            ),
        };
    });

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[{ position: 'absolute', width: '100%' }, cardStyle]}>

                {/* Overlay: LIKE (Green Apply) */}
                <Animated.View
                    style={[
                        likeOpacity,
                        {
                            position: 'absolute',
                            top: 40,
                            left: 40,
                            zIndex: 10,
                            transform: [{ rotate: '-30deg' }],
                        },
                    ]}
                >
                    <View className="border-4 border-green-500 rounded-xl px-4 py-2 bg-white/20">
                        <Animated.Text className="text-green-500 font-black text-4xl uppercase tracking-widest">
                            APPLY
                        </Animated.Text>
                    </View>
                </Animated.View>

                {/* Overlay: NOPE (Red X) */}
                <Animated.View
                    style={[
                        nopeOpacity,
                        {
                            position: 'absolute',
                            top: 40,
                            right: 40,
                            zIndex: 10,
                            transform: [{ rotate: '30deg' }],
                        },
                    ]}
                >
                    <View className="border-4 border-red-500 rounded-xl px-4 py-2 bg-white/20">
                        <Animated.Text className="text-red-500 font-black text-4xl uppercase tracking-widest">
                            NOPE
                        </Animated.Text>
                    </View>
                </Animated.View>

                {/* Overlay: SUPER (Blue Star) */}
                <Animated.View
                    style={[
                        superOpacity,
                        {
                            position: 'absolute',
                            bottom: 100,
                            alignSelf: 'center',
                            zIndex: 10,
                        },
                    ]}
                >
                    <View className="border-4 border-blue-500 rounded-xl px-4 py-2 bg-white/20">
                        <Animated.Text className="text-blue-500 font-black text-4xl uppercase tracking-widest">
                            SUPER
                        </Animated.Text>
                    </View>
                </Animated.View>

                {/* Actual Card Content */}
                {/* We pass a specialized prop or style to basic JobCard if we want to disable its internal scale pressable behavior 
                    However, JobCard doesn't have a 'disabled' prop exposed for the whole container easily, 
                    but we can wrap it in a View that captures touches if needed. 
                    Actually, we specifically want to DISABLE the "Buy It Now" button usage inside the card 
                    BECAUSE the swipe itself is the action now. 
                    Or do we? The prompt says swipeRight = Apply. 
                    So we should likely pass isProcessing={true} or similar to make it look static, 
                    or ideally refactor JobCard to be "view only" mode.
                    For now, passing dummy handlers.
                */}
                <JobCard
                    billet={billet}
                    onBuyPress={() => { /* No-op, use swipe */ }}
                    isProcessing={false}
                    applicationStatus={undefined}
                />
            </Animated.View>
        </GestureDetector>
    );
}
