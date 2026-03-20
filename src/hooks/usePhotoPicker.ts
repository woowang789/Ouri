import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { reverseGeocode } from '@/services/location';
import type { SelectedPhoto } from '@/types/photo';

// EXIF DateTimeOriginal (YYYY:MM:DD HH:MM:SS) → ISO 8601 변환
function exifDateToISO(exifDate: string | undefined): string | null {
  if (!exifDate) return null;
  // 'YYYY:MM:DD HH:MM:SS' → 'YYYY-MM-DDTHH:MM:SS'
  const iso = exifDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').replace(' ', 'T');
  const date = new Date(iso);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

// ImagePicker 결과를 SelectedPhoto로 변환
function assetToSelectedPhoto(asset: ImagePicker.ImagePickerAsset): SelectedPhoto {
  const exif = asset.exif;

  return {
    localUri: asset.uri,
    takenAt: exifDateToISO(exif?.DateTimeOriginal ?? exif?.DateTime),
    takenLat: exif?.GPSLatitude ?? null,
    takenLng: exif?.GPSLongitude ?? null,
    takenLocationName: null, // 역지오코딩으로 별도 채움
  };
}

// GPS 좌표가 있는 사진들에 역지오코딩 적용
async function enrichWithLocationNames(
  photos: SelectedPhoto[],
): Promise<SelectedPhoto[]> {
  const result: SelectedPhoto[] = [];
  for (const photo of photos) {
    if (photo.takenLat != null && photo.takenLng != null) {
      const locationName = await reverseGeocode(photo.takenLat, photo.takenLng);
      result.push({ ...photo, takenLocationName: locationName });
    } else {
      result.push(photo);
    }
  }
  return result;
}

export function usePhotoPicker() {
  // 갤러리에서 다중 선택
  const pickFromGallery = useCallback(async (): Promise<SelectedPhoto[]> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근 권한을 허용해주세요.');
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      exif: true,
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets) return [];

    const photos = result.assets.map(assetToSelectedPhoto);
    return enrichWithLocationNames(photos);
  }, []);

  // 카메라 촬영
  const takePhoto = useCallback(async (): Promise<SelectedPhoto | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 접근 권한을 허용해주세요.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      exif: true,
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const photo = assetToSelectedPhoto(result.assets[0]);

    // 카메라 촬영 시 EXIF GPS가 없으면 현재 위치로 보완
    if (photo.takenLat == null || photo.takenLng == null) {
      try {
        const { status: locStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          photo.takenLat = loc.coords.latitude;
          photo.takenLng = loc.coords.longitude;
        }
      } catch {
        // 위치 획득 실패 시 무시
      }
    }

    // 역지오코딩
    if (photo.takenLat != null && photo.takenLng != null) {
      photo.takenLocationName = await reverseGeocode(
        photo.takenLat,
        photo.takenLng,
      );
    }

    return photo;
  }, []);

  return { pickFromGallery, takePhoto };
}
