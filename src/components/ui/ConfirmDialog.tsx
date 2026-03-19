import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { Button } from './Button';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cardColor = useThemeColor({}, 'card');
  const overlayColor = useThemeColor({}, 'overlay');
  const errorColor = useThemeColor({}, 'error');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={[styles.overlay, { backgroundColor: overlayColor }]} onPress={onCancel}>
        <Pressable style={[styles.dialog, { backgroundColor: cardColor }]} onPress={() => {}}>
          <ThemedText style={[Typography.heading3, styles.title]}>{title}</ThemedText>
          <ThemedText style={[Typography.body, styles.message]}>{message}</ThemedText>
          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              variant="outline"
              onPress={onCancel}
              style={styles.button}
            />
            <Button
              title={confirmLabel}
              variant="primary"
              onPress={onConfirm}
              style={StyleSheet.flatten([
                styles.button,
                destructive ? { backgroundColor: errorColor } : undefined,
              ])}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  message: {
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
  },
});
