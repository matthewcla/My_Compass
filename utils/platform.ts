import { Platform } from 'react-native';

/**
 * Detects if the current environment is Mobile Web (iOS or Android browser).
 * This is distinct from a native app or desktop web.
 */
export function isMobileWeb(): boolean {
    if (Platform.OS !== 'web') {
        return false;
    }

    // Check user agent for common mobile identifiers
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
}
