import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { SocialLoginButton } from '@/components/auth/SocialLoginButton';
import { useAuth } from '@/stores/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
  const placeholderColor = useThemeColor({}, 'placeholder');
  const primaryColor = useThemeColor({}, 'primary');
  const primaryLightColor = useThemeColor({}, 'primaryLight');
  const borderColor = useThemeColor({}, 'border');

  const handleLogin = () => {
    clearError();
    login();
  };

  return (
    <ThemedView style={styles.container}>
      {/* 로고 */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: primaryLightColor }]}>
          <Ionicons name="airplane" size={40} color={primaryColor} />
        </View>
        <ThemedText style={[Typography.heading1, styles.logo]}>Ouri</ThemedText>
        <ThemedText style={[Typography.body, { color: placeholderColor }]}>
          여행의 순간을 함께 기록하세요
        </ThemedText>
      </View>

      {/* 에러 메시지 */}
      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      {/* 소셜 로그인 */}
      <View style={[styles.loginSection, { borderColor }]}>
        <ThemedText style={[Typography.captionBold, styles.sectionLabel, { color: placeholderColor }]}>
          시작하기
        </ThemedText>
        <View style={styles.buttons}>
          <SocialLoginButton onPress={handleLogin} loading={isLoading} />
        </View>
      </View>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logo: {
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    fontSize: 14,
  },
  loginSection: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  sectionLabel: {
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buttons: {
    gap: Spacing.md,
  },
});
