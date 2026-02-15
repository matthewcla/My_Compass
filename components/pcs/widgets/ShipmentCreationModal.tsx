/**
 * ShipmentCreationModal — Bottom-sheet modal for creating new HHG shipments.
 * Supports GBL (government shipment), PPM (personally procured move), and NTS (storage release).
 */
import { ScalePressable } from '@/components/ScalePressable';
import { usePCSStore } from '@/store/usePCSStore';
import { HHGShipmentType } from '@/types/pcs';
import * as Haptics from 'expo-haptics';
import {
    ArrowRight,
    Package,
    Truck,
    Warehouse,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
    useColorScheme,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ShipmentCreationModalProps {
    visible: boolean;
    onClose: () => void;
    onCreated: (shipmentId: string) => void;
}

const SHIPMENT_TYPES: { type: HHGShipmentType; label: string; desc: string; icon: typeof Truck }[] = [
    { type: 'GBL', label: 'Government Shipment', desc: 'Government-arranged carrier moves your HHG', icon: Truck },
    { type: 'PPM', label: 'PPM (DITY)', desc: 'You move your own items and get reimbursed', icon: Package },
    { type: 'NTS', label: 'From Storage (NTS)', desc: 'Release items from government storage', icon: Warehouse },
];

export function ShipmentCreationModal({ visible, onClose, onCreated }: ShipmentCreationModalProps) {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const addShipment = usePCSStore((s) => s.addShipment);

    const [selectedType, setSelectedType] = useState<HHGShipmentType>('GBL');
    const [label, setLabel] = useState('');
    const [originZip, setOriginZip] = useState('');
    const [destinationZip, setDestinationZip] = useState('');

    const isNTS = selectedType === 'NTS';
    const canCreate = label.trim().length > 0 && originZip.trim().length >= 5;

    const handleCreate = () => {
        if (!canCreate) return;
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        }

        addShipment(
            selectedType,
            label.trim(),
            originZip.trim(),
            isNTS ? null : (destinationZip.trim() || null),
        );

        // Get the newly created shipment ID
        const shipments = usePCSStore.getState().financials.hhg.shipments || [];
        const newShipment = shipments[shipments.length - 1];

        // Reset form
        setSelectedType('GBL');
        setLabel('');
        setOriginZip('');
        setDestinationZip('');

        onCreated(newShipment?.id ?? '');
        onClose();
    };

    const handleClose = () => {
        setSelectedType('GBL');
        setLabel('');
        setOriginZip('');
        setDestinationZip('');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View className="flex-1 justify-end bg-black/45">
                <Pressable className="flex-1" onPress={handleClose} />
                <Animated.View
                    entering={FadeInUp.duration(220)}
                    className="rounded-t-3xl bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-700 px-4 pt-4"
                    style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                >
                    {/* Handle */}
                    <View className="items-center mb-3">
                        <View className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-zinc-700" />
                    </View>

                    <Text className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        New Shipment
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                        Add another lot of HHG to your move plan.
                    </Text>

                    {/* Type Selector */}
                    <View className="gap-2 mb-4">
                        {SHIPMENT_TYPES.map(({ type, label: typeLabel, desc, icon: Icon }) => {
                            const isSelected = selectedType === type;
                            return (
                                <ScalePressable
                                    key={type}
                                    onPress={() => setSelectedType(type)}
                                    className={`rounded-xl border px-3.5 py-3 flex-row items-center ${isSelected
                                            ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
                                            : 'border-slate-200 dark:border-zinc-700/50'
                                        }`}
                                >
                                    <View className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${isSelected
                                            ? 'bg-blue-100 dark:bg-blue-900/40'
                                            : 'bg-slate-100 dark:bg-zinc-800'
                                        }`}>
                                        <Icon size={18} color={isSelected ? (isDark ? '#93c5fd' : '#1d4ed8') : (isDark ? '#94a3b8' : '#64748b')} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`text-sm font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'
                                            }`}>{typeLabel}</Text>
                                        <Text className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">{desc}</Text>
                                    </View>
                                    {isSelected && (
                                        <View className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 items-center justify-center">
                                            <View className="w-2 h-2 rounded-full bg-white" />
                                        </View>
                                    )}
                                </ScalePressable>
                            );
                        })}
                    </View>

                    {/* Label */}
                    <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                        Shipment Label
                    </Text>
                    <TextInput
                        value={label}
                        onChangeText={setLabel}
                        placeholder={isNTS ? 'e.g. From San Diego Storage' : 'e.g. Newport RI → Memphis'}
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 px-3.5 py-3 text-sm text-slate-900 dark:text-white mb-4"
                    />

                    {/* Origin / Destination */}
                    <View className="flex-row gap-2 mb-5">
                        <View className="flex-1">
                            <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                                {isNTS ? 'Storage ZIP' : 'Origin ZIP'}
                            </Text>
                            <TextInput
                                value={originZip}
                                onChangeText={setOriginZip}
                                placeholder="00000"
                                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                keyboardType="number-pad"
                                maxLength={5}
                                className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 px-3.5 py-3 text-sm text-slate-900 dark:text-white"
                            />
                        </View>

                        <View className="items-center justify-end pb-3">
                            <ArrowRight size={16} color={isDark ? '#64748b' : '#94a3b8'} />
                        </View>

                        <View className="flex-1">
                            <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                                Destination ZIP
                            </Text>
                            <TextInput
                                value={destinationZip}
                                onChangeText={setDestinationZip}
                                placeholder={isNTS ? 'N/A' : '00000'}
                                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                keyboardType="number-pad"
                                maxLength={5}
                                editable={!isNTS}
                                className={`rounded-xl border px-3.5 py-3 text-sm ${isNTS
                                        ? 'border-slate-100 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800/30 text-slate-400 dark:text-zinc-600'
                                        : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 text-slate-900 dark:text-white'
                                    }`}
                            />
                        </View>
                    </View>

                    {/* Create Button */}
                    <ScalePressable
                        onPress={handleCreate}
                        disabled={!canCreate}
                        className={`rounded-xl py-3.5 items-center ${canCreate
                                ? 'bg-blue-600 dark:bg-blue-700 active:bg-blue-700'
                                : 'bg-slate-200 dark:bg-zinc-800'
                            }`}
                    >
                        <Text className={`text-sm font-bold ${canCreate ? 'text-white' : 'text-slate-400 dark:text-zinc-600'
                            }`}>
                            Create Shipment
                        </Text>
                    </ScalePressable>
                </Animated.View>
            </View>
        </Modal>
    );
}
