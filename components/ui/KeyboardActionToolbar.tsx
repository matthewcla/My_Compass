import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, useColorScheme } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

export function KeyboardActionToolbar() {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const keyboardHeight = useSharedValue(0);
    const [isVisible, setIsVisible] = useState(false);

    // Scale for press animation
    const scale = useSharedValue(1);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSubscription = Keyboard.addListener(showEvent, (e) => {
            setIsVisible(true);
            const toValue = e.endCoordinates.height;
            keyboardHeight.value = Platform.OS === 'ios'
                ? withSpring(toValue, { damping: 20, stiffness: 200, mass: 1 })
                : withTiming(toValue, { duration: e.duration || 250, easing: Easing.out(Easing.ease) });
        });

        const hideSubscription = Keyboard.addListener(hideEvent, (e) => {
            keyboardHeight.value = Platform.OS === 'ios'
                ? withSpring(0, { damping: 20, stiffness: 200, mass: 1 })
                : withTiming(0, { duration: e.duration || 250, easing: Easing.out(Easing.ease) });

            // Hide completely after animation
            setTimeout(() => {
                setIsVisible(false);
            }, e.duration || 250);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: -keyboardHeight.value }
            ],
            // Fade out smoothly as it travels down
            opacity: keyboardHeight.value > 50 ? 1 : 0,
        };
    });

    const animatedPressStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }]
        };
    });

    if (!isVisible) return null;

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    zIndex: 99999,
                },
                animatedContainerStyle
            ]}
            pointerEvents="box-none"
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
                        shadowColor: isDark ? '#000' : '#334155',
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
