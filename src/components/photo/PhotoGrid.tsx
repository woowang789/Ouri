import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { PhotoThumbnail } from './PhotoThumbnail';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/theme';
import type { Photo } from '@/types/photo';

interface PhotoGridProps {
  photos: Photo[];
  memoPhotoIds?: Set<string>;
  coverPhotoId?: string | null;
  maxInitialPhotos?: number;
  onPhotoPress: (photo: Photo) => void;
  onPhotoLongPress?: (photo: Photo) => void;
}

const GAP = Spacing.sm;
const PADDING = Spacing.base;
const COLUMNS = 3;
const MAX_INITIAL = 30;

export const PhotoGrid = React.memo(function PhotoGrid({
  photos, memoPhotoIds, coverPhotoId,
  maxInitialPhotos = MAX_INITIAL,
  onPhotoPress, onPhotoLongPress,
}: PhotoGridProps) {
  const { width } = useWindowDimensions();
  const size = Math.floor((width - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS);
  const tintColor = useThemeColor({}, 'tint');
  const [visibleCount, setVisibleCount] = useState(maxInitialPhotos);

  // photos 변경 시 visibleCount 리셋
  useEffect(() => {
    setVisibleCount(maxInitialPhotos);
  }, [photos.length, maxInitialPhotos]);

  const visiblePhotos = photos.length > visibleCount
    ? photos.slice(0, visibleCount)
    : photos;
  const remaining = photos.length - visibleCount;

  const handleShowMore = useCallback(() => {
    setVisibleCount((prev) => prev + MAX_INITIAL);
  }, []);

  return (
    <View style={styles.grid}>
      {visiblePhotos.map((photo) => (
        <PhotoThumbnail
          key={photo.id}
          photo={photo}
          size={size}
          hasMemo={memoPhotoIds?.has(photo.id)}
          isCover={photo.id === coverPhotoId}
          onPress={() => onPhotoPress(photo)}
          onLongPress={() => onPhotoLongPress?.(photo)}
        />
      ))}
      {remaining > 0 && (
        <Pressable onPress={handleShowMore} style={styles.showMore}>
          <ThemedText style={[styles.showMoreText, { color: tintColor }]}>
            나머지 {remaining}장 더 보기
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: PADDING,
  },
  showMore: {
    width: '100%',
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
