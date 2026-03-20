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
import * as memoService from '@/services/memo';
import { formatShortDate } from '@/utils/date';
import { AddMemoModal } from '@/components/memo/AddMemoModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spacing, BorderRadius } from '@/constants/theme';
import type { Photo } from '@/types/photo';
import type { Memo } from '@/types/memo';

export default function PhotoViewerScreen() {
  const { id, photoId } = useLocalSearchParams<{ id: string; photoId: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [memo, setMemo] = useState<Memo | null>(null);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getPhotos(id!);
      setPhotos(data);

      if (photoId) {
        const idx = data.findIndex((p) => p.id === photoId);
        if (idx >= 0) {
          setCurrentIndex(idx);
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: idx, animated: false });
          }, 100);
        }
      }
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
      <Pressable onPress={toggleOverlay} style={{ width, height }}>
        <Image
          source={{ uri: item.driveThumbnailLink }}
          style={{ width, height }}
          contentFit="contain"
          transition={200}
        />
      </Pressable>
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
            <View style={{ width: 36 }} />
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
});
