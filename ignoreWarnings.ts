import { LogBox } from 'react-native';

if (__DEV__) {
    const ignoreWarns = [
        'SafeAreaView has been deprecated',
        'WARN SafeAreaView has been deprecated',
        'SafeAreaView has been deprecated and will be removed in a future release',
        "SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead.",
        "SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead. See https://github.com/th3rdwave/react-native-safe-area-context",
        'expo-notifications',
        'react-native-vision-camera failed to load',
    ];

    const warn = console.warn;
    console.warn = (...arg) => {
        for (const warning of ignoreWarns) {
            if (arg[0].startsWith(warning)) {
                return;
            }
        }
        warn(...arg);
    };

    LogBox.ignoreLogs(ignoreWarns);
}
