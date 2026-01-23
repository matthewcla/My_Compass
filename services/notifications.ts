import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Registers the device for push notifications.
 * - Checks for physical device (simulator restriction).
 * - Requests permissions if not granted.
 * - Retrieves the ExpoPushToken.
 * - Configures Android notification channels.
 * 
 * @returns {Promise<string | undefined>} The ExpoPushToken or undefined if failed.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        // For development, we might just return undefined or a mock token if needed,
        // but usually logging is enough to let the dev know.
        return undefined;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return undefined;
    }

    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

        if (!projectId) {
            // In bare workflow or if not configured, this might be null.
            // For managed Expo Go workflow, it usually works without ID, but explicit ID is safer if using EAS.
            // We'll try without ID first if missing, or specific if needed.
            // However, getExpoPushTokenAsync usually requires projectId if not in Expo Go.
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        return tokenData.data;
    } catch (e) {
        console.error('Error fetching push token:', e);
        return undefined;
    }
}
