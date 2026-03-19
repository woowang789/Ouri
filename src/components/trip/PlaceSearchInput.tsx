import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { searchPlaces } from '@/services/place';
import type { KakaoPlaceDocument } from '@/types/kakao';

interface PlaceSearchInputProps {
  value: string;
  onSelect: (place: KakaoPlaceDocument) => void;
  label?: string;
  error?: string;
}

export function PlaceSearchInput({ value, onSelect, label, error }: PlaceSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<KakaoPlaceDocument[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'placeholder');

  // 300ms 디바운스 검색
  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!text.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const data = await searchPlaces(text);
      setResults(data);
      setShowDropdown(data.length > 0);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSelect = (place: KakaoPlaceDocument) => {
    setQuery(place.placeName);
    setShowDropdown(false);
    onSelect(place);
  };

  return (
    <View style={styles.container}>
      <Input
        label={label}
        value={query}
        onChangeText={handleChangeText}
        placeholder="장소를 검색하세요"
        error={error}
        onFocus={() => {
          if (results.length > 0) setShowDropdown(true);
        }}
      />
      {showDropdown && (
        <View style={[styles.dropdown, { backgroundColor: cardColor, borderColor }]}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {results.map((item) => (
              <Pressable key={item.id} style={styles.item} onPress={() => handleSelect(item)}>
                <ThemedText style={Typography.body} numberOfLines={1}>
                  {item.placeName}
                </ThemedText>
                <ThemedText
                  style={[Typography.caption, { color: placeholderColor }]}
                  numberOfLines={1}
                >
                  {item.addressName}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    maxHeight: 200,
    marginTop: Spacing.xs,
  },
  item: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: 2,
  },
});
