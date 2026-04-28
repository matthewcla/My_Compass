import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

interface UseCinematicDeckProps {
    totalSteps: number;
    onComplete?: () => void;
    onExit?: () => void;
}

export function useCinematicDeck({ totalSteps, onComplete, onExit }: UseCinematicDeckProps) {
    const router = useRouter();
    const [step, setStep] = useState(0);

    const next = useCallback(() => {
        setStep((prev) => {
            if (totalSteps <= 0) {
                return 0;
            }

            return Math.min(prev + 1, totalSteps);
        });
    }, [totalSteps]);

    useEffect(() => {
        setStep((prev) => Math.min(prev, totalSteps));
    }, [totalSteps]);

    useEffect(() => {
        if (totalSteps > 0 && step === totalSteps) {
            onComplete?.();
        }
    }, [onComplete, step, totalSteps]);

    const back = useCallback(() => {
        if (step > 0) {
            setStep((prev) => prev - 1);
        } else if (onExit) {
            onExit();
        } else {
            router.back();
        }
    }, [step, onExit, router]);

    const goTo = useCallback((index: number) => {
        if (index >= 0 && index < totalSteps) {
            setStep(index);
        }
    }, [totalSteps]);

    const reset = useCallback(() => {
        setStep(0);
    }, []);

    return {
        step,
        next,
        back,
        goTo,
        reset,
        isFirst: step === 0,
        isLast: totalSteps > 0 && step >= totalSteps - 1,
    };
}
