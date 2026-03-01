import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import SwipeableRow from '@/components/common/SwipeableRow';
import CheckCircle from '@/components/common/CheckCircle';
import Icon, { IconName } from '@/components/common/Icon';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/theme';
import { Task, Priority } from '@/types';

const PRIORITY_META: Record<Priority, { color: string; icon: IconName }> = {
  high: { color: '#ff453a', icon: 'priorityHigh' },
  medium: { color: '#ffd60a', icon: 'priorityMedium' },
  low: { color: '#30d158', icon: 'priorityLow' },
};

interface Props {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  priorityLabel: string;
}

export default function TaskItem({ task, onToggle, onDelete, onEdit, priorityLabel }: Props) {
  const { theme } = useTheme();
  const meta = PRIORITY_META[task.priority];

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <SwipeableRow onDelete={onDelete} onEdit={onEdit} deleteLabel="Borrar" editLabel="Editar">
      <Pressable
        style={[
          s.item,
          { backgroundColor: theme.surface, borderColor: theme.borderDim },
          task.completed && s.done,
        ]}
        onPress={handleToggle}
      >
        {/* Barra lateral de prioridad */}
        <View style={[s.priorityBar, { backgroundColor: meta.color }]} />

        <CheckCircle done={task.completed} onToggle={handleToggle} />

        <Text
          style={[
            s.name,
            { color: task.completed ? theme.textSecondary : theme.text },
            task.completed && s.strike,
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>

        {/* Badge de prioridad con ícono */}
        <View style={[s.badge, { backgroundColor: `${meta.color}1a` }]}>
          <Icon name={meta.icon} size={13} color={meta.color} />
          <Text style={[s.badgeText, { color: meta.color }]}>{priorityLabel}</Text>
        </View>
      </Pressable>
    </SwipeableRow>
  );
}

const s = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  done: { opacity: 0.5 },
  priorityBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  name: { flex: 1, fontSize: 15, fontWeight: '500', paddingLeft: 4 },
  strike: { textDecorationLine: 'line-through' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
