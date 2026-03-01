import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { format, startOfWeek, addDays, isSameDay, isAfter } from 'date-fns';
import { Spacing } from '@/theme';

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  completedDates?: string[]; // 'yyyy-MM-dd'
}

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function WeekStrip({ selectedDate, onSelectDate, completedDates = [] }: Props) {
  const { theme } = useTheme();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <View style={styles.row}>
      {days.map((day, i) => {
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, today);
        const isFuture = isAfter(day, today);
        const dateStr = format(day, 'yyyy-MM-dd');
        const isCompleted = completedDates.includes(dateStr);

        return (
          <Pressable
            key={i}
            onPress={() => !isFuture && onSelectDate(day)}
            style={[styles.day, isSelected && { backgroundColor: theme.accent }]}
          >
            <Text
              style={[
                styles.letter,
                { color: isSelected ? '#fff' : theme.textSecondary },
                isToday && !isSelected && { color: theme.accent },
              ]}
            >
              {DAY_LETTERS[i]}
            </Text>
            {isCompleted && !isSelected && (
              <View style={[styles.dot, { backgroundColor: theme.accent }]} />
            )}
            {isSelected && (
              <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />
            )}
            {!isCompleted && !isSelected && (
              <View style={[styles.dot, { backgroundColor: 'transparent' }]} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  day: {
    width: 36,
    height: 40,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  letter: { fontSize: 13, fontWeight: '600' },
  dot: { width: 5, height: 5, borderRadius: 99 },
});
