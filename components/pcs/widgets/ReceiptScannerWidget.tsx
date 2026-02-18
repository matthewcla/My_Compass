import { GlassView } from '@/components/ui/GlassView';
import { Camera } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

/**
 * ReceiptScannerWidget — Phase 3 widget stub.
 * Appears during TRANSIT_LEAVE → ACTIVE_TRAVEL sub-phase.
 * Full OCR integration is a future task.
 */
export function ReceiptScannerWidget() {
    return (
        <GlassView className="p-4 rounded-2xl">
            <View className="flex-row items-center space-x-3">
                <View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center">
                    <Camera size={20} color="#F59E0B" />
                </View>
                <View className="flex-1">
                    <Text className="text-white font-semibold text-base">Receipt Scanner</Text>
                    <Text className="text-white/60 text-xs mt-0.5">
                        Snap receipts for lodging, fuel, and tolls
                    </Text>
                </View>
            </View>
        </GlassView>
    );
}
