import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography } from '@/constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}

export function EmptyState({ icon = 'albums-outline', title, message }: EmptyStateProps) {
  const placeholderColor = useThemeColor({}, 'placeholder');

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={placeholderColor} />
      <ThemedText style={[Typography.heading3, styles.title]}>{title}</ThemedText>
      {message && (
        <ThemedText style={[Typography.body, { color: placeholderColor }, styles.message]}>
          {message}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.sm,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.base,
  },
  message: {
    textAlign: 'center',
  },
});
