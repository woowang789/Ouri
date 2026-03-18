import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';

export default function SignupScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">회원가입</ThemedText>
      {/* TODO: Phase 2-1에서 UI 구현 */}
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
