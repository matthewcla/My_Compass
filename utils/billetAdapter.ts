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

// Asset Bank (Remote Unsplash Images)
const LOCAL_IMAGES = [
    { uri: 'https://images.unsplash.com/photo-1544211136-11f8e6bc3408?auto=format&fit=crop&q=80&w=800' }, // Amphib
    { uri: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800' }, // Air
    { uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800' }, // Sea
    { uri: 'https://plus.unsplash.com/premium_photo-1661962487386-896db80b439c?auto=format&fit=crop&q=80&w=800' }, // Destroyer
    { uri: 'https://images.unsplash.com/photo-1598556776374-1b7b04a3721c?auto=format&fit=crop&q=80&w=800' }, // Carrier
    { uri: 'https://images.unsplash.com/photo-1605218427306-022ba973305a?auto=format&fit=crop&q=80&w=800' }, // Submarine
    { uri: 'https://images.unsplash.com/photo-1552560229-3079b33a55e1?auto=format&fit=crop&q=80&w=800' }, // Patrol
    { uri: 'https://images.unsplash.com/photo-1589401764720-d667c3315a6f?auto=format&fit=crop&q=80&w=800' }, // Supply
    { uri: 'https://images.unsplash.com/photo-1532189531853-4654b4a1b069?auto=format&fit=crop&q=80&w=800' }, // Operations
    { uri: 'https://images.unsplash.com/photo-1599388168285-d72db5a33118?auto=format&fit=crop&q=80&w=800' }, // Deck
];

// Simple string hashing function (djb2 implementation)
function simpleHash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    return Math.abs(hash);
}

/**
 * Transforms a raw Schema Billet into the enriched view model required for the Swipe Card.
 * Uses deterministic hashing to generate missing "mock" data (financials, lifestyle, etc).
 */
export function enrichBillet(billet: Billet): SwipeCardData {
    const hash = simpleHash(billet.id);

    // Deterministic Mock Generators
    const isHot = (hash % 10) === 0; // 10% chance
    const imageIndex = hash % LOCAL_IMAGES.length;
    const salaryBase = 2800 + (hash % 1000); // Housing allowance base

    // Mapped Lists
    const levels = ['Low', 'Moderate', 'High', 'Very High'];
    const qualities = ['Poor', 'Fair', 'Good', 'Excellent'];
    const specialPays = ['Sea Pay', 'Sub Pay', 'Flight Pay', 'Dive Pay', 'Hazardous Duty'];

    // Generate 1-3 random special pays based on hash
    const generatedPays = [];
    if (hash % 2 === 0) generatedPays.push(specialPays[hash % specialPays.length]);
    if (hash % 3 === 0) generatedPays.push(specialPays[(hash + 1) % specialPays.length]);
    if (generatedPays.length === 0) generatedPays.push('COLA');

    // Safe formatting helpers
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

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
        isHot: billet.compass.matchScore > 90 || isHot,

        // Generated/Asset Data
        image: LOCAL_IMAGES[imageIndex],
        description: billet.billetDescription || 'No description available for this billet.',
        detailerNote: billet.compass.contextualNarrative || "Review requirements carefully.",

        career: {
            manning: `${80 + (hash % 20)}%`, // Mock manning 80-99%
            nec: billet.nec || 'None',
            warfare: (hash % 2 === 0) ? 'ESWS Required' : 'Optional',
        },
        financials: {
            bah: formatCurrency(salaryBase),
            specialPay: generatedPays,
            colIndex: levels[hash % levels.length],
        },
        lifestyle: {
            schools: (hash % 5) + 1, // 1-5 rating
            spouseJobs: levels[(hash + 1) % levels.length],
            commute: `${10 + (hash % 50)} mins`,
        },
    };
}
