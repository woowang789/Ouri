import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
} from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useUploadQueue } from '@/hooks/useUploadQueue';
import { useDeleteQueue } from '@/hooks/useDeleteQueue';

type Mode = 'upload' | 'delete' | null;

/**
 * 현재 표시할 모드 결정 (업로드 우선 — 업로드 → 삭제 순서로 실행)
 */
function getActiveMode(
  uploadActive: boolean,
  uploadComplete: boolean,
  deleteActive: boolean,
  deleteComplete: boolean,
): Mode {
  if (uploadActive || (!deleteActive && uploadComplete)) return 'upload';
  if (deleteActive || deleteComplete) return 'delete';
  return null;
}

/**
 * 글로벌 진행률 바 (_layout.tsx에서 렌더링)
 * 업로드 또는 삭제 큐에 항목이 있으면 어떤 화면에서든 표시
 */
export function GlobalUploadProgressBar() {
  const { stats: uploadStats, isUploading, lastEvent: uploadLastEvent } = useUploadQueue();
  const { stats: deleteStats, isDeleting, lastEvent: deleteLastEvent } = useDeleteQueue();

  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  const uploadActive = isUploading && uploadStats.total > 0;
  const uploadComplete = uploadLastEvent?.type === 'complete';
  const deleteActive = isDeleting && deleteStats.total > 0;
  const deleteComplete = deleteLastEvent?.type === 'complete';

  const mode = getActiveMode(uploadActive, !!uploadComplete, deleteActive, !!deleteComplete);
  const isComplete = mode === 'delete' ? deleteComplete : uploadComplete;
  const current = mode === 'delete' ? deleteStats.deleted : uploadStats.uploaded;
  const total = mode === 'delete' ? deleteStats.total : uploadStats.total;
  const failed = mode === 'delete' ? deleteStats.failed : uploadStats.failed;

  useEffect(() => {
    if (mode && !isComplete) {
      opacity.value = withTiming(1, { duration: 200 });
      progress.value = withTiming(total > 0 ? current / total : 0, { duration: 300 });
    } else if (isComplete) {
      progress.value = withTiming(1, { duration: 300 });
      opacity.value = withDelay(1500, withTiming(0, { duration: 300 }));
    } else {
      opacity.value = 0;
    }
  }, [mode, current, total, isComplete, opacity, progress]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as `${number}%`,
  }));

  if (!mode && !isComplete) return null;

  const label = mode === 'delete' ? '삭제' : '업로드';
  const text = isComplete
    ? `${label} 완료!`
    : failed > 0
      ? `${label} 중 (${current}/${total}) · ${failed}장 실패`
      : `사진 ${label} 중 (${current}/${total})`;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <ThemedText style={styles.text}>{text}</ThemedText>
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
