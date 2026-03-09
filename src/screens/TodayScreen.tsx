import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  AppState,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { format, isSameDay } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Switch } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useHabits, useTasks, useProgress, useDateLocale, useHydration } from '@/hooks';
import HabitCard from '@/components/habits/HabitCard';
import TaskItem from '@/components/tasks/TaskItem';
import OrangeButton from '@/components/common/OrangeButton';
import BottomModal from '@/components/common/BottomModal';
import EditModal from '@/components/common/EditModal';
import SettingsBar from '@/components/common/SettingsBar';
import FormInput from '@/components/common/FormInput';
import ProgressRing from '@/components/common/ProgressRing';
import WeekStrip from '@/components/common/WeekStrip';
import { Spacing, Radius, type AppTheme } from '@/theme';
import type { Task, Habit } from '@/types';
import { Priority, Frequency } from '@/types';
import { useStore } from '@/store';

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

  // ── Domain hooks ────────────────────────────────────────────────────────────
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

  const {
    tasks: todayTasks,
    addTask: addTaskForDate,
    editTask,
    removeTask,
    toggleTask,
  } = useTasks(selectedDate);

  const progress = useProgress(selectedDate);
  const locale = useDateLocale();
  const hydrated = useHydration();

  // ── UI-only state ────────────────────────────────────────────────────────────
  const [modalTask, setModalTask] = useState(false);
  const [modalHabit, setModalHabit] = useState(false);
  const [editItem, setEditItem] = useState<
    { type: 'task'; data: Task } | { type: 'habit'; data: Habit } | null
  >(null);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('');
  const [habitFreq, setHabitFreq] = useState<Frequency>('daily');

  // Task category filter
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal specific state
  const [taskCategory, setTaskCategory] = useState<string>('personal');

  // Custom category creation
  const [modalNewCategory, setModalNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('');

  // Store
  const getAllCategories = useStore((s) => s.getAllCategories);
  const addTaskCategory = useStore((s) => s.addTaskCategory);
  const allCategories = getAllCategories();

  const isToday = isSameDay(selectedDate, new Date());

  if (!hydrated) {
    return (
      <SafeAreaView
        style={[
          { flex: 1, alignItems: 'center', justifyContent: 'center' },
          { backgroundColor: theme.bg },
        ]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </SafeAreaView>
    );
  }

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;
    addTaskForDate(taskTitle.trim(), taskPriority, {
      category: taskCategory,
    } as any);
    setTaskTitle('');
    setTaskPriority('medium');
    setTaskCategory('personal');
    setModalTask(false);
  };

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

  const priorities: Priority[] = ['high', 'medium', 'low'];
  const frequencies: Frequency[] = ['daily', 'weekly', 'monthly'];

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    const id = newCatName.trim().toLowerCase().replace(/\s+/g, '_');
    addTaskCategory({ id, label: newCatName.trim(), emoji: newCatEmoji.trim() || '📌' });
    setNewCatName('');
    setNewCatEmoji('');
    setModalNewCategory(false);
  };

  const filteredTasks = todayTasks.filter(
    (t) => categoryFilter === 'all' || t.category === categoryFilter
  );

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <SettingsBar />

      {/* Week strip */}
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
          <View style={s.headerBtns}>
            <Pressable
              style={[s.circleBtn, { backgroundColor: theme.surface }]}
              onPress={() => setModalHabit(true)}
            >
              <Text style={[s.circleBtnText, { color: theme.text }]}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Progress rings */}
        <View style={s.ringSection}>
          <View style={s.ringsRow}>
            <View style={s.ringWrapper}>
              <ProgressRing
                progress={progress.habits}
                size={148}
                strokeWidth={11}
                label={t('habitsToday')}
              />
            </View>
            <View style={s.ringWrapper}>
              <ProgressRing
                progress={progress.tasks}
                size={148}
                strokeWidth={11}
                label={t('tasksToday')}
              />
            </View>
          </View>
        </View>

        {/* Tasks section */}
        {(todayTasks.length > 0 || true) && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>
                {t('tasksSection')}
              </Text>
              <Pressable onPress={() => setModalTask(true)}>
                <Text style={[s.sectionAction, { color: theme.accent }]}>{t('newTask')}</Text>
              </Pressable>
            </View>

            {/* Category Filter Chips - scrollable */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={[s.filterRow, { marginBottom: 0 }]}>
                {/* All chip */}
                <Pressable
                  style={[
                    s.filterChip,
                    { backgroundColor: theme.surface2 },
                    categoryFilter === 'all' && { backgroundColor: theme.accent, borderColor: theme.accent }
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategoryFilter('all'); }}
                >
                  <Text style={[s.filterText, { color: theme.textSecondary }, categoryFilter === 'all' && { color: '#fff' }]}>
                    {t('task.category.filter.all')}
                  </Text>
                </Pressable>

                {/* Dynamic category chips */}
                {allCategories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[
                      s.filterChip,
                      { backgroundColor: theme.surface2 },
                      categoryFilter === cat.id && { backgroundColor: theme.accent, borderColor: theme.accent }
                    ]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategoryFilter(cat.id); }}
                  >
                    <Text style={[s.filterText, { color: theme.textSecondary }, categoryFilter === cat.id && { color: '#fff' }]}>
                      {cat.emoji} {cat.label}
                    </Text>
                  </Pressable>
                ))}

                {/* Add custom category button */}
                <Pressable
                  style={[s.filterChip, { backgroundColor: theme.surface2, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.accent }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setModalNewCategory(true); }}
                >
                  <Text style={[s.filterText, { color: theme.accent }]}>+ Nueva</Text>
                </Pressable>
              </View>
            </ScrollView>

            {filteredTasks.length === 0 ? (
              <Text style={[s.emptyInline, { color: theme.textMuted }]}>{t('emptyTasks')}</Text>
            ) : (
              filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleTask(task.id);
                  }}
                  onDelete={() => removeTask(task.id)}
                  onEdit={() => setEditItem({ type: 'task', data: task })}
                  priorityLabel={t(`priority.${task.priority}`)}
                />
              ))
            )}
          </View>
        )}

        {/* Daily habits */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>{t('dailyHabits')}</Text>
            <Pressable onPress={() => setModalHabit(true)}>
              <Text style={[s.sectionAction, { color: theme.accent }]}>{t('newHabit')}</Text>
            </Pressable>
          </View>
          {dailyHabits.length === 0 ? (
            <View style={[s.emptyCard, { backgroundColor: theme.surface }]}>
              <Text style={s.emptyBig}>✨</Text>
              <Text style={[s.emptyTitle, { color: theme.text }]}>{t('habitsEmpty.title')}</Text>
              <Text style={[s.emptyDesc, { color: theme.textSecondary }]}>
                {t('habitsEmpty.desc')}
              </Text>
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
          )}
        </View>

        {/* Weekly habits */}
        {weeklyHabits.length > 0 && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: theme.textSecondary, marginBottom: 10 }]}>
              {t('weeklyHabits')}
            </Text>
            {weeklyHabits.map((h) => (
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
            <Text style={[s.sectionTitle, { color: theme.textSecondary, marginBottom: 10 }]}>
              {t('monthlyHabits')}
            </Text>
            {monthlyHabits.map((h) => (
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

      {/* Modal: nueva tarea */}
      <BottomModal visible={modalTask} onClose={() => setModalTask(false)}>
        <Text style={[s.modalTitle, { color: theme.text }]}>{t('modals.newTask')}</Text>
        <FormInput
          label={t('forms.whatToDo')}
          placeholder={t('forms.taskPlaceholder')}
          value={taskTitle}
          onChangeText={setTaskTitle}
          autoFocus
        />
        <Text style={[s.formLabel, { color: theme.textSecondary }]}>{t('priority.label')}</Text>
        <View style={s.segRow}>
          {priorities.map((p) => (
            <Pressable
              key={p}
              style={[
                s.seg,
                { backgroundColor: theme.surface2, borderColor: theme.border },
                taskPriority === p && {
                  backgroundColor: theme.accentDim,
                  borderColor: theme.accent,
                },
              ]}
              onPress={() => setTaskPriority(p)}
            >
              <Text
                style={[
                  s.segText,
                  { color: theme.textSecondary },
                  taskPriority === p && { color: theme.accent },
                ]}
              >
                {t(`priority.${p}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[s.formLabel, { color: theme.textSecondary, marginTop: Spacing.sm }]}>
          {t('task.category.label')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[s.segRow, { marginBottom: Spacing.md }]}>
            {allCategories.map((c) => (
              <Pressable
                key={c.id}
                style={[
                  s.seg,
                  { backgroundColor: theme.surface2, borderColor: theme.border },
                  taskCategory === c.id && {
                    backgroundColor: theme.accentDim,
                    borderColor: theme.accent,
                  },
                ]}
                onPress={() => setTaskCategory(c.id)}
              >
                <Text
                  style={[
                    s.segText,
                    { color: theme.textSecondary },
                    taskCategory === c.id && { color: theme.accent },
                  ]}
                >
                  {c.emoji} {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View style={s.modalActions}>
          <OrangeButton
            label={t('actions.cancel')}
            onPress={() => setModalTask(false)}
            variant="ghost"
            style={{ flex: 1 }}
          />
          <OrangeButton label={t('actions.save')} onPress={handleAddTask} style={{ flex: 2 }} />
        </View>
      </BottomModal>

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
          <FormInput
            label={t('forms.emoji')}
            placeholder="💪"
            value={habitEmoji}
            onChangeText={setHabitEmoji}
            maxLength={4}
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
          onSave={(data) => {
            if (editItem.type === 'task') editTask(editItem.data.id, data as any);
            else editHabit(editItem.data.id, data as any);
          }}
        />
      )}

      {/* Modal: nueva categoría */}
      <BottomModal visible={modalNewCategory} onClose={() => setModalNewCategory(false)}>
        <Text style={[s.modalTitle, { color: theme.text }]}>Nueva categoría</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={[s.formLabel, { color: theme.textSecondary }]}>Nombre *</Text>
            <TextInput
              placeholder="Ej: Finanzas"
              placeholderTextColor={theme.textMuted}
              value={newCatName}
              onChangeText={setNewCatName}
              style={[s.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface2 }]}
              autoFocus
            />
          </View>
          <View style={{ width: 72 }}>
            <Text style={[s.formLabel, { color: theme.textSecondary }]}>Emoji</Text>
            <TextInput
              placeholder="📌"
              placeholderTextColor={theme.textMuted}
              value={newCatEmoji}
              onChangeText={setNewCatEmoji}
              maxLength={4}
              style={[s.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface2, textAlign: 'center', fontSize: 22 }]}
            />
          </View>
        </View>
        <View style={s.modalActions}>
          <OrangeButton label={t('actions.cancel')} onPress={() => setModalNewCategory(false)} variant="ghost" style={{ flex: 1 }} />
          <OrangeButton label={t('actions.save')} onPress={handleCreateCategory} style={{ flex: 2 }} />
        </View>
      </BottomModal>
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
    headerBtns: { flexDirection: 'row', gap: 8 },
    circleBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleBtnText: { fontSize: 22, fontWeight: '300', marginTop: -1 },
    ringSection: { alignItems: 'center', paddingVertical: Spacing.lg },
    ringsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl },
    ringWrapper: { alignItems: 'center' },
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
    emptyInline: { fontSize: 13, paddingVertical: 8 },
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
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: Spacing.md,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    filterText: {
      fontSize: 13,
      fontWeight: '600',
    },
    textInput: {
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.sm,
      fontSize: 15,
    },
  });
