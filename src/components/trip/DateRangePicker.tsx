import { StyleSheet, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing, Typography } from '@/constants/theme';

interface DateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onSelectDate: (date: string) => void;
  label?: string;
  error?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onSelectDate,
  label,
  error,
}: DateRangePickerProps) {
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const errorColor = useThemeColor({}, 'error');

  // 마킹 기간 생성
  const markedDates: Record<string, object> = {};

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      const key = current.toISOString().split('T')[0];
      const isStart = key === startDate;
      const isEnd = key === endDate;
      markedDates[key] = {
        color: primaryColor,
        textColor: '#fff',
        startingDay: isStart,
        endingDay: isEnd,
      };
      current.setDate(current.getDate() + 1);
    }
  } else if (startDate) {
    markedDates[startDate] = {
      color: primaryColor,
      textColor: '#fff',
      startingDay: true,
      endingDay: true,
    };
  }

  const handleDayPress = (day: DateData) => {
    onSelectDate(day.dateString);
  };

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={[Typography.captionBold, styles.label]}>{label}</ThemedText>
      )}
      <Calendar
        markingType="period"
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          backgroundColor: bgColor,
          calendarBackground: cardColor,
          textSectionTitleColor: textColor,
          dayTextColor: textColor,
          todayTextColor: primaryColor,
          arrowColor: primaryColor,
          monthTextColor: textColor,
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13,
        }}
      />
      {error && (
        <ThemedText style={[Typography.caption, { color: errorColor }]}>
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
});
