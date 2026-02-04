import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { X, Zap, ZapOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScannerView } from './ScannerView';

interface ScannerModalProps {
    visible: boolean;
    onClose: () => void;
    onScan: (data: string) => void;
    validator?: (code: string) => boolean;
}

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

export function ScannerModal({ visible, onClose, onScan, validator }: ScannerModalProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    const [torchOn, setTorchOn] = useState(false);
    const [scanError, setScanError] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!visible) {
            setTorchOn(false);
            setScanError(false);
        }
    }, [visible]);

    // Auto-clear error after 2 seconds
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (scanError) {
            timer = setTimeout(() => {
                setScanError(false);
            }, 2000);
        }
        return () => clearTimeout(timer);
    }, [scanError]);

    const handleScan = (data: string) => {
        if (scanError) return; // Prevent spamming if already in error state

        if (validator) {
            const isValid = validator(data);
            if (!isValid) {
                setScanError(true);
                return;
            }
        }

        // Success
        onScan(data);
    };

    const borderColor = scanError ? 'border-red-500' : 'border-emerald-400';

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
                    {visible && <ScannerView onScan={handleScan} torchOn={torchOn} />}
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
                        className={`border-2 ${borderColor} rounded-2xl relative`}
                    >
                        {/* Corner Accents (Decor) */}
                        <View className={`absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 ${borderColor} -mt-[2px] -ml-[2px] rounded-tl-xl`} />
                        <View className={`absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 ${borderColor} -mt-[2px] -mr-[2px] rounded-tr-xl`} />
                        <View className={`absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 ${borderColor} -mb-[2px] -ml-[2px] rounded-bl-xl`} />
                        <View className={`absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 ${borderColor} -mb-[2px] -mr-[2px] rounded-br-xl`} />
                    </View>

                    {/* Footer Instruction / Error */}
                    <View className="absolute bottom-24 bg-black/60 px-4 py-2 rounded-lg">
                        <Text className={`text-xs text-center ${scanError ? 'text-red-400 font-bold' : 'text-white/80'}`}>
                            {scanError ? 'Invalid QR Code' : 'Align code within the frame to check in'}
                        </Text>
                    </View>
                </View>

                {/* 3. Close Button: Adjusted for Safe Area */}
                <TouchableOpacity
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close Scanner"
                    className="absolute right-6 w-10 h-10 bg-black/50 rounded-full items-center justify-center border border-white/20"
                    style={{ top: insets.top + 20 }}
                    activeOpacity={0.7}
                >
                    <X size={20} color="#fff" />
                </TouchableOpacity>

                {/* 4. Flashlight Toggle: Adjusted for Safe Area (Left side) */}
                <TouchableOpacity
                    onPress={() => setTorchOn(!torchOn)}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle Flashlight"
                    className="absolute left-6 w-10 h-10 bg-black/50 rounded-full items-center justify-center border border-white/20"
                    style={{ top: insets.top + 20 }}
                    activeOpacity={0.7}
                >
                    {torchOn ? (
                        <Zap size={20} color="#fbbf24" fill="#fbbf24" />
                    ) : (
                        <ZapOff size={20} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </Modal>
    );
}
