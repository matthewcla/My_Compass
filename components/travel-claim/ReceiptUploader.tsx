import * as ImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, Pressable, Text, View, useColorScheme } from 'react-native';

interface ReceiptUploaderProps {
  onPhotoSelected: (uri: string) => void;
  existingUri?: string;
  label?: string;
}

/**
 * Receipt photo upload component with camera and gallery options.
 *
 * Features:
 * - Take photo with camera
 * - Choose from gallery
 * - Show thumbnail if photo exists
 * - Replace existing photo
 * - Request permissions on first use
 *
 * Requires: expo-image-picker
 * Install: npx expo install expo-image-picker
 */
export function ReceiptUploader({
  onPhotoSelected,
  existingUri,
  label = 'Receipt Photo',
}: ReceiptUploaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [hasPermission, setHasPermission] = useState(false);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    // Request camera permission if not already granted
    if (!hasPermission) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in Settings to take receipt photos.',
          [{ text: 'OK' }]
        );
        return;
      }
      setHasPermission(true);
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7, // Compress to reduce storage
        allowsEditing: false,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[ReceiptUploader] Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[ReceiptUploader] Gallery error:', error);
      Alert.alert('Error', 'Failed to pick photo. Please try again.');
    }
  };

  const removePhoto = () => {
    Alert.alert(
      'Remove Receipt',
      'Are you sure you want to remove this receipt photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onPhotoSelected(''),
        },
      ]
    );
  };

  return (
    <View className="gap-3">
      {/* Label */}
      <Text className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </Text>

      {/* Existing Photo Thumbnail */}
      {existingUri ? (
        <View className="rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <Image
            source={{ uri: existingUri }}
            className="w-full h-48"
            resizeMode="cover"
            accessibilityLabel="Receipt photo thumbnail"
          />

          {/* Remove Button Overlay */}
          <Pressable
            onPress={removePhoto}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 items-center justify-center shadow-lg active:bg-red-600"
            accessibilityRole="button"
            accessibilityLabel="Remove receipt photo"
          >
            <X size={16} color="white" strokeWidth={3} />
          </Pressable>

          {/* Replace Photo Buttons */}
          <View className="flex-row gap-2 p-3 bg-white/95 dark:bg-slate-900/95">
            <Pressable
              onPress={takePhoto}
              className="flex-1 py-2.5 bg-blue-600 rounded-lg flex-row items-center justify-center gap-2 active:bg-blue-700"
              accessibilityRole="button"
              accessibilityLabel="Retake photo with camera"
            >
              <Camera size={16} color="white" />
              <Text className="text-white font-semibold text-sm">Retake</Text>
            </Pressable>

            <Pressable
              onPress={pickPhoto}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg flex-row items-center justify-center gap-2 active:bg-slate-200 dark:active:bg-slate-600"
              accessibilityRole="button"
              accessibilityLabel="Replace with photo from gallery"
            >
              <ImageIcon size={16} color={isDark ? '#e2e8f0' : '#334155'} />
              <Text className="text-slate-700 dark:text-slate-200 font-semibold text-sm">
                Replace
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* Add Photo Buttons */
        <View className="flex-row gap-3">
          <Pressable
            onPress={takePhoto}
            className="flex-1 py-3.5 bg-blue-600 rounded-xl flex-row items-center justify-center gap-2 active:bg-blue-700 shadow-sm"
            accessibilityRole="button"
            accessibilityLabel="Take photo with camera"
          >
            <Camera size={20} color="white" />
            <Text className="text-white font-semibold text-base">Take Photo</Text>
          </Pressable>

          <Pressable
            onPress={pickPhoto}
            className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex-row items-center justify-center gap-2 active:bg-slate-200 dark:active:bg-slate-700 border border-slate-200 dark:border-slate-700"
            accessibilityRole="button"
            accessibilityLabel="Choose photo from gallery"
          >
            <ImageIcon size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text className="text-slate-700 dark:text-slate-300 font-semibold text-base">
              Choose Photo
            </Text>
          </Pressable>
        </View>
      )}

      {/* Helper Text */}
      <Text className="text-xs text-slate-500 dark:text-slate-400">
        {existingUri
          ? 'Receipt photo attached. Tap to replace or remove.'
          : 'Required for expenses ≥ $75 per JTR regulations'}
      </Text>
    </View>
  );
}
