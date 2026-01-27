import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

// Enable className support for Lucide icons if not already globally done
// cssInterop(LucideIcon, {
//   className: {
//     target: 'style',
//     nativeStyleToProp: {
//       color: true,
//       opacity: true,
//     },
//   },
// }); 
// Note: cssInterop on the Generic LucideIcon type might not work for individual imports like <Home />.
// Only specific components can be interop'd or we wrap them.
// Since we are creating a WRAPPER, we can handle className on the wrapper View or pass styles manually.

interface IconProps {
    icon: LucideIcon;
    size?: number;
    color?: string;
    className?: string;
    style?: any;
}

export function Icon({ icon: IconComponent, size = 24, color, className, style }: IconProps) {
    // We wrap in a View to ensure layout properties from className (margins, padding, positioning) work 
    // without relying on the Icon component to accept them all perfectly on every platform.
    // However, things like 'text-red-500' (color) won't cascade from View to Svg implicitly in RN like in CSS.
    // We need to parse color from style if possible, or rely on explicit color prop.
    // Ideally, users pass `color` prop or `text-color` class to the wrapper which we can evaluate?
    // NativeWind doesn't easily let us extract "color" from a className string at runtime without useTailwind or similar hooks.
    // For simplicity and robustness:
    // 1. Layout styles (margin, padding) go to wrapper View (or just don't wrap if not needed, but wrapping is safer for consistent sizing).
    // 2. Color/Size go to Icon explicitly.

    // Actually, if we want to allow `className="text-blue-500"` to work, we need nativewind to resolve it.
    // Let's rely on explicit props for color/size as per standard RN practice usually, 
    // BUT the prompt says "freely".
    // If the user wants to use className for color, it's harder. 
    // I will implement a simple pass-through.

    // If we wrap it, flex layout might change. 
    // Let's try to pass className directly to IconComponent if we can interop it, 
    // BUT `lucide-react-native` icons are functional components. 

    // Let's just use the component and pass color/size.
    // For className support (layout), we might need to wrap.

    const iconElement = (
        <IconComponent
            size={size}
            color={color || '#000'} // Default color if not provided
            style={style}
        />
    );

    if (className) {
        // If className is provided, wrapping in a View is the safest way to apply layout styles (margin, etc)
        // trying to apply className to the Icon directly requires cssInterop for every icon which is tedious.
        return (
            <View className={className}>
                {iconElement}
            </View>
        );
    }

    return iconElement;
}
