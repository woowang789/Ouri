import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ui/ThemedText';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

// --- 타입 ---

interface ToastConfig {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  duration?: number; // 기본 3000ms
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
}

// --- Context ---

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast는 ToastProvider 내부에서 사용해야 합니다');
  }
  return context;
}

// --- 타입별 아이콘 ---

const TOAST_ICONS: Record<ToastConfig['type'], keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  warning: 'warning',
  error: 'close-circle',
  info: 'information-circle',
};

// --- Toast UI ---

// SafeAreaProvider 없이도 동작하도록 고정 상단 여백 사용
const TOP_INSET = Platform.OS === 'ios' ? 54 : 40;

function ToastView({ config, onHide }: { config: ToastConfig; onHide: () => void }) {
  const translateY = useSharedValue(-120);

  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');
  const errorColor = useThemeColor({}, 'error');
  const primaryColor = useThemeColor({}, 'primary');

  const colorMap: Record<ToastConfig['type'], string> = {
    success: successColor,
    warning: warningColor,
    error: errorColor,
    info: primaryColor,
  };

  const accentColor = colorMap[config.type];
  const duration = config.duration ?? 3000;

  useEffect(() => {
    // 슬라이드 다운 → 대기 → 슬라이드 업
    translateY.value = withSequence(
      withTiming(0, { duration: 300 }),
      withDelay(
        duration,
        withTiming(-120, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(onHide)();
          }
        }),
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.toast,
        { top: TOP_INSET, backgroundColor: cardColor },
        Shadows.card,
        animatedStyle,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <Ionicons
        name={TOAST_ICONS[config.type]}
        size={20}
        color={accentColor}
        style={styles.icon}
      />
      <ThemedText
        style={[Typography.caption, { color: textColor, flex: 1 }]}
        numberOfLines={2}
      >
        {config.message}
      </ThemedText>
    </Animated.View>
  );
}

// --- Provider ---

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ToastConfig | null>(null);
  const keyRef = useRef(0);

  const showToast = useCallback((config: ToastConfig) => {
    keyRef.current += 1;
    setCurrent(config);
  }, []);

  const hide = useCallback(() => {
    setCurrent(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={styles.wrapper}>
        {children}
        {current && <ToastView key={keyRef.current} config={current} onHide={hide} />}
      </View>
    </ToastContext.Provider>
  );
}

// --- 스타일 ---

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    zIndex: 9999,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
