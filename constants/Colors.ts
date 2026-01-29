const systemGray = '#8E8E93';
const systemGray6Light = '#F2F2F7';
const systemGray6Dark = '#1C1C1E';
const systemBlueLight = '#007AFF';
const systemBlueDark = '#0A84FF';
const navyBlue = '#0A1628';
const navyLight = '#1E3A5F';
const navyGold = '#C9A227';

export const Colors = {
  gray: {
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

    status: {
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
    }
  },
};
export default Colors;
