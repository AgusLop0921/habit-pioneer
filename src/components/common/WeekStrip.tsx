import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { format, startOfWeek, addDays, addWeeks, isSameDay } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { useTranslation } from 'react-i18next';
import { Spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

const WEEK_LIMIT = 2; // weeks back / forward from current week
const TOTAL_WEEKS = WEEK_LIMIT * 2 + 1; // 5 pages

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  completedDates?: string[]; // 'yyyy-MM-dd'
}

export default function WeekStrip({ selectedDate, onSelectDate, completedDates = [] }: Props) {
  const { theme } = useTheme();
  const locale = useDateLocale();
  const { t } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const flatRef = useRef<FlatList<number>>(null);
  const hasScrolledInitially = useRef(false);

  const currentWeekStart = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today]);

  // When selectedDate changes externally (e.g. app returns to foreground),
  // recalculate the correct weekOffset so the strip shows the right week.
  useEffect(() => {
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const diffMs = selectedWeekStart.getTime() - currentWeekStart.getTime();
    const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    const clamped = Math.max(-WEEK_LIMIT, Math.min(WEEK_LIMIT, diffWeeks));
    if (clamped !== weekOffset) {
      setWeekOffset(clamped);
    }
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll FlatList whenever weekOffset changes (e.g. via arrows)
  useEffect(() => {
    if (pageWidth <= 0) return;
    const index = weekOffset + WEEK_LIMIT;
    flatRef.current?.scrollToOffset({
      offset: index * pageWidth,
      animated: hasScrolledInitially.current,
    });
    hasScrolledInitially.current = true;
  }, [weekOffset, pageWidth]);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pageWidth <= 0) return;
      const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
      const newOffset = index - WEEK_LIMIT;
      if (newOffset === weekOffset) return;

      const newWeekStart = addWeeks(currentWeekStart, newOffset);
      const newDays = Array.from({ length: 7 }, (_, i) => addDays(newWeekStart, i));
      const alreadyVisible = newDays.some((d) => isSameDay(d, selectedDate));
      if (!alreadyVisible) {
        onSelectDate(newOffset > weekOffset ? newDays[0] : newDays[6]);
      }
      setWeekOffset(newOffset);
    },
    [pageWidth, weekOffset, currentWeekStart, selectedDate, onSelectDate]
  );

  const canGoPrev = weekOffset > -WEEK_LIMIT;
  const canGoNext = weekOffset < WEEK_LIMIT;

  const handlePrev = () => {
    if (!canGoPrev) return;
    const newOffset = weekOffset - 1;
    const newWeekStart = addWeeks(currentWeekStart, newOffset);
    const newDays = Array.from({ length: 7 }, (_, i) => addDays(newWeekStart, i));
    if (!newDays.some((d) => isSameDay(d, selectedDate))) onSelectDate(newDays[6]);
    setWeekOffset(newOffset);
  };

  const handleNext = () => {
    if (!canGoNext) return;
    const newOffset = weekOffset + 1;
    const newWeekStart = addWeeks(currentWeekStart, newOffset);
    const newDays = Array.from({ length: 7 }, (_, i) => addDays(newWeekStart, i));
    if (!newDays.some((d) => isSameDay(d, selectedDate))) onSelectDate(newDays[0]);
    setWeekOffset(newOffset);
  };

  const renderWeek = useCallback(
    ({ item: offset }: { item: number }) => {
      const weekStart = addWeeks(currentWeekStart, offset);
      const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

      return (
        <View style={[styles.row, { width: pageWidth }]}>
          {days.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCompleted = completedDates.includes(dateStr);

            return (
              <Pressable
                key={i}
                onPress={() => onSelectDate(day)}
                style={[styles.day, isSelected && { backgroundColor: theme.accent }]}
                accessibilityRole="button"
                accessibilityLabel={format(day, 'EEEE d MMMM', { locale })}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.letter,
                    { color: isSelected ? '#fff' : theme.textMuted },
                    isToday && !isSelected && { color: theme.accent },
                  ]}
                >
                  {format(day, 'EEEEE', { locale })}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    { color: isSelected ? '#fff' : theme.text },
                    isToday && !isSelected && { color: theme.accent, fontWeight: '800' },
                  ]}
                >
                  {format(day, 'd')}
                </Text>
                {/* Indicator dot: today ring / completed / selected / empty */}
                {isToday && !isSelected ? (
                  <View style={[styles.todayDot, { backgroundColor: theme.accent }]} />
                ) : isCompleted && !isSelected ? (
                  <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                ) : isSelected ? (
                  <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />
                ) : (
                  <View style={styles.dotSpacer} />
                )}
              </Pressable>
            );
          })}
        </View>
      );
    },
    [pageWidth, selectedDate, completedDates, theme, locale, today, currentWeekStart, onSelectDate]
  );

  const weeks = useMemo(() => Array.from({ length: TOTAL_WEEKS }, (_, i) => i - WEEK_LIMIT), []);

  return (
    <View style={styles.wrapper}>
      {/* Prev arrow */}
      <Pressable
        onPress={handlePrev}
        disabled={!canGoPrev}
        style={styles.arrow}
        accessibilityRole="button"
        accessibilityLabel={t('a11y.previousWeek')}
      >
        <Ionicons
          name="chevron-back"
          size={18}
          color={canGoPrev ? theme.accent : theme.textSecondary}
          style={{ opacity: canGoPrev ? 1 : 0.3 }}
        />
      </Pressable>

      <View
        style={styles.listContainer}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w !== pageWidth) setPageWidth(w);
        }}
      >
        {pageWidth > 0 && (
          <FlatList
            ref={flatRef}
            data={weeks}
            keyExtractor={(item) => String(item)}
            renderItem={renderWeek}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            initialScrollIndex={WEEK_LIMIT}
            getItemLayout={(_, index) => ({ length: pageWidth, offset: index * pageWidth, index })}
            bounces={false}
          />
        )}
      </View>

      {/* Next arrow */}
      <Pressable
        onPress={handleNext}
        disabled={!canGoNext}
        style={styles.arrow}
        accessibilityRole="button"
        accessibilityLabel={t('a11y.nextWeek')}
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          color={canGoNext ? theme.accent : theme.textSecondary}
          style={{ opacity: canGoNext ? 1 : 0.3 }}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  listContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  arrow: {
    width: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
    marginHorizontal: 2,
  },
  letter: { fontSize: 11, fontWeight: '600', lineHeight: 14 },
  dayNumber: { fontSize: 16, fontWeight: '600', lineHeight: 20 },
  dot: { width: 4, height: 4, borderRadius: 99, marginTop: 2 },
  todayDot: { width: 6, height: 6, borderRadius: 99, marginTop: 2 },
  dotSpacer: { width: 4, height: 4, marginTop: 2 },
});
