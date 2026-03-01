import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import SwipeableRow from '../common/SwipeableRow';
import Icon from '../common/Icon';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme';
import { WeeklyGoal } from '../../types';

interface Props { goal: WeeklyGoal; onLog: () => void; onDelete: () => void; onEdit: () => void; }

export default function GoalItem({ goal, onLog, onDelete, onEdit }: Props) {
  const { theme } = useTheme();
  const done = goal.completions.length;
  const pct = Math.round((done / goal.targetCount) * 100);

  return (
    <SwipeableRow onDelete={onDelete} onEdit={onEdit}>
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.borderDim }]}>
        <View style={s.header}>
          {/* Ícono de objetivo */}
          <View style={[s.iconBadge, { backgroundColor: theme.accentDim }]}>
            <Icon name="target" size={20} color={theme.accent} />
          </View>
          <View style={s.titleBlock}>
            <Text style={[s.title, { color: theme.text }]}>{goal.title}</Text>
            <Text style={[s.sub, { color: theme.textSecondary }]}>
              {done}/{goal.targetCount} · {pct}%
            </Text>
          </View>
          {/* Ícono de racha */}
          {done > 0 && (
            <View style={[s.streakBadge, { backgroundColor: `${theme.accent}15` }]}>
              <Icon name="streak" size={14} color={theme.accent} />
              <Text style={[s.streakText, { color: theme.accent }]}>{done}</Text>
            </View>
          )}
        </View>

        {/* Dots de progreso */}
        <View style={s.dots}>
          {Array.from({ length: goal.targetCount }).map((_, i) => (
            <Pressable
              key={i}
              style={[
                s.dot,
                { borderColor: theme.border, backgroundColor: theme.surface2 },
                i < done && { backgroundColor: theme.accent, borderColor: theme.accent },
              ]}
              onPress={i === done ? onLog : undefined}
            >
              {i < done && <Icon name="check" size={14} color="#fff" />}
              {i === done && <Icon name="plus" size={14} color={theme.textMuted} />}
            </Pressable>
          ))}
        </View>
      </View>
    </SwipeableRow>
  );
}

const s = StyleSheet.create({
  card: {
    padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  streakText: { fontSize: 13, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dot: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
});
