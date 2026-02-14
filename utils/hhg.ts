/**
 * HHG (Household Goods) Utility Functions
 * Based on Joint Travel Regulations (JTR) Table 5-2
 */

// JTR Table 5-2: PCS and NTS Weight Allowances (Pounds)
// Format: [Grade, Without Dependents, With Dependents]
const JTR_WEIGHT_ALLOWANCES: Record<string, [number, number]> = {
    // General / Admirals
    'O-10': [18000, 18000],
    'O-9': [18000, 18000],
    'O-8': [18000, 18000],
    'O-7': [18000, 18000],
    'O-6': [18000, 18000],

    // Officers
    'O-5': [16000, 17500],
    'O-4': [14000, 17000],
    'O-3': [13000, 14500],
    'O-2': [12500, 13500],
    'O-1': [10000, 12000],

    // Warrant Officers
    'W-5': [16000, 17500],
    'W-4': [14000, 17000],
    'W-3': [13000, 14500],
    'W-2': [12500, 13500],
    'W-1': [10000, 12000],

    // Enlisted
    'E-9': [12000, 15000], // MCPON is higher (14k/17k) but using standard E-9 for now
    'E-8': [11000, 14000],
    'E-7': [11000, 13000],
    'E-6': [8000, 11000],
    'E-5': [7000, 9000],
    'E-4': [7000, 8000],
    'E-3': [5000, 8000],
    'E-2': [5000, 8000],
    'E-1': [5000, 8000],

    // Aviation Cadets / Service Academy Cadets/Midshipmen
    'CADET': [350, 350],
};

/**
 * Get the maximum authorized HHG weight allowance based on pay grade and dependency status.
 * Source: JTR Table 5-2
 * 
 * @param payGrade - The service member's pay grade (e.g., 'E-5', 'O-3')
 * @param hasDependents - Whether the member has dependents
 * @returns Maximum weight allowance in pounds
 */
export function getHHGWeightAllowance(payGrade: string, hasDependents: boolean): number {
    const normalizedGrade = payGrade.toUpperCase();
    const allowance = JTR_WEIGHT_ALLOWANCES[normalizedGrade];

    if (!allowance) {
        console.warn(`[getHHGWeightAllowance] Unknown pay grade: ${payGrade}, defaulting to E-1`);
        return hasDependents ? 8000 : 5000;
    }

    return hasDependents ? allowance[1] : allowance[0];
}

/**
 * Estimate weight for a specific room type used in quick estimations.
 * Based on standard industry averages for military moves.
 * 
 * @param roomType - The type of room (e.g., 'Living Room', 'Bedroom')
 * @returns Estimated weight in pounds
 */
export function getEstimatedRoomWeight(roomType: string): number {
    const ROOM_WEIGHTS: Record<string, number> = {
        'Living Room': 1500,
        'Family Room': 1200,
        'Dining Room': 1000,
        'Master Bedroom': 1500,
        'Bedroom': 1000, // Guest/Child bedroom
        'Kitchen': 1000,
        'Home Office': 800, // Books add weight quickly!
        'Garage': 2000, // Tools and equipment
        'Patio': 500,
        'Hallway': 150,
        'Bathroom': 150,
        'Laundry Room': 300,
        'Attic/Basement': 1000,
    };

    return ROOM_WEIGHTS[roomType] || 500; // Default fallback
}

// Pre-defined categories for HHG items
export const HHG_CATEGORIES = [
    { id: 'FURNITURE', label: 'Furniture' },
    { id: 'APPLIANCES', label: 'Appliances' },
    { id: 'BOXES', label: 'Boxes & Totes' },
    { id: 'VEHICLE', label: 'Vehicle Parts/Access' },
    { id: 'OTHER', label: 'Other/Misc' },
] as const;
