import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Keyboard, Pressable, useColorScheme } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedKeyboard,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

export function KeyboardActionToolbar() {
    const isDark = (useColorScheme() ?? 'light') === 'dark';

    // UI Thread synchronous keyboard tracker (100% JS Bridge bypass)
    const keyboard = useAnimatedKeyboard();

    // Scale for press micro-animation
    const scale = useSharedValue(1);

    const animatedContainerStyle = useAnimatedStyle(() => {
        // Only render visible when the keyboard is actively crossing the 50px threshold
        const opacity = interpolate(
            keyboard.height.value,
            [0, 50, 100],
            [0, 0, 1],
            Extrapolation.CLAMP
        );

        // Prevent GPU render layer interaction when opacity is 0 
        const zIndex = keyboard.height.value > 50 ? 99999 : -1;

        return {
            opacity,
            zIndex,
            transform: [
                { translateY: -keyboard.height.value }
            ],
        };
    });

    const animatedPressStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }]
        };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                },
                animatedContainerStyle
            ]}
        >
            <Animated.View style={animatedPressStyle}>
                <Pressable
                    onPress={() => Keyboard.dismiss()}
                    onPressIn={() => {
                        scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
                    }}
                    onPressOut={() => {
                        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
                    }}
                    className="overflow-hidden rounded-full"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: isDark ? 0.4 : 0.15,
                        shadowRadius: 16,
                        elevation: 8,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                    }}
                >
                    <BlurView
                        intensity={isDark ? 60 : 90}
                        tint={isDark ? "dark" : "light"}
                        className="w-[54px] h-[54px] items-center justify-center flex-row"
                        style={{
                            backgroundColor: isDark ? 'rgba(20, 20, 22, 0.85)' : 'rgba(255, 255, 255, 0.8)',
                            borderRadius: 27,
                        }}
                    >
                        <Ionicons
                            name="close"
                            size={24}
                            color={isDark ? '#e2e8f0' : '#334155'}
                            style={{ opacity: 0.9 }}
                        />
                    </BlurView>
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
}

