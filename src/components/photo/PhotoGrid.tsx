import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { PhotoThumbnail } from './PhotoThumbnail';
import { Spacing } from '@/constants/theme';
import type { Photo } from '@/types/photo';

interface PhotoGridProps {
  photos: Photo[];
  memoPhotoIds?: Set<string>;
  onPhotoPress: (photo: Photo) => void;
}

const GAP = Spacing.sm;
const PADDING = Spacing.base;
const COLUMNS = 3;

export function PhotoGrid({ photos, memoPhotoIds, onPhotoPress }: PhotoGridProps) {
  const { width } = useWindowDimensions();
  const size = Math.floor((width - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  return (
    <View style={styles.grid}>
      {photos.map((photo) => (
        <PhotoThumbnail
          key={photo.id}
          photo={photo}
          size={size}
          hasMemo={memoPhotoIds?.has(photo.id)}
          onPress={() => onPhotoPress(photo)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: PADDING,
  },
});
