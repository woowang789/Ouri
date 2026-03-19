import { Pressable, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ui/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

type Provider = 'google' | 'apple';

interface SocialLoginButtonProps {
  provider: Provider;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const providerConfig = {
  google: {
    label: 'Google로 계속하기',
    icon: 'logo-google' as const,
  },
  apple: {
    label: 'Apple로 계속하기',
    icon: 'logo-apple' as const,
  },
};

export function SocialLoginButton({
  provider,
  onPress,
  loading = false,
  disabled = false,
}: SocialLoginButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const config = providerConfig[provider];
  const isDisabled = disabled || loading;

  // provider별 스타일 결정
  const getProviderStyle = (): { container: ViewStyle; textColor: string; iconColor: string } => {
    if (provider === 'google') {
      return {
        container: {
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#DADCE0',
        },
        textColor: '#333333',
        iconColor: '#4285F4',
      };
    }
    // Apple: 다크모드 대응
    if (colorScheme === 'dark') {
      return {
        container: {
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#FFFFFF',
        },
        textColor: '#000000',
        iconColor: '#000000',
      };
    }
    return {
      container: {
        backgroundColor: '#000000',
      },
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
    };
  };

  const { container: providerStyle, textColor, iconColor } = getProviderStyle();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        providerStyle,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          <Ionicons name={config.icon} size={20} color={iconColor} style={styles.icon} />
          <ThemedText style={[Typography.bodyBold, { color: textColor }]}>
            {config.label}
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    minHeight: 48,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
