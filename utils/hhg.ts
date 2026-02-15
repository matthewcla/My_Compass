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
    { id: 'ELECTRONICS', label: 'Electronics' },
    { id: 'BOXES', label: 'Boxes & Totes' },
    { id: 'VEHICLE', label: 'Vehicle Parts/Access' },
    { id: 'OUTDOOR', label: 'Outdoor/Patio' },
    { id: 'KIDS', label: 'Kids & Baby' },
    { id: 'OTHER', label: 'Other/Misc' },
] as const;

// ─── Room-Organized Item Catalogue ─────────────────────────────────

export interface HHGTemplate {
    category: 'FURNITURE' | 'APPLIANCES' | 'ELECTRONICS' | 'BOXES' | 'VEHICLE' | 'OUTDOOR' | 'KIDS' | 'OTHER';
    description: string;
    estimatedWeight: number;
    room: string;
}

export const HHG_ROOMS = [
    'Living Room',
    'Bedroom',
    'Kitchen',
    'Home Office',
    'Garage & Outdoor',
    'Kids & Baby',
] as const;

export const HHG_CATALOGUE: HHGTemplate[] = [
    // ── Living Room ────────────────────────────────────────────
    { room: 'Living Room', category: 'FURNITURE', description: 'Sofa (3-seat)', estimatedWeight: 200 },
    { room: 'Living Room', category: 'FURNITURE', description: 'Loveseat', estimatedWeight: 140 },
    { room: 'Living Room', category: 'FURNITURE', description: 'Recliner', estimatedWeight: 100 },
    { room: 'Living Room', category: 'FURNITURE', description: 'Coffee Table', estimatedWeight: 50 },
    { room: 'Living Room', category: 'FURNITURE', description: 'End Table', estimatedWeight: 30 },
    { room: 'Living Room', category: 'FURNITURE', description: 'Entertainment Center', estimatedWeight: 150 },
    { room: 'Living Room', category: 'FURNITURE', description: 'Bookshelf', estimatedWeight: 80 },
    { room: 'Living Room', category: 'FURNITURE', description: 'Floor Lamp', estimatedWeight: 15 },
    { room: 'Living Room', category: 'ELECTRONICS', description: 'TV (55"+)', estimatedWeight: 45 },
    { room: 'Living Room', category: 'ELECTRONICS', description: 'Soundbar / Home Theater', estimatedWeight: 30 },
    { room: 'Living Room', category: 'ELECTRONICS', description: 'Gaming Console + Accessories', estimatedWeight: 25 },

    // ── Bedroom ────────────────────────────────────────────────
    { room: 'Bedroom', category: 'FURNITURE', description: 'King Bed Frame + Mattress', estimatedWeight: 250 },
    { room: 'Bedroom', category: 'FURNITURE', description: 'Queen Bed Frame + Mattress', estimatedWeight: 200 },
    { room: 'Bedroom', category: 'FURNITURE', description: 'Twin Bed Frame + Mattress', estimatedWeight: 100 },
    { room: 'Bedroom', category: 'FURNITURE', description: 'Dresser (6-drawer)', estimatedWeight: 150 },
    { room: 'Bedroom', category: 'FURNITURE', description: 'Nightstand', estimatedWeight: 35 },
    { room: 'Bedroom', category: 'FURNITURE', description: 'Wardrobe / Armoire', estimatedWeight: 200 },
    { room: 'Bedroom', category: 'FURNITURE', description: 'Chest of Drawers', estimatedWeight: 100 },
    { room: 'Bedroom', category: 'FURNITURE', description: 'Mirror (dressing)', estimatedWeight: 30 },
    { room: 'Bedroom', category: 'BOXES', description: 'Box of Clothing (~40 lbs)', estimatedWeight: 40 },
    { room: 'Bedroom', category: 'BOXES', description: 'Box of Linens / Bedding', estimatedWeight: 25 },

    // ── Kitchen ────────────────────────────────────────────────
    { room: 'Kitchen', category: 'APPLIANCES', description: 'Refrigerator', estimatedWeight: 250 },
    { room: 'Kitchen', category: 'APPLIANCES', description: 'Dishwasher (portable)', estimatedWeight: 80 },
    { room: 'Kitchen', category: 'APPLIANCES', description: 'Microwave', estimatedWeight: 35 },
    { room: 'Kitchen', category: 'APPLIANCES', description: 'Stand Mixer', estimatedWeight: 25 },
    { room: 'Kitchen', category: 'APPLIANCES', description: 'Toaster Oven / Air Fryer', estimatedWeight: 15 },
    { room: 'Kitchen', category: 'FURNITURE', description: 'Kitchen Table + 4 Chairs', estimatedWeight: 150 },
    { room: 'Kitchen', category: 'FURNITURE', description: 'Bar Stools (pair)', estimatedWeight: 40 },
    { room: 'Kitchen', category: 'BOXES', description: 'Box of Pots & Pans', estimatedWeight: 50 },
    { room: 'Kitchen', category: 'BOXES', description: 'Box of Dishes & Glassware', estimatedWeight: 45 },
    { room: 'Kitchen', category: 'BOXES', description: 'Box of Small Appliances', estimatedWeight: 30 },

    // ── Home Office ────────────────────────────────────────────
    { room: 'Home Office', category: 'FURNITURE', description: 'Desk', estimatedWeight: 80 },
    { room: 'Home Office', category: 'FURNITURE', description: 'Office Chair', estimatedWeight: 40 },
    { room: 'Home Office', category: 'FURNITURE', description: 'Filing Cabinet', estimatedWeight: 60 },
    { room: 'Home Office', category: 'FURNITURE', description: 'Bookshelf (loaded)', estimatedWeight: 120 },
    { room: 'Home Office', category: 'ELECTRONICS', description: 'Desktop Computer + Monitor', estimatedWeight: 40 },
    { room: 'Home Office', category: 'ELECTRONICS', description: 'Printer / Scanner', estimatedWeight: 25 },
    { room: 'Home Office', category: 'BOXES', description: 'Box of Books (~50 lbs)', estimatedWeight: 50 },

    // ── Garage & Outdoor ───────────────────────────────────────
    { room: 'Garage & Outdoor', category: 'OUTDOOR', description: 'Lawn Mower (push)', estimatedWeight: 80 },
    { room: 'Garage & Outdoor', category: 'OUTDOOR', description: 'Grill (gas)', estimatedWeight: 100 },
    { room: 'Garage & Outdoor', category: 'OUTDOOR', description: 'Patio Table + 4 Chairs', estimatedWeight: 120 },
    { room: 'Garage & Outdoor', category: 'OUTDOOR', description: 'Bicycle', estimatedWeight: 30 },
    { room: 'Garage & Outdoor', category: 'VEHICLE', description: 'Tool Chest (loaded)', estimatedWeight: 150 },
    { room: 'Garage & Outdoor', category: 'VEHICLE', description: 'Workbench', estimatedWeight: 100 },
    { room: 'Garage & Outdoor', category: 'BOXES', description: 'Box of Power Tools', estimatedWeight: 60 },
    { room: 'Garage & Outdoor', category: 'BOXES', description: 'Box of Sporting Equipment', estimatedWeight: 45 },
    { room: 'Garage & Outdoor', category: 'OTHER', description: 'Storage Totes (each)', estimatedWeight: 30 },

    // ── Kids & Baby ────────────────────────────────────────────
    { room: 'Kids & Baby', category: 'KIDS', description: 'Crib + Mattress', estimatedWeight: 60 },
    { room: 'Kids & Baby', category: 'KIDS', description: 'Changing Table', estimatedWeight: 45 },
    { room: 'Kids & Baby', category: 'KIDS', description: 'High Chair', estimatedWeight: 20 },
    { room: 'Kids & Baby', category: 'KIDS', description: 'Stroller', estimatedWeight: 25 },
    { room: 'Kids & Baby', category: 'KIDS', description: 'Playpen / Pack-n-Play', estimatedWeight: 25 },
    { room: 'Kids & Baby', category: 'KIDS', description: 'Toy Box (loaded)', estimatedWeight: 50 },
    { room: 'Kids & Baby', category: 'KIDS', description: 'Kids Bike / Ride-On', estimatedWeight: 20 },
    { room: 'Kids & Baby', category: 'FURNITURE', description: 'Bunk Bed', estimatedWeight: 180 },
    { room: 'Kids & Baby', category: 'BOXES', description: 'Box of Toys & Games', estimatedWeight: 30 },

    // ── Misc / Whole-House ─────────────────────────────────────
    { room: 'Living Room', category: 'APPLIANCES', description: 'Washer', estimatedWeight: 170 },
    { room: 'Living Room', category: 'APPLIANCES', description: 'Dryer', estimatedWeight: 130 },
    { room: 'Living Room', category: 'OTHER', description: 'Area Rug (large)', estimatedWeight: 40 },
    { room: 'Living Room', category: 'OTHER', description: 'Curtains / Drapes (set)', estimatedWeight: 15 },
    { room: 'Living Room', category: 'OTHER', description: 'Wall Art / Framed Pictures', estimatedWeight: 20 },
];

/**
 * Quick estimate: bedroom-count presets.
 * Maps bedroom count → array of room types to auto-populate.
 */
export const QUICK_ESTIMATE_PRESETS: Record<string, string[]> = {
    '1BR': ['Living Room', 'Bedroom', 'Kitchen'],
    '2BR': ['Living Room', 'Bedroom', 'Bedroom', 'Kitchen'],
    '3BR': ['Living Room', 'Bedroom', 'Bedroom', 'Bedroom', 'Kitchen', 'Home Office'],
    '4BR+': ['Living Room', 'Bedroom', 'Bedroom', 'Bedroom', 'Bedroom', 'Kitchen', 'Home Office', 'Garage & Outdoor'],
};

/**
 * Calculate total quick-estimate weight from a preset.
 * Uses getEstimatedRoomWeight() for each room in the preset.
 */
export function getQuickEstimateWeight(presetKey: string): number {
    const rooms = QUICK_ESTIMATE_PRESETS[presetKey];
    if (!rooms) return 0;
    return rooms.reduce((sum, room) => sum + getEstimatedRoomWeight(room), 0);
}
