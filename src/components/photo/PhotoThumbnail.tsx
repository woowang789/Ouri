import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius } from '@/constants/theme';
import type { Photo } from '@/types/photo';

interface PhotoThumbnailProps {
  photo: Photo;
  size?: number;
  hasMemo?: boolean;
  isCover?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function PhotoThumbnail({ photo, size = 110, hasMemo, isCover, onPress, onLongPress }: PhotoThumbnailProps) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => pressed && styles.pressed}>
      <Image
        source={{ uri: photo.driveThumbnailLink }}
        style={[styles.image, { width: size, height: size }]}
        contentFit="cover"
        transition={200}
      />
      {isCover && (
        <View style={styles.coverBadge}>
          <Ionicons name="image" size={10} color="#fff" />
        </View>
      )}
      {hasMemo && (
        <View style={styles.memoBadge}>
          <Ionicons name="chatbubble-ellipses" size={10} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: BorderRadius.md,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  coverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(196,101,74,0.85)',
    borderRadius: BorderRadius.full,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(196,101,74,0.85)',
    borderRadius: BorderRadius.full,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
