import { SecureLogger } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/** 5 minutes of inactivity → show warning */
const WARNING_MS = 5 * 60 * 1000;

/** 10 minutes of inactivity → hard sign-out */
const TIMEOUT_MS = 10 * 60 * 1000;

export interface IdleTimeoutResult {
    /** True when the 5-minute warning should be displayed */
    showWarning: boolean;
    /** Seconds remaining until hard sign-out (only meaningful when showWarning is true) */
    remainingSeconds: number;
    /** Call on any user interaction to reset the idle clock */
    resetTimer: () => void;
}

/**
 * IA-11: Session idle timeout.
 *
 * Behaviour:
 *  - Any touch/interaction calls resetTimer() — resets both thresholds
 *  - At 5 min idle: sets showWarning=true with a live countdown
 *  - At 10 min idle: calls onTimeout (hard sign-out)
 *  - On AppState → 'active': checks wall-clock elapsed time and either
 *    signs out immediately (>= 10 min) or resets the timer (< 10 min)
 *
 * Only runs when isActive is true (authenticated + consent acknowledged).
 *
 * @param onTimeout  Called on hard sign-out — should invoke signOut()
 * @param isActive   Whether the idle timer should be running
 */
export function useIdleTimeout(onTimeout: () => void, isActive: boolean): IdleTimeoutResult {
    const [showWarning, setShowWarning] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    // Wall-clock timestamp of last user activity
    const lastActivityRef = useRef(Date.now());

    // Store onTimeout in a ref to avoid it being a dependency of resetTimer.
    // Without this, an inline signOut() in the context value would recreate
    // resetTimer on every render, causing the timers to restart constantly.
    const onTimeoutRef = useRef(onTimeout);
    onTimeoutRef.current = onTimeout;

    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearAll = useCallback(() => {
        if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
        if (logoutTimerRef.current) { clearTimeout(logoutTimerRef.current); logoutTimerRef.current = null; }
        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    }, []);

    const resetTimer = useCallback(() => {
        if (!isActive) return;
        lastActivityRef.current = Date.now();
        clearAll();
        setShowWarning(false);
        setRemainingSeconds(0);

        // At 5 min: show warning + start countdown
        warningTimerRef.current = setTimeout(() => {
            SecureLogger.warn('[IdleTimeout] Warning threshold reached (5 min)');
            setShowWarning(true);
            setRemainingSeconds(Math.round((TIMEOUT_MS - WARNING_MS) / 1000)); // 300s
            countdownRef.current = setInterval(() => {
                setRemainingSeconds(s => Math.max(0, s - 1));
            }, 1000);
        }, WARNING_MS);

        // At 10 min: hard sign-out
        logoutTimerRef.current = setTimeout(() => {
            SecureLogger.warn('[IdleTimeout] Timeout reached (10 min) — signing out');
            clearAll();
            setShowWarning(false);
            onTimeoutRef.current();
        }, TIMEOUT_MS);
    }, [isActive, clearAll]);

    // Start / stop based on session active state
    useEffect(() => {
        if (isActive) {
            resetTimer();
        } else {
            clearAll();
            setShowWarning(false);
            setRemainingSeconds(0);
        }
        return clearAll;
    }, [isActive, resetTimer, clearAll]);

    // AppState: detect long background periods via wall-clock diff
    useEffect(() => {
        if (!isActive) return;

        const handleAppStateChange = (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                const elapsed = Date.now() - lastActivityRef.current;
                if (elapsed >= TIMEOUT_MS) {
                    SecureLogger.warn('[IdleTimeout] Session expired while backgrounded — signing out');
                    clearAll();
                    setShowWarning(false);
                    onTimeoutRef.current();
                } else {
                    // Returning to foreground counts as activity
                    resetTimer();
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [isActive, clearAll, resetTimer]);

    return { showWarning, remainingSeconds, resetTimer };
}
