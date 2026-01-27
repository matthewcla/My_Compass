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
        'E-7': 'CPO',
        'E-8': 'SCPO',
        'E-9': 'MCPO'
    };

    return rankMap[rank] || rank;
}

/**
 * Construct an Enlisted Rate from Rating and Rank (Paygrade).
 * e.g. Rating="IT", Rank="E-6" -> "IT1"
 * e.g. Rating="IT", Rank="E-7" -> "ITC"
 * 
 * @param rating - The enlisted rating code (e.g. "IT", "ET")
 * @param rank - The paygrade (e.g. "E-6")
 */
export function formatRate(rating?: string, rank?: string): string {
    if (!rating) return formatRank(rank);
    if (!rank) return rating;

    const suffixMap: Record<string, string> = {
        'E-1': 'SR',
        'E-2': 'SA',
        'E-3': 'SN',
        'E-4': '3',
        'E-5': '2',
        'E-6': '1',
        'E-7': 'C',
        'E-8': 'CS',
        'E-9': 'CM'
    };

    const suffix = suffixMap[rank];
    if (suffix) {
        // Handle lower enlisted (E1-E3) which are usually Rating + Suffix (e.g. ITSN)
        // Check if suffix implies generic Seaman/Airman/Fireman or just appended.
        // For simplicity, we assume standard Rating + Suffix concatenation for now.
        return `${rating}${suffix}`;
    }

    return formatRank(rank);
}
