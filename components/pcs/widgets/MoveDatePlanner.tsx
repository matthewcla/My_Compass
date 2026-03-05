import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { services } from '@/services/api/serviceRegistry';
import { usePCSStore } from '@/store/usePCSStore';
import { isApiSuccess } from '@/types/api';
import { PickupWindow } from '@/types/pcs';
import { Calendar, Check, Clock, Loader2, Truck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const EMPTY_SHIPMENTS: any[] = [];

interface MoveDatePlannerProps {
    originZip?: string;
    destinationZip?: string;
}

export function MoveDatePlanner({ originZip = '23604', destinationZip = '92134' }: MoveDatePlannerProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const estimatedWeight = usePCSStore((s) => s.financials.hhg.estimatedWeight);
    const shipments = usePCSStore((s) => s.financials.hhg.shipments) ?? EMPTY_SHIPMENTS;
    const firstShipment = shipments[0];
    const selectedWindowId = firstShipment?.selectedPickupWindowId ?? null;
    const shipmentType = (firstShipment?.type as 'GBL' | 'PPM') ?? 'GBL';
    const updateShipment = usePCSStore((s) => s.updateShipment);

    const [windows, setWindows] = useState<PickupWindow[]>([]);
    const [loading, setLoading] = useState(true);
    const [transitDays, setTransitDays] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchWindows = async () => {
            setLoading(true);
            const [pickupResult, deliveryResult] = await Promise.all([
                services.dps.getPickupWindows(originZip, estimatedWeight || 5000),
                services.dps.getDeliveryEstimate(originZip, destinationZip, shipmentType),
            ]);

            if (cancelled) return;

            if (isApiSuccess(pickupResult)) {
                setWindows(pickupResult.data);
                // Auto-select preferred window if none selected
                if (!selectedWindowId && firstShipment) {
                    const preferred = pickupResult.data.find((w) => w.isPreferred) || pickupResult.data[0];
                    if (preferred) {
                        updateShipment(firstShipment.id, { selectedPickupWindowId: preferred.id });
                    }
                }
            }
            if (isApiSuccess(deliveryResult)) {
                setTransitDays(deliveryResult.data.transitDays);
            }
            setLoading(false);
        };

        fetchWindows();
        return () => { cancelled = true; };
    }, [originZip, destinationZip, estimatedWeight, shipmentType]);

    const handleSelectWindow = (windowId: string) => {
        if (firstShipment) {
            updateShipment(firstShipment.id, { selectedPickupWindowId: windowId });
        }
    };

    if (loading) {
        return (
            <Animated.View entering={FadeIn}>
                <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} className="rounded-2xl p-8 items-center gap-3 border border-slate-200 dark:border-white/10 mx-4 overflow-hidden mb-4">
                    <Animated.View
                        entering={FadeIn}
                        className="animate-spin"
                    >
                        <Loader2 size={24} color="#3b82f6" />
                    </Animated.View>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading pickup windows...</Text>
                </GlassView>
            </Animated.View>
        );
    }

    if (windows.length === 0) {
        return (
            <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} className="rounded-2xl p-6 items-center gap-3 border border-slate-200 dark:border-white/10 mx-4 overflow-hidden mb-4">
                <Calendar size={32} color={isDark ? '#64748b' : '#94a3b8'} strokeWidth={1.5} />
                <Text className="text-slate-500 dark:text-slate-400 text-center text-sm font-semibold">No pickup windows available</Text>
            </GlassView>
        );
    }

    return (
        <Animated.View entering={FadeIn} layout={LinearTransition.springify().damping(15)} className="gap-3">
            {transitDays && (
                <View className="flex-row items-center gap-2 mb-1 px-4">
                    <Truck size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                    <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">
                        Estimated transit: <Text className="text-slate-800 dark:text-slate-200 font-bold">{transitDays} days</Text>
                    </Text>
                </View>
            )}

            {windows.map((window, idx) => {
                const isSelected = selectedWindowId === window.id;
                const capacityColor =
                    window.capacityLabel === 'AVAILABLE' ? 'text-green-600 dark:text-green-400' :
                        window.capacityLabel === 'LIMITED' ? 'text-amber-600 dark:text-amber-400' :
                            'text-red-500 dark:text-red-400';

                return (
                    <Animated.View
                        key={window.id}
                        entering={FadeInDown.delay(idx * 80)}
                        style={{ paddingHorizontal: 16 }}
                    >
                        <Pressable
                            onPress={() => handleSelectWindow(window.id)}
                            className={`border rounded-2xl p-4 flex-row items-center gap-3 ${isSelected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
                                }`}
                        >
                            {/* Selection indicator */}
                            <View
                                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-600'
                                    }`}
                            >
                                {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                            </View>

                            {/* Date range */}
                            <View className="flex-1">
                                <Text className={`font-bold text-sm ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {formatDate(window.startDate)} – {formatDate(window.endDate)}
                                </Text>
                                <View className="flex-row items-center gap-1.5 mt-0.5">
                                    <Clock size={12} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                                    <Text className={`text-[11px] font-bold tracking-wider uppercase ${capacityColor}`}>
                                        {window.capacityLabel === 'AVAILABLE' ? 'Available' :
                                            window.capacityLabel === 'LIMITED' ? 'Limited slots' :
                                                'Waitlist only'}
                                    </Text>
                                </View>
                            </View>

                            {/* Preferred badge */}
                            {window.isPreferred && (
                                <View className="bg-emerald-500/20 rounded-full px-2 py-0.5">
                                    <Text className="text-emerald-400 text-[10px] font-bold">BEST</Text>
                                </View>
                            )}
                        </Pressable>
                    </Animated.View>
                );
            })}
        </Animated.View>
    );
}
