import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';

export default function TripCreateScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">여행 만들기</ThemedText>
      {/* TODO: Phase 2-4에서 UI 구현 */}
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
