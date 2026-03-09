/**
 * PomodoroStatsCard.tsx
 * Displays today's sessions, this week's sessions, and total focused minutes.
 * Drop this component anywhere (e.g. HistoryScreen) to show Pomodoro stats.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { usePomodoroStore, POMODORO_COLORS } from '@/store/pomodoroStore';
import { Radius, Spacing } from '@/theme';

export default function PomodoroStatsCard() {
    const { theme } = useTheme();
    const { getTodaySessions, getWeekSessions, getTotalFocusMinutes } = usePomodoroStore();

    const todayCount = getTodaySessions().filter((s) => s.mode === 'work').length;
    const weekCount = getWeekSessions().filter((s) => s.mode === 'work').length;
    const totalMinutes = getTotalFocusMinutes();

    type StatItem = { icon: 'today-outline' | 'calendar-outline' | 'time-outline'; label: string; value: string; color: string };

    const stats: StatItem[] = [
        { icon: 'today-outline', label: 'Hoy', value: `${todayCount}`, color: POMODORO_COLORS.work },
        { icon: 'calendar-outline', label: 'Esta semana', value: `${weekCount}`, color: POMODORO_COLORS.shortBreak },
        { icon: 'time-outline', label: 'Min. totales', value: `${totalMinutes}`, color: POMODORO_COLORS.longBreak },
    ];

    return (
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={s.header}>
                <Text style={s.headerEmoji}>🍅</Text>
                <Text style={[s.headerTitle, { color: theme.text }]}>Pomodoro</Text>
            </View>

            <View style={s.row}>
                {stats.map((stat) => (
                    <View key={stat.label} style={s.stat}>
                        <View style={[s.iconCircle, { backgroundColor: `${stat.color}18` }]}>
                            <Ionicons name={stat.icon} size={18} color={stat.color} />
                        </View>
                        <Text style={[s.statValue, { color: theme.text }]}>{stat.value}</Text>
                        <Text style={[s.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    card: {
        borderRadius: Radius.xl,
        borderWidth: 1,
        padding: Spacing.lg,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
    headerEmoji: { fontSize: 18 },
    headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
    row: { flexDirection: 'row', justifyContent: 'space-around' },
    stat: { alignItems: 'center', gap: 6 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 24, fontWeight: '800', letterSpacing: -1 },
    statLabel: { fontSize: 11, fontWeight: '500' },
});
