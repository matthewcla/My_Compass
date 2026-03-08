/**
 * ShipmentCreationModal — Bottom-sheet modal for creating new HHG shipments.
 * Supports GBL (government shipment), PPM (personally procured move), and NTS (storage release).
 */
import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
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
                    style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                >
                    <GlassView
                        intensity={95}
                        tint={isDark ? 'dark' : 'light'}
                        className="rounded-t-3xl overflow-hidden border-t border-slate-200 dark:border-white/10 pt-4 px-4"
                        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                    >
                        {/* Handle */}
                        <View className="items-center mb-3">
                            <View className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-white/20" />
                        </View>

                        <Text className="text-xl font-bold text-slate-900 dark:text-white mb-0.5 tracking-tight">
                            New Shipment
                        </Text>
                        <Text className="text-[13px] text-slate-500 dark:text-slate-400 mb-5">
                            Add another lot of HHG to your move plan.
                        </Text>

                        {/* Type Selector */}
                        <View className="gap-2.5 mb-5">
                            {SHIPMENT_TYPES.map(({ type, label: typeLabel, desc, icon: Icon }) => {
                                const isSelected = selectedType === type;
                                return (
                                    <ScalePressable
                                        key={type}
                                        onPress={() => setSelectedType(type)}
                                        className={`rounded-xl border px-3.5 py-3.5 flex-row items-center ${isSelected
                                            ? 'bg-blue-500/10 border-blue-500/40'
                                            : 'bg-white/50 dark:bg-slate-800/40 border-slate-200 dark:border-white/10'
                                            }`}
                                    >
                                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 border ${isSelected
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'bg-white/80 border-slate-200 dark:bg-slate-700/50 dark:border-white/5'
                                            }`}>
                                            <Icon size={18} color={isSelected ? '#ffffff' : (isDark ? '#cbd5e1' : '#64748b')} strokeWidth={isSelected ? 2.5 : 2} />
                                        </View>
                                        <View className="flex-1">
                                            <Text className={`text-[15px] font-bold tracking-tight ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'
                                                }`}>{typeLabel}</Text>
                                            <Text className={`text-[12px] mt-0.5 ${isSelected ? 'text-blue-600/80 dark:text-blue-200/70' : 'text-slate-500 dark:text-slate-400'}`}>{desc}</Text>
                                        </View>
                                        {isSelected && (
                                            <View className="w-5 h-5 rounded-full bg-blue-500 items-center justify-center shadow-sm">
                                                <View className="w-2 h-2 rounded-full bg-white relative top-[0.5px]" />
                                            </View>
                                        )}
                                    </ScalePressable>
                                );
                            })}
                        </View>

                        {/* Label */}
                        <Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                            Shipment Label
                        </Text>
                        <TextInput
                            value={label}
                            onChangeText={setLabel}
                            placeholder={isNTS ? 'e.g. From San Diego Storage' : 'e.g. Newport RI → Memphis'}
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 px-4 py-3.5 text-sm text-slate-900 dark:text-white mb-5 font-medium"
                        />

                        {/* Origin / Destination */}
                        <View className="flex-row gap-3 mb-6">
                            <View className="flex-1">
                                <Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                                    {isNTS ? 'Storage ZIP' : 'Origin ZIP'}
                                </Text>
                                <TextInput
                                    value={originZip}
                                    onChangeText={setOriginZip}
                                    placeholder="00000"
                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                    keyboardType="number-pad"
                                    maxLength={5}
                                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 px-4 py-3.5 text-sm text-slate-900 dark:text-white font-medium text-center"
                                />
                            </View>

                            <View className="items-center justify-end pb-3.5">
                                <ArrowRight size={16} color={isDark ? '#64748b' : '#94a3b8'} strokeWidth={2.5} />
                            </View>

                            <View className="flex-1">
                                <Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                                    Destination ZIP
                                </Text>
                                <TextInput
                                    value={destinationZip}
                                    onChangeText={setDestinationZip}
                                    placeholder={isNTS ? 'N/A' : '00000'}
                                    placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
                                    keyboardType="number-pad"
                                    maxLength={5}
                                    editable={!isNTS}
                                    className={`rounded-xl border px-4 py-3.5 text-sm font-medium text-center ${isNTS
                                        ? 'border-slate-100 dark:border-white/5 bg-slate-100/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600'
                                        : 'border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 text-slate-900 dark:text-white'
                                        }`}
                                />
                            </View>
                        </View>

                        {/* Create Button */}
                        <ScalePressable
                            onPress={handleCreate}
                            disabled={!canCreate}
                            className={`rounded-xl py-4 items-center mb-2 ${canCreate
                                ? 'bg-blue-600 dark:bg-blue-600 active:bg-blue-700'
                                : 'bg-slate-200 dark:bg-slate-800/60 border border-transparent dark:border-white/5'
                                }`}
                        >
                            <Text className={`text-sm tracking-wide font-bold ${canCreate ? 'text-white' : 'text-slate-400 dark:text-slate-600'
                                }`}>
                                CREATE SHIPMENT
                            </Text>
                        </ScalePressable>
                    </GlassView>
                </Animated.View>
            </View>
        </Modal>
    );
}
