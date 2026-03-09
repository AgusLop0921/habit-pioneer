import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePomodoroStore } from '@/store/pomodoroStore';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/theme';
import Icon from '@/components/common/Icon';

export default function PomodoroStatsCard() {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const getTodaySessions = usePomodoroStore((s) => s.getTodaySessions);
    const getTotalFocusMinutes = usePomodoroStore((s) => s.getTotalFocusMinutes);

    const todaySessions = getTodaySessions();
    const workSessions = todaySessions.filter(s => s.mode === 'work').length;
    const focusMinutesToday = Math.round(todaySessions.filter(s => s.mode === 'work').reduce((acc, s) => acc + s.durationSeconds, 0) / 60);

    return (
        <View style={[s.card, { backgroundColor: theme.surface2, borderColor: theme.borderDim }]}>
            <View style={s.header}>
                <View style={[s.iconBg, { backgroundColor: theme.accentDim }]}>
                    <Icon name="timer" size={20} color={theme.accent} />
                </View>
                <Text style={[s.title, { color: theme.text }]}>{t('history.productivity') || 'Productividad'}</Text>
            </View>

            <View style={s.row}>
                <View style={s.stat}>
                    <Text style={[s.val, { color: theme.text }]}>{workSessions}</Text>
                    <Text style={[s.label, { color: theme.textSecondary }]}>{t('history.sessionsToday') || 'Sesiones hoy'}</Text>
                </View>
                <View style={s.divider} />
                <View style={s.stat}>
                    <Text style={[s.val, { color: theme.text }]}>{focusMinutesToday}</Text>
                    <Text style={[s.label, { color: theme.textSecondary }]}>{t('history.minutesToday') || 'Minutos foco'}</Text>
                </View>
                <View style={s.divider} />
                <View style={s.stat}>
                    <Text style={[s.val, { color: theme.text }]}>{getTotalFocusMinutes()}</Text>
                    <Text style={[s.label, { color: theme.textSecondary }]}>{t('history.totalFocus') || 'Total histórico'}</Text>
                </View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    card: {
        padding: Spacing.md,
        borderRadius: Radius.xl,
        borderWidth: 1,
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: Spacing.md,
    },
    iconBg: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    val: {
        fontSize: 18,
        fontWeight: '800',
    },
    label: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
        textAlign: 'center',
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(0,0,0,0.05)',
    }
});
