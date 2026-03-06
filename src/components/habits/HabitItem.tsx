import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import CheckCircle from '@/components/common/CheckCircle';
import SwipeableRow from '@/components/common/SwipeableRow';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/theme';
import { Habit } from '@/types';

interface Props {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function HabitItem({ habit, done, onToggle, onDelete, onEdit }: Props) {
  const { theme } = useTheme();
  return (
    <SwipeableRow onDelete={onDelete} onEdit={onEdit} borderColor={theme.border}>
      <Pressable
        style={[styles.item, { backgroundColor: theme.surface }, done && styles.done]}
        onPress={onToggle}
      >
        <CheckCircle done={done} onToggle={onToggle} />
        <View style={styles.info}>
          <Text
            style={[
              styles.name,
              { color: theme.text },
              done && { textDecorationLine: 'line-through', color: theme.textMuted },
            ]}
            numberOfLines={1}
          >
            {habit.name}
          </Text>
          {habit.description ? (
            <Text style={[styles.desc, { color: theme.textMuted }]} numberOfLines={1}>
              {habit.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    borderRadius: Radius.xl - 1,
  },
  done: { opacity: 0.55 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '500' },
  desc: { fontSize: 12, marginTop: 2 },
});
