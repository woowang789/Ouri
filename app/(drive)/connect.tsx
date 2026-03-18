import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';

export default function DriveConnectScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Google Drive 연동</ThemedText>
      {/* TODO: Phase 2-2에서 UI 구현 */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
