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
            <Animated.View entering={FadeIn} className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-8 items-center gap-3">
                <Animated.View
                    entering={FadeIn}
                    className="animate-spin"
                >
                    <Loader2 size={24} color="#3b82f6" />
                </Animated.View>
                <Text className="text-zinc-500 text-sm">Loading pickup windows from DPS...</Text>
            </Animated.View>
        );
    }

    if (windows.length === 0) {
        return (
            <View className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 items-center gap-3">
                <Calendar size={32} color="#71717a" />
                <Text className="text-zinc-500 text-center text-sm">No pickup windows available</Text>
            </View>
        );
    }

    return (
        <Animated.View entering={FadeIn} layout={LinearTransition.springify().damping(15)} className="gap-3">
            {transitDays && (
                <View className="flex-row items-center gap-2 mb-1">
                    <Truck size={16} color="#71717a" />
                    <Text className="text-zinc-400 text-xs">
                        Estimated transit: <Text className="text-zinc-200 font-semibold">{transitDays} days</Text>
                    </Text>
                </View>
            )}

            {windows.map((window, idx) => {
                const isSelected = selectedWindowId === window.id;
                const capacityColor =
                    window.capacityLabel === 'AVAILABLE' ? 'text-emerald-400' :
                        window.capacityLabel === 'LIMITED' ? 'text-amber-400' :
                            'text-red-400';

                return (
                    <Animated.View
                        key={window.id}
                        entering={FadeInDown.delay(idx * 80)}
                    >
                        <Pressable
                            onPress={() => handleSelectWindow(window.id)}
                            className={`border rounded-2xl p-4 flex-row items-center gap-3 ${isSelected ? 'bg-blue-950/30 border-blue-500/50' : 'bg-zinc-800/50 border-zinc-700/40'
                                }`}
                        >
                            {/* Selection indicator */}
                            <View
                                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-zinc-600'
                                    }`}
                            >
                                {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                            </View>

                            {/* Date range */}
                            <View className="flex-1">
                                <Text className={`font-semibold text-sm ${isSelected ? 'text-blue-200' : 'text-zinc-300'}`}>
                                    {formatDate(window.startDate)} – {formatDate(window.endDate)}
                                </Text>
                                <View className="flex-row items-center gap-2 mt-0.5">
                                    <Clock size={12} color="#71717a" />
                                    <Text className={`text-xs ${capacityColor}`}>
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
