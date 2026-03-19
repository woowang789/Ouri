import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BorderRadius } from '@/constants/theme';

export function TripMarker() {
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <View pointerEvents="none" style={[styles.marker, { backgroundColor: primaryColor }]}>
      <Ionicons name="location" size={20} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
