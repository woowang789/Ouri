import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { formatDateRange } from '@/utils/date';
import type { Trip } from '@/types/trip';

interface TripHeaderProps {
  trip: Trip;
  coverPhotoUrl?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function TripHeader({ trip, coverPhotoUrl, onEdit, onDelete }: TripHeaderProps) {
  const placeholderColor = useThemeColor({}, 'placeholder');
  const primaryColor = useThemeColor({}, 'primary');
  const errorColor = useThemeColor({}, 'error');
  const surfaceMutedColor = useThemeColor({}, 'surfaceMuted');

  return (
    <View style={styles.container}>
      {/* 커버 이미지 */}
      {coverPhotoUrl && (
        <Image
          source={{ uri: coverPhotoUrl }}
          style={styles.coverImage}
          contentFit="cover"
          transition={300}
        />
      )}

      {/* 제목 + 액션 */}
      <View style={styles.titleRow}>
        <ThemedText style={[Typography.heading1, styles.title]} numberOfLines={2}>
          {trip.title}
        </ThemedText>
        <View style={styles.actions}>
          <Pressable onPress={onEdit} hitSlop={12} style={[styles.actionButton, { backgroundColor: surfaceMutedColor }]}>
            <Ionicons name="create-outline" size={18} color={primaryColor} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={12} style={[styles.actionButton, { backgroundColor: errorColor + '10' }]}>
            <Ionicons name="trash-outline" size={18} color={errorColor} />
          </Pressable>
        </View>
      </View>

      {/* 메타 정보 */}
      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar" size={15} color={primaryColor} />
          <ThemedText style={[Typography.body, { color: placeholderColor }]}>
            {formatDateRange(trip.startDate, trip.endDate)}
          </ThemedText>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location" size={15} color={primaryColor} />
          <ThemedText style={[Typography.body, { color: placeholderColor }]}>
            {trip.locationName}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.base,
    gap: Spacing.md,
  },
  coverImage: {
    height: 220,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
    marginHorizontal: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContainer: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
