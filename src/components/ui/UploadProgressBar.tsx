import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
} from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useUploadQueue } from '@/hooks/useUploadQueue';

/**
 * 글로벌 업로드 진행률 바 (_layout.tsx에서 렌더링)
 * 업로드 큐에 항목이 있으면 어떤 화면에서든 표시
 */
export function GlobalUploadProgressBar() {
  const { stats, isUploading, lastEvent } = useUploadQueue();
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  const total = stats.total;
  const current = stats.uploaded;
  const visible = isUploading && total > 0;
  const isComplete = lastEvent?.type === 'complete';

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      progress.value = withTiming(total > 0 ? current / total : 0, { duration: 300 });
    }
    if (isComplete) {
      progress.value = withTiming(1, { duration: 300 });
      opacity.value = withDelay(1500, withTiming(0, { duration: 300 }));
    }
    if (!visible && !isComplete) {
      opacity.value = 0;
    }
  }, [current, total, visible, isComplete, opacity, progress]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as `${number}%`,
  }));

  if (!visible && !isComplete) return null;

  const hasError = stats.failed > 0;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <ThemedText style={styles.text}>
        {isComplete
          ? '업로드 완료!'
          : hasError
            ? `업로드 중 (${current}/${total}) · ${stats.failed}장 실패`
            : `사진 업로드 중 (${current}/${total})`}
      </ThemedText>
      <View style={styles.trackContainer}>
        <Animated.View style={[styles.track, barStyle]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.base,
    right: Spacing.base,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    shadowColor: '#2D2926',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 999,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  trackContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.border,
    overflow: 'hidden',
  },
  track: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
});
