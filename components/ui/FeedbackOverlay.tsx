import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';

export type FeedbackType = 'success' | 'warning' | 'info';

interface FeedbackOverlayProps {
    isVisible: boolean;
    message: string;
    type: FeedbackType;
}

export const FeedbackOverlay = memo(({ isVisible, message, type }: FeedbackOverlayProps) => {
    // Determine styles based on type
    const getStyles = () => {
        switch (type) {
            case 'success':
                return {
                    containerInfo: 'bg-green-600 dark:bg-green-700',
                    textInfo: 'text-white'
                };
            case 'warning':
                return {
                    containerInfo: 'bg-amber-500 dark:bg-amber-600',
                    textInfo: 'text-white'
                };
            case 'info':
            default:
                return {
                    containerInfo: 'bg-slate-800 dark:bg-slate-700',
                    textInfo: 'text-white'
                };
        }
    };

    const { containerInfo, textInfo } = getStyles();

    return (
        <View className="absolute top-0 left-0 right-0 items-center z-50 pointer-events-none" style={{ marginTop: 60 }}>
            {isVisible && (
                <Animated.View
                    entering={ZoomIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 30,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    }}
                    className={`${containerInfo}`}
                >
                    <Text className={`font-bold text-sm ${textInfo} text-center`}>
                        {message}
                    </Text>
                </Animated.View>
            )}
        </View>
    );
});
