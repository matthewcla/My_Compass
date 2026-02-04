import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { X } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScannerView } from './ScannerView';

interface ScannerModalProps {
    visible: boolean;
    onClose: () => void;
    onScan: (data: string) => void;
}

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

export function ScannerModal({ visible, onClose, onScan }: ScannerModalProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black">
                {/* 1. Camera Layer */}
                <View style={StyleSheet.absoluteFill}>
                    {visible && <ScannerView onScan={onScan} />}
                </View>

                {/* 2. Overlay Layer (Visual Dimming with Cutout) */}
                <View className="flex-1 items-center justify-center">

                    {/* Header: Adjusted for Safe Area + standard padding */}
                    <GlassView
                        intensity={40}
                        tint="dark"
                        className="absolute rounded-full px-6 py-3 border border-white/20"
                        style={{ top: insets.top + 20 }}
                    >
                        <Text className="text-white font-bold text-sm tracking-widest uppercase">
                            Scan Event QR Code
                        </Text>
                    </GlassView>

                    {/* Scan Frame */}
                    <View
                        style={{ width: SCAN_SIZE, height: SCAN_SIZE }}
                        className="border-2 border-emerald-400 rounded-2xl relative"
                    >
                        {/* Corner Accents (Decor) */}
                        <View className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 -mt-[2px] -ml-[2px] rounded-tl-xl" />
                        <View className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 -mt-[2px] -mr-[2px] rounded-tr-xl" />
                        <View className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 -mb-[2px] -ml-[2px] rounded-bl-xl" />
                        <View className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 -mb-[2px] -mr-[2px] rounded-br-xl" />
                    </View>

                    {/* Footer Instruction */}
                    <View className="absolute bottom-24 bg-black/60 px-4 py-2 rounded-lg">
                        <Text className="text-white/80 text-xs text-center">
                            Align code within the frame to check in
                        </Text>
                    </View>
                </View>

                {/* 3. Close Button: Adjusted for Safe Area */}
                <TouchableOpacity
                    onPress={onClose}
                    className="absolute right-6 w-10 h-10 bg-black/50 rounded-full items-center justify-center border border-white/20"
                    style={{ top: insets.top + 20 }}
                    activeOpacity={0.7}
                >
                    <X size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </Modal>
    );
}
