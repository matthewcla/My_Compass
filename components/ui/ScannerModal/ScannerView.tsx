import jsQR from 'jsqr';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ScannerViewProps {
    onScan: (code: string) => void;
    torchOn?: boolean;
}

export function ScannerView({ onScan, torchOn }: ScannerViewProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let animationFrameId: number;
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                // Request camera stream
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Wait for video to be ready requires correct attribute on video element
                    videoRef.current.setAttribute('playsinline', 'true'); // required to tell iOS safari we don't want fullscreen
                    videoRef.current.play();
                    requestAnimationFrame(tick);
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Camera access denied or not supported.");
            }
        };

        const tick = () => {
            if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const canvas2d = canvas.getContext('2d');

                if (canvas2d) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    canvas2d.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const imageData = canvas2d.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code) {
                        onScan(code.data);
                        // Optional: Pause scanning after success?
                        // For now, parent handles closing/debouncing
                    }
                }
            }
            animationFrameId = requestAnimationFrame(tick);
        };

        startCamera();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onScan]);

    if (error) {
        return (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: 'white' }}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'black', overflow: 'hidden' }}>
            {/* 
                We use a raw <div> wrapper to mount standard HTML elements 
                This is valid in React Native Web but may show type errors in RN Typescript without web types.
                We suppress or ignore if needed, but 'createElement' is safer.
            */}
            <View style={{ flex: 1 }}>
                <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </View>
        </View>
    );
}
