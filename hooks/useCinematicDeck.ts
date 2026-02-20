import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

interface UseCinematicDeckProps {
    totalSteps: number;
    onComplete?: () => void;
    onExit?: () => void;
}

export function useCinematicDeck({ totalSteps, onComplete, onExit }: UseCinematicDeckProps) {
    const router = useRouter();
    const [step, setStep] = useState(0);

    const next = useCallback(() => {
        if (step < totalSteps - 1) {
            setStep((prev) => prev + 1);
        } else if (onComplete) {
            onComplete();
        }
    }, [step, totalSteps, onComplete]);

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
        isLast: step === totalSteps - 1,
    };
}
