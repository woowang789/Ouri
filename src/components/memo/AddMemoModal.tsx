import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

interface AddMemoModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
}

export function AddMemoModal({ visible, onClose, onSubmit }: AddMemoModalProps) {
  const [content, setContent] = useState('');

  const cardColor = useThemeColor({}, 'card');
  const overlayColor = useThemeColor({}, 'overlay');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
    onClose();
  };

  const handleClose = () => {
    setContent('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={[styles.overlay, { backgroundColor: overlayColor }]} onPress={handleClose}>
          <Pressable style={[styles.dialog, { backgroundColor: cardColor }]} onPress={() => {}}>
            <ThemedText style={[Typography.heading3, styles.title]}>메모 작성</ThemedText>
            <Input
              placeholder="여행의 순간을 기록하세요"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              style={styles.input}
              autoFocus
            />
            <View style={styles.actions}>
              <Button title="취소" variant="outline" onPress={handleClose} style={styles.button} />
              <Button
                title="저장"
                variant="primary"
                onPress={handleSubmit}
                disabled={!content.trim()}
                style={styles.button}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.base,
  },
  input: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.base,
  },
  button: {
    flex: 1,
  },
});
