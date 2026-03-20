import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, Spacing, Typography } from '@/constants/theme';

const BANNER_CONTENT_HEIGHT = 36;

/**
 * 오프라인 상태일 때 화면 상단에 표시되는 배너
 * 노치/Dynamic Island 영역을 포함하여 배경색을 채우고,
 * 텍스트는 SafeArea 아래에 표시
 */
export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const animatedValue = useRef(new Animated.Value(0)).current;

  const totalHeight = insets.top + BANNER_CONTENT_HEIGHT;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOnline ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOnline, animatedValue]);

  const height = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, totalHeight],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View style={[styles.container, { height, opacity, backgroundColor: colors.warning }]}>
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={14} color="#FFFFFF" />
        <Animated.Text style={[styles.text, { opacity }]}>
          오프라인 모드 — 저장된 데이터를 표시합니다
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
  },
  text: {
    ...Typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
