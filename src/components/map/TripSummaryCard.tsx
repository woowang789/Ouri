import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography } from '@/constants/theme';
import { formatDateRange } from '@/utils/date';
import type { Trip } from '@/types/trip';

interface TripSummaryCardProps {
  trip: Trip;
  onPress: () => void;
}

export function TripSummaryCard({ trip, onPress }: TripSummaryCardProps) {
  const placeholderColor = useThemeColor({}, 'placeholder');
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.content}>
          <ThemedText style={Typography.bodyBold} numberOfLines={1}>
            {trip.title}
          </ThemedText>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={primaryColor} />
              <ThemedText style={[Typography.caption, { color: placeholderColor }]}>
                {formatDateRange(trip.startDate, trip.endDate)}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={primaryColor} />
              <ThemedText style={[Typography.caption, { color: placeholderColor }]}>
                {trip.locationName}
              </ThemedText>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={placeholderColor} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
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
