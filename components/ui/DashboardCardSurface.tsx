import { SolidView } from '@/components/ui/SolidView';
import { useColorScheme } from '@/components/useColorScheme';
import { getShadow } from '@/utils/getShadow';
import React from 'react';
import { View, ViewProps } from 'react-native';

export interface DashboardCardSurfaceProps extends ViewProps {
    className?: string;
    intensity?: number;
}

export function DashboardCardSurface({
    children,
    className = '',
    intensity = 80,
    style,
    ...props
}: DashboardCardSurfaceProps) {
    const isDark = useColorScheme() === 'dark';

    if (isDark) {
        return (
            <SolidView
                intensity={intensity}
                tint="dark"
                className={`overflow-hidden shadow-sm border border-white/10 ${className}`}
                style={style}
                {...props}
            >
                {children}
            </SolidView>
        );
    }

    // Light Mode: Solid white surface with crisp borders and precise Brutalist hard shadow
    // Note: Separating the shadow container from the overflow container prevents clipping.
    return (
        <View
            className={`bg-transparent ${className}`}
            style={[
                getShadow({ shadowColor: '#0A1628', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }),
                style
            ]}
            {...props}
        >
            <View 
                className="overflow-hidden bg-white border-2 border-slate-200"
                style={{ borderRadius: 0 }}
            >
                {children}
            </View>
        </View>
    );
}
