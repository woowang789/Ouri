import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography } from '@/constants/theme';
import { formatDateRange } from '@/utils/date';
import type { Trip } from '@/types/trip';

interface TripCardProps {
  trip: Trip;
  coverPhotoUrl?: string;
  onPress: () => void;
}

export function TripCard({ trip, coverPhotoUrl, onPress }: TripCardProps) {
  const placeholderColor = useThemeColor({}, 'placeholder');
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card style={StyleSheet.flatten([styles.card, pressed ? styles.pressed : undefined])}>
          {coverPhotoUrl ? (
            <Image
              source={{ uri: coverPhotoUrl }}
              style={styles.cover}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.cover, styles.placeholder, { backgroundColor: placeholderColor + '20' }]}>
              <Ionicons name="image-outline" size={40} color={placeholderColor} />
            </View>
          )}
          <View style={styles.info}>
            <ThemedText style={Typography.bodyBold} numberOfLines={1}>
              {trip.title}
            </ThemedText>
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={primaryColor} />
                <ThemedText style={[Typography.caption, { color: placeholderColor }]}>
                  {formatDateRange(trip.startDate, trip.endDate)}
                </ThemedText>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={primaryColor} />
                <ThemedText style={[Typography.caption, { color: placeholderColor }]} numberOfLines={1}>
                  {trip.locationName}
                </ThemedText>
              </View>
            </View>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cover: {
    width: '100%',
    height: 180,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
