import { ScreenHeader } from '@/components/ScreenHeader';
import { useDiffClampScroll } from '@/hooks/useDiffClampScroll';
import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

const HEADER_HEIGHT = 120; // Approximation including safe area

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DiffClampDemo() {
    const insets = useSafeAreaInsets();
    const { onScroll, headerStyle } = useDiffClampScroll({ headerHeight: HEADER_HEIGHT });

    // Generate dummy list items
    const items = Array.from({ length: 50 }, (_, i) => i);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Status Bar Shim */}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: insets.top,
                    backgroundColor: '#f3f4f6', // Match container background
                    zIndex: 99, // Below header (100), above content
                }}
            />

            {/* Animated Header Wrapper */}
            <Animated.View style={[styles.headerContainer, headerStyle]}>
                <ScreenHeader
                    title="Diff-Clamp Demo"
                    subtitle="Scroll down to hide, up to show"
                    withSafeArea={true}
                />
            </Animated.View>

            {/* Scrollable Content */}
            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 20, paddingBottom: 40, paddingHorizontal: 16 }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.instructions}>
                    1. Scroll DOWN: Header should slide up and hide.
                    2. Scroll UP: Header should IMMEDIATELY slide down (diff-clamp).
                    3. Top Bounce (iOS): Header should stay fixed at top (0).
                </Text>

                {items.map((item) => (
                    <View key={item} style={styles.card}>
                        <Text style={styles.cardText}>Item {item}</Text>
                    </View>
                ))}
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6', // gray-100
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        // Ensure background covers content behind it
        backgroundColor: 'transparent',
    },
    instructions: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        fontSize: 14,
        lineHeight: 20,
        color: '#333',
    },
    card: {
        height: 80,
        backgroundColor: 'white',
        marginBottom: 12,
        borderRadius: 12,
        justifyContent: 'center',
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});
