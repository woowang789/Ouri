import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography } from '@/constants/theme';
import { formatDateRange } from '@/utils/date';
import type { Trip } from '@/types/trip';

interface TripHeaderProps {
  trip: Trip;
  onEdit: () => void;
  onDelete: () => void;
}

export function TripHeader({ trip, onEdit, onDelete }: TripHeaderProps) {
  const placeholderColor = useThemeColor({}, 'placeholder');
  const primaryColor = useThemeColor({}, 'primary');
  const errorColor = useThemeColor({}, 'error');

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <ThemedText style={[Typography.heading2, styles.title]} numberOfLines={2}>
          {trip.title}
        </ThemedText>
        <View style={styles.actions}>
          <Pressable onPress={onEdit} hitSlop={8}>
            <Ionicons name="create-outline" size={22} color={primaryColor} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={22} color={errorColor} />
          </Pressable>
        </View>
      </View>
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={16} color={primaryColor} />
          <ThemedText style={[Typography.body, { color: placeholderColor }]}>
            {formatDateRange(trip.startDate, trip.endDate)}
          </ThemedText>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={16} color={primaryColor} />
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
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  meta: {
    gap: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
