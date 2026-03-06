import { SpotlightResults } from '@/components/spotlight/SpotlightResults';
import { useSpotlightStore } from '@/store/useSpotlightStore';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Search } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Keyboard, Platform, StyleSheet, TextInput, useColorScheme, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function SpotlightOverlay() {
    const isDark = useColorScheme() === 'dark';
    const isOpen = useSpotlightStore((s) => s.isOpen);
    const close = useSpotlightStore((s) => s.close);
    const query = useSpotlightStore((s) => s.query);
    const setQuery = useSpotlightStore((s) => s.setQuery);

    const inputRef = useRef<TextInput>(null);
    const insets = useSafeAreaInsets();
    const keyboard = useAnimatedKeyboard();

    const keyboardStyle = useAnimatedStyle(() => {
        // OVERLAP & PERFORMANCE FIX:
        // Changing `paddingBottom` dynamically forces a full React Native layout pass on the UI thread,
        // causing layout thrashing and stuttering. Instead, we use absolute constant structural padding,
        // and calculate a fluid `translateY` offset that mathematically subtracts the safe area bottom
        // so we perfectly skirt the keyboard 100% on the GPU.
        const activeTranslation = Math.max(0, keyboard.height.value - insets.bottom);
        return {
            transform: [{ translateY: -activeTranslation }],
        };
    });

    // Auto-focus the input when the overlay opens
    useEffect(() => {
        if (isOpen) {
            // Slight delay to allow the animation to start before popping the keyboard
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isOpen]);

    const handleClose = () => {
        Keyboard.dismiss();
        setQuery('');
        close();
    };

    // Automatically close Spotlight if the user dismisses the keyboard directly
    // (e.g., swiping down on the keyboard or tapping a hardware dismissal key)
    useEffect(() => {
        if (!isOpen) return;

        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                handleClose();
            }
        );

        return () => {
            keyboardDidHideListener.remove();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Animated.View
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(200)}
            style={styles.absoluteOverlay}
        >
            <BlurView
                tint={isDark ? 'dark' : 'light'}
                intensity={100}
                experimentalBlurMethod="dimezisBlurView"
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.4)' }
                ]}
            />

            <View style={{ flex: 1, paddingTop: insets.top + 16 }}>
                {/* Search Results Area */}
                <View style={{ flex: 1 }}>
                    <SpotlightResults onClose={handleClose} />
                </View>

                {/* Bottom Anchored Controls */}
                <Animated.View style={[{ width: '100%', paddingBottom: insets.bottom + 16 }, keyboardStyle]}>

                    {/* Contrast Gradient Backdrop */}
                    <LinearGradient
                        colors={[
                            isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                            'transparent'
                        ]}
                        locations={[0, 0.6, 1]}
                        style={[StyleSheet.absoluteFill, { top: -10 }]}
                        pointerEvents="none"
                    />

                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                        {/* Search Input Control */}
                        {/* Restricted width to allow the global KeyboardActionToolbar to float perfectly in-line to the right. */}
                        {/* Toolbar width: 54px + Gap: 12px + Right Edge: 16px = 82px reserved. */}
                        <View style={{ width: '100%', paddingRight: 66 }}>
                            <View
                                style={[
                                    styles.searchBar,
                                    {
                                        width: '100%',
                                        overflow: 'hidden',
                                        borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                                        shadowColor: isDark ? '#000' : '#334155',
                                        shadowOffset: { width: 0, height: 8 },
                                        shadowOpacity: isDark ? 0.4 : 0.15,
                                        shadowRadius: 16,
                                        elevation: 8,
                                    }
                                ]}
                            >
                                <BlurView
                                    tint={isDark ? 'dark' : 'light'}
                                    intensity={isDark ? 50 : 80}
                                    style={[
                                        StyleSheet.absoluteFill,
                                        { backgroundColor: isDark ? 'rgba(20, 20, 22, 0.85)' : 'rgba(255, 255, 255, 0.8)' }
                                    ]}
                                />

                                <Search
                                    size={20}
                                    color={isDark ? '#e2e8f0' : '#475569'}
                                    strokeWidth={2.5}
                                    style={{ marginRight: 8, marginLeft: 4 }}
                                />

                                <TextInput
                                    ref={inputRef}
                                    value={query}
                                    onChangeText={setQuery}
                                    placeholder="Spotlight Search"
                                    placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                                    style={[
                                        styles.input,
                                        { color: isDark ? '#ffffff' : '#000000' }
                                    ]}
                                    autoCorrect={false}
                                />
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    absoluteOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 99999, // Absolute top layer
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        borderRadius: 27,
        paddingHorizontal: 16,
        borderWidth: 1,
    },

    input: {
        flex: 1,
        fontSize: 18,
        height: '100%',
        paddingVertical: 20, // 20px explicit padding to enforce Tap-to-Focus standard
        ...Platform.select({
            web: { outline: 'none' } as any
        })
    }
});
