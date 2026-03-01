import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import BottomModal from './BottomModal';
import OrangeButton from './OrangeButton';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius, type AppTheme } from '@/theme';
import { Priority, Frequency, ShopCategory } from '@/types';
import { useTranslation } from 'react-i18next';

export type EditModalType = 'task' | 'goal' | 'shopping' | 'habit';

// Flat bag covering all edit-modal field shapes across all entity types
export type EditModalInitialData = {
  title?: string;
  priority?: Priority;
  targetCount?: number;
  name?: string;
  quantity?: number;
  category?: ShopCategory;
  description?: string;
  emoji?: string;
  frequency?: Frequency;
};

interface EditModalProps {
  visible: boolean;
  type: EditModalType;
  initialData?: EditModalInitialData;
  onSave: (data: EditModalInitialData) => void;
  onClose: () => void;
}

export default function EditModal({ visible, type, initialData, onSave, onClose }: EditModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Task fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  // Goal fields
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('3');
  // Shopping fields
  const [shopName, setShopName] = useState('');
  const [shopQty, setShopQty] = useState('1');
  const [shopCat, setShopCat] = useState<ShopCategory>('general');
  // Habit fields
  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('');
  const [habitFreq, setHabitFreq] = useState<Frequency>('daily');

  useEffect(() => {
    if (!initialData) return;
    if (type === 'task') {
      setTaskTitle(initialData.title ?? '');
      setTaskPriority(initialData.priority ?? 'medium');
    } else if (type === 'goal') {
      setGoalTitle(initialData.title ?? '');
      setGoalTarget(String(initialData.targetCount ?? 3));
    } else if (type === 'shopping') {
      setShopName(initialData.name ?? '');
      setShopQty(String(initialData.quantity ?? 1));
      setShopCat(initialData.category ?? 'general');
    } else if (type === 'habit') {
      setHabitName(initialData.name ?? '');
      setHabitDesc(initialData.description ?? '');
      setHabitEmoji(initialData.emoji ?? '');
      setHabitFreq(initialData.frequency ?? 'daily');
    }
  }, [initialData, type, visible]);

  const handleSave = () => {
    if (type === 'task') {
      if (!taskTitle.trim()) return;
      onSave({ title: taskTitle.trim(), priority: taskPriority });
    } else if (type === 'goal') {
      if (!goalTitle.trim()) return;
      onSave({ title: goalTitle.trim(), targetCount: parseInt(goalTarget) || 3 });
    } else if (type === 'shopping') {
      if (!shopName.trim()) return;
      onSave({ name: shopName.trim(), quantity: parseInt(shopQty) || 1, category: shopCat });
    } else if (type === 'habit') {
      if (!habitName.trim()) return;
      onSave({
        name: habitName.trim(),
        description: habitDesc.trim(),
        emoji: habitEmoji.trim() || undefined,
        frequency: habitFreq,
      });
    }
    onClose();
  };

  const s = makeStyles(theme);
  const priorities: Priority[] = ['high', 'medium', 'low'];
  const frequencies: Frequency[] = ['daily', 'weekly', 'monthly'];
  const categories: ShopCategory[] = ['food', 'cleaning', 'hygiene', 'general'];
  const catEmojis: Record<ShopCategory, string> = {
    food: '🍎',
    cleaning: '🧹',
    hygiene: '🧴',
    general: '📦',
  };

  const modalTitles: Record<EditModalType, string> = {
    task: `✏️ ${t('modals.newTask')}`,
    goal: `✏️ ${t('modals.newGoal')}`,
    shopping: `✏️ ${t('modals.addToSuper')}`,
    habit: `✏️ ${t('modals.addHabit')}`,
  };

  return (
    <BottomModal visible={visible} onClose={onClose}>
      <Text style={s.title}>{modalTitles[type]}</Text>

      {type === 'task' && (
        <>
          <Text style={s.label}>{t('forms.whatToDo')}</Text>
          <TextInput
            style={s.input}
            value={taskTitle}
            onChangeText={setTaskTitle}
            placeholder={t('forms.taskPlaceholder')}
            placeholderTextColor={theme.textMuted}
            autoFocus
          />
          <Text style={s.label}>{t('priority.label')}</Text>
          <View style={s.segRow}>
            {priorities.map((p) => (
              <Pressable
                key={p}
                style={[s.seg, taskPriority === p && s.segActive]}
                onPress={() => setTaskPriority(p)}
              >
                <Text style={[s.segText, taskPriority === p && s.segTextActive]}>
                  {t(`priority.${p}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {type === 'goal' && (
        <>
          <Text style={s.label}>{t('forms.whatToAchieve')}</Text>
          <TextInput
            style={s.input}
            value={goalTitle}
            onChangeText={setGoalTitle}
            placeholder={t('forms.goalPlaceholder')}
            placeholderTextColor={theme.textMuted}
            autoFocus
          />
          <Text style={s.label}>{t('forms.timesPerWeek')}</Text>
          <TextInput
            style={s.input}
            value={goalTarget}
            onChangeText={setGoalTarget}
            keyboardType="numeric"
            placeholderTextColor={theme.textMuted}
          />
        </>
      )}

      {type === 'shopping' && (
        <>
          <Text style={s.label}>{t('forms.whatToBuy')}</Text>
          <TextInput
            style={s.input}
            value={shopName}
            onChangeText={setShopName}
            placeholder={t('forms.itemPlaceholder')}
            placeholderTextColor={theme.textMuted}
            autoFocus
          />
          <Text style={s.label}>{t('forms.quantity')}</Text>
          <TextInput
            style={s.input}
            value={shopQty}
            onChangeText={setShopQty}
            keyboardType="numeric"
            placeholderTextColor={theme.textMuted}
          />
          <Text style={s.label}>{t('categories.label')}</Text>
          <View style={s.catGrid}>
            {categories.map((c) => (
              <Pressable
                key={c}
                style={[s.catOpt, shopCat === c && s.catOptActive]}
                onPress={() => setShopCat(c)}
              >
                <Text style={s.catEmoji}>{catEmojis[c]}</Text>
                <Text style={[s.catText, shopCat === c && s.catTextActive]}>
                  {t(`categories.${c}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {type === 'habit' && (
        <>
          <Text style={s.label}>{t('forms.habitName')}</Text>
          <TextInput
            style={s.input}
            value={habitName}
            onChangeText={setHabitName}
            placeholder={t('forms.habitNamePlaceholder')}
            placeholderTextColor={theme.textMuted}
            autoFocus
          />
          <Text style={s.label}>{t('forms.habitDesc')}</Text>
          <TextInput
            style={s.input}
            value={habitDesc}
            onChangeText={setHabitDesc}
            placeholder={t('forms.habitDescPlaceholder')}
            placeholderTextColor={theme.textMuted}
          />
          <Text style={s.label}>Emoji (opcional)</Text>
          <TextInput
            style={s.input}
            value={habitEmoji}
            onChangeText={setHabitEmoji}
            placeholder="💪🏅📚"
            placeholderTextColor={theme.textMuted}
            maxLength={4}
          />
          <Text style={s.label}>{t('frequency.label')}</Text>
          <View style={s.segRow}>
            {frequencies.map((f) => (
              <Pressable
                key={f}
                style={[s.seg, habitFreq === f && s.segActive]}
                onPress={() => setHabitFreq(f)}
              >
                <Text style={[s.segText, habitFreq === f && s.segTextActive]}>
                  {t(`frequency.${f}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <View style={s.actions}>
        <OrangeButton
          label={t('actions.cancel')}
          onPress={onClose}
          variant="ghost"
          style={{ flex: 1 }}
        />
        <OrangeButton label={t('actions.save')} onPress={handleSave} style={{ flex: 2 }} />
      </View>
    </BottomModal>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    title: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: Spacing.lg },
    label: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: Spacing.sm,
      fontWeight: '500',
      marginTop: 4,
    },
    input: {
      backgroundColor: theme.surface2,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.md,
      padding: Spacing.md,
      color: theme.text,
      fontSize: 14,
      marginBottom: Spacing.md,
    },
    segRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
    seg: {
      flex: 1,
      padding: 10,
      borderRadius: Radius.md,
      backgroundColor: theme.surface2,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    segActive: { backgroundColor: theme.orangeDim, borderColor: theme.orange },
    segText: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
    segTextActive: { color: theme.orange },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
    catOpt: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.surface2,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    catOptActive: { backgroundColor: theme.orangeDim, borderColor: theme.orange },
    catEmoji: { fontSize: 16 },
    catText: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
    catTextActive: { color: theme.orange },
    actions: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
  });
