import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing, Typography } from '@/constants/theme';

interface AddPhotoSheetProps {
  visible: boolean;
  onClose: () => void;
  onPickFromGallery: () => void;
  onTakePhoto: () => void;
}

export function AddPhotoSheet({
  visible,
  onClose,
  onPickFromGallery,
  onTakePhoto,
}: AddPhotoSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ThemedText style={[Typography.heading3, styles.title]}>사진 추가</ThemedText>
      <View style={styles.options}>
        <Button
          title="갤러리에서 선택"
          variant="outline"
          onPress={onPickFromGallery}
        />
        <Button
          title="카메라로 촬영"
          variant="outline"
          onPress={onTakePhoto}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  options: {
    gap: Spacing.sm,
  },
});
