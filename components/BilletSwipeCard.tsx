import { useColorScheme } from '@/components/useColorScheme';
import { Billet } from '@/types/schema';
import { enrichBillet } from '@/utils/billetAdapter';
import { getShadow } from '@/utils/getShadow';
import { Image } from 'expo-image';
import {
    Award,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    Flame,
    GraduationCap,
    Home,
    MapPin,
    MessageSquare,
    Users
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, LayoutChangeEvent, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
    Gesture,
    GestureDetector,
    GestureUpdateEvent,
    PanGestureHandlerEventPayload,
    TapGestureHandlerEventPayload
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

// --- Constants ---
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 800;
const HEADER_HEIGHT = 224;
const TRIGGER_BAR_HEIGHT = 50;

const COLORS = {
    white: '#FFFFFF',
    blue400: '#60a5fa',
    blue500: '#3b82f6',
    blue600: '#2563eb',
    blue900: '#1e3a8a',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate400: '#94a3b8',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
    red500: '#ef4444',
    green50: '#f0fdf4',
    green600: '#16a34a',
    green700: '#15803d',
    green800: '#166534',
    purple600: '#9333ea',
};

// --- Helper Components ---
const InfoSection = ({ icon: Icon, title, children, color = 'blue' }: { icon: React.ElementType; title: string; children: React.ReactNode; color?: 'blue' | 'green' | 'purple' }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Dynamic Icon Colors
    const iconColor = color === 'green'
        ? (isDark ? '#4ade80' : COLORS.green600)
        : color === 'purple'
            ? (isDark ? '#c084fc' : COLORS.purple600)
            : (isDark ? '#60a5fa' : COLORS.blue600);

    const titleColorStyle = color === 'green'
        ? 'text-green-600 dark:text-green-400'
        : color === 'purple'
            ? 'text-purple-600 dark:text-purple-400'
            : 'text-blue-600 dark:text-blue-400';

    return (
        <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon size={14} color={iconColor} strokeWidth={2.5} />
                <Text className={`font-bold text-xs uppercase tracking-widest ${titleColorStyle}`}>
                    {title}
                </Text>
            </View>
            <View style={{ gap: 8 }}>
                {children}
            </View>
        </View>
    );
};

const DataPill = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
        <Text className="text-slate-400 text-sm">{label}</Text>
        <Text className="text-slate-800 dark:text-slate-200 font-bold text-sm">{value}</Text>
    </View>
);

// --- Props ---
interface BilletSwipeCardProps {
    billet: Billet;
    onSwipe: (direction: 'left' | 'right' | 'up') => void;
    active: boolean;
    index: number;
    isSandbox?: boolean;
}

// --- Main Component ---
export function BilletSwipeCard({ billet, onSwipe, active, index, isSandbox = false }: BilletSwipeCardProps) {
    const data = useMemo(() => enrichBillet(billet), [billet]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const cardHeight = useSharedValue(0);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const handleSwipeComplete = useCallback((direction: 'left' | 'right' | 'up') => {
        onSwipe(direction);
    }, [onSwipe]);

    const openDrawer = useCallback(() => {
        setIsDrawerOpen(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setIsDrawerOpen(false);
    }, []);

    const onCardLayout = useCallback((e: LayoutChangeEvent) => {
        cardHeight.value = e.nativeEvent.layout.height;
    }, []);

    // --- TAP GESTURE: Only triggers in bottom trigger zone ---
    const tap = Gesture.Tap()
        .maxDuration(300)
        .onEnd((event: GestureUpdateEvent<TapGestureHandlerEventPayload>) => {
            const tapY = event.y;
            const triggerZoneStart = cardHeight.value - TRIGGER_BAR_HEIGHT;
            if (tapY >= triggerZoneStart) {
                runOnJS(openDrawer)();
            }
        });

    const gestureAxis = useSharedValue<0 | 1 | 2>(0); // 0: null, 1: x-axis, 2: y-axis
    const LOCK_THRESHOLD = 10;

    // --- PAN GESTURE: For swiping the card ---
    const pan = Gesture.Pan()
        .enabled(active && !isDrawerOpen)
        .onStart(() => {
            gestureAxis.value = 0;
        })
        .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
            // RAILROADING LOGIC:
            // Determine axis if not yet set
            if (gestureAxis.value === 0) {
                const absX = Math.abs(event.translationX);
                const absY = Math.abs(event.translationY);

                if (absX > LOCK_THRESHOLD && absX > absY) {
                    gestureAxis.value = 1; // Lock to X
                } else if (absY > LOCK_THRESHOLD && absY > absX) {
                    gestureAxis.value = 2; // Lock to Y
                }
            }

            // Apply movement based on locked axis
            if (gestureAxis.value === 1) {
                translateX.value = event.translationX;
                translateY.value = 0; // Force Y to 0
            } else if (gestureAxis.value === 2) {
                translateX.value = 0; // Force X to 0
                translateY.value = event.translationY;
            } else {
                // Pre-lock: allow micro-movement or dampen it?
                // Let's dampen it to prevent jitter before lock
                translateX.value = event.translationX * 0.2;
                translateY.value = event.translationY * 0.2;
            }
        })
        .onEnd((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
            const velocityX = event.velocityX;
            const velocityY = event.velocityY;

            // Only trigger actions if we are locked to that axis
            if (gestureAxis.value === 2 && (velocityY < -VELOCITY_THRESHOLD || translateY.value < -200)) {
                translateY.value = withTiming(-1000, {}, () => {
                    runOnJS(handleSwipeComplete)('up');
                });
                return;
            }

            if (gestureAxis.value === 1) {
                if (velocityX > VELOCITY_THRESHOLD || translateX.value > SWIPE_THRESHOLD) {
                    translateX.value = withTiming(SCREEN_WIDTH * 1.5, {}, () => {
                        runOnJS(handleSwipeComplete)('right');
                    });
                    return;
                }

                if (velocityX < -VELOCITY_THRESHOLD || translateX.value < -SWIPE_THRESHOLD) {
                    translateX.value = withTiming(-SCREEN_WIDTH * 1.5, {}, () => {
                        runOnJS(handleSwipeComplete)('left');
                    });
                    return;
                }
            }

            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
        });

    const composedGesture = Gesture.Exclusive(tap, pan);

    const cardStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
            [-15, 0, 15],
            Extrapolation.CLAMP
        );

        const scale = withSpring(index === 0 ? 1 : 0.95);
        const top = withSpring(index === 0 ? 0 : 20);

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

    // Badge Opacity Logic - Mutually exclusive based on direction
    const likeStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [0, SCREEN_WIDTH * 0.25],
            [0, 1],
            Extrapolation.CLAMP
        )
    }));

    const nopeStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [-SCREEN_WIDTH * 0.25, 0],
            [1, 0],
            Extrapolation.CLAMP
        )
    }));

    // Super Like (WOW) Opacity - Driven by vertical swipe
    const superLikeStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateY.value,
            [-SCREEN_HEIGHT * 0.2, 0],
            [1, 0],
            Extrapolation.CLAMP
        )
    }));

    return (
        <GestureDetector gesture={composedGesture}>
            <Animated.View
                style={[{ position: 'absolute', width: '100%', height: '100%' }, cardStyle]}
                onLayout={onCardLayout}
            >
                {/* Swipe Overlays */}
                <Animated.View style={[likeStyle, { position: 'absolute', top: 40, left: 40, zIndex: 50, transform: [{ rotate: '-30deg' }] }]}>
                    <View className="border-4 border-green-500 rounded-xl px-4 py-2 bg-white/20">
                        <Text className="text-green-500 font-black text-4xl uppercase tracking-widest">YES</Text>
                    </View>
                </Animated.View>

                <Animated.View style={[nopeStyle, { position: 'absolute', top: 40, right: 40, zIndex: 50, transform: [{ rotate: '30deg' }] }]}>
                    <View className="border-4 border-red-500 rounded-xl px-4 py-2 bg-white/20">
                        <Text className="text-red-500 font-black text-4xl uppercase tracking-widest">NOPE</Text>
                    </View>
                </Animated.View>

                <Animated.View style={[superLikeStyle, { position: 'absolute', top: 55, alignSelf: 'center', zIndex: 50 }]}>
                    <View className="border-4 border-blue-500 rounded-xl px-4 py-2 bg-white/20">
                        <Text className="text-blue-500 font-black text-4xl uppercase tracking-widest">WOW!</Text>
                    </View>
                </Animated.View>

                {/* Main Card */}
                {/* 1. Outer Container: Shadow & Positioning */}
                <View
                    className="w-full h-full rounded-[40px] bg-white dark:bg-slate-900"
                    style={{
                        ...getShadow({
                            shadowColor: isSandbox ? COLORS.purple600 : (isDark ? COLORS.blue500 : '#000'),
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: (isSandbox || isDark) ? 0.6 : 0.3,
                            shadowRadius: 20,
                            elevation: 10,
                        }),
                    }}
                >
                    {/* 2. Inner Container: Clipping & Border */}
                    <View
                        className="w-full h-full bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col"
                    >
                        {/* Header */}
                        <View className="relative w-full bg-slate-900" style={{ height: HEADER_HEIGHT }}>
                            <Image source={data.image} className="w-full h-full" contentFit="cover" />
                            <View className="absolute inset-0 bg-black/30" />

                            <View className="absolute top-6 left-6 flex-row gap-2">
                                <View className="px-3 py-1.5 bg-blue-600 rounded-xl shadow-lg">
                                    <Text className="text-white text-[10px] font-black uppercase tracking-widest">{data.type}</Text>
                                </View>
                                {data.isHot && (
                                    <View className="px-3 py-1.5 bg-orange-500 rounded-xl shadow-lg flex-row items-center gap-1">
                                        <Flame size={12} color="white" fill="currentColor" />
                                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">Hot Billet</Text>
                                    </View>
                                )}
                            </View>

                            <View className="absolute top-6 right-6">
                                {billet.advertisementStatus === 'projected' ? (
                                    <View className="px-3 py-1.5 bg-purple-600 rounded-xl shadow-lg border border-purple-400 mb-2 items-center justify-center">
                                        <Text className="text-white text-[10px] font-black uppercase tracking-widest">Projected</Text>
                                    </View>
                                ) : ( // Match score normally
                                    <View className="w-14 h-14 bg-white/20 rounded-2xl border border-white/30 items-center justify-center">
                                        <Text className="text-white text-[10px] font-bold uppercase leading-none opacity-80">Match</Text>
                                        <Text className="text-white text-xl font-black leading-none">{data.compatibility}%</Text>
                                    </View>
                                )}
                            </View>

                            <View className="absolute bottom-6 left-6 right-6">
                                <Text className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">{data.billetId}</Text>
                                <Text className="text-3xl font-black text-white leading-tight uppercase tracking-tight">{data.title}</Text>
                                <View className="flex-row items-center gap-1 mt-1">
                                    <MapPin size={14} color={COLORS.blue400} />
                                    <Text className="text-white/80 text-sm font-bold">{data.location}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Body Content */}
                        <View className="flex-1 p-6 justify-center">
                            <View className="bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-900 dark:border-blue-500 pl-4 py-6 pr-4 rounded-r-2xl mb-2">
                                <View className="flex-row items-center gap-2 mb-3">
                                    <MessageSquare size={14} color={isDark ? '#3b82f6' : COLORS.blue900} />
                                    <Text className="text-blue-900 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">Detailer's Note</Text>
                                </View>
                                <Text className="text-slate-700 dark:text-slate-300 italic text-base leading-relaxed">"{data.detailerNote}"</Text>
                            </View>
                        </View>

                        {/* Trigger Bar - Padded to clear external controls */}
                        <TouchableOpacity
                            onPress={openDrawer}
                            activeOpacity={0.9}
                            className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 justify-start items-center pt-4 pb-[50px]"
                        >
                            <View className="flex-row items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-2xl pointer-events-none">
                                <Text className="text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-widest text-[13px]">Show Details</Text>
                                <ChevronUp size={18} color={isDark ? '#60a5fa' : COLORS.blue600} strokeWidth={2.5} />
                            </View>
                        </TouchableOpacity>

                        {/* Drawer Overlay */}
                        {isDrawerOpen && (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 9999,
                                }}
                            >
                                {/* Backdrop */}
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={closeDrawer}
                                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }}
                                />

                                {/* Drawer Panel - Full Height */}
                                <View
                                    className="absolute bottom-0 left-0 right-0 h-[95%] bg-white dark:bg-slate-900 rounded-t-[32px] overflow-hidden"
                                    style={{
                                        ...getShadow({
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: -4 },
                                            shadowOpacity: 0.15,
                                            shadowRadius: 16,
                                            elevation: 10,
                                        }),
                                    }}
                                >
                                    {/* Drawer Header - Title Only */}
                                    <View className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 items-center">
                                        {/* Drag Handle */}
                                        <View className="w-10 h-1 bg-slate-400 rounded-full mb-3" />
                                        <Text className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-widest">
                                            Assignment Details
                                        </Text>
                                    </View>

                                    {/* Drawer Content */}
                                    <ScrollView
                                        style={{ flex: 1, paddingHorizontal: 20 }}
                                        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }} // Increased bottom padding for scroll content
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {/* Professional Requirements - Moved from Main Card */}
                                        <InfoSection icon={Award} title="Professional Requirements" color="blue">
                                            <View className="flex-row gap-3">
                                                <View className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                                                    <Text className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Rating</Text>
                                                    <Text className="font-bold text-slate-800 dark:text-slate-200">{data.rank} • {data.rate}</Text>
                                                </View>
                                                <View className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
                                                    <Text className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Manning</Text>
                                                    <Text className="font-bold text-slate-800 dark:text-slate-200">{data.career.manning}</Text>
                                                </View>
                                            </View>
                                            <DataPill label="NEC Required" value={data.career.nec} />
                                            <DataPill label="Warfare Qual" value={data.career.warfare} />
                                        </InfoSection>

                                        {/* Financials */}
                                        <InfoSection icon={DollarSign} title="Estimated Financials" color="green">
                                            <View className="bg-green-50 dark:bg-green-900/20 p-3.5 rounded-xl flex-row justify-between items-center mb-1.5">
                                                <Text className="text-green-800 dark:text-green-400 font-black text-lg">{data.financials.bah}</Text>
                                                <View className="items-end">
                                                    <Text className="text-[11px] text-green-600 dark:text-green-400 uppercase font-bold">Monthly BAH</Text>
                                                    <Text className="text-[10px] text-green-700 dark:text-green-500 opacity-70 font-medium">E-6 Dependents Rate</Text>
                                                </View>
                                            </View>
                                            <DataPill label="Cost of Living" value={data.financials.colIndex} />
                                            <View className="flex-row flex-wrap gap-1.5 pt-1.5">
                                                {data.financials.specialPay.map((pay, i) => (
                                                    <View key={i} className="bg-white dark:bg-slate-800 border border-green-600 dark:border-green-500 px-2.5 py-0.5 rounded-full">
                                                        <Text className="text-[11px] font-bold text-green-700 dark:text-green-400">+ {pay}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </InfoSection>

                                        {/* Family & Quality of Life */}
                                        <InfoSection icon={Home} title="Family & Quality of Life" color="purple">
                                            <View className="flex-row gap-2">
                                                <View className="flex-1 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl items-center">
                                                    <GraduationCap size={20} color={COLORS.slate400} />
                                                    <Text className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mt-1">{data.lifestyle.schools}/5</Text>
                                                    <Text className="text-[10px] text-slate-400 uppercase">Schools</Text>
                                                </View>
                                                <View className="flex-1 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl items-center">
                                                    <Users size={20} color={COLORS.slate400} />
                                                    <Text className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mt-1">{data.lifestyle.spouseJobs}</Text>
                                                    <Text className="text-[10px] text-slate-400 uppercase">Spouse Job</Text>
                                                </View>
                                                <View className="flex-1 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl items-center">
                                                    <Clock size={20} color={COLORS.slate400} />
                                                    <Text className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mt-1">{data.lifestyle.commute}</Text>
                                                    <Text className="text-[10px] text-slate-400 uppercase">Commute</Text>
                                                </View>
                                            </View>
                                        </InfoSection>

                                        {/* Command Mission */}
                                        <View className="mt-2">
                                            <Text className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Command Mission</Text>
                                            <Text className="text-slate-600 dark:text-slate-400 text-[13px] leading-5">{data.description}</Text>
                                        </View>
                                        <View className="h-5" />
                                    </ScrollView>

                                    {/* Fixed Footer - Matches Trigger Bar Exactly */}
                                    {/* Fixed Footer - Matches Trigger Bar Exactly */}
                                    <TouchableOpacity
                                        onPress={closeDrawer}
                                        activeOpacity={0.9}
                                        className="w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 justify-start items-center pt-4 pb-[50px]"
                                    >
                                        <View className="flex-row items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-2xl pointer-events-none">
                                            <Text className="text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-widest text-[13px]">Close Details</Text>
                                            <ChevronDown size={18} color={isDark ? '#60a5fa' : COLORS.blue600} strokeWidth={2.5} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                    </View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
}
