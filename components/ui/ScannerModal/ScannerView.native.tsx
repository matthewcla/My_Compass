import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Safely import Camera for Expo Go compatibility
let Camera: any = null;
let useCameraDevice: any = null;
let useCodeScanner: any = null;

try {
    const visionCamera = require('react-native-vision-camera');
    Camera = visionCamera.Camera;
    useCameraDevice = visionCamera.useCameraDevice;
    useCodeScanner = visionCamera.useCodeScanner;
} catch (e) {
    console.warn("react-native-vision-camera failed to load (likely in Expo Go). Using fallback.");
}

interface ScannerViewProps {
    onScan: (code: string) => void;
}

export function ScannerView({ onScan }: ScannerViewProps) {
    const [hasPermission, setHasPermission] = useState(false);

    // If Camera lib didn't load (Expo Go), show fallback
    if (!Camera) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-900 px-10">
                <Text className="text-white text-center font-bold text-lg mb-2">Camera Unavailable</Text>
                <Text className="text-slate-400 text-center">
                    Vision Camera is not supported in Expo Go.
                    Please run `npx expo run:ios` to test the camera.
                </Text>
                {/* Mock Trigger for DX */}
                <Text
                    onPress={() => onScan('MOCK_QR_DATA')}
                    className="mt-8 text-emerald-400 font-bold uppercase tracking-widest border border-emerald-400/30 px-4 py-2 rounded-lg"
                >
                    Simulate Scan
                </Text>
            </View>
        );
    }

    const device = useCameraDevice('back');

    useEffect(() => {
        (async () => {
            if (Camera) {
                const status = await Camera.requestCameraPermission();
                setHasPermission(status === 'granted');
            }
        })();
    }, []);

    const codeScanner = useCodeScanner({
        codeTypes: ['qr', 'ean-13'],
        onCodeScanned: (codes: any[]) => {
            if (codes.length > 0 && codes[0].value) {
                onScan(codes[0].value);
            }
        },
    });

    if (!hasPermission) {
        return (
            <View className="flex-1 items-center justify-center bg-black">
                <Text className="text-white">Camera permission required</Text>
            </View>
        );
    }

    if (device == null) {
        return (
            <View className="flex-1 items-center justify-center bg-black">
                <Text className="text-white">No camera device found</Text>
            </View>
        );
    }

    return (
        <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            codeScanner={codeScanner}
        />
    );
}
