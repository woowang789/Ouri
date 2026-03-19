import { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TripHeader } from '@/components/trip/TripHeader';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { useTrip } from '@/hooks/useTrip';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getPhotoIdsWithMemo } from '@/services/memo';
import { toDateString, toFriendlyDateHeader } from '@/utils/date';
import { Spacing, Typography } from '@/constants/theme';
import type { Photo } from '@/types/photo';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { trip, photos, loading, deleteTrip } = useTrip(id!);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memoPhotoIds, setMemoPhotoIds] = useState<Set<string>>(new Set());

  const placeholderColor = useThemeColor({}, 'placeholder');

  // 메모가 있는 사진 ID 로드
  useEffect(() => {
    if (photos.length === 0) return;
    getPhotoIdsWithMemo(photos.map((p) => p.id)).then(setMemoPhotoIds);
  }, [photos]);

  // 사진을 날짜별로 그룹핑
  const sections = useMemo(() => {
    const groups = new Map<string, Photo[]>();
    for (const photo of photos) {
      const dateKey = toDateString(photo.takenAt);
      const existing = groups.get(dateKey);
      if (existing) {
        existing.push(photo);
      } else {
        groups.set(dateKey, [photo]);
      }
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, datePhotos]) => ({
        title: date,
        data: datePhotos,
      }));
  }, [photos]);

  // 여행 삭제
  const handleDeleteTrip = async () => {
    setShowDeleteDialog(false);
    await deleteTrip();
    router.back();
  };

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string; data: Photo[] } }) => (
      <View>
        <ThemedText
          style={[Typography.captionBold, styles.dateHeader, { color: placeholderColor }]}
        >
          {toFriendlyDateHeader(section.title)}
        </ThemedText>
        <View style={styles.photoGridWrapper}>
          <PhotoGrid
            photos={section.data}
            memoPhotoIds={memoPhotoIds}
            onPhotoPress={(photo) =>
              router.push(`/trip/${id}/photo-viewer?photoId=${photo.id}`)
            }
          />
        </View>
      </View>
    ),
    [placeholderColor, id, router, memoPhotoIds]
  );

  if (!trip && !loading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>여행을 찾을 수 없습니다</ThemedText>
      </ThemedView>
    );
  }

  if (!trip) return <ThemedView style={styles.container} />;

  return (
    <ThemedView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={() => null}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={
          <TripHeader
            trip={trip}
            onEdit={() => router.push(`/trip/${id}/edit`)}
            onDelete={() => setShowDeleteDialog(true)}
          />
        }
        ListFooterComponent={<View style={styles.footer} />}
        contentContainerStyle={sections.length === 0 ? styles.emptyContent : undefined}
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            <ThemedText style={[Typography.body, { color: placeholderColor, textAlign: 'center' }]}>
              사진을 추가해보세요
            </ThemedText>
          </View>
        }
        stickySectionHeadersEnabled={false}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        title="여행 삭제"
        message="이 여행과 관련된 모든 사진, 메모가 삭제됩니다. 정말 삭제하시겠습니까?"
        confirmLabel="삭제"
        destructive
        onConfirm={handleDeleteTrip}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  photoGridWrapper: {
    marginBottom: Spacing.sm,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyFeed: {
    paddingVertical: Spacing.xxl * 2,
    alignItems: 'center',
  },
  footer: {
    height: 100,
  },
});
