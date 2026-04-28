import { FeedbackOverlay, FeedbackType } from '@/components/ui/FeedbackOverlay';
import React, { useCallback, useState } from 'react';

export function useFeedback() {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<FeedbackType>('info');
    const [timer, setTimer] = useState<number | null>(null);

    const showFeedback = useCallback((msg: string, feedbackType: FeedbackType = 'info') => {
        // Clear existing timer if any
        if (timer) {
            clearTimeout(timer);
        }

        setMessage(msg);
        setType(feedbackType);
        setVisible(true);

        // Auto-hide after 2.5 seconds
        const newTimer = setTimeout(() => {
            setVisible(false);
        }, 2500) as unknown as number;

        setTimer(newTimer);
    }, [timer]);

    // Component to render in the parent
    const FeedbackComponent = useCallback(() => (
        <FeedbackOverlay isVisible={visible} message={message} type={type} />
    ), [visible, message, type]);

    return {
        showFeedback,
        FeedbackComponent,
        isFeedbackVisible: visible
    };
}
