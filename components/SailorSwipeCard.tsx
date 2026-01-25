
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
import React, { useCallback, useState } from 'react';
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

// --- Types ---
export interface SwipeCardData {
    id: number;
    billetId: string;
    title: string;
    location: string;
    type: string;
    rotation: string;
    rank: string;
    rate: string;
    compatibility: number;
    isHot: boolean;
    image: string;
    description: string;
    detailerNote: string;
    career: {
        manning: string;
        nec: string;
        warfare: string;
    };
    financials: {
        bah: string;
        specialPay: string[];
        colIndex: string;
    };
    lifestyle: {
        schools: number;
        spouseJobs: string;
        commute: string;
    };
    startDate: string;
}

interface SailorSwipeCardProps {
    data: SwipeCardData;
}

// --- Helper Components ---
const InfoSection = ({ icon: Icon, title, children, color = 'blue' }: { icon: React.ElementType; title: string; children: React.ReactNode; color?: 'blue' | 'green' | 'purple' }) => {
    const iconColor = color === 'green' ? COLORS.green600 : color === 'purple' ? COLORS.purple600 : COLORS.blue600;
    const titleColor = color === 'green' ? COLORS.green600 : color === 'purple' ? COLORS.purple600 : COLORS.blue600;

    return (
        <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon size={14} color={iconColor} strokeWidth={2.5} />
                <Text style={{ fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: titleColor }}>
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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.slate50 }}>
        <Text style={{ color: COLORS.slate400, fontSize: 14 }}>{label}</Text>
        <Text style={{ color: COLORS.slate800, fontWeight: '700', fontSize: 14 }}>{value}</Text>
    </View>
);

export function SailorSwipeCard({ data }: SailorSwipeCardProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Using index 0 and active true by default for now since this is used in a flat list context often
    // Ideally this would receive onSwipe, active, index props like BilletCard
    const active = true;
    const index = 0;

    // For standalone demo purposes, we mock onSwipe. 
    // In production, this should be passed as a prop.
    const onSwipe = (direction: string) => console.log('Swiped sailor:', direction);

    const cardHeight = useSharedValue(0);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const handleSwipeComplete = useCallback((direction: 'left' | 'right' | 'up') => {
        onSwipe(direction);
    }, []);

    const openDrawer = useCallback(() => {
        setIsDrawerOpen(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setIsDrawerOpen(false);
    }, []);

    const onCardLayout = useCallback((e: LayoutChangeEvent) => {
        cardHeight.value = e.nativeEvent.layout.height;
    }, []);

    // --- TAP GESTURE ---
    const tap = Gesture.Tap()
        .maxDuration(300)
        .onEnd((event: GestureUpdateEvent<TapGestureHandlerEventPayload>) => {
            const tapY = event.y;
            const triggerZoneStart = cardHeight.value - TRIGGER_BAR_HEIGHT;
            if (tapY >= triggerZoneStart) {
                runOnJS(openDrawer)();
            }
        });

    // --- PAN GESTURE ---
    const pan = Gesture.Pan()
        .enabled(active && !isDrawerOpen)
        .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
            const velocityX = event.velocityX;
            const velocityY = event.velocityY;

            // Simple swipe logic matching BilletCard
            if (velocityY < -VELOCITY_THRESHOLD || translateY.value < -200) {
                translateY.value = withTiming(-1000, {}, () => runOnJS(handleSwipeComplete)('up'));
                return;
            }
            if (velocityX > VELOCITY_THRESHOLD || translateX.value > SWIPE_THRESHOLD) {
                translateX.value = withTiming(SCREEN_WIDTH * 1.5, {}, () => runOnJS(handleSwipeComplete)('right'));
                return;
            }
            if (velocityX < -VELOCITY_THRESHOLD || translateX.value < -SWIPE_THRESHOLD) {
                translateX.value = withTiming(-SCREEN_WIDTH * 1.5, {}, () => runOnJS(handleSwipeComplete)('left'));
                return;
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

    // Badge Opacity Logic
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
                style={[{ width: '100%', maxWidth: 400, height: 600, alignSelf: 'center' }, cardStyle]} // Fixed height approximation for standalone usage logic
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
                        <Text className="text-blue-500 font-black text-4xl uppercase tracking-widest">WOW</Text>
                    </View>
                </Animated.View>

                {/* Main Card */}
                {/* 1. Outer Container: Shadow & Positioning */}
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 40, // 2.5rem
                        backgroundColor: 'white',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 10,
                    }}
                >
                    {/* 2. Inner Container: Clipping & Border */}
                    <View
                        className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 flex flex-col"
                    >

                        {/* Header */}
                        <View className="relative w-full bg-slate-900" style={{ height: HEADER_HEIGHT }}>
                            <Image source={{ uri: data.image }} className="w-full h-full" contentFit="cover" />
                            <View className="absolute inset-0 bg-black/30" />

                            {/* Badges */}
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

                            {/* Match */}
                            <View className="absolute top-6 right-6">
                                <View className="w-14 h-14 bg-white/20 rounded-2xl border border-white/30 items-center justify-center">
                                    <Text className="text-white text-[10px] font-bold uppercase leading-none opacity-80">Match</Text>
                                    <Text className="text-white text-xl font-black leading-none">{data.compatibility}%</Text>
                                </View>
                            </View>

                            {/* Info */}
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
                        <View className="flex-1 p-6">
                            <View className="bg-blue-50/50 border-l-4 border-blue-900 p-4 rounded-r-2xl mb-8">
                                <View className="flex-row items-center gap-2 mb-1">
                                    <MessageSquare size={12} color={COLORS.blue900} />
                                    <Text className="text-blue-900 font-bold text-[10px] uppercase">Detailer's Note</Text>
                                </View>
                                <Text className="text-slate-700 italic text-sm">"{data.detailerNote}"</Text>
                            </View>

                            <InfoSection icon={Award} title="Professional Requirements" color="blue">
                                <View className="flex-row gap-3">
                                    <View className="flex-1 bg-slate-50 p-3 rounded-2xl">
                                        <Text className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Rating</Text>
                                        <Text className="font-bold text-slate-800">{data.rank} • {data.rate}</Text>
                                    </View>
                                    <View className="flex-1 bg-slate-50 p-3 rounded-2xl">
                                        <Text className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Manning</Text>
                                        <Text className="font-bold text-slate-800">{data.career.manning}</Text>
                                    </View>
                                </View>
                                <DataPill label="NEC Required" value={data.career.nec} />
                                <DataPill label="Warfare Qual" value={data.career.warfare} />
                            </InfoSection>
                        </View>

                        {/* Trigger Bar */}
                        <View
                            style={{
                                height: 70, // Increased to avoid corner clipping
                                backgroundColor: COLORS.white,
                                borderTopWidth: 1,
                                borderTopColor: COLORS.slate100,
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingBottom: 8,
                            }}
                        >
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                backgroundColor: COLORS.slate50,
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                borderRadius: 20
                            }}>
                                <Text style={{ color: COLORS.blue600, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, fontSize: 13 }}>Show Details</Text>
                                <ChevronUp size={18} color={COLORS.blue600} strokeWidth={2.5} />
                            </View>
                        </View>

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
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: '95%',
                                        backgroundColor: COLORS.white,
                                        borderTopLeftRadius: 32,
                                        borderTopRightRadius: 32,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: -4 },
                                        shadowOpacity: 0.15,
                                        shadowRadius: 16,
                                        elevation: 10,
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Drawer Header - Title Only */}
                                    <View style={{
                                        paddingHorizontal: 20,
                                        paddingVertical: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: COLORS.slate100,
                                        alignItems: 'center'
                                    }}>
                                        {/* Drag Handle */}
                                        <View style={{ width: 40, height: 4, backgroundColor: COLORS.slate400, borderRadius: 2, marginBottom: 12 }} />
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.slate900, textTransform: 'uppercase', letterSpacing: 1 }}>
                                            Assignment Details
                                        </Text>
                                    </View>

                                    {/* Drawer Content */}
                                    <ScrollView
                                        style={{ flex: 1, paddingHorizontal: 20 }}
                                        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }} // Increased bottom padding for scroll content
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {/* Financials */}
                                        <InfoSection icon={DollarSign} title="Estimated Financials" color="green">
                                            <View style={{ backgroundColor: COLORS.green50, padding: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <Text style={{ color: COLORS.green800, fontWeight: '900', fontSize: 18 }}>{data.financials.bah}</Text>
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <Text style={{ fontSize: 11, color: COLORS.green600, textTransform: 'uppercase', fontWeight: '700' }}>Monthly BAH</Text>
                                                    <Text style={{ fontSize: 10, color: COLORS.green700, opacity: 0.7, fontWeight: '500' }}>E-6 Dependents Rate</Text>
                                                </View>
                                            </View>
                                            <DataPill label="Cost of Living" value={data.financials.colIndex} />
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 6 }}>
                                                {data.financials.specialPay.map((pay, i) => (
                                                    <View key={i} style={{ backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.green600, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 }}>
                                                        <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.green700 }}>+ {pay}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </InfoSection>

                                        {/* Family & Quality of Life */}
                                        <InfoSection icon={Home} title="Family & Quality of Life" color="purple">
                                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                                <View style={{ flex: 1, backgroundColor: COLORS.slate50, padding: 10, borderRadius: 12, alignItems: 'center' }}>
                                                    <GraduationCap size={20} color={COLORS.slate400} />
                                                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.slate800, marginTop: 4 }}>{data.lifestyle.schools}/5</Text>
                                                    <Text style={{ fontSize: 10, color: COLORS.slate400, textTransform: 'uppercase' }}>Schools</Text>
                                                </View>
                                                <View style={{ flex: 1, backgroundColor: COLORS.slate50, padding: 10, borderRadius: 12, alignItems: 'center' }}>
                                                    <Users size={20} color={COLORS.slate400} />
                                                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.slate800, marginTop: 4 }}>{data.lifestyle.spouseJobs}</Text>
                                                    <Text style={{ fontSize: 10, color: COLORS.slate400, textTransform: 'uppercase' }}>Spouse Job</Text>
                                                </View>
                                                <View style={{ flex: 1, backgroundColor: COLORS.slate50, padding: 10, borderRadius: 12, alignItems: 'center' }}>
                                                    <Clock size={20} color={COLORS.slate400} />
                                                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.slate800, marginTop: 4 }}>{data.lifestyle.commute}</Text>
                                                    <Text style={{ fontSize: 10, color: COLORS.slate400, textTransform: 'uppercase' }}>Commute</Text>
                                                </View>
                                            </View>
                                        </InfoSection>

                                        {/* Command Mission (Description) */}
                                        <View style={{ marginTop: 8 }}>
                                            <Text style={{ fontSize: 11, color: COLORS.slate400, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Command Mission</Text>
                                            <Text style={{ color: COLORS.slate600, fontSize: 13, lineHeight: 20 }}>{data.description}</Text>
                                        </View>

                                        {/* Close Button at Bottom */}
                                        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 30 }}>
                                            <TouchableOpacity
                                                onPress={closeDrawer}
                                                style={{
                                                    backgroundColor: COLORS.slate100,
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 16,
                                                    borderRadius: 20,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 6
                                                }}
                                            >
                                                <ChevronDown size={18} color={COLORS.slate700} strokeWidth={2.5} />
                                                <Text style={{ color: COLORS.slate700, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Close Details</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </ScrollView>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Animated.View >
        </GestureDetector >
    );
}
