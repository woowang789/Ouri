import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPhotos } from '@/services/photo';
import { updateTrip, getTrip } from '@/services/trip';
import * as memoService from '@/services/memo';
import { useDriveImage } from '@/hooks/useDriveImage';
import { formatShortDate } from '@/utils/date';
import { AddMemoModal } from '@/components/memo/AddMemoModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import type { Photo } from '@/types/photo';
import type { Memo } from '@/types/memo';

// FlatList renderItem 내에서 훅을 사용하기 위한 컴포넌트 추출
function FullScreenPhoto({
  item,
  width,
  height,
  onPress,
}: {
  item: Photo;
  width: number;
  height: number;
  onPress: () => void;
}) {
  const driveSource = useDriveImage(item.driveFileId);

  return (
    <Pressable onPress={onPress} style={{ width, height }}>
      <Image
        source={driveSource ?? { uri: item.driveThumbnailLink }}
        placeholder={{ uri: item.driveThumbnailLink }}
        style={{ width, height }}
        contentFit="contain"
        transition={200}
      />
    </Pressable>
  );
}

export default function PhotoViewerScreen() {
  const { id, photoId } = useLocalSearchParams<{ id: string; photoId: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [memo, setMemo] = useState<Memo | null>(null);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [data, tripData] = await Promise.all([
        getPhotos(id!),
        getTrip(id!),
      ]);

      let idx = 0;
      if (photoId) {
        const found = data.findIndex((p) => p.id === photoId);
        if (found >= 0) idx = found;
      }

      setInitialIndex(idx);
      setCurrentIndex(idx);
      setPhotos(data);
      setCoverPhotoId(tripData?.coverPhotoId ?? null);
    })();
  }, [id, photoId]);

  const currentPhoto = photos[currentIndex];

  // 현재 사진의 메모 로드
  const currentPhotoId = currentPhoto?.id;
  useEffect(() => {
    if (!currentPhotoId) return;
    (async () => {
      try {
        const memos = await memoService.getMemosByPhoto(currentPhotoId);
        setMemo(memos.length > 0 ? memos[0] : null);
      } catch (e) {
        console.warn('메모 조회 실패:', e);
        setMemo(null);
      }
    })();
  }, [currentPhotoId]);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const toggleOverlay = () => setShowOverlay((prev) => !prev);

  // 커버 사진 설정
  const handleSetCover = async () => {
    if (!currentPhoto) return;
    try {
      await updateTrip(id!, { coverPhotoId: currentPhoto.id });
      setCoverPhotoId(currentPhoto.id);
      setShowMoreSheet(false);
    } catch {
      Alert.alert('오류', '커버 사진 설정에 실패했습니다');
      setShowMoreSheet(false);
    }
  };

  // 메모 추가
  const handleAddMemo = async (content: string) => {
    if (!currentPhoto) return;
    try {
      const newMemo = await memoService.createMemo({
        photoId: currentPhoto.id,
        content,
      });
      setMemo(newMemo);
    } catch (e) {
      Alert.alert('오류', '메모 저장에 실패했습니다');
    }
  };

  // 메모 삭제
  const handleDeleteMemo = async () => {
    if (!memo) return;
    try {
      await memoService.deleteMemo(memo.id);
      setMemo(null);
      setShowDeleteDialog(false);
    } catch (e) {
      Alert.alert('오류', '메모 삭제에 실패했습니다');
      setShowDeleteDialog(false);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: Photo }) => (
      <FullScreenPhoto
        item={item}
        width={width}
        height={height}
        onPress={toggleOverlay}
      />
    ),
    [width, height]
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={photos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {showOverlay && (
        <>
          {/* 상단 바 */}
          <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
            {photos.length > 0 && (
              <View style={styles.pageCounterContainer}>
                <Text style={styles.pageCounter}>
                  {currentIndex + 1} / {photos.length}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => setShowMoreSheet(true)}
              hitSlop={12}
              style={styles.moreButton}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
            </Pressable>
          </View>

          {/* 하단 정보 */}
          {currentPhoto && (
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.base }]}>
              {/* 촬영 정보 */}
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.infoText}>
                  {formatShortDate(currentPhoto.takenAt)}
                </Text>
              </View>
              {currentPhoto.takenLocationName && (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.infoText}>
                    {currentPhoto.takenLocationName}
                  </Text>
                </View>
              )}

              {/* 메모 영역 */}
              {memo ? (
                <Pressable
                  style={styles.memoContainer}
                  onLongPress={() => setShowDeleteDialog(true)}
                >
                  <Ionicons name="chatbubble-ellipses" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.memoText} numberOfLines={3}>
                    {memo.content}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.addMemoButton}
                  onPress={() => setShowMemoModal(true)}
                >
                  <View style={styles.addMemoPill}>
                    <Ionicons name="create-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.addMemoText}>메모 남기기</Text>
                  </View>
                </Pressable>
              )}
            </View>
          )}
        </>
      )}

      <AddMemoModal
        visible={showMemoModal}
        onClose={() => setShowMemoModal(false)}
        onSubmit={handleAddMemo}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        title="메모 삭제"
        message="이 메모를 삭제하시겠습니까?"
        confirmLabel="삭제"
        destructive
        onConfirm={handleDeleteMemo}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <BottomSheet visible={showMoreSheet} onClose={() => setShowMoreSheet(false)}>
        <Pressable
          onPress={handleSetCover}
          style={({ pressed }) => [styles.sheetActionItem, pressed && { opacity: 0.6 }]}
          disabled={currentPhoto?.id === coverPhotoId}
        >
          <Ionicons
            name={currentPhoto?.id === coverPhotoId ? 'checkmark-circle' : 'image-outline'}
            size={20}
            color={currentPhoto?.id === coverPhotoId ? '#999' : '#333'}
          />
          <ThemedText
            style={[
              Typography.body,
              currentPhoto?.id === coverPhotoId && { color: '#999' },
            ]}
          >
            {currentPhoto?.id === coverPhotoId ? '현재 커버 사진' : '커버 사진으로 설정'}
          </ThemedText>
        </Pressable>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0908',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(10,9,8,0.5)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageCounterContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  pageCounter: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: 'rgba(10,9,8,0.6)',
    gap: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  memoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  memoText: {
    flex: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  addMemoButton: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  addMemoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  addMemoText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
  },
});
