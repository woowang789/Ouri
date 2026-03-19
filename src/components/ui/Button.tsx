import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

type ButtonVariant = 'primary' | 'outline' | 'text';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const primary = useThemeColor({}, 'primary');
  const disabledColor = useThemeColor({}, 'disabled');

  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle[] = [styles.base];
  let textColor = '#fff';

  if (variant === 'primary') {
    containerStyle.push({ backgroundColor: isDisabled ? disabledColor : primary });
    textColor = '#fff';
  } else if (variant === 'outline') {
    containerStyle.push({
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: isDisabled ? disabledColor : primary,
    });
    textColor = isDisabled ? disabledColor : primary;
  } else {
    containerStyle.push({ backgroundColor: 'transparent' });
    textColor = isDisabled ? disabledColor : primary;
  }

  if (style) containerStyle.push(style);

  return (
    <Pressable
      style={({ pressed }) => [
        ...containerStyle,
        pressed && !isDisabled && styles.pressed,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <ThemedText
          style={[Typography.bodyBold, { color: textColor, textAlign: 'center' }]}
        >
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  pressed: {
    opacity: 0.7,
  },
});
