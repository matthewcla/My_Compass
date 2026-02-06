import { FeedbackOverlay, FeedbackType } from '@/components/ui/FeedbackOverlay';
import React, { useCallback, useRef, useState } from 'react';

export function useFeedback() {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<FeedbackType>('info');
    const timerRef = useRef<number | null>(null);

    const showFeedback = useCallback((msg: string, feedbackType: FeedbackType = 'info') => {
        // Clear existing timer if any
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        setMessage(msg);
        setType(feedbackType);
        setVisible(true);

        // Auto-hide after 2.5 seconds
        const newTimer = setTimeout(() => {
            setVisible(false);
            timerRef.current = null;
        }, 2500) as unknown as number;

        timerRef.current = newTimer;
    }, []);

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
