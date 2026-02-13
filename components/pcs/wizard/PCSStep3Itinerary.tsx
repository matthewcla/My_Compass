import { useColorScheme } from '@/components/useColorScheme';
import { WizardCard } from '@/components/wizard/WizardCard';
import { usePCSStore } from '@/store/usePCSStore';
import { PCSStop } from '@/types/pcs';
import { Bed, MapPin, Plus, Trash2, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface PCSStep3ItineraryProps {
    embedded?: boolean;
}

export function PCSStep3Itinerary({ embedded = false }: PCSStep3ItineraryProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const currentDraft = usePCSStore((state) => state.currentDraft);
    const updateDraft = usePCSStore((state) => state.updateDraft);
    const activeOrder = usePCSStore((state) => state.activeOrder);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newStop, setNewStop] = useState<Partial<PCSStop>>({
        location: '',
        arrivalDate: '',
        departureDate: '',
        reason: 'LEISURE',
    });

    const { originName, destName } = useMemo(() => {
        if (!currentDraft || !activeOrder) return { originName: 'Origin', destName: 'Destination' };
        const index = activeOrder.segments.findIndex(s => s.id === currentDraft.id);
        const prev = index > 0 ? activeOrder.segments[index - 1] : null;
        return {
            originName: prev?.location.name || 'Origin',
            destName: currentDraft.location.name || 'Destination'
        };
    }, [currentDraft, activeOrder]);

    const handleAddStop = () => {
        if (!newStop.location || !newStop.arrivalDate || !newStop.departureDate) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }

        const stop: PCSStop = {
            id: Math.random().toString(36).substring(7),
            location: newStop.location,
            arrivalDate: newStop.arrivalDate,
            departureDate: newStop.departureDate,
            reason: newStop.reason as 'LEISURE' | 'OFFICIAL',
        };

        const updatedStops = [...(currentDraft?.userPlan.stops || []), stop];
        updateDraft({
            userPlan: {
                ...currentDraft!.userPlan,
                stops: updatedStops,
            },
        });

        setIsModalVisible(false);
        setNewStop({ location: '', arrivalDate: '', departureDate: '', reason: 'LEISURE' });
    };

    const handleRemoveStop = (stopId: string) => {
        const updatedStops = currentDraft?.userPlan.stops?.filter(s => s.id !== stopId) || [];
        updateDraft({
            userPlan: {
                ...currentDraft!.userPlan,
                stops: updatedStops,
            },
        });
    };

    if (!currentDraft) return null;

    const content = (
        <View>
            {/* Origin Node */}
            <View className="flex-row mb-0">
                <View className="items-center mr-4">
                    <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center z-10">
                        <MapPin size={16} color="white" />
                    </View>
                    <View className="w-[2px] h-full bg-slate-300 dark:bg-slate-700 absolute top-8" />
                </View>
                <View className="flex-1 pb-8">
                    <Text className="text-base font-bold text-slate-900 dark:text-white">{originName}</Text>
                    <Text className="text-sm text-slate-500 dark:text-slate-400">Depart: {new Date(currentDraft.dates.projectedDeparture).toLocaleDateString()}</Text>
                </View>
            </View>

            {/* Stops List */}
            {currentDraft.userPlan.stops?.map((stop, index) => (
                <View key={stop.id} className="flex-row mb-0">
                    <View className="items-center mr-4">
                        <View className="w-8 h-8 rounded-full bg-orange-500 items-center justify-center z-10 shadow-sm border-2 border-slate-50 dark:border-slate-950">
                            <Bed size={16} color="white" />
                        </View>
                        <View className="w-[2px] h-full bg-slate-300 dark:bg-slate-700 absolute top-8" />
                    </View>
                    <View className="flex-1 pb-8">
                        <View className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-row justify-between items-start">
                            <View className="flex-1">
                                <Text className="text-base font-bold text-slate-900 dark:text-white">{stop.location}</Text>
                                <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {new Date(stop.arrivalDate).toLocaleDateString()} - {new Date(stop.departureDate).toLocaleDateString()}
                                </Text>
                                <View className="flex-row mt-2">
                                    <View className={`px-2 py-0.5 rounded ${stop.reason === 'OFFICIAL' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'}`}>
                                        <Text className={`text-xs font-semibold ${stop.reason === 'OFFICIAL' ? 'text-blue-700 dark:text-blue-300' : 'text-purple-700 dark:text-purple-300'}`}>
                                            {stop.reason}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => handleRemoveStop(stop.id)} className="p-2">
                                <Trash2 size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ))}

            {/* Add Stop Button Node */}
            <View className="flex-row mb-0">
                <View className="items-center mr-4">
                    <View className="w-8 h-8 items-center justify-center" />
                    <View className="w-[2px] h-full bg-slate-300 dark:bg-slate-700 absolute top-[-30px] bottom-0" />
                </View>
                <View className="flex-1 pb-8">
                    <TouchableOpacity
                        onPress={() => setIsModalVisible(true)}
                        className="flex-row items-center justify-center p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl active:bg-slate-100 dark:active:bg-slate-900"
                    >
                        <Plus size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                        <Text className="font-semibold text-slate-500 dark:text-slate-400 ml-2">Add Stop</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Destination Node */}
            <View className="flex-row">
                <View className="items-center mr-4">
                    <View className="w-8 h-8 rounded-full bg-emerald-600 items-center justify-center z-10">
                        <MapPin size={16} color="white" />
                    </View>
                    <View className="w-[2px] h-8 bg-slate-300 dark:bg-slate-700 absolute top-[-32px]" />
                </View>
                <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900 dark:text-white">{destName}</Text>
                    <Text className="text-sm text-slate-500 dark:text-slate-400">Arrive: {new Date(currentDraft.dates.projectedArrival).toLocaleDateString()}</Text>
                </View>
            </View>

            {/* Add Stop Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 h-[70%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-slate-900 dark:text-white">Add Stop</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <X size={24} color={isDark ? 'white' : 'black'} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <View className="space-y-4">
                                <View>
                                    <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Location (City, State)</Text>
                                    <TextInput
                                        className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                                        placeholder="e.g. Memphis, TN"
                                        placeholderTextColor="#94a3b8"
                                        value={newStop.location}
                                        onChangeText={(text) => setNewStop({ ...newStop, location: text })}
                                    />
                                </View>

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Arrival Date</Text>
                                        <TextInput
                                            className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor="#94a3b8"
                                            value={newStop.arrivalDate}
                                            onChangeText={(text) => setNewStop({ ...newStop, arrivalDate: text })}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Departure Date</Text>
                                        <TextInput
                                            className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor="#94a3b8"
                                            value={newStop.departureDate}
                                            onChangeText={(text) => setNewStop({ ...newStop, departureDate: text })}
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reason</Text>
                                    <View className="flex-row gap-4">
                                        <Pressable
                                            onPress={() => setNewStop({ ...newStop, reason: 'LEISURE' })}
                                            className={`flex-1 p-3 rounded-xl border items-center ${newStop.reason === 'LEISURE'
                                                ? 'bg-purple-50 border-purple-500 dark:bg-purple-900/20'
                                                : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                                }`}
                                        >
                                            <Text className={`font-semibold ${newStop.reason === 'LEISURE' ? 'text-purple-700 dark:text-purple-300' : 'text-slate-500'}`}>Leisure</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => setNewStop({ ...newStop, reason: 'OFFICIAL' })}
                                            className={`flex-1 p-3 rounded-xl border items-center ${newStop.reason === 'OFFICIAL'
                                                ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
                                                : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                                }`}
                                        >
                                            <Text className={`font-semibold ${newStop.reason === 'OFFICIAL' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500'}`}>Official</Text>
                                        </Pressable>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={handleAddStop}
                                    className="bg-blue-600 p-4 rounded-xl items-center mt-4"
                                >
                                    <Text className="text-white font-bold text-lg">Add Stop</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );

    if (embedded) return content;

    return (
        <WizardCard title="Itinerary" noPadding>
            <View className="p-4">{content}</View>
        </WizardCard>
    );
}
