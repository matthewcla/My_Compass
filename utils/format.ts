/**
 * Format a rank abbreviation to a more user-friendly display format.
 * Currently maps enlisted ranks to their petty officer designations.
 *
 * @param rank - The rank abbreviation (e.g., "E-6")
 * @returns The formatted rank (e.g., "PO1") or the original rank if no mapping exists.
 */
export function formatRank(rank?: string): string {
    if (!rank) return '';

    const rankMap: Record<string, string> = {
        'E-4': 'PO3',
        'E-5': 'PO2',
        'E-6': 'PO1',
        'E-7': 'CPO'
    };

    return rankMap[rank] || rank;
}
