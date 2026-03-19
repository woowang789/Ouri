import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
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
        <View key={`${index}-${photo.localUri}`} style={[styles.cell, { width: cellSize, height: cellSize }]}>
          <Image
            source={{ uri: photo.localUri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          <Pressable
            style={styles.removeButton}
            onPress={() => onRemove(index)}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={22} color="#fff" />
          </Pressable>
        </View>
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
