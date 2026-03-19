import { Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

interface SocialLoginButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SocialLoginButton({
  onPress,
  loading = false,
  disabled = false,
}: SocialLoginButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles.google,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color="#2D2926" size="small" />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#4285F4" style={styles.icon} />
          <ThemedText style={[Typography.bodyBold, { color: '#2D2926' }]}>
            Google로 계속하기
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    minHeight: 50,
  },
  google: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DBD4',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
