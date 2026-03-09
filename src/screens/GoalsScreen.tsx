import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useGoals } from '@/hooks';
import { useTheme } from '@/context/ThemeContext';
import GoalItem from '@/components/goals/GoalItem';
import OrangeButton from '@/components/common/OrangeButton';
import EditModal from '@/components/common/EditModal';
import SettingsBar from '@/components/common/SettingsBar';
import FormInput from '@/components/common/FormInput';
import BottomModal from '@/components/common/BottomModal';
import Icon from '@/components/common/Icon';
import { Spacing, Radius, type AppTheme } from '@/theme';
import type { WeeklyGoal } from '@/types';

export default function GoalsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { weeklyGoals, addWeeklyGoal, editWeeklyGoal, removeWeeklyGoal, logGoalCompletion, undoGoalCompletion } =
    useGoals();
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('3');
  const [editItem, setEditItem] = useState<WeeklyGoal | null>(null);

  const handleAdd = () => {
    if (!title.trim()) return;
    addWeeklyGoal({ title: title.trim(), targetCount: parseInt(target) || 3 });
    setTitle('');
    setTarget('3');
    setModal(false);
  };

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <SettingsBar />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.titleRow}>
            <Icon name="goals" size={26} color={theme.accent} />
            <Text style={[s.title, { color: theme.text }]}>{t('goalsSection')}</Text>
          </View>
          <OrangeButton label={t('newGoal')} onPress={() => setModal(true)} size="sm" />
        </View>

        <View style={s.content}>
          {weeklyGoals.length === 0 ? (
            <View style={[s.emptyCard, { backgroundColor: theme.surface }]}>
              <Icon name="target" size={48} color={theme.textMuted} />
              <Text style={[s.emptyText, { color: theme.textMuted }]}>{t('emptyGoals')}</Text>
            </View>
          ) : (
            weeklyGoals.map((g) => (
              <GoalItem
                key={g.id}
                goal={g}
                onLog={() => logGoalCompletion(g.id)}
                onUndo={() => undoGoalCompletion(g.id)}
                onDelete={() => removeWeeklyGoal(g.id)}
                onEdit={() => setEditItem(g)}
              />
            ))
          )}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      <BottomModal visible={modal} onClose={() => setModal(false)}>
        <Text style={[s.modalTitle, { color: theme.text }]}>{t('modals.newGoal')}</Text>
        <FormInput
          label={t('forms.whatToAchieve')}
          placeholder={t('forms.goalPlaceholder')}
          value={title}
          onChangeText={setTitle}
          autoFocus
        />
        <FormInput
          label={t('forms.timesPerWeek')}
          value={target}
          onChangeText={setTarget}
          keyboardType="numeric"
        />
        <View style={s.actions}>
          <OrangeButton
            label={t('actions.cancel')}
            onPress={() => setModal(false)}
            variant="ghost"
            style={{ flex: 1 }}
          />
          <OrangeButton label={t('createGoal')} onPress={handleAdd} style={{ flex: 2 }} />
        </View>
      </BottomModal>

      {editItem && (
        <EditModal
          visible={!!editItem}
          type="goal"
          initialData={editItem}
          onClose={() => setEditItem(null)}
          onSave={(data) => editWeeklyGoal(editItem.id, data)}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (_theme: AppTheme) =>
  StyleSheet.create({
    safe: { flex: 1 },
    header: {
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 22, fontWeight: '800' },
    content: { paddingHorizontal: Spacing.lg },
    emptyCard: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 14, textAlign: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
    actions: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
  });
