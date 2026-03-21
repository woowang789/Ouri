import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useDriveImage } from '@/hooks/useDriveImage';
import { BorderRadius, Spacing } from '@/constants/theme';
import type { SelectedPhoto } from '@/types/photo';

const COLUMNS = 3;
const GAP = Spacing.sm;

interface PhotoPickerGridProps {
  photos: SelectedPhoto[];
  onRemove: (index: number) => void;
  onAdd: () => void;
}

export function PhotoPickerGrid({ photos, onRemove, onAdd }: PhotoPickerGridProps) {
  const { width } = useWindowDimensions();
  const cellSize = (width - Spacing.base * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'placeholder');

  return (
    <View style={styles.grid}>
      {photos.map((photo, index) => (
        <PhotoCell
          key={`${index}-${photo.localUri}`}
          photo={photo}
          size={cellSize}
          onRemove={() => onRemove(index)}
        />
      ))}

      {/* 추가 버튼 */}
      <Pressable
        style={[
          styles.cell,
          styles.addButton,
          { width: cellSize, height: cellSize, borderColor },
        ]}
        onPress={onAdd}
      >
        <Ionicons name="add" size={32} color={placeholderColor} />
      </Pressable>
    </View>
  );
}

// 개별 사진 셀 — drive:// URI는 Drive 인증 이미지로 표시
function PhotoCell({ photo, size, onRemove }: { photo: SelectedPhoto; size: number; onRemove: () => void }) {
  const isDrivePhoto = photo.localUri.startsWith('drive://');
  const driveFileId = isDrivePhoto ? photo.localUri.replace('drive://', '') : undefined;
  const driveSource = useDriveImage(driveFileId);

  const imageSource = isDrivePhoto
    ? driveSource ?? undefined
    : { uri: photo.localUri };

  return (
    <View style={[styles.cell, { width: size, height: size }]}>
      <Image
        source={imageSource}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <Pressable
        style={styles.removeButton}
        onPress={onRemove}
        hitSlop={8}
      >
        <Ionicons name="close-circle" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cell: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  addButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
