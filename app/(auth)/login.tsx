import { StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { SocialLoginButton } from '@/components/auth/SocialLoginButton';
import { useAuth } from '@/stores/authStore';
import { Spacing, Typography } from '@/constants/theme';

export default function LoginScreen() {
  const { mockLogin } = useAuth();

  return (
    <ThemedView style={styles.container}>
      {/* 상단: 앱 로고/타이틀 */}
      <View style={styles.header}>
        <ThemedText style={styles.logo}>Ouri</ThemedText>
        <ThemedText style={styles.subtitle}>
          여행의 순간을 함께 기록하세요
        </ThemedText>
      </View>

      {/* 중앙: 소셜 로그인 버튼 */}
      <View style={styles.buttons}>
        <SocialLoginButton provider="google" onPress={mockLogin} />
        <SocialLoginButton provider="apple" onPress={mockLogin} />
      </View>

      {/* 하단: 회원가입 링크 */}
      <View style={styles.footer}>
        <ThemedText style={Typography.caption}>
          계정이 없으신가요?{' '}
          <Link href="/(auth)/signup">
            <ThemedText style={styles.link}>회원가입</ThemedText>
          </Link>
        </ThemedText>
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
    marginBottom: 60,
  },
  logo: {
    fontSize: 40,
    lineHeight: 56,
    fontWeight: '700',
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: Spacing.sm,
    opacity: 0.6,
    fontSize: 15,
  },
  buttons: {
    gap: Spacing.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  link: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
