import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { usePCSStore } from '@/store/usePCSStore';
import { ReceiptCategory } from '@/types/pcs';
import { getShadow } from '@/utils/getShadow';
import { scanReceipt } from '@/utils/receiptOCR';
import * as ImagePicker from 'expo-image-picker';
import { Camera, DollarSign, Fuel, Home, Receipt, Trash2, Utensils } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const CATEGORY_CONFIG: Record<ReceiptCategory, { icon: any; label: string; color: string }> = {
    GAS: { icon: Fuel, label: 'Gas', color: '#f59e0b' },
    LODGING: { icon: Home, label: 'Lodging', color: '#6366f1' },
    TOLLS: { icon: Receipt, label: 'Tolls', color: '#0ea5e9' },
    MEALS: { icon: Utensils, label: 'Meals', color: '#10b981' },
    OTHER: { icon: DollarSign, label: 'Other', color: '#64748b' },
};

export function ReceiptScannerWidget() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [isCapturing, setIsCapturing] = useState(false);

    const receipts = usePCSStore(state => state.receipts);
    const addReceipt = usePCSStore(state => state.addReceipt);
    const removeReceipt = usePCSStore(state => state.removeReceipt);

    const receiptCount = receipts.length;
    const runningTotal = receipts.reduce((sum, r) => sum + (r.amount ?? 0), 0);

    const handleCapture = useCallback(async () => {
        setIsCapturing(true);
        try {
            const permResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permResult.granted) {
                Alert.alert('Camera Required', 'Please allow camera access to scan receipts.');
                setIsCapturing(false);
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                quality: 0.8,
                allowsEditing: false,
            });

            if (result.canceled || !result.assets?.[0]) {
                setIsCapturing(false);
                return;
            }

            const imageUri = result.assets[0].uri;

            // Run OCR
            let amount: number | null = null;
            let category: ReceiptCategory = 'OTHER';
            let confidence: 'high' | 'medium' | 'low' = 'low';

            try {
                const ocrResult = await scanReceipt(imageUri);
                amount = ocrResult.extractedAmount;
                category = ocrResult.detectedCategory;
                confidence = ocrResult.confidence;
            } catch {
                // OCR failed silently — user can enter amount manually
            }

            addReceipt({
                imageUri,
                amount,
                category,
                note: '',
                ocrConfidence: confidence,
            });
        } catch (err) {
            Alert.alert('Error', 'Could not capture receipt. Please try again.');
        } finally {
            setIsCapturing(false);
        }
    }, [addReceipt]);

    const handleDelete = useCallback((id: string) => {
        Alert.alert('Delete Receipt', 'Remove this receipt?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => removeReceipt(id) },
        ]);
    }, [removeReceipt]);

    const recentReceipts = receipts.slice(-3).reverse();

    return (
        <View style={getShadow({
            shadowColor: isDark ? '#f59e0b' : '#d97706',
            shadowOpacity: isDark ? 0.08 : 0.1,
            shadowRadius: isDark ? 10 : 14,
            elevation: 3,
        })}>
            <GlassView
                intensity={60}
                tint={isDark ? 'dark' : 'light'}
                className="rounded-xl overflow-hidden border border-amber-200/30 dark:border-amber-800/30"
            >
                <View className="p-5">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-col">
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                                Travel Receipts
                            </Text>
                            <View className="flex-row items-baseline gap-1.5">
                                <Text className="text-3xl font-bold text-slate-900 dark:text-white leading-none">
                                    {receiptCount}
                                </Text>
                                <Text className="text-sm text-slate-400 font-medium">
                                    {receiptCount === 1 ? 'Receipt' : 'Receipts'}
                                </Text>
                                {runningTotal > 0 && (
                                    <Text className="text-sm font-semibold text-amber-600 dark:text-amber-400 ml-2">
                                        ${runningTotal.toFixed(2)}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Capture Button */}
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={handleCapture}
                            disabled={isCapturing}
                            style={getShadow({
                                shadowColor: isDark ? '#fbbf24' : '#d97706',
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                                elevation: 4,
                            })}
                        >
                            <GlassView
                                intensity={40}
                                tint={isDark ? 'dark' : 'light'}
                                className="w-11 h-11 rounded-full items-center justify-center border border-white/20 bg-amber-500/10"
                            >
                                <Camera
                                    size={20}
                                    color={isDark ? '#fbbf24' : '#d97706'}
                                    strokeWidth={2.5}
                                />
                            </GlassView>
                        </TouchableOpacity>
                    </View>

                    {/* Recent Receipts */}
                    {recentReceipts.length > 0 ? (
                        <View className="gap-2">
                            {recentReceipts.map((receipt) => {
                                const config = CATEGORY_CONFIG[receipt.category];
                                const Icon = config.icon;
                                return (
                                    <Animated.View
                                        key={receipt.id}
                                        entering={FadeInDown.duration(200)}
                                    >
                                        <View
                                            className="flex-row items-center rounded-lg px-3 py-2.5 border-[1.5px] border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50"
                                        >
                                            {/* Thumbnail */}
                                            <Image
                                                source={{ uri: receipt.imageUri }}
                                                className="w-8 h-8 rounded"
                                                resizeMode="cover"
                                            />

                                            {/* Category + Amount */}
                                            <View className="flex-1 ml-3">
                                                <View className="flex-row items-center gap-1.5">
                                                    <Icon size={12} color={config.color} />
                                                    <Text className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                                                        {config.label}
                                                    </Text>
                                                </View>
                                                <Text className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {receipt.amount != null ? `$${receipt.amount.toFixed(2)}` : 'Amount TBD'}
                                                </Text>
                                            </View>

                                            {/* Delete */}
                                            <TouchableOpacity
                                                onPress={() => handleDelete(receipt.id)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                className="p-1"
                                            >
                                                <Trash2
                                                    size={14}
                                                    color={isDark ? '#94a3b8' : '#94a3b8'}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                );
                            })}
                        </View>
                    ) : (
                        // Empty state
                        <Animated.View entering={FadeIn} className="items-center py-2">
                            <Text className="text-xs text-slate-400 dark:text-slate-500 text-center">
                                Tap the camera to snap your first receipt
                            </Text>
                        </Animated.View>
                    )}
                </View>
            </GlassView>
        </View>
    );
}
