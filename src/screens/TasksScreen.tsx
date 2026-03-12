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
import { format, isSameDay, differenceInCalendarDays, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useTasks, useProgress, useDateLocale, useHydration } from '@/hooks';
import TaskItem from '@/components/tasks/TaskItem';
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
import type { Task } from '@/types';
import { Priority } from '@/types';
import { useStore } from '@/store';

export default function TasksScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [selectedDate, setSelectedDate] = useState(new Date());

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
    tasks: todayTasks,
    overdueTasks,
    addTask: addTaskForDate,
    editTask,
    removeTask,
    toggleTask,
    rescheduleToDate,
  } = useTasks(selectedDate);

  const progress = useProgress(selectedDate);
  const locale = useDateLocale();
  const hydrated = useHydration();

  const [modalTask, setModalTask] = useState(false);
  const [editItem, setEditItem] = useState<{ type: 'task'; data: Task } | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskCategory, setTaskCategory] = useState<string>('personal');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [modalNewCategory, setModalNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('');
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(true);
  const [isTasksExpanded, setIsTasksExpanded] = useState(true);

  const getAllCategories = useStore((s) => s.getAllCategories);
  const addTaskCategory = useStore((s) => s.addTaskCategory);
  const allTasks = useStore((s) => s.tasks);
  const allCategories = getAllCategories();

  const isToday = isSameDay(selectedDate, new Date());

  // Dates with at least one completed task — for WeekStrip indicators
  const taskCompletedDates = allTasks.filter((t) => t.completed).map((t) => t.date);

  if (!hydrated) {
    return (
      <SafeAreaView
        style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: theme.bg }]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </SafeAreaView>
    );
  }

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;
    addTaskForDate(taskTitle.trim(), taskPriority, { category: taskCategory } as any);
    setTaskTitle('');
    setTaskPriority('medium');
    setTaskCategory('personal');
    setModalTask(false);
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    const id = newCatName.trim().toLowerCase().replace(/\s+/g, '_');
    addTaskCategory({ id, label: newCatName.trim(), emoji: newCatEmoji.trim() || '📌' });
    setNewCatName('');
    setNewCatEmoji('');
    setModalNewCategory(false);
  };

  const priorities: Priority[] = ['high', 'medium', 'low'];

  const filteredTasks = todayTasks
    .filter((t) => categoryFilter === 'all' || t.category === categoryFilter)
    .sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <SettingsBar />

      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        completedDates={taskCompletedDates}
      />

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={[s.title, { color: theme.text }]}>
            {isToday ? t('today') : format(selectedDate, 'EEE, d MMM', { locale })}
          </Text>
          <Pressable
            style={[s.circleBtn, { backgroundColor: theme.surface }]}
            onPress={() => setModalTask(true)}
          >
            <Text style={[s.circleBtnText, { color: theme.text }]}>+</Text>
          </Pressable>
        </View>

        {/* Progress ring */}
        <View style={s.ringSection}>
          <ProgressRing
            progress={progress.tasks}
            size={148}
            strokeWidth={11}
            label={t('tasksToday')}
          />
        </View>

        {/* Overdue tasks */}
        {isToday && overdueTasks.length > 0 && (
          <View style={s.section}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsOverdueExpanded(!isOverdueExpanded);
              }}
            >
              <View style={s.overdueDot} />
              <Text style={[s.sectionTitle, { color: '#FF9F0A' }]}>
                {t('task.overdue.sectionTitle')} ({overdueTasks.length})
              </Text>
              <Icon
                name={isOverdueExpanded ? 'chevronDown' : 'chevronRight'}
                size={16}
                color="#FF9F0A"
              />
            </Pressable>
            {isOverdueExpanded &&
              overdueTasks.map((task) => {
                const daysAgo = differenceInCalendarDays(new Date(), parseISO(task.date));
                const ageLabel =
                  daysAgo === 1
                    ? t('task.overdue.yesterday')
                    : t('task.overdue.daysAgo', { count: daysAgo });
                return (
                  <View key={task.id}>
                    <View style={s.overdueRowHeader}>
                      <Text style={s.overdueAgeLabel}>{ageLabel}</Text>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          rescheduleToDate(task.id);
                        }}
                      >
                        <Text style={s.overdueMoveBtn}>{t('task.overdue.moveToToday')}</Text>
                      </Pressable>
                    </View>
                    <TaskItem
                      task={task}
                      onToggle={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        toggleTask(task.id);
                      }}
                      onDelete={() => removeTask(task.id)}
                      onEdit={() => setEditItem({ type: 'task', data: task })}
                      priorityLabel={t(`priority.${task.priority}`)}
                    />
                  </View>
                );
              })}
          </View>
        )}

        {/* Tasks section */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Pressable
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsTasksExpanded(!isTasksExpanded);
              }}
            >
              <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>
                {t('tasksSection')}
              </Text>
              <Icon
                name={isTasksExpanded ? 'chevronDown' : 'chevronRight'}
                size={16}
                color={theme.textSecondary}
              />
            </Pressable>
            <Pressable onPress={() => setModalTask(true)}>
              <Text style={[s.sectionAction, { color: theme.accent }]}>{t('newTask')}</Text>
            </Pressable>
          </View>

          {isTasksExpanded && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                <View style={[s.filterRow, { marginBottom: 0 }]}>
                  <Pressable
                    style={[
                      s.filterChip,
                      { backgroundColor: theme.surface2 },
                      categoryFilter === 'all' && { backgroundColor: theme.accent, borderColor: theme.accent },
                    ]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategoryFilter('all'); }}
                  >
                    <Text style={[s.filterText, { color: theme.textSecondary }, categoryFilter === 'all' && { color: '#fff' }]}>
                      {t('task.category.filter.all')}
                    </Text>
                  </Pressable>

                  {allCategories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[
                        s.filterChip,
                        { backgroundColor: theme.surface2 },
                        categoryFilter === cat.id && { backgroundColor: theme.accent, borderColor: theme.accent },
                      ]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategoryFilter(cat.id); }}
                    >
                      <Text style={[s.filterText, { color: theme.textSecondary }, categoryFilter === cat.id && { color: '#fff' }]}>
                        {cat.emoji} {cat.label}
                      </Text>
                    </Pressable>
                  ))}

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
            </>
          )}
        </View>

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
                taskPriority === p && { backgroundColor: theme.accentDim, borderColor: theme.accent },
              ]}
              onPress={() => setTaskPriority(p)}
            >
              <Text style={[s.segText, { color: theme.textSecondary }, taskPriority === p && { color: theme.accent }]}>
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
                  taskCategory === c.id && { backgroundColor: theme.accentDim, borderColor: theme.accent },
                ]}
                onPress={() => setTaskCategory(c.id)}
              >
                <Text style={[s.segText, { color: theme.textSecondary }, taskCategory === c.id && { color: theme.accent }]}>
                  {c.emoji} {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View style={s.modalActions}>
          <OrangeButton label={t('actions.cancel')} onPress={() => setModalTask(false)} variant="ghost" style={{ flex: 1 }} />
          <OrangeButton label={t('actions.save')} onPress={handleAddTask} style={{ flex: 2 }} />
        </View>
      </BottomModal>

      {/* Edit modal */}
      {editItem && (
        <EditModal
          visible={!!editItem}
          type={editItem.type}
          initialData={editItem.data as any}
          onClose={() => setEditItem(null)}
          onSave={(data) => editTask(editItem.data.id, data as any)}
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
          <EmojiPicker
            value={newCatEmoji}
            onSelect={setNewCatEmoji}
            label="Emoji"
            containerStyle={{ width: 72 }}
          />
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
    emptyInline: { fontSize: 13, paddingVertical: 8 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
    formLabel: { fontSize: 13, marginBottom: Spacing.sm, fontWeight: '500' },
    segRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
    seg: { flex: 1, padding: 10, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },
    segText: { fontSize: 13, fontWeight: '500' },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    filterText: { fontSize: 13, fontWeight: '600' },
    textInput: {
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.sm,
      fontSize: 15,
    },
    overdueDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9F0A' },
    overdueRowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
      marginBottom: 4,
      marginTop: 2,
    },
    overdueAgeLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FF9F0A',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    overdueMoveBtn: { fontSize: 12, fontWeight: '700', color: '#FF9F0A' },
  });
