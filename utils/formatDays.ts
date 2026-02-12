/**
 * Formats leave days: shows ".5" only for half-days, otherwise whole numbers.
 * e.g. 30 → "30", 30.5 → "30.5", 30.1 → "30"
 */
export function formatDays(value: number): string {
    const rounded = Math.round(value * 2) / 2; // snap to nearest 0.5
    return rounded % 1 === 0.5 ? rounded.toFixed(1) : Math.round(rounded).toString();
}
