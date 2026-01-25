import { ImageSourcePropType } from 'react-native';

export interface RawBillet {
    id: string;
    billetId: string;
    title: string;
    location: string;
    type: string;
    rank: string;
    rate: string;
}

export interface EnrichedBillet extends RawBillet {
    compatibility: number;
    isHot: boolean;
    image: ImageSourcePropType;
    financials: {
        salary: string;
        housingAllowance: string;
        costOfLiving: string;
    };
    lifestyle: {
        familyFriendly: string;
        nightlife: string;
        weather: string;
    };
    detailerNote: string;
}

// Asset Bank
const LOCAL_IMAGES = [
    require('../assets/images/ship_placeholder_1.jpg'),
    require('../assets/images/ship_placeholder_2.jpg'),
    require('../assets/images/ship_placeholder_3.jpg'),
    require('../assets/images/ship_placeholder_4.jpg'),
    require('../assets/images/ship_placeholder_5.jpg'),
    require('../assets/images/ship_placeholder_6.jpg'),
    require('../assets/images/ship_placeholder_7.jpg'),
    require('../assets/images/ship_placeholder_8.jpg'),
    require('../assets/images/ship_placeholder_9.jpg'),
    require('../assets/images/ship_placeholder_10.jpg'),
];

// Simple string hashing function (djb2 implementation)
function simpleHash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    return Math.abs(hash);
}

export function enrichBillet(raw: RawBillet): EnrichedBillet {
    const hash = simpleHash(raw.billetId);

    // Deterministic properties
    const isHot = (hash % 10) === 0; // 10% chance
    const compatibility = (hash % 30) + 70; // Range 70-99
    const imageIndex = hash % LOCAL_IMAGES.length;

    // Generate realistic-looking static data based on the hash
    const salaryBase = 3000 + (hash % 5000);
    const housingBase = 1200 + (hash % 2000);

    const levels = ['Low', 'Moderate', 'High', 'Very High'];
    const qualities = ['Poor', 'Fair', 'Good', 'Excellent'];

    return {
        ...raw,
        compatibility,
        isHot,
        image: LOCAL_IMAGES[imageIndex],
        financials: {
            salary: `$${salaryBase.toLocaleString()}/mo`,
            housingAllowance: `$${housingBase.toLocaleString()}/mo`,
            costOfLiving: levels[hash % levels.length],
        },
        lifestyle: {
            familyFriendly: qualities[(hash + 1) % qualities.length],
            nightlife: qualities[(hash + 2) % qualities.length],
            weather: qualities[(hash + 3) % qualities.length],
        },
        detailerNote: isHot
            ? "HOT FILL: Priority manning required. Contact detailer immediately."
            : "Standard rotation. Review prerequisites carefully before applying.",
    };
}
