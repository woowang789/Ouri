import { Platform, TextStyle } from 'react-native';

const tintColorLight = '#C4654A';
const tintColorDark = '#F0ECE6';

export const Colors = {
  light: {
    text: '#2D2926',
    background: '#FAF7F3',
    tint: tintColorLight,
    icon: '#8A8279',
    tabIconDefault: '#B5AEA5',
    tabIconSelected: tintColorLight,
    // 브랜드 & 시맨틱 컬러
    primary: '#C4654A',
    primaryLight: '#FFF0EB',
    secondary: '#7B9E8F',
    error: '#D4574A',
    success: '#5A9E6F',
    warning: '#D4A24E',
    // UI 시맨틱
    card: '#FFFFFF',
    border: '#EDE8E1',
    placeholder: '#9E958C',
    overlay: 'rgba(45,41,38,0.5)',
    disabled: '#C9C4BD',
    // 추가 시맨틱
    surfaceMuted: '#F3EEE8',
    accent: '#E8B86D',
  },
  dark: {
    text: '#F0ECE6',
    background: '#1C1916',
    tint: tintColorDark,
    icon: '#9E958C',
    tabIconDefault: '#6A6259',
    tabIconSelected: tintColorDark,
    // 브랜드 & 시맨틱 컬러
    primary: '#E0825E',
    primaryLight: '#3A2820',
    secondary: '#8FB5A4',
    error: '#E86B5E',
    success: '#6DB87F',
    warning: '#E0B85E',
    // UI 시맨틱
    card: '#272320',
    border: '#3A3530',
    placeholder: '#7A7269',
    overlay: 'rgba(0,0,0,0.7)',
    disabled: '#4A4540',
    // 추가 시맨틱
    surfaceMuted: '#222019',
    accent: '#D4A24E',
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
  xxxl: 40,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
} as const;

export const Typography: Record<string, TextStyle> = {
  heading1: { fontSize: 28, fontWeight: '700', lineHeight: 38, letterSpacing: -0.5 },
  heading2: { fontSize: 22, fontWeight: '700', lineHeight: 30, letterSpacing: -0.3 },
  heading3: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 24 },
  bodyBold: { fontSize: 15, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  small: { fontSize: 11, fontWeight: '400', lineHeight: 16 },
};

export const Shadows = {
  card: {
    shadowColor: '#2D2926',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#2D2926',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  fab: {
    shadowColor: '#C4654A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

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
