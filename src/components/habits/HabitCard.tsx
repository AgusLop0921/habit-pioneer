import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import SwipeableRow from '@/components/common/SwipeableRow';
import Icon, { IconName } from '@/components/common/Icon';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/theme';
import { Habit } from '@/types';

// Mini ring de progreso (sin emojis)
function MiniRing({
  progress,
  color,
  bg,
  done,
}: {
  progress: number;
  color: string;
  bg: string;
  done: boolean;
}) {
  const size = 44;
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(progress, 100) / 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={bg} strokeWidth={sw} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={sw}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2},${size / 2}`}
        />
      </Svg>
      {/* Ícono check cuando completado */}
      <Icon name={done ? 'check' : 'star-outline'} size={16} color={done ? color : bg} />
    </View>
  );
}

// Ícono del badge según frecuencia del hábito
function habitIcon(freq: string): IconName {
  if (freq === 'weekly') return 'weekly';
  if (freq === 'monthly') return 'monthly';
  return 'daily';
}

interface Props {
  habit: Habit;
  done: boolean;
  count?: number;
  targetCount?: number;
  onToggle: () => void;
  onIncrement?: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function HabitCard({
  habit,
  done,
  count,
  targetCount,
  onToggle,
  onIncrement,
  onDelete,
  onEdit,
}: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const hasCounter = count !== undefined && targetCount !== undefined;
  const progress = hasCounter
    ? Math.min(100, Math.round((count! / targetCount!) * 100))
    : done
      ? 100
      : 0;
  const ringColor = done || progress >= 100 ? theme.green : theme.accent;
  const iconName = habitIcon(habit.frequency);

  return (
    <SwipeableRow onDelete={onDelete} onEdit={onEdit}>
      <Animated.View
        entering={FadeInDown.duration(250).springify()}
        exiting={FadeOutLeft.duration(200)}
        style={[s.card, { backgroundColor: theme.surface, borderColor: theme.borderDim }]}
      >
        {/* Badge de frecuencia o emoji */}
        <View style={[s.badge, { backgroundColor: done ? `${ringColor}22` : theme.surface2 }]}>
          {habit.emoji ? (
            <Text style={s.emojiText}>{habit.emoji}</Text>
          ) : (
            <Icon name={iconName} size={22} color={done ? ringColor : theme.textSecondary} />
          )}
        </View>

        {/* Info */}
        <Pressable
          style={s.info}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.toggleHabit', {
            action: done ? t('a11y.uncheck') : t('a11y.complete'),
            name: habit.name,
          })}
          accessibilityState={{ checked: done }}
        >
          <Text
            style={[s.name, { color: done ? theme.textSecondary : theme.text }, done && s.strike]}
            numberOfLines={1}
          >
            {habit.name}
          </Text>
          {habit.description ? (
            <Text style={[s.desc, { color: theme.textSecondary }]} numberOfLines={1}>
              {habit.description}
            </Text>
          ) : hasCounter ? (
            <Text style={[s.desc, { color: theme.textSecondary }]}>
              {count}/{targetCount} · {progress}%
            </Text>
          ) : null}
        </Pressable>

        {/* Ring / counter */}
        {hasCounter ? (
          <Pressable
            onPress={onIncrement}
            style={s.ringWrap}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.incrementHabit', {
              name: habit.name,
              count,
              target: targetCount,
            })}
          >
            <MiniRing progress={progress} color={ringColor} bg={theme.ringBg} done={done} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handlePress}
            style={s.ringWrap}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.toggleHabit', {
              action: done ? t('a11y.uncheck') : t('a11y.complete'),
              name: habit.name,
            })}
          >
            <MiniRing progress={progress} color={ringColor} bg={theme.ringBg} done={done} />
          </Pressable>
        )}
      </Animated.View>
    </SwipeableRow>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  strike: { textDecorationLine: 'line-through' },
  desc: { fontSize: 12, marginTop: 2 },
  ringWrap: { padding: 4 },
  emojiText: { fontSize: 22 },
});
