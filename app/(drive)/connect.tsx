import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/stores/authStore';
import { Spacing } from '@/constants/theme';

export default function DriveConnectScreen() {
  const { mockConnectDrive } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Google Drive 연동</ThemedText>
      <ThemedText style={styles.description}>
        사진을 안전하게 내 Google Drive에 보관합니다
      </ThemedText>
      {/* TODO: Phase 2-2에서 실제 Drive 연동 UI 구현 */}
      <Button title="[Mock] Drive 연동" onPress={mockConnectDrive} style={styles.button} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  description: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
    opacity: 0.6,
    textAlign: 'center',
  },
  button: {
    minWidth: 200,
  },
});
