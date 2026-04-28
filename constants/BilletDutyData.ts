/**
 * Duty-type and rating-aware lookup data for billet enrichment.
 * Maps (dutyType, targetRating) combinations to realistic special pays,
 * warfare qualifications, manning ranges, and header images.
 */

import { ImageSourcePropType } from 'react-native';

// =============================================================================
// SPECIAL PAY MAPPING
// =============================================================================

/** Key format: `${dutyType}-${targetRating}` */
const SPECIAL_PAY_MAP: Record<string, string[]> = {
    // IT - Information Systems Technician
    'SEA-IT': ['Sea Pay'],
    'SHORE-IT': [],

    // AT - Aviation Electronics Technician
    'SEA-AT': ['Sea Pay', 'Flight Deck Pay'],
    'SHORE-AT': [],

    // ETN - Electronics Technician (Nuclear)
    'SEA-ETN': ['Sea Pay', 'Sub Pay', 'Nuclear Incentive Pay'],
    'SHORE-ETN': ['Nuclear Incentive Pay'],

    // SWO - Surface Warfare Officer
    'SEA-SWO': ['Sea Pay'],
    'SHORE-SWO': [],
};

/**
 * Get special pays for a billet based on duty type and rating.
 * OCONUS locations automatically add COLA.
 */
export function getSpecialPays(
    dutyType: string | null | undefined,
    targetRating: string | null | undefined,
    isOconus: boolean
): string[] {
    const key = `${dutyType || 'SHORE'}-${targetRating || 'IT'}`;
    const pays = [...(SPECIAL_PAY_MAP[key] || [])];
    if (isOconus) pays.push('COLA');
    if (pays.length === 0) pays.push('None');
    return pays;
}

// =============================================================================
// WARFARE QUALIFICATION MAPPING
// =============================================================================

interface WarfareMapping {
    sea: string;
    shore: string;
}

const WARFARE_MAP: Record<string, WarfareMapping> = {
    'IT': { sea: 'ESWS Required', shore: 'IW Qualified' },
    'AT': { sea: 'EAWS Required', shore: 'EAWS Required' },
    'ETN': { sea: 'SSWS Required', shore: 'ESWS Preferred' },
    'SWO': { sea: 'SWO Qualified', shore: 'SWO Qualified' },
};

/**
 * Get warfare qualification requirement based on rating and duty type.
 */
export function getWarfareQual(
    dutyType: string | null | undefined,
    targetRating: string | null | undefined
): string {
    const mapping = WARFARE_MAP[targetRating || 'IT'] || WARFARE_MAP['IT'];
    return (dutyType === 'SEA') ? mapping.sea : mapping.shore;
}

// =============================================================================
// MANNING DATA
// =============================================================================

interface ManningRange {
    min: number;
    max: number;
}

const MANNING_RANGES: Record<string, ManningRange> = {
    'IT': { min: 78, max: 92 },
    'AT': { min: 80, max: 95 },
    'ETN': { min: 85, max: 98 },
    'SWO': { min: 82, max: 96 },
};

/**
 * Get a deterministic manning percentage within the realistic range for a rating.
 * Uses hashValue for variance within the range.
 */
export function getManning(
    targetRating: string | null | undefined,
    hashValue: number
): string {
    const range = MANNING_RANGES[targetRating || 'IT'] || MANNING_RANGES['IT'];
    const spread = range.max - range.min;
    const value = range.min + (hashValue % (spread + 1));
    return `${value}%`;
}

// =============================================================================
// IMAGE BANK — Mapped by duty type and rating
// =============================================================================

interface ImageSet {
    sea: ImageSourcePropType[];
    shore: ImageSourcePropType[];
}

const IMAGE_BANK: Record<string, ImageSet> = {
    'IT': {
        sea: [
            { uri: 'https://images.unsplash.com/photo-1544211136-11f8e6bc3408?auto=format&fit=crop&q=80&w=800' }, // Amphib
            { uri: 'https://plus.unsplash.com/premium_photo-1661962487386-896db80b439c?auto=format&fit=crop&q=80&w=800' }, // Destroyer
            { uri: 'https://images.unsplash.com/photo-1598556776374-1b7b04a3721c?auto=format&fit=crop&q=80&w=800' }, // Carrier
        ],
        shore: [
            { uri: 'https://images.unsplash.com/photo-1532189531853-4654b4a1b069?auto=format&fit=crop&q=80&w=800' }, // Operations center
            { uri: 'https://images.unsplash.com/photo-1589401764720-d667c3315a6f?auto=format&fit=crop&q=80&w=800' }, // Supply/admin
        ],
    },
    'AT': {
        sea: [
            { uri: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800' }, // Air/flight deck
            { uri: 'https://images.unsplash.com/photo-1598556776374-1b7b04a3721c?auto=format&fit=crop&q=80&w=800' }, // Carrier
        ],
        shore: [
            { uri: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800' }, // Air
            { uri: 'https://images.unsplash.com/photo-1532189531853-4654b4a1b069?auto=format&fit=crop&q=80&w=800' }, // Operations
        ],
    },
    'ETN': {
        sea: [
            { uri: 'https://images.unsplash.com/photo-1605218427306-022ba973305a?auto=format&fit=crop&q=80&w=800' }, // Submarine
        ],
        shore: [
            { uri: 'https://images.unsplash.com/photo-1532189531853-4654b4a1b069?auto=format&fit=crop&q=80&w=800' }, // Operations
            { uri: 'https://images.unsplash.com/photo-1589401764720-d667c3315a6f?auto=format&fit=crop&q=80&w=800' }, // Training facility
        ],
    },
    'SWO': {
        sea: [
            { uri: 'https://plus.unsplash.com/premium_photo-1661962487386-896db80b439c?auto=format&fit=crop&q=80&w=800' }, // Destroyer
            { uri: 'https://images.unsplash.com/photo-1552560229-3079b33a55e1?auto=format&fit=crop&q=80&w=800' }, // Patrol/cruiser
            { uri: 'https://images.unsplash.com/photo-1544211136-11f8e6bc3408?auto=format&fit=crop&q=80&w=800' }, // Amphib
        ],
        shore: [
            { uri: 'https://images.unsplash.com/photo-1532189531853-4654b4a1b069?auto=format&fit=crop&q=80&w=800' }, // Operations
            { uri: 'https://images.unsplash.com/photo-1599388168285-d72db5a33118?auto=format&fit=crop&q=80&w=800' }, // Deck/facility
        ],
    },
};

/**
 * Get an appropriate header image for a billet based on its rating and duty type.
 * Uses hashValue for deterministic selection within the appropriate image set.
 */
export function getBilletImage(
    dutyType: string | null | undefined,
    targetRating: string | null | undefined,
    hashValue: number
): ImageSourcePropType {
    const ratingImages = IMAGE_BANK[targetRating || 'IT'] || IMAGE_BANK['IT'];
    const imageSet = (dutyType === 'SEA') ? ratingImages.sea : ratingImages.shore;
    return imageSet[hashValue % imageSet.length];
}
