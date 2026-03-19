import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BorderRadius, Spacing, Shadows } from '@/constants/theme';

interface CardProps extends ViewProps {
  style?: ViewStyle;
}

export function Card({ style, children, ...rest }: CardProps) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View
      style={[styles.card, Shadows.card, { backgroundColor: cardColor, borderColor }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 0.5,
    padding: Spacing.base,
  },
});
