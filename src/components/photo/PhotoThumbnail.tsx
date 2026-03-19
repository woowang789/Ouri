import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius } from '@/constants/theme';
import type { Photo } from '@/types/photo';

interface PhotoThumbnailProps {
  photo: Photo;
  size?: number;
  hasMemo?: boolean;
  onPress?: () => void;
}

export function PhotoThumbnail({ photo, size = 110, hasMemo, onPress }: PhotoThumbnailProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Image
        source={{ uri: photo.driveThumbnailLink }}
        style={[styles.image, { width: size, height: size }]}
        contentFit="cover"
        transition={200}
      />
      {hasMemo && (
        <View style={styles.memoBadge}>
          <Ionicons name="document-text" size={12} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: BorderRadius.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  memoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
