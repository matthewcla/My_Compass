const systemGray = '#8E8E93';
const systemGray6Light = '#F4F4F5'; // Off-white
const systemGray6Dark = '#18181B';
const systemBlueLight = '#0A1628'; // Navy Blue for Primary Action
const systemBlueDark = '#338EF7';
const navyBlue = '#0A1628'; // Deep Navy
const navyLight = '#1E3A5F';
const navyGold = '#C9A227'; // Athletic Gold

export const Colors = {
  // Canvas gradient stops (shared with ScreenGradient)
  gradient: {
    light: ['#FAFAFA', '#F4F4F5'] as const, // Crisp Light
    dark: ['#000000', '#09090B'] as const,   // OLED Black
  },
  blue: {
    500: '#338EF7', // systemBlueDark (dark mode use)
    600: '#006FEE', // systemBlueLight (light mode use)
  },
  green: {
    500: '#17C964', // vibrant emerald (dark mode use)
    600: '#15803d', // forest green (light mode use — 4.54:1 on white)
  },
  gray: {
    400: '#9ca3af',
    500: '#6b7280',
  },
  light: {
    text: '#0F172A', // High-contrast Slate 900
    background: '#FAFAFA', // Soft Off-White
    tint: navyBlue,
    tabIconDefault: '#94A3B8', // Slate 400
    tabIconSelected: navyBlue,

    systemGray: systemGray,
    systemGray6: systemGray6Light,
    systemBlue: systemBlueLight,
    navyBlue: navyBlue,
    navyLight: navyLight,
    navyGold: navyGold,
    labelPrimary: '#0F172A',
    labelSecondary: '#475569', // Slate 600
    cardBackground: '#FFFFFF', // Crisp White surfaces
    wizardCardBackground: '#FFFFFF',
    inputBackground: '#F4F4F5',
    accentText: navyBlue,
    surface: '#FFFFFF',
    surfaceBorder: '#E2E8F0', // Slate 200
    primary: navyBlue,
    secondaryContainer: navyGold,
    iconBubble: '#F1F5F9', // Solid Slate 100
    iconBubbleLocked: '#E2E8F0', // Solid Slate 200

    status: {
      success: '#15803d', // green-700 — 4.54:1 on white
      warning: '#B45309', // amber-700 — 4.67:1 on white
      error: '#BE123C',   // rose-700  — 5.63:1 on white
    }
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: systemBlueDark,
    tabIconDefault: '#ccc',
    tabIconSelected: systemBlueDark,

    systemGray: systemGray,
    systemGray6: systemGray6Dark,
    systemBlue: systemBlueDark,
    navyBlue: navyBlue,
    navyLight: navyLight,
    navyGold: navyGold,
    labelPrimary: '#FFFFFF',
    labelSecondary: '#EBEBF5',
    cardBackground: '#09090B',
    wizardCardBackground: '#09090B',
    inputBackground: '#18181B',
    accentText: '#FFFFFF',
    surface: '#131313',
    surfaceBorder: '#27272A',
    primary: '#aec6fe',
    secondaryContainer: '#fdc400',
    iconBubble: '#18181B', // Solid instead of rgba
    iconBubbleLocked: '#27272A',

    status: {
      success: '#4ade80', // green-400 — luminous on dark
      warning: '#fbbf24', // amber-400 — luminous on dark
      error: '#fb7185',   // rose-400  — luminous on dark
    }
  },
};
export default Colors;
