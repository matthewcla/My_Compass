import { getBilletImage, getManning, getSpecialPays, getWarfareQual } from '@/constants/BilletDutyData';
import { getLocationData } from '@/constants/BilletLocationData';
import { Billet } from '@/types/schema';
import { ImageSourcePropType } from 'react-native';

// Re-export this so components can use it
export interface SwipeCardData {
    id: string; // Changed to string to match Billet ID
    billetId: string;
    title: string;
    location: string;
    type: string;
    rank: string;
    rate: string;
    compatibility: number; // 0-100
    isHot: boolean;
    image: ImageSourcePropType;
    description: string;
    detailerNote: string;
    career: {
        manning: string;
        nec: string;
        warfare: string;
    };
    financials: {
        bah: string;
        specialPay: string[];
        colIndex: string;
    };
    lifestyle: {
        schools: number;
        spouseJobs: string;
        commute: string;
    };
}

// Simple string hashing function (djb2 implementation)
// Retained for deterministic variance within realistic ranges
function simpleHash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    return Math.abs(hash);
}

// Safe formatting helpers
const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

/**
 * Transforms a raw Schema Billet into the enriched view model required for the Swipe Card.
 * Uses location-aware and duty-type-aware lookup tables for realistic data.
 * Hash is retained only for deterministic variance within realistic ranges.
 */
export function enrichBillet(billet: Billet): SwipeCardData {
    const hash = simpleHash(billet.id);

    // ---- Location-based data ----
    const locData = getLocationData(billet.location);
    const bahRate = locData.bah[billet.payGrade] || locData.bah['E-6'];

    // ---- Duty / Rating-based data ----
    const specialPays = getSpecialPays(billet.dutyType, billet.targetRating, locData.isOconus);
    const warfareQual = getWarfareQual(billet.dutyType, billet.targetRating);
    const manning = getManning(billet.targetRating, hash);
    const image = getBilletImage(billet.dutyType, billet.targetRating, hash);

    return {
        id: billet.id,
        billetId: billet.uic, // Using UIC as display ID equivalent for now
        title: billet.title,
        location: billet.location,
        type: billet.dutyType || 'Sea Duty', // Default fallback
        rank: billet.payGrade,
        rate: billet.designator || billet.nec || 'Any', // Fallback

        // Compass Data (from schema)
        compatibility: billet.compass.matchScore || 85,
        isHot: billet.compass.matchScore > 90,

        // Lookup-driven data
        image,
        description: billet.billetDescription || 'No description available for this billet.',
        detailerNote: billet.compass.contextualNarrative || "Review requirements carefully.",

        career: {
            manning,
            nec: billet.nec || 'None',
            warfare: warfareQual,
        },
        financials: {
            bah: formatCurrency(bahRate),
            specialPay: specialPays,
            colIndex: locData.cola,
        },
        lifestyle: {
            schools: locData.schools,
            spouseJobs: locData.spouseJobs,
            commute: locData.commute,
        },
    };
}
