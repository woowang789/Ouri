import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DateRangePicker } from '@/components/trip/DateRangePicker';
import { PlaceSearchInput } from '@/components/trip/PlaceSearchInput';
import { PhotoPickerGrid } from '@/components/photo/PhotoPickerGrid';
import { AddPhotoSheet } from '@/components/photo/AddPhotoSheet';
import { usePhotoPicker } from '@/hooks/usePhotoPicker';
import { extractTripMetadata } from '@/utils/tripMetadata';
import { Spacing, Typography } from '@/constants/theme';
import type { SelectedPhoto } from '@/types/photo';
import type { KakaoPlaceDocument } from '@/types/kakao';

type Step = 'photos' | 'details';

export interface TripFormData {
  title: string;
  startDate: string;
  endDate: string;
  locationName: string;
  locationLat: number;
  locationLng: number;
  photos: SelectedPhoto[];
}

interface TripFormProps {
  // 수정 모드일 때 기존 값
  initialPhotos?: SelectedPhoto[];
  initialTitle?: string;
  initialStartDate?: string | null;
  initialEndDate?: string | null;
  initialPlace?: KakaoPlaceDocument | null;
  // 초기 스텝 (수정 시 사진이 이미 있으면 'photos'에서 시작)
  initialStep?: Step;
  submitLabel: string;
  onSubmit: (data: TripFormData) => Promise<void>;
  onCancel?: () => void;
}

export function TripForm({
  initialPhotos = [],
  initialTitle = '',
  initialStartDate = null,
  initialEndDate = null,
  initialPlace = null,
  initialStep = 'photos',
  submitLabel,
  onSubmit,
  onCancel,
}: TripFormProps) {
  const [step, setStep] = useState<Step>(initialStep);
  const [photos, setPhotos] = useState<SelectedPhoto[]>(initialPhotos);
  const [sheetVisible, setSheetVisible] = useState(false);
  const { pickFromGallery, takePhoto } = usePhotoPicker();

  const [title, setTitle] = useState(initialTitle);
  const [startDate, setStartDate] = useState<string | null>(initialStartDate);
  const [endDate, setEndDate] = useState<string | null>(initialEndDate);
  const [place, setPlace] = useState<KakaoPlaceDocument | null>(initialPlace);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 갤러리에서 사진 선택
  const handlePickFromGallery = async () => {
    const picked = await pickFromGallery();
    if (picked.length > 0) setPhotos((prev) => [...prev, ...picked]);
    setSheetVisible(false);
  };

  // 카메라로 촬영
  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo) setPhotos((prev) => [...prev, photo]);
    setSheetVisible(false);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Step 1 → Step 2: 메타데이터 자동 입력 (기존 값이 없을 때만)
  const handleNext = () => {
    const meta = extractTripMetadata(photos);
    if (meta) {
      if (!startDate) setStartDate(meta.startDate);
      if (!endDate) setEndDate(meta.endDate);
      if (!place && meta.locationName) {
        setPlace({
          id: '',
          placeName: meta.locationName,
          addressName: meta.locationName,
          roadAddressName: '',
          x: String(meta.locationLng),
          y: String(meta.locationLat),
          categoryName: '',
          phone: '',
        });
      }
    }
    setStep('details');
  };

  const handleBack = () => {
    setStep('photos');
  };

  const handleSelectDate = (date: string) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date < startDate) {
        setStartDate(date);
        setEndDate(startDate);
      } else {
        setEndDate(date);
      }
    }
  };

  // 기본 제목 생성: "장소명_기간"
  const buildDefaultTitle = (): string => {
    const placePart = place?.placeName ?? '';
    const datePart =
      startDate && endDate
        ? startDate === endDate
          ? startDate
          : `${startDate}~${endDate}`
        : '';
    if (placePart && datePart) return `${placePart}_${datePart}`;
    return placePart || datePart || '새 여행';
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!startDate || !endDate) newErrors.date = '여행 날짜를 선택하세요';
    if (!place) newErrors.place = '장소를 선택하세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !startDate || !endDate || !place) return;

    setLoading(true);
    await onSubmit({
      title: title.trim() || buildDefaultTitle(),
      startDate,
      endDate,
      locationName: place.placeName,
      locationLat: parseFloat(place.y),
      locationLng: parseFloat(place.x),
      photos,
    });
    setLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      {step === 'photos' ? (
        <View style={styles.stepContainer}>
          <ThemedText style={[Typography.heading3, styles.stepTitle]}>
            사진을 선택하세요
          </ThemedText>
          <ThemedText style={[Typography.caption, styles.stepDescription]}>
            사진의 촬영 정보로 날짜와 장소가 자동 입력됩니다
          </ThemedText>

          {photos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="images-outline"
                title="선택된 사진이 없습니다"
                message="갤러리에서 여행 사진을 선택해주세요"
              />
              <View style={styles.emptyButton}>
                <Button
                  title="사진 선택하기"
                  onPress={() => setSheetVisible(true)}
                />
              </View>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <PhotoPickerGrid
                photos={photos}
                onRemove={handleRemovePhoto}
                onAdd={() => setSheetVisible(true)}
              />
              <View style={styles.nextButtonWrapper}>
                <Button title="다음" onPress={handleNext} />
              </View>
            </ScrollView>
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="여행 제목"
            placeholder={buildDefaultTitle()}
            value={title}
            onChangeText={setTitle}
          />

          <DateRangePicker
            label="여행 날짜"
            startDate={startDate}
            endDate={endDate}
            onSelectDate={handleSelectDate}
            error={errors.date}
          />

          <PlaceSearchInput
            label="장소"
            value={place?.placeName ?? ''}
            onSelect={setPlace}
            error={errors.place}
          />

          <View style={styles.buttonRow}>
            <Button
              title="이전"
              variant="outline"
              onPress={handleBack}
              style={styles.halfButton}
            />
            <Button
              title={submitLabel}
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.halfButton}
            />
          </View>

          {onCancel && (
            <Button
              title="취소"
              variant="text"
              onPress={onCancel}
            />
          )}
        </ScrollView>
      )}

      <AddPhotoSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onPickFromGallery={handlePickFromGallery}
        onTakePhoto={handleTakePhoto}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingTop: Spacing.base,
  },
  stepTitle: {
    paddingHorizontal: Spacing.base,
  },
  stepDescription: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.xs,
    marginBottom: Spacing.base,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyButton: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  nextButtonWrapper: {
    marginTop: Spacing.lg,
  },
  form: {
    padding: Spacing.base,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
});
