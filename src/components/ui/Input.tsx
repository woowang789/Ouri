import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: InputProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const cardColor = useThemeColor({}, 'card');

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={[Typography.captionBold, styles.label]}>{label}</ThemedText>
      )}
      <TextInput
        style={[
          styles.input,
          {
            color: textColor,
            borderColor: error ? errorColor : borderColor,
            backgroundColor: cardColor,
          },
          style,
        ]}
        placeholderTextColor={placeholderColor}
        {...rest}
      />
      {error && (
        <ThemedText style={[Typography.caption, { color: errorColor }, styles.error]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: 16,
    minHeight: 48,
  },
  error: {
    marginTop: Spacing.xs,
  },
});
