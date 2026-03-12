import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { format, isSameDay } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useHabits, useProgress, useDateLocale, useHydration } from '@/hooks';
import HabitCard from '@/components/habits/HabitCard';
import OrangeButton from '@/components/common/OrangeButton';
import BottomModal from '@/components/common/BottomModal';
import EditModal from '@/components/common/EditModal';
import SettingsBar from '@/components/common/SettingsBar';
import FormInput from '@/components/common/FormInput';
import EmojiPicker from '@/components/common/EmojiPicker';
import Icon from '@/components/common/Icon';
import ProgressRing from '@/components/common/ProgressRing';
import WeekStrip from '@/components/common/WeekStrip';
import { Spacing, Radius, type AppTheme } from '@/theme';
import type { Habit } from '@/types';
import { Frequency } from '@/types';

export default function TodayScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [selectedDate, setSelectedDate] = useState(new Date());

  // Reset to today whenever the app comes back to the foreground
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        setSelectedDate(new Date());
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  const {
    dailyHabits,
    weeklyHabits,
    monthlyHabits,
    isHabitDone,
    completedDates,
    addHabit,
    editHabit,
    removeHabit,
    toggleHabit,
  } = useHabits(selectedDate);

  const progress = useProgress(selectedDate);
  const locale = useDateLocale();
  const hydrated = useHydration();

  const [modalHabit, setModalHabit] = useState(false);
  const [editItem, setEditItem] = useState<{ type: 'habit'; data: Habit } | null>(null);

  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('');
  const [habitFreq, setHabitFreq] = useState<Frequency>('daily');

  const [isDailyHabitsExpanded, setIsDailyHabitsExpanded] = useState(true);
  const [isWeeklyHabitsExpanded, setIsWeeklyHabitsExpanded] = useState(true);
  const [isMonthlyHabitsExpanded, setIsMonthlyHabitsExpanded] = useState(true);

  const isToday = isSameDay(selectedDate, new Date());

  if (!hydrated) {
    return (
      <SafeAreaView
        style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: theme.bg }]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </SafeAreaView>
    );
  }

  const handleAddHabit = () => {
    if (!habitName.trim()) return;
    addHabit({
      name: habitName.trim(),
      description: habitDesc.trim(),
      emoji: habitEmoji.trim() || undefined,
      frequency: habitFreq,
    });
    setHabitName('');
    setHabitDesc('');
    setHabitEmoji('');
    setHabitFreq('daily');
    setModalHabit(false);
  };

  const frequencies: Frequency[] = ['daily', 'weekly', 'monthly'];

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <SettingsBar />

      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        completedDates={completedDates}
      />

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={s.header}>
          <Text style={[s.title, { color: theme.text }]}>
            {isToday ? t('today') : format(selectedDate, 'EEE, d MMM', { locale })}
          </Text>
          <Pressable
            style={[s.circleBtn, { backgroundColor: theme.surface }]}
            onPress={() => setModalHabit(true)}
          >
            <Text style={[s.circleBtnText, { color: theme.text }]}>+</Text>
          </Pressable>
        </View>

        {/* Progress ring */}
        <View style={s.ringSection}>
          <ProgressRing
            progress={progress.habits}
            size={160}
            strokeWidth={12}
            label={t('habitsToday')}
          />
        </View>

        {/* Daily habits */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsDailyHabitsExpanded(!isDailyHabitsExpanded);
              }}
            >
              <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>{t('dailyHabits')}</Text>
              <Icon
                name={isDailyHabitsExpanded ? 'chevronDown' : 'chevronRight'}
                size={16}
                color={theme.textSecondary}
              />
            </Pressable>
            <Pressable onPress={() => setModalHabit(true)}>
              <Text style={[s.sectionAction, { color: theme.accent }]}>{t('newHabit')}</Text>
            </Pressable>
          </View>
          {isDailyHabitsExpanded && (
            dailyHabits.length === 0 ? (
              <View style={[s.emptyCard, { backgroundColor: theme.surface }]}>
                <Text style={s.emptyBig}>✨</Text>
                <Text style={[s.emptyTitle, { color: theme.text }]}>{t('habitsEmpty.title')}</Text>
                <Text style={[s.emptyDesc, { color: theme.textSecondary }]}>{t('habitsEmpty.desc')}</Text>
                <Pressable
                  style={[s.emptyBtn, { backgroundColor: theme.accent }]}
                  onPress={() => setModalHabit(true)}
                >
                  <Text style={s.emptyBtnText}>{t('newHabit')}</Text>
                </Pressable>
              </View>
            ) : (
              dailyHabits.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  done={isHabitDone(h)}
                  onToggle={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleHabit(h.id);
                  }}
                  onDelete={() => removeHabit(h.id)}
                  onEdit={() => setEditItem({ type: 'habit', data: h })}
                />
              ))
            )
          )}
        </View>

        {/* Weekly habits */}
        {weeklyHabits.length > 0 && (
          <View style={s.section}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsWeeklyHabitsExpanded(!isWeeklyHabitsExpanded);
              }}
            >
              <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>{t('weeklyHabits')}</Text>
              <Icon
                name={isWeeklyHabitsExpanded ? 'chevronDown' : 'chevronRight'}
                size={16}
                color={theme.textSecondary}
              />
            </Pressable>
            {isWeeklyHabitsExpanded &&
              weeklyHabits.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  done={isHabitDone(h)}
                  onToggle={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleHabit(h.id);
                  }}
                  onDelete={() => removeHabit(h.id)}
                  onEdit={() => setEditItem({ type: 'habit', data: h })}
                />
              ))}
          </View>
        )}

        {/* Monthly habits */}
        {monthlyHabits.length > 0 && (
          <View style={s.section}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsMonthlyHabitsExpanded(!isMonthlyHabitsExpanded);
              }}
            >
              <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>{t('monthlyHabits')}</Text>
              <Icon
                name={isMonthlyHabitsExpanded ? 'chevronDown' : 'chevronRight'}
                size={16}
                color={theme.textSecondary}
              />
            </Pressable>
            {isMonthlyHabitsExpanded &&
              monthlyHabits.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  done={isHabitDone(h)}
                  onToggle={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleHabit(h.id);
                  }}
                  onDelete={() => removeHabit(h.id)}
                  onEdit={() => setEditItem({ type: 'habit', data: h })}
                />
              ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal: nuevo hábito */}
      <BottomModal visible={modalHabit} onClose={() => setModalHabit(false)}>
        <Text style={[s.modalTitle, { color: theme.text }]}>{t('modals.addHabit')}</Text>
        <View style={s.habitNameRow}>
          <FormInput
            label={`${t('forms.habitName')} *`}
            placeholder={t('forms.habitNamePlaceholder')}
            value={habitName}
            onChangeText={setHabitName}
            autoFocus
            containerStyle={s.habitNameInput}
          />
          <EmojiPicker
            value={habitEmoji}
            onSelect={setHabitEmoji}
            label={t('forms.emoji')}
            containerStyle={s.habitEmojiInput}
          />
        </View>
        <FormInput
          label={t('forms.habitDesc')}
          placeholder={t('forms.habitDescPlaceholder')}
          value={habitDesc}
          onChangeText={setHabitDesc}
        />
        <Text style={[s.formLabel, { color: theme.textSecondary }]}>{t('frequency.label')}</Text>
        <View style={s.segRow}>
          {frequencies.map((f) => (
            <Pressable
              key={f}
              style={[
                s.seg,
                { backgroundColor: theme.surface2, borderColor: theme.border },
                habitFreq === f && { backgroundColor: theme.accentDim, borderColor: theme.accent },
              ]}
              onPress={() => setHabitFreq(f)}
            >
              <Text
                style={[
                  s.segText,
                  { color: theme.textSecondary },
                  habitFreq === f && { color: theme.accent },
                ]}
              >
                {t(`frequency.${f}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={s.modalActions}>
          <OrangeButton
            label={t('actions.cancel')}
            onPress={() => setModalHabit(false)}
            variant="ghost"
            style={{ flex: 1 }}
          />
          <OrangeButton label={t('actions.save')} onPress={handleAddHabit} style={{ flex: 2 }} />
        </View>
      </BottomModal>

      {/* Edit modal */}
      {editItem && (
        <EditModal
          visible={!!editItem}
          type={editItem.type}
          initialData={editItem.data as any}
          onClose={() => setEditItem(null)}
          onSave={(data) => editHabit(editItem.data.id, data as any)}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (_theme: AppTheme) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: 0,
    },
    title: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
    circleBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleBtnText: { fontSize: 22, fontWeight: '300', marginTop: -1 },
    ringSection: { alignItems: 'center', paddingVertical: Spacing.lg },
    section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionAction: { fontSize: 14, fontWeight: '600' },
    emptyCard: {
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      alignItems: 'center',
      gap: 10,
    },
    emptyBig: { fontSize: 48, marginBottom: 8 },
    emptyTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
    emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    emptyBtn: {
      marginTop: 8,
      paddingHorizontal: Spacing.xl,
      paddingVertical: 14,
      borderRadius: Radius.full,
      width: '100%',
      alignItems: 'center',
    },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
    formLabel: { fontSize: 13, marginBottom: Spacing.sm, fontWeight: '500' },
    segRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
    seg: { flex: 1, padding: 10, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },
    segText: { fontSize: 13, fontWeight: '500' },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
    habitNameRow: { flexDirection: 'row', gap: 8 },
    habitNameInput: { flex: 17, marginBottom: Spacing.md },
    habitEmojiInput: { flex: 4, marginBottom: Spacing.md },
  });
