import { differenceInDays, isValid, parseISO } from 'date-fns';

/**
 * Parses a time string (HH:mm) into minutes from midnight.
 */
function parseTime(timeStr: string): number {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Parses a working hours string (e.g. "0700-1600") into start and end minutes from midnight.
 * Returns null if "NONE" or invalid.
 */
function parseWorkingHours(whStr: string): { start: number; end: number } | null {
    if (!whStr || whStr.toUpperCase() === 'NONE') return null;

    // Handle "0700-1600" or "07:00-16:00" format
    const cleaned = whStr.replace(/:/g, '');
    const parts = cleaned.split('-');
    if (parts.length !== 2) return null;

    const startH = parseInt(parts[0].substring(0, 2), 10);
    const startM = parseInt(parts[0].substring(2, 4), 10);
    const endH = parseInt(parts[1].substring(0, 2), 10);
    const endM = parseInt(parts[1].substring(2, 4), 10);

    return {
        start: startH * 60 + startM,
        end: endH * 60 + endM
    };
}

export interface LeaveCalculationInput {
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    departureWorkingHours: string; // "0700-1600" or "NONE"
    returnWorkingHours: string;    // "0700-1600" or "NONE"
}

export interface LeaveCalculationResult {
    chargeableDays: number;
    projectedBalance: number;
    isOverdraft: boolean;
    errors: string[];
}

/**
 * Calculates chargeable leave days based on Navy rules (MILPERSMAN 1050-010).
 */
export function calculateLeave(
    input: LeaveCalculationInput,
    currentBalance: number
): LeaveCalculationResult {
    const { startDate, endDate, startTime, endTime, departureWorkingHours, returnWorkingHours } = input;
    const errors: string[] = [];

    if (!startDate || !endDate) {
        return { chargeableDays: 0, projectedBalance: currentBalance, isOverdraft: false, errors: [] };
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (!isValid(start) || !isValid(end)) {
        return { chargeableDays: 0, projectedBalance: currentBalance, isOverdraft: false, errors: ['Invalid dates'] };
    }

    if (end < start) {
        return {
            chargeableDays: 0,
            projectedBalance: currentBalance, // FORCE RESET to current balance
            isOverdraft: false,
            errors: ['End date cannot be before start date']
        };
    }

    // Basic day difference (inclusive usually, but we refine based on rules)
    // MILPERSMAN usually counts first day and last day based on logic.
    // Base diff:
    let dayCount = differenceInDays(end, start) + 1;

    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);

    // --- Day of Departure Rule ---
    // Generally counted as day of duty (not leave), unless leave commences prior to end of normal workday.
    // If "NONE" (non-workday), it is leave?
    // "If leave starts on a workday, the hour entered may not be prior to the end of the normal workday." -> If it is prior, it's a validation error or it becomes leave?
    // Actually, normally: You depart AFTER work -> Day of Duty (Chargeable = 0 for that day).
    // If you depart BEFORE work ends -> Chargeable = 1.

    // However, the rule stated in prompt: "If leave starts on a workday, the hour entered may not be prior to the end of the normal workday."
    // This implies strictly: YOU CANNOT LEAVE EARLY on a "Leave" status unless you take the whole day? Or maybe it just means if you leave early, it's chargeable.
    // Let's interpret "Day of Departure generally counted as day of duty".
    // This implies: Chargeable Days = Total Days - 1 (Start Day) ... unless condition met.

    const depWH = parseWorkingHours(departureWorkingHours);
    const retWH = parseWorkingHours(returnWorkingHours);

    // Check Start Day
    let startDayIsChargeable = true;

    if (depWH) {
        // It is a workday
        // Logic: Counted as day of duty (NOT chargeable) if leave commences AT or AFTER end of workday.
        // If startMinutes >= depWH.end -> Day of Duty (Deduced from total).
        if (startMinutes >= depWH.end) {
            startDayIsChargeable = false;
        } else {
            // Leaving before work ends.
            // Prompt rule: "the hour entered may not be prior to the end of the normal workday."
            // This sounds like a VALIDATION rule preventing user from entering it, rather than just a charge logic.
            // But if allowed, it would be chargeable.
            // Let's add a warning/error if they try to leave early on a workday? 
            // Usually you can take "half day" but Navy leave is usually whole days.
            // Use strict interpretation of prompt: "hour entered may not be prior to..."
            errors.push("Departure time cannot be earlier than end of working hours on a workday.");
        }
    } else {
        // Non-workday (Weekend/Holiday)
        // Prompt: "starting hour may be 0001".
        // Generally counts as leave (Chargeable).
        startDayIsChargeable = true;
    }

    // Check End Day
    // Logic: Generally counted as day of leave (Chargeable), unless return is made AT or BEFORE commencement of normal workday.
    let endDayIsChargeable = true;

    if (retWH) {
        // Workday
        // If returnMinutes <= retWH.start -> Day of Duty (Not Chargeable).
        if (endMinutes <= retWH.start) {
            endDayIsChargeable = false;
        }
    } else {
        // Non-workday
        // Prompt: "ending hour may be 2400".
        // Always chargeable if it's the last day of leave and you are still distinct from duty?
        // Actually, if you return on a Saturday (non-workday), is it chargeable? Yes, usually.
        endDayIsChargeable = true;
    }

    // Adjust Total
    // We started with `dayCount` assuming all are chargeable.
    // If start day is NOT chargeable (Day of Duty), subtract 1.
    // if end day is NOT chargeable (Day of Duty), subtract 1.
    // Note: If Start Date == End Date (1 day leave request), handle carefully.

    if (differenceInDays(end, start) === 0) {
        // Same day
        // If it's a Day of Duty based on checks, then count is 0.
        // If startDayIsChargeable AND endDayIsChargeable (implies it didn't meet duty exemption), it's 1.
        // But waaaait, if I leave after work (Duty) and return before work (Duty) on same day... that's 0.
        if (!startDayIsChargeable && !endDayIsChargeable) {
            dayCount = 0;
        } else if (!startDayIsChargeable || !endDayIsChargeable) {
            // If one criteria met duty status, is it 0? 
            // E.g. Leave Saturday (Chargeable), Return Saturday?
            // Use boolean flags.
            if (!startDayIsChargeable) dayCount--;
            // We can't subtract twice for same day.
        }
    } else {
        if (!startDayIsChargeable) dayCount--;
        if (!endDayIsChargeable) dayCount--;
    }

    const chargeableDays = Math.max(0, dayCount);
    const projectedBalance = currentBalance - chargeableDays;

    return {
        chargeableDays,
        projectedBalance,
        isOverdraft: projectedBalance < 0,
        errors
    };
}
