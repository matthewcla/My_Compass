import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface VerifiedBadgeProps {
    size?: number;
    fillColor?: string;
    checkColor?: string;
}

/**
 * Twitter/X-style verified badge.
 * Solid filled badge shape with a white checkmark — no outer stroke/outline.
 */
export function VerifiedBadge({
    size = 24,
    fillColor = '#1D9BF0',
    checkColor = '#FFFFFF',
}: VerifiedBadgeProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {/* Badge body — filled, no stroke */}
            <Path
                d="M12 1.5l2.09 3.37L18 4.24l.63 3.96L22 11.13l-2.47 3.01.34 4.01-3.87.9L13.91 22.5 12 21.35l-1.91 1.15-2.09-3.45-3.87-.9.34-4.01L2 11.13l3.37-2.93L5.99 4.24l3.92.63L12 1.5z"
                fill={fillColor}
            />
            {/* Checkmark — white stroke, no fill */}
            <Path
                d="M8.5 12.5l2 2 5-5"
                stroke={checkColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </Svg>
    );
}
