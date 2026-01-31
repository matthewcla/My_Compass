import { Colors } from '@/constants/Colors';
import { SmartBenchItem } from '@/store/useAssignmentStore';
import { Billet } from '@/types/schema';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Dimensions, FlatList, Platform, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BenchCard } from './BenchCard';
import { ManifestRail } from './ManifestRail';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const COLLAPSED_HEIGHT = 190; // Approx height of rail + header
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.65;

interface SmartBenchPanelProps {
    items: SmartBenchItem[];
    onSelect: (billet: Billet) => void;
    onSeeAll: () => void;
    bottomOffset: number; // Space for footer
}

export const SmartBenchPanel: React.FC<SmartBenchPanelProps> = ({ items, onSelect, onSeeAll, bottomOffset }) => {
    const isExpanded = useSharedValue(false);
    const height = useSharedValue(COLLAPSED_HEIGHT);

    // Web state for rendering switch (since Reanimated on web can be tricky with layout changes)
    const [expandedWeb, setExpandedWeb] = React.useState(false);

    useEffect(() => {
        // Init height
        height.value = COLLAPSED_HEIGHT;
    }, []);

    const toggleExpand = () => {
        'worklet';
        if (isExpanded.value) {
            height.value = withSpring(COLLAPSED_HEIGHT, { damping: 20, stiffness: 90 });
            isExpanded.value = false;
            if (Platform.OS === 'web') runOnJS(setExpandedWeb)(false);
        } else {
            height.value = withSpring(EXPANDED_HEIGHT, { damping: 20, stiffness: 90 });
            isExpanded.value = true;
            if (Platform.OS === 'web') runOnJS(setExpandedWeb)(true);
        }
    };

    const pan = Gesture.Pan()
        .onChange((event) => {
            if (Platform.OS === 'web') return; // Disable drag on web, use click

            // Logic for dragging
            // If dragging UP (negative Y) -> Growing
            // If dragging DOWN (positive Y) -> Shrinking
            const newHeight = height.value - event.changeY;
            if (newHeight >= COLLAPSED_HEIGHT && newHeight <= EXPANDED_HEIGHT) {
                height.value = newHeight;
            }
        })
        .onEnd((event) => {
            if (Platform.OS === 'web') return;

            // Snap logic
            if (height.value > (COLLAPSED_HEIGHT + EXPANDED_HEIGHT) / 2 || event.velocityY < -500) {
                height.value = withSpring(EXPANDED_HEIGHT, { damping: 20, stiffness: 90 });
                isExpanded.value = true;
            } else {
                height.value = withSpring(COLLAPSED_HEIGHT, { damping: 20, stiffness: 90 });
                isExpanded.value = false;
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        height: height.value,
        bottom: bottomOffset, // Sit on top of footer
    }));

    // Expanded Render Item
    const renderExpandedItem = ({ item }: { item: SmartBenchItem }) => (
        <View className="mb-3 px-4">
            <BenchCard
                billet={item.billet}
                type={item.type}
                onPress={() => onSelect(item.billet)}
            // Pass a prop to BenchCard to make it full width if needed, 
            // or just use container style. Standard BenchCard is somewhat wide.
            />
        </View>
    );

    const colorScheme = useColorScheme();
    // Use Slate-800 (#1E293B) for dark mode surface to distinguish from Slate-900 background
    const backgroundColor = colorScheme === 'dark' ? '#1E293B' : '#FFFFFF';

    return (
        <GestureDetector gesture={pan}>
            <Animated.View
                className="absolute left-0 right-0 border-t border-slate-200 dark:border-slate-700 rounded-t-3xl z-20 overflow-hidden"
                style={[
                    animatedStyle,
                    {
                        backgroundColor,
                        // Explicit Deep Shadow for separation
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: -5, // Shadow casts UPWARDS
                        },
                        shadowOpacity: 0.15,
                        shadowRadius: 10,
                        elevation: 20, // High elevation for Android
                    }
                ]}
            >
                {/* DRAG HANDLE / HEADER */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={toggleExpand as any}
                    className="h-10 w-full items-center justify-center border-b border-slate-100 dark:border-slate-800/50 bg-slate-100 dark:bg-slate-800"
                >
                    <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mb-1" />
                    <View className="flex-row items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-500" color={Colors.light.navyGold} />
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            Smart Bench
                        </Text>
                        {Platform.OS === 'web' && (
                            <View className="ml-1">
                                {expandedWeb ? <ChevronDown size={14} color="#64748B" /> : <ChevronUp size={14} color="#64748B" />}
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                {/* CONTENT AREA */}
                {/* 
                  Native: Uses Reanimated shared value to toggle layout opacity/visibility if we wanted smooth transition,
                  but switching conditional rendering is often cleaner for completely different layouts. 
                  However, simple conditional rendering based on shared value isn't direct.
                  We'll use specific Animated.Views to crossfade or just switch if we can drive it.
                  
                  For simplicity effectively:
                  If expanded -> Show Vertical List
                  If collapsed -> Show ManifestRail
                */}

                <View className="flex-1 pt-2">
                    {/* Using a simple state check for web, but for native we rely on the height. 
                        We can render BOTH and crossfade opacity based on isExpanded.
                     */}

                    {/* COLLAPSED VIEW (Absolute) */}
                    <Animated.View style={useAnimatedStyle(() => ({
                        opacity: withSpring(isExpanded.value ? 0 : 1),
                        pointerEvents: isExpanded.value ? 'none' : 'auto',
                        position: 'absolute', width: '100%', height: '100%', top: 10
                    }))}>
                        <ManifestRail
                            items={items}
                            onSelect={onSelect}
                            onSeeAll={onSeeAll}
                        />
                    </Animated.View>

                    {/* EXPANDED VIEW */}
                    <Animated.View style={useAnimatedStyle(() => ({
                        opacity: withSpring(isExpanded.value ? 1 : 0),
                        pointerEvents: isExpanded.value ? 'auto' : 'none',
                        flex: 1
                    }))}>
                        <FlatList
                            data={items}
                            renderItem={({ item }) => (
                                <View className="flex-1 p-2" style={{ maxWidth: '50%' }}>
                                    <BenchCard
                                        billet={item.billet}
                                        type={item.type}
                                        onPress={() => onSelect(item.billet)}
                                    />
                                </View>
                            )}
                            numColumns={2}
                            keyExtractor={(item) => item.billet.id}
                            contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 20, paddingTop: 10 }}
                            columnWrapperStyle={{ justifyContent: 'space-between' }}
                        />
                        <TouchableOpacity onPress={onSeeAll} className="items-center py-4 border-t border-slate-100 dark:border-slate-800">
                            <Text className="text-blue-600 font-semibold">View All in Discovery</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

            </Animated.View>
        </GestureDetector>
    );
};
