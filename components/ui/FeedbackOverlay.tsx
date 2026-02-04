import { MotiView } from 'moti';
import React, { memo } from 'react';
import { Text, View } from 'react-native';

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
            {/* 
               We use MotiView for the animation. 
               from: initial state (hidden, moved up)
               animate: target state (visible, natural position)
               exit: state when unmounting or isVisible becomes false (hidden, moved up)
            */}
            {isVisible && (
                <MotiView
                    from={{ opacity: 0, translateY: -20, scale: 0.9 }}
                    animate={{ opacity: 1, translateY: 0, scale: 1 }}
                    exit={{ opacity: 0, translateY: -20, scale: 0.9 }}
                    transition={{ type: 'timing', duration: 300 }}
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
                </MotiView>
            )}
        </View>
    );
});
