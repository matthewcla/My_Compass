import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const logAttendance = useCalendarStore((state) => state.logAttendance);
  const events = useCalendarStore((state) => state.getEvents());
  const insets = useSafeAreaInsets();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
      if (scanned) return;
      setScanned(true);

      // Check if data matches an event ID
      const event = events.find(e => e.id === data);

      if (event) {
          logAttendance(event.id);
          Alert.alert(
              "Check-in Successful",
              `You have been checked in to ${event.title}`,
              [{ text: "OK", onPress: () => router.back() }]
          );
      } else {
           Alert.alert(
              "Invalid QR Code",
              `No event found for code: ${data}`,
              [{ text: "Try Again", onPress: () => setScanned(false) }]
          );
      }
  };

  const simulateScan = () => {
       // Find a career event or just the first event
       const event = events.find(e => e.type === 'career_event') || events[0];
       if (event) {
           handleBarCodeScanned({ type: 'qr', data: event.id });
       }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
            barcodeTypes: ["qr"],
        }}
      >
        <View style={[styles.overlay, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                <X color="white" size={32} />
            </TouchableOpacity>

            <View style={styles.scanFrame} />

            <View style={styles.controls}>
                 <Text style={styles.instruction}>Scan Event QR Code</Text>
                 {/* Simulation Button for Dev/Simulator */}
                 <TouchableOpacity onPress={simulateScan} style={styles.simButton}>
                     <Text style={styles.simText}>Simulate Scan (Dev)</Text>
                 </TouchableOpacity>
            </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 50,
  },
  closeButton: {
      alignSelf: 'flex-start',
      padding: 20,
  },
  scanFrame: {
      width: 250,
      height: 250,
      borderWidth: 2,
      borderColor: 'white',
      borderRadius: 20,
      backgroundColor: 'transparent',
  },
  controls: {
      alignItems: 'center',
      gap: 20,
  },
  instruction: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
  },
  simButton: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
  },
  simText: {
      color: 'white',
      fontSize: 14,
  }
});
