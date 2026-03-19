import { useCallback, useEffect, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { FAB } from '@/components/ui/FAB';
import { EmptyState } from '@/components/ui/EmptyState';
import { TripCard } from '@/components/trip/TripCard';
import { useTrips } from '@/hooks/useTrips';
import { groupTripsByMonth } from '@/utils/date';
import { Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getPhotos } from '@/services/photo';
import type { Trip } from '@/types/trip';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trips, loading, refreshing, refresh } = useTrips();
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});
  const placeholderColor = useThemeColor({}, 'placeholder');
  const primaryColor = useThemeColor({}, 'primary');

  // 커버 사진 URL 로드
  useEffect(() => {
    (async () => {
      const urls: Record<string, string> = {};
      for (const trip of trips) {
        if (trip.coverPhotoId) {
          const photos = await getPhotos(trip.id);
          const cover = photos.find((p) => p.id === trip.coverPhotoId);
          if (cover) urls[trip.id] = cover.driveThumbnailLink;
        }
      }
      setCoverUrls(urls);
    })();
  }, [trips]);

  const sections = groupTripsByMonth(trips);

  const renderItem = useCallback(
    ({ item }: { item: Trip }) => (
      <View style={styles.cardWrapper}>
        <TripCard
          trip={item}
          coverPhotoUrl={coverUrls[item.id]}
          onPress={() => router.push(`/trip/${item.id}`)}
        />
      </View>
    ),
    [coverUrls, router]
  );

  if (!loading && trips.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.base }]}>
          <ThemedText style={styles.appTitle}>Ouri</ThemedText>
        </View>
        <EmptyState
          icon="airplane-outline"
          title="아직 여행이 없어요"
          message="새로운 여행을 만들어 추억을 기록해보세요"
        />
        <FAB onPress={() => router.push('/trip/create')} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderContainer}>
            <View style={[styles.sectionDot, { backgroundColor: primaryColor }]} />
            <ThemedText style={[Typography.captionBold, styles.sectionHeader, { color: placeholderColor }]}>
              {section.title}
            </ThemedText>
          </View>
        )}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: insets.top + Spacing.base }]}>
            <ThemedText style={styles.appTitle}>Ouri</ThemedText>
          </View>
        }
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        onRefresh={refresh}
        refreshing={refreshing}
      />
      <FAB onPress={() => router.push('/trip/create')} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#C4654A',
  },
  list: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 100,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionHeader: {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardWrapper: {
    marginBottom: Spacing.base,
  },
});
