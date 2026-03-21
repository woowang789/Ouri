import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, SectionList, StyleSheet, View } from 'react-native';
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
import { getCoverPhotos } from '@/services/trip';
import type { CoverPhotoInfo } from '@/services/trip';
import type { Trip } from '@/types/trip';

const PAGE_SIZE = 5;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trips, loading, refreshing, refresh } = useTrips();
  const [coverPhotos, setCoverPhotos] = useState<Record<string, CoverPhotoInfo>>({});
  const coverPhotosRef = useRef(coverPhotos);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const placeholderColor = useThemeColor({}, 'placeholder');
  const primaryColor = useThemeColor({}, 'primary');

  // trips 개수가 변경되면 visibleCount 리셋 + 커버 캐시 초기화
  const tripsLengthRef = useRef(trips.length);
  useEffect(() => {
    if (trips.length !== tripsLengthRef.current) {
      tripsLengthRef.current = trips.length;
      setVisibleCount(PAGE_SIZE);
      setCoverPhotos({});
    }
  }, [trips.length]);

  // 화면에 보이는 trips만 슬라이스
  const visibleTrips = useMemo(
    () => trips.slice(0, visibleCount),
    [trips, visibleCount],
  );

  // coverPhotosRef를 렌더 시점에 동기 업데이트
  coverPhotosRef.current = coverPhotos;

  // 아직 커버 사진을 조회하지 않은 trips만 추가 조회 후 병합
  useEffect(() => {
    const uncached = visibleTrips.filter((t) => t.coverPhotoId && !coverPhotos[t.id]);
    if (uncached.length === 0) return;
    getCoverPhotos(uncached).then((fresh) => {
      setCoverPhotos((prev) => ({ ...prev, ...fresh }));
    });
  }, [visibleTrips]); // eslint-disable-line react-hooks/exhaustive-deps

  const sections = useMemo(() => groupTripsByMonth(visibleTrips), [visibleTrips]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, trips.length));
  }, [trips.length]);

  const renderItem = useCallback(
    ({ item }: { item: Trip }) => (
      <View style={styles.cardWrapper}>
        <TripCard
          trip={item}
          coverDriveFileId={coverPhotosRef.current[item.id]?.driveFileId}
          onPress={() => router.push(`/trip/${item.id}`)}
        />
      </View>
    ),
    [router]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string; data: Trip[] } }) => (
      <View style={styles.sectionHeaderContainer}>
        <View style={[styles.sectionDot, { backgroundColor: primaryColor }]} />
        <ThemedText style={[Typography.captionBold, styles.sectionHeader, { color: placeholderColor }]}>
          {section.title}
        </ThemedText>
      </View>
    ),
    [primaryColor, placeholderColor]
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
      <View style={[styles.header, { paddingTop: insets.top + Spacing.base }]}>
        <ThemedText style={styles.appTitle}>Ouri</ThemedText>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        extraData={coverPhotos}
        windowSize={5}
        maxToRenderPerBatch={5}
        initialNumToRender={5}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        onRefresh={refresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
