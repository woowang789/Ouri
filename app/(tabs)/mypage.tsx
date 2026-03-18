import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';

export default function MypageScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">마이페이지</ThemedText>
      {/* TODO: Phase 2-8에서 UI 구현 */}
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
