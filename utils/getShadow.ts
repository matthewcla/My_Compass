import { Platform } from 'react-native';

interface ShadowProps {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

interface TextShadowProps {
  textShadowColor?: string;
  textShadowOffset?: { width: number; height: number };
  textShadowRadius?: number;
}

/**
 * Generates platform-specific shadow styles.
 * On Web, it returns a `boxShadow` string to avoid deprecation warnings.
 * On Native, it returns the standard React Native shadow props.
 */
export const getShadow = ({
  shadowColor = '#000000',
  shadowOffset = { width: 0, height: 0 },
  shadowOpacity = 0,
  shadowRadius = 0,
  elevation,
}: ShadowProps) => {
  if (Platform.OS === 'web') {
    const { width, height } = shadowOffset;
    const color = normalizeColor(shadowColor, shadowOpacity);
    return {
      boxShadow: `${width}px ${height}px ${shadowRadius}px ${color}`,
    };
  }

  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
  };
};

/**
 * Generates platform-specific text shadow styles.
 * On Web, it returns a `textShadow` string.
 * On Native, it returns the standard React Native textShadow props.
 */
export const getTextShadow = ({
  textShadowColor = '#000000',
  textShadowOffset = { width: 0, height: 0 },
  textShadowRadius = 0,
}: TextShadowProps) => {
  if (Platform.OS === 'web') {
    const { width, height } = textShadowOffset;
    return {
      textShadow: `${width}px ${height}px ${textShadowRadius}px ${textShadowColor}`,
    };
  }

  return {
    textShadowColor,
    textShadowOffset,
    textShadowRadius,
  };
};

function normalizeColor(color: string, opacity: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    let hex = color.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }

  // Handle named colors
  if (color.toLowerCase() === 'black') return `rgba(0, 0, 0, ${opacity})`;
  if (color.toLowerCase() === 'white') return `rgba(255, 255, 255, ${opacity})`;
  if (color.toLowerCase() === 'transparent') return 'transparent';

  // If color is already rgba, strictly speaking we should probably mix the opacity,
  // but for simplicity, if it's explicitly rgba, we might assume the user knows what they are doing
  // or that it's complicated to parse.
  // However, often shadowColor is just the base color.

  // If we can't parse it easily, return it as is, but it might lack opacity on web
  // if the browser doesn't support 'color + opacity' syntax (which it doesn't really).
  // But CSS colors like 'rgba(0,0,0,0.5)' are fine.

  return color;
}
