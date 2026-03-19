import { Platform, TextStyle } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // 브랜드 & 시맨틱 컬러
    primary: '#0a7ea4',
    primaryLight: '#e0f4fa',
    secondary: '#6C5CE7',
    error: '#E74C3C',
    success: '#27AE60',
    warning: '#F39C12',
    // UI 시맨틱
    card: '#FFFFFF',
    border: '#E8EAED',
    placeholder: '#9BA1A6',
    overlay: 'rgba(0,0,0,0.5)',
    disabled: '#C4C9CD',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // 브랜드 & 시맨틱 컬러
    primary: '#4FC3F7',
    primaryLight: '#1A3A4A',
    secondary: '#A29BFE',
    error: '#FF6B6B',
    success: '#2ECC71',
    warning: '#FDCB6E',
    // UI 시맨틱
    card: '#1E2022',
    border: '#2C2F33',
    placeholder: '#687076',
    overlay: 'rgba(0,0,0,0.7)',
    disabled: '#3A3D40',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const Typography: Record<string, TextStyle> = {
  heading1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  heading2: { fontSize: 22, fontWeight: '700', lineHeight: 30 },
  heading3: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  small: { fontSize: 11, fontWeight: '400', lineHeight: 16 },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
