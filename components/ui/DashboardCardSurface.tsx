import { GlassView } from '@/components/ui/GlassView';
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
            <GlassView
                intensity={intensity}
                tint="dark"
                className={`overflow-hidden shadow-sm border border-white/10 ${className}`}
                style={style}
                {...props}
            >
                {children}
            </GlassView>
        );
    }

    // Light Mode: Solid white surface with crisp borders and precise Apple shadow
    // Note: Separating the shadow container from the overflow container prevents clipping.
    return (
        <View
            className={`bg-transparent ${className}`}
            style={[
                getShadow({ shadowColor: '#475569', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }),
                style
            ]}
            {...props}
        >
            <View 
                className="overflow-hidden bg-white border border-slate-200/60 w-full h-full" 
                style={{ borderRadius: (style as any)?.borderRadius ?? 24 }}
            >
                {children}
            </View>
        </View>
    );
}
