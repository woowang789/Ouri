import { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';

import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { SocialLoginButton } from '@/components/auth/SocialLoginButton';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/stores/authStore';
import { Spacing, Typography } from '@/constants/theme';

export default function SignupScreen() {
  const { mockSignup } = useAuth();
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState<'social' | 'nickname'>('social');

  const handleSocialPress = () => {
    setStep('nickname');
  };

  const handleSignup = () => {
    if (nickname.trim()) {
      mockSignup(nickname.trim());
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 상단: 타이틀 */}
        <View style={styles.header}>
          <ThemedText style={Typography.heading1}>회원가입</ThemedText>
          <ThemedText style={styles.subtitle}>
            {step === 'social'
              ? 'SNS 계정으로 간편하게 시작하세요'
              : '사용할 닉네임을 입력해주세요'}
          </ThemedText>
        </View>

        {step === 'social' ? (
          /* 소셜 로그인 버튼 */
          <View style={styles.buttons}>
            <SocialLoginButton provider="google" onPress={handleSocialPress} />
            <SocialLoginButton provider="apple" onPress={handleSocialPress} />
          </View>
        ) : (
          /* 닉네임 입력 + 가입 완료 */
          <View style={styles.nicknameForm}>
            <Input
              label="닉네임"
              placeholder="2~10자 사이로 입력해주세요"
              value={nickname}
              onChangeText={setNickname}
              maxLength={10}
              autoFocus
            />
            <Button
              title="가입 완료"
              onPress={handleSignup}
              disabled={nickname.trim().length < 2}
              style={styles.submitButton}
            />
          </View>
        )}

        {/* 하단: 로그인 링크 */}
        <View style={styles.footer}>
          <ThemedText style={Typography.caption}>
            이미 계정이 있으신가요?{' '}
            <Link href="/(auth)/login">
              <ThemedText style={styles.link}>로그인</ThemedText>
            </Link>
          </ThemedText>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    marginTop: Spacing.sm,
    opacity: 0.6,
    fontSize: 15,
  },
  buttons: {
    gap: Spacing.md,
  },
  nicknameForm: {
    gap: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.sm,
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
