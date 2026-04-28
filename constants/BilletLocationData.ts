/**
 * Location-aware lookup data for billet enrichment.
 * BAH rates are approximate 2024 with-dependents values for E-6 baseline.
 * All other values are realistic estimates for user-testing purposes.
 */

export interface LocationData {
    /** BAH rate by pay grade (monthly, with dependents) */
    bah: Record<string, number>;
    /** Cost of living index */
    cola: 'Low' | 'Moderate' | 'High' | 'Very High';
    /** School quality 1-5 */
    schools: number;
    /** Spouse job market quality */
    spouseJobs: 'Poor' | 'Fair' | 'Good' | 'Excellent';
    /** Typical commute */
    commute: string;
    /** Whether location is OCONUS */
    isOconus: boolean;
}

// Default fallback for unknown locations
const DEFAULT_LOCATION: LocationData = {
    bah: { 'E-5': 1800, 'E-6': 2100, 'E-7': 2300, 'O-3': 2400, 'O-4': 2600 },
    cola: 'Moderate',
    schools: 3,
    spouseJobs: 'Fair',
    commute: '20 mins',
    isOconus: false,
};

export const LOCATION_DATA: Record<string, LocationData> = {
    // =========================================================================
    // CALIFORNIA
    // =========================================================================
    'SAN DIEGO, CA': {
        bah: { 'E-5': 2874, 'E-6': 3150, 'E-7': 3348, 'O-3': 3417, 'O-4': 3570 },
        cola: 'Very High',
        schools: 3,
        spouseJobs: 'Excellent',
        commute: '25 mins',
        isOconus: false,
    },
    'LEMOORE, CA': {
        bah: { 'E-5': 2064, 'E-6': 2196, 'E-7': 2400, 'O-3': 2520, 'O-4': 2700 },
        cola: 'Moderate',
        schools: 3,
        spouseJobs: 'Poor',
        commute: '10 mins',
        isOconus: false,
    },
    'CORONA, CA': {
        bah: { 'E-5': 2700, 'E-6': 2958, 'E-7': 3150, 'O-3': 3258, 'O-4': 3450 },
        cola: 'Very High',
        schools: 4,
        spouseJobs: 'Good',
        commute: '30 mins',
        isOconus: false,
    },
    'PORT HUENEME, CA': {
        bah: { 'E-5': 2610, 'E-6': 2856, 'E-7': 3048, 'O-3': 3150, 'O-4': 3300 },
        cola: 'High',
        schools: 3,
        spouseJobs: 'Good',
        commute: '15 mins',
        isOconus: false,
    },
    'MONTEREY, CA': {
        bah: { 'E-5': 2850, 'E-6': 3120, 'E-7': 3300, 'O-3': 3390, 'O-4': 3540 },
        cola: 'Very High',
        schools: 4,
        spouseJobs: 'Good',
        commute: '15 mins',
        isOconus: false,
    },

    // =========================================================================
    // HAWAII
    // =========================================================================
    'PEARL HARBOR, HI': {
        bah: { 'E-5': 2952, 'E-6': 3204, 'E-7': 3402, 'O-3': 3504, 'O-4': 3660 },
        cola: 'Very High',
        schools: 3,
        spouseJobs: 'Fair',
        commute: '30 mins',
        isOconus: false,
    },
    'WAHIAWA, HI': {
        bah: { 'E-5': 2952, 'E-6': 3204, 'E-7': 3402, 'O-3': 3504, 'O-4': 3660 },
        cola: 'Very High',
        schools: 3,
        spouseJobs: 'Fair',
        commute: '20 mins',
        isOconus: false,
    },

    // =========================================================================
    // VIRGINIA / DC AREA
    // =========================================================================
    'NORFOLK, VA': {
        bah: { 'E-5': 1938, 'E-6': 2136, 'E-7': 2310, 'O-3': 2430, 'O-4': 2610 },
        cola: 'Moderate',
        schools: 3,
        spouseJobs: 'Good',
        commute: '25 mins',
        isOconus: false,
    },
    'VIRGINIA BEACH, VA': {
        bah: { 'E-5': 1938, 'E-6': 2136, 'E-7': 2310, 'O-3': 2430, 'O-4': 2610 },
        cola: 'Moderate',
        schools: 4,
        spouseJobs: 'Good',
        commute: '20 mins',
        isOconus: false,
    },
    'OCEANA, VA': {
        bah: { 'E-5': 1938, 'E-6': 2136, 'E-7': 2310, 'O-3': 2430, 'O-4': 2610 },
        cola: 'Moderate',
        schools: 4,
        spouseJobs: 'Good',
        commute: '15 mins',
        isOconus: false,
    },
    'DAM NECK, VA': {
        bah: { 'E-5': 1938, 'E-6': 2136, 'E-7': 2310, 'O-3': 2430, 'O-4': 2610 },
        cola: 'Moderate',
        schools: 4,
        spouseJobs: 'Good',
        commute: '15 mins',
        isOconus: false,
    },
    'DAHLGREN, VA': {
        bah: { 'E-5': 1860, 'E-6': 2040, 'E-7': 2220, 'O-3': 2340, 'O-4': 2520 },
        cola: 'Moderate',
        schools: 3,
        spouseJobs: 'Fair',
        commute: '10 mins',
        isOconus: false,
    },
    'ARLINGTON, VA': {
        bah: { 'E-5': 2628, 'E-6': 2880, 'E-7': 3084, 'O-3': 3180, 'O-4': 3390 },
        cola: 'Very High',
        schools: 5,
        spouseJobs: 'Excellent',
        commute: '35 mins',
        isOconus: false,
    },
    'WASHINGTON, DC': {
        bah: { 'E-5': 2628, 'E-6': 2880, 'E-7': 3084, 'O-3': 3180, 'O-4': 3390 },
        cola: 'Very High',
        schools: 4,
        spouseJobs: 'Excellent',
        commute: '40 mins',
        isOconus: false,
    },

    // =========================================================================
    // FLORIDA
    // =========================================================================
    'JACKSONVILLE, FL': {
        bah: { 'E-5': 1812, 'E-6': 1980, 'E-7': 2148, 'O-3': 2268, 'O-4': 2430 },
        cola: 'Low',
        schools: 3,
        spouseJobs: 'Good',
        commute: '20 mins',
        isOconus: false,
    },
    'MAYPORT, FL': {
        bah: { 'E-5': 1812, 'E-6': 1980, 'E-7': 2148, 'O-3': 2268, 'O-4': 2430 },
        cola: 'Low',
        schools: 3,
        spouseJobs: 'Good',
        commute: '25 mins',
        isOconus: false,
    },
    'PENSACOLA, FL': {
        bah: { 'E-5': 1680, 'E-6': 1836, 'E-7': 1998, 'O-3': 2100, 'O-4': 2280 },
        cola: 'Low',
        schools: 3,
        spouseJobs: 'Fair',
        commute: '15 mins',
        isOconus: false,
    },

    // =========================================================================
    // PACIFIC NORTHWEST
    // =========================================================================
    'BREMERTON, WA': {
        bah: { 'E-5': 2220, 'E-6': 2436, 'E-7': 2616, 'O-3': 2730, 'O-4': 2910 },
        cola: 'High',
        schools: 3,
        spouseJobs: 'Fair',
        commute: '15 mins',
        isOconus: false,
    },
    'BANGOR, WA': {
        bah: { 'E-5': 2220, 'E-6': 2436, 'E-7': 2616, 'O-3': 2730, 'O-4': 2910 },
        cola: 'High',
        schools: 4,
        spouseJobs: 'Fair',
        commute: '10 mins',
        isOconus: false,
    },
    'OAK HARBOR, WA': {
        bah: { 'E-5': 1956, 'E-6': 2148, 'E-7': 2316, 'O-3': 2436, 'O-4': 2610 },
        cola: 'Moderate',
        schools: 3,
        spouseJobs: 'Fair',
        commute: '10 mins',
        isOconus: false,
    },
    'WHIDBEY ISLAND, WA': {
        bah: { 'E-5': 1956, 'E-6': 2148, 'E-7': 2316, 'O-3': 2436, 'O-4': 2610 },
        cola: 'Moderate',
        schools: 3,
        spouseJobs: 'Fair',
        commute: '10 mins',
        isOconus: false,
    },

    // =========================================================================
    // NORTHEAST
    // =========================================================================
    'GROTON, CT': {
        bah: { 'E-5': 2100, 'E-6': 2304, 'E-7': 2484, 'O-3': 2604, 'O-4': 2790 },
        cola: 'Moderate',
        schools: 4,
        spouseJobs: 'Fair',
        commute: '10 mins',
        isOconus: false,
    },
    'NEW LONDON, CT': {
        bah: { 'E-5': 2100, 'E-6': 2304, 'E-7': 2484, 'O-3': 2604, 'O-4': 2790 },
        cola: 'Moderate',
        schools: 4,
        spouseJobs: 'Fair',
        commute: '15 mins',
        isOconus: false,
    },
    'BOSTON, MA': {
        bah: { 'E-5': 2970, 'E-6': 3246, 'E-7': 3450, 'O-3': 3558, 'O-4': 3720 },
        cola: 'Very High',
        schools: 5,
        spouseJobs: 'Excellent',
        commute: '30 mins',
        isOconus: false,
    },

    // =========================================================================
    // SOUTHEAST / SOUTH
    // =========================================================================
    'GOOSE CREEK, SC': {
        bah: { 'E-5': 1884, 'E-6': 2064, 'E-7': 2244, 'O-3': 2364, 'O-4': 2544 },
        cola: 'Low',
        schools: 4,
        spouseJobs: 'Good',
        commute: '15 mins',
        isOconus: false,
    },
    'KINGS BAY, GA': {
        bah: { 'E-5': 1656, 'E-6': 1812, 'E-7': 1968, 'O-3': 2076, 'O-4': 2244 },
        cola: 'Low',
        schools: 3,
        spouseJobs: 'Poor',
        commute: '10 mins',
        isOconus: false,
    },
    'MILLINGTON, TN': {
        bah: { 'E-5': 1572, 'E-6': 1728, 'E-7': 1884, 'O-3': 1980, 'O-4': 2148 },
        cola: 'Low',
        schools: 2,
        spouseJobs: 'Fair',
        commute: '15 mins',
        isOconus: false,
    },

    // =========================================================================
    // MIDWEST / WEST
    // =========================================================================
    'GREAT LAKES, IL': {
        bah: { 'E-5': 1884, 'E-6': 2064, 'E-7': 2244, 'O-3': 2352, 'O-4': 2520 },
        cola: 'Moderate',
        schools: 3,
        spouseJobs: 'Good',
        commute: '15 mins',
        isOconus: false,
    },
    'FALLON, NV': {
        bah: { 'E-5': 1608, 'E-6': 1764, 'E-7': 1920, 'O-3': 2028, 'O-4': 2196 },
        cola: 'Low',
        schools: 2,
        spouseJobs: 'Poor',
        commute: '10 mins',
        isOconus: false,
    },
    'FORT WORTH, TX': {
        bah: { 'E-5': 1824, 'E-6': 1998, 'E-7': 2172, 'O-3': 2280, 'O-4': 2460 },
        cola: 'Low',
        schools: 3,
        spouseJobs: 'Good',
        commute: '25 mins',
        isOconus: false,
    },

    // =========================================================================
    // MARYLAND
    // =========================================================================
    'PATUXENT RIVER, MD': {
        bah: { 'E-5': 2088, 'E-6': 2292, 'E-7': 2472, 'O-3': 2592, 'O-4': 2772 },
        cola: 'Moderate',
        schools: 3,
        spouseJobs: 'Fair',
        commute: '10 mins',
        isOconus: false,
    },

    // =========================================================================
    // JAPAN
    // =========================================================================
    'YOKOSUKA, JAPAN': {
        bah: { 'E-5': 2400, 'E-6': 2640, 'E-7': 2832, 'O-3': 2952, 'O-4': 3132 },
        cola: 'High',
        schools: 4,
        spouseJobs: 'Poor',
        commute: '15 mins',
        isOconus: true,
    },
    'IWAKUNI, JAPAN': {
        bah: { 'E-5': 2256, 'E-6': 2484, 'E-7': 2676, 'O-3': 2796, 'O-4': 2976 },
        cola: 'Moderate',
        schools: 4,
        spouseJobs: 'Poor',
        commute: '10 mins',
        isOconus: true,
    },
    'SASEBO, JAPAN': {
        bah: { 'E-5': 2256, 'E-6': 2484, 'E-7': 2676, 'O-3': 2796, 'O-4': 2976 },
        cola: 'Moderate',
        schools: 3,
        spouseJobs: 'Poor',
        commute: '10 mins',
        isOconus: true,
    },

    // =========================================================================
    // EUROPE
    // =========================================================================
    'ROTA, SPAIN': {
        bah: { 'E-5': 2100, 'E-6': 2316, 'E-7': 2496, 'O-3': 2616, 'O-4': 2796 },
        cola: 'Moderate',
        schools: 4,
        spouseJobs: 'Poor',
        commute: '10 mins',
        isOconus: true,
    },
    'NAPLES, ITALY': {
        bah: { 'E-5': 2148, 'E-6': 2364, 'E-7': 2544, 'O-3': 2664, 'O-4': 2844 },
        cola: 'Moderate',
        schools: 3,
        spouseJobs: 'Poor',
        commute: '20 mins',
        isOconus: true,
    },
    'SIGONELLA, ITALY': {
        bah: { 'E-5': 2004, 'E-6': 2196, 'E-7': 2376, 'O-3': 2496, 'O-4': 2676 },
        cola: 'Low',
        schools: 3,
        spouseJobs: 'Poor',
        commute: '10 mins',
        isOconus: true,
    },

    // =========================================================================
    // OTHER OCONUS
    // =========================================================================
    'BAHRAIN': {
        bah: { 'E-5': 2256, 'E-6': 2484, 'E-7': 2676, 'O-3': 2796, 'O-4': 2976 },
        cola: 'Moderate',
        schools: 3,
        spouseJobs: 'Poor',
        commute: '10 mins',
        isOconus: true,
    },
    'GUAM': {
        bah: { 'E-5': 2400, 'E-6': 2640, 'E-7': 2832, 'O-3': 2952, 'O-4': 3132 },
        cola: 'High',
        schools: 2,
        spouseJobs: 'Poor',
        commute: '15 mins',
        isOconus: true,
    },
    'DIEGO GARCIA': {
        bah: { 'E-5': 1800, 'E-6': 1980, 'E-7': 2148, 'O-3': 2268, 'O-4': 2448 },
        cola: 'Low',
        schools: 1,
        spouseJobs: 'Poor',
        commute: '5 mins',
        isOconus: true,
    },
};

/**
 * Get location data for a billet, with fallback for unknown locations.
 */
export function getLocationData(location: string): LocationData {
    return LOCATION_DATA[location] || DEFAULT_LOCATION;
}
