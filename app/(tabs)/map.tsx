import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import MapView, { Marker } from 'react-native-maps';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { TripMarker } from '@/components/map/TripMarker';
import { TripSummaryCard } from '@/components/map/TripSummaryCard';
import { useTrips } from '@/hooks/useTrips';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography } from '@/constants/theme';
import type { Trip } from '@/types/trip';

// 한국 중심 좌표
const KOREA_CENTER = {
  latitude: 36.0,
  longitude: 127.5,
  latitudeDelta: 5,
  longitudeDelta: 5,
};

export default function MapScreen() {
  const router = useRouter();
  const { trips } = useTrips();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const placeholderColor = useThemeColor({}, 'placeholder');
  const tabBarHeight = useBottomTabBarHeight();

  // Android에서 Google Maps API 키가 없을 경우 안내
  if (Platform.OS === 'android') {
    return (
      <ThemedView style={styles.fallback}>
        <ThemedText style={[Typography.heading3, { textAlign: 'center' }]}>
          지도 기능
        </ThemedText>
        <ThemedText style={[Typography.body, { color: placeholderColor, textAlign: 'center' }]}>
          Android에서는 Google Maps API 키가 필요합니다.{'\n'}
          iOS 시뮬레이터에서 확인해주세요.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={KOREA_CENTER}
        onPress={() => setSelectedTrip(null)}
      >
        {trips.map((trip) => (
          <Marker
            key={trip.id}
            coordinate={{
              latitude: trip.locationLat,
              longitude: trip.locationLng,
            }}
            onPress={() => setSelectedTrip(trip)}
            onSelect={() => setSelectedTrip(trip)}
            tracksViewChanges={false}
          >
            <TripMarker />
          </Marker>
        ))}
      </MapView>

      {selectedTrip && (
        <View style={[styles.cardContainer, { bottom: tabBarHeight + Spacing.base }]}>
          <TripSummaryCard
            trip={selectedTrip}
            onPress={() => router.push(`/trip/${selectedTrip.id}`)}
          />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.base,
  },
  cardContainer: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
  },
});
