/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */
import { Platform } from 'react-native';

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#000',
    background: '#f8f9fa',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    primary: '#4c669f',
    secondary: '#3b5998',
    accent: '#192f6a',
    card: '#ffffff',
    border: '#e1e4e8',
    notification: '#ff3b30',
    success: '#34c759',
  },
  dark: {
    text: '#fff',
    background: '#1a1a1a',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    primary: '#4c669f',
    secondary: '#3b5998',
    accent: '#192f6a',
    card: '#2c2c2e',
    border: '#3a3a3c',
    notification: '#ff453a',
    success: '#32d74b',
  },
};

export const Fonts = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
    bold: 'Roboto-Bold',
  },
  default: {
    regular: 'sans-serif',
    medium: 'sans-serif-medium',
    bold: 'sans-serif-bold',
  }
});
