const systemGray = '#8E8E93';
const systemGray6Light = '#F2F2F7';
const systemGray6Dark = '#1C1C1E';
const systemBlueLight = '#1A4E8A';
const systemBlueDark = '#5B8FCF';
const navyBlue = '#0A1628';
const navyLight = '#1E3A5F';
const navyGold = '#C9A227';

export const Colors = {
  // Canvas gradient stops (shared with ScreenGradient)
  gradient: {
    light: ['#EEF1F7', '#DDE3EE'] as const, // Cool blue-gray — naval, professional
    dark: ['#0C1A2B', '#060E18'] as const,   // Navy abyss — blue-tinted, not generic slate
  },
  blue: {
    500: '#3b82f6',
    600: '#2563eb',
  },
  green: {
    500: '#22c55e',
    600: '#16a34a',
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
    inputBackground: '#F8FAFC',
    accentText: systemBlueLight,
    surface: '#FFFFFF',
    surfaceBorder: '#E2E8F0',
    iconBubble: '#E8EDF6',
    iconBubbleLocked: '#F1F5F9',

    status: {
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
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
    cardBackground: '#1E293B',
    wizardCardBackground: '#1E293B',
    inputBackground: '#0F172A',
    accentText: '#FFFFFF',
    surface: '#1E293B',
    surfaceBorder: '#334155',
    iconBubble: 'rgba(91, 143, 207, 0.18)',
    iconBubbleLocked: '#334155',

    status: {
      success: '#3AAE6C',
      warning: '#C8921C',
      error: '#C84444',
    }
  },
};
export default Colors;
