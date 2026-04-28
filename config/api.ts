import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const API_CONFIG = {
    baseUrl: (extra.apiBaseUrl as string) ?? 'https://api.dev.mycompass.navy.mil',
    timeout: 30_000,
    maxRetries: 3,
    retryBaseDelay: 1_000,
} as const;
