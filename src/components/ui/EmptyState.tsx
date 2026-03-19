import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}

export function EmptyState({ icon = 'albums-outline', title, message }: EmptyStateProps) {
  const placeholderColor = useThemeColor({}, 'placeholder');
  const primaryLightColor = useThemeColor({}, 'primaryLight');
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: primaryLightColor }]}>
        <Ionicons name={icon} size={40} color={primaryColor} />
      </View>
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
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
