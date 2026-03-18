const systemGray = '#8E8E93';
const systemGray6Light = '#FAFAFA';
const systemGray6Dark = '#18181B';
const systemBlueLight = '#006FEE';
const systemBlueDark = '#338EF7';
const navyBlue = '#000000';
const navyLight = '#09090B';
const navyGold = '#F5A524';

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
    text: '#000',
    background: '#fff',
    tint: systemBlueLight,
    tabIconDefault: '#ccc',
    tabIconSelected: systemBlueLight,

    systemGray: systemGray,
    systemGray6: systemGray6Light,
    systemBlue: systemBlueLight,
    navyBlue: navyBlue,
    navyLight: navyLight,
    navyGold: navyGold,
    labelPrimary: '#000000',
    labelSecondary: '#3C3C43',
    cardBackground: '#FFFFFF',
    wizardCardBackground: '#FFFFFF',
    inputBackground: '#F4F4F5',
    accentText: systemBlueLight,
    surface: '#FFFFFF',
    surfaceBorder: '#E4E4E7',
    iconBubble: '#E8EDF6',
    iconBubbleLocked: '#F1F5F9',

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
    surface: '#09090B',
    surfaceBorder: '#27272A',
    iconBubble: 'rgba(51, 142, 247, 0.18)',
    iconBubbleLocked: '#27272A',

    status: {
      success: '#4ade80', // green-400 — luminous on dark
      warning: '#fbbf24', // amber-400 — luminous on dark
      error: '#fb7185',   // rose-400  — luminous on dark
    }
  },
};
export default Colors;
