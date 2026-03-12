import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useHistory, useDateLocale } from '@/hooks';
import { useTheme } from '@/context/ThemeContext';
import Icon from '@/components/common/Icon';
import InfoTooltip from '@/components/common/InfoTooltip';
import { Spacing, Radius, type AppTheme } from '@/theme';
import { calculateLevel, LEVELS } from '@/utils/levels';

export default function ResumenTab() {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { habits, history, totalCompleted, currentStreak, longestStreak } = useHistory();
    const locale = useDateLocale();

    // ── Data Computations ──
    const levelData = calculateLevel(totalCompleted);
    const dailyHabits = habits.filter((h) => h.frequency === 'daily');
    const todayStr = new Date().toISOString().split('T')[0];
    const todayHistory = history[todayStr] ?? {};

    const completedTodayCount = dailyHabits.filter(h => todayHistory[h.id]).length;
    const totalDailyCount = dailyHabits.length;

    // Active days logic
    const totalActiveDays = Object.values(history).filter(day => Object.values(day).some(Boolean)).length;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
    });

    const activeThisWeek = last7Days.filter(d => {
        const dateStr = d.toISOString().split('T')[0];
        const h = history[dateStr] ?? {};
        return Object.values(h).some(Boolean);
    }).length;

    // Week progress logic
    const weekHabitsDone = last7Days.reduce((acc, d) => {
        const dateStr = d.toISOString().split('T')[0];
        const dayHist = history[dateStr] ?? {};
        return acc + dailyHabits.filter(h => dayHist[h.id]).length;
    }, 0);
    const totalWeekHabitsPossible = totalDailyCount * 7;
    const weekProgressPercent = totalWeekHabitsPossible > 0 ? Math.round((weekHabitsDone / totalWeekHabitsPossible) * 100) : 0;

    // Month & Temporal logic
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const thisMonthDays = Array.from({ length: daysInMonth }, (_, i) => new Date(today.getFullYear(), today.getMonth(), i + 1));

    let monthHabitsDone = 0;
    let perfectDaysThisMonth = 0;
    thisMonthDays.forEach(day => {
        const dateStr = day.toISOString().split('T')[0];
        const dayHist = history[dateStr] ?? {};
        const doneCount = dailyHabits.filter(h => dayHist[h.id]).length;
        monthHabitsDone += doneCount;
        if (totalDailyCount > 0 && doneCount === totalDailyCount && day <= today) {
            perfectDaysThisMonth++;
        }
    });

    const passedDaysThisMonth = today.getDate();
    const totalMonthHabitsPossible = passedDaysThisMonth * totalDailyCount;
    const successRateThisMonth = totalMonthHabitsPossible > 0 ? Math.round((monthHabitsDone / totalMonthHabitsPossible) * 100) : 0;

    // This week vs Last week
    const last7DaysStart = new Date(today);
    last7DaysStart.setDate(last7DaysStart.getDate() - 6);
    const prev7Days = Array.from({ length: 7 }, (_, i) => {
        const pd = new Date(last7DaysStart);
        pd.setDate(pd.getDate() - (7 - i));
        return pd;
    });
    const prevWeekHabitsDone = prev7Days.reduce((acc, pd) => {
        const dateStr = pd.toISOString().split('T')[0];
        const dayHist = history[dateStr] ?? {};
        return acc + dailyHabits.filter(h => dayHist[h.id]).length;
    }, 0);
    const thisWeekVsLast = prevWeekHabitsDone > 0 ? Math.round(((weekHabitsDone - prevWeekHabitsDone) / prevWeekHabitsDone) * 100) : (weekHabitsDone > 0 ? 100 : 0);

    // This month vs last month
    const prevMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    let prevMonthHabitsDone = 0;
    for (let i = 1; i <= prevMonthDays; i++) {
        const pd = new Date(today.getFullYear(), today.getMonth() - 1, i);
        const dateStr = pd.toISOString().split('T')[0];
        const dayHist = history[dateStr] ?? {};
        prevMonthHabitsDone += dailyHabits.filter(h => dayHist[h.id]).length;
    }
    const thisMonthVsLast = prevMonthHabitsDone > 0 ? Math.round(((monthHabitsDone - prevMonthHabitsDone) / prevMonthHabitsDone) * 100) : (monthHabitsDone > 0 ? 100 : 0);

    let messageKey = 'history.motivatingMessage_0';
    if (totalDailyCount > 0) {
        if (completedTodayCount === totalDailyCount) messageKey = 'history.motivatingMessage_all';
        else if (completedTodayCount === 0) messageKey = 'history.motivatingMessage_0';
        else if (completedTodayCount === 1) messageKey = 'history.motivatingMessage_1';
        else if (completedTodayCount >= totalDailyCount - 1) messageKey = 'history.motivatingMessage_most';
        else if (completedTodayCount >= totalDailyCount / 2) messageKey = 'history.motivatingMessage_half';
        else messageKey = 'history.motivatingMessage_few';
    }

    const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);

    const s = makeStyles(theme);

    return (
        <View style={s.container}>
            {/* ── Message of the day ── */}
            <View style={[s.card, s.purpleCard]}>
                <Text style={s.purpleCardSub}>{t('history.messageOfTheDay')}</Text>
                <Text style={s.purpleCardTitle}>{t(messageKey)}</Text>
                {totalDailyCount > 0 && (
                    <Text style={s.purpleCardSub}>Has completado {completedTodayCount} de {totalDailyCount} hábitos hoy</Text>
                )}
            </View>

            {/* ── Streak ── */}
            <View style={[s.card, { backgroundColor: theme.surface }]}>
                <View style={s.streakHeader}>
                    <View style={s.flameIconWrap}>
                        <Icon name="flame" size={24} color="#FF6347" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.label, { color: theme.textSecondary }]}>{t('history.currentStreak')}</Text>
                        <Text style={[s.valLg, { color: theme.text }]}>{currentStreak} días</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[s.label, { color: theme.textSecondary }]}>{t('history.bestStreak')}</Text>
                        <Text style={[s.valMd, { color: theme.text }]}>{longestStreak} días</Text>
                    </View>
                </View>
                <View style={s.progressTrack}>
                    <View style={[s.progressBar, { width: `${Math.min(100, longestStreak > 0 ? (currentStreak / longestStreak) * 100 : 0)}%`, backgroundColor: '#A855F7' }]} />
                </View>
                <Text style={[s.label, { color: theme.textSecondary, marginTop: Spacing.sm }]}>
                    {currentStreak >= longestStreak && longestStreak > 0
                        ? t('history.newRecord')
                        : t('history.daysToRecord', { days: longestStreak - currentStreak })}
                </Text>
            </View>

            {/* ── Leveling ── */}
            <View style={[s.card, { backgroundColor: theme.surface }]}>
                <View style={s.levelHeader}>
                    <View style={s.levelBadge}>
                        <Text style={s.levelBadgeText}>{levelData.currentLevel.level}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.label, { color: theme.textSecondary }]}>{t('history.level')}</Text>
                        <Text style={[s.valMd, { color: theme.text }]}>{t(levelData.currentLevel.titleKey)}</Text>
                    </View>
                    <Icon name="trendingUp" size={24} color="#4ADE80" />
                    <InfoTooltip title={t('history.levelTooltipTitle')}>
                        <Text style={[s.label, { color: theme.textSecondary, marginBottom: 10 }]}>
                            {t('history.levelTooltipRule')}
                        </Text>
                        {LEVELS.map((lvl) => (
                            <View key={lvl.level} style={[
                                s.levelRow,
                                lvl.level === levelData.currentLevel.level && { backgroundColor: theme.accentDim ?? 'rgba(168,85,247,0.12)', borderRadius: 8 },
                            ]}>
                                <View style={[s.levelRowBadge, lvl.level === levelData.currentLevel.level && { backgroundColor: '#A855F7' }]}>
                                    <Text style={[s.levelRowBadgeText, lvl.level === levelData.currentLevel.level && { color: '#fff' }]}>
                                        {lvl.level}
                                    </Text>
                                </View>
                                <Text style={[s.label, { flex: 1, color: theme.text }]}>{t(lvl.titleKey)}</Text>
                                <Text style={[s.label, { color: theme.textSecondary }]}>
                                    {lvl.totalXpRequired === 0 ? '0' : `${lvl.totalXpRequired}`} XP
                                </Text>
                            </View>
                        ))}
                    </InfoTooltip>
                </View>
                <View style={s.levelNumbers}>
                    <Text style={[s.label, { color: theme.textSecondary }]}>{t('history.experience')}</Text>
                    <Text style={[s.label, { color: theme.text }]}>{levelData.totalXp} / {levelData.nextLevel ? levelData.nextLevel.totalXpRequired : '∞'} XP</Text>
                </View>
                <View style={s.progressTrack}>
                    <View style={[s.progressBar, { width: `${levelData.xpProgressPercent}%`, backgroundColor: '#A855F7' }]} />
                </View>
                <Text style={[s.label, { color: theme.textSecondary, marginTop: Spacing.sm }]}>
                    {levelData.xpForNextLevel
                        ? t('history.xpForNextLevel', { xp: levelData.xpForNextLevel - levelData.xpCurrent, nextLevel: levelData.nextLevel?.level })
                        : t('history.maxLevel')}
                </Text>
            </View>

            {/* ── Active Days ── */}
            <View style={[s.card, { backgroundColor: theme.surface }]}>
                <View style={s.iconWrapBlue}>
                    <Icon name="target" size={20} color="#3B82F6" />
                </View>
                <Text style={[s.valLg, { color: theme.text, marginTop: Spacing.lg, marginBottom: Spacing.md }]}>{totalActiveDays}</Text>
                <Text style={[s.label, { color: theme.textSecondary, marginBottom: Spacing.md }]}>{t('history.activeDays')}</Text>
                <Text style={[s.label, { color: '#22C55E' }]}>{t('history.thisWeek', { count: activeThisWeek })}</Text>
            </View>

            {/* ── Week Progress ── */}
            <View style={[s.card, { backgroundColor: theme.surface }]}>
                <View style={s.weekProgHeader}>
                    <Text style={s.weekProgTitleText}>{t('history.weekProgress')}</Text>
                    <View style={s.weekProgBadge}>
                        <Text style={s.weekProgBadgeText}>{weekProgressPercent}%</Text>
                    </View>
                </View>

                <View style={[s.progressTrack, { marginBottom: Spacing.xl }]}>
                    <View style={[s.progressBar, { width: `${weekProgressPercent}%`, backgroundColor: '#A855F7' }]} />
                </View>

                <View style={s.weekProgDays}>
                    {(t('history.weekDaysShort', { returnObjects: true }) as string[]).map((dayName, i) => {
                        const d = last7Days[i];
                        const dateStr = d.toISOString().split('T')[0];
                        const dayHist = history[dateStr] ?? {};
                        const doneCount = dailyHabits.filter(h => dayHist[h.id]).length;
                        const isDone = totalDailyCount > 0 && doneCount === totalDailyCount;
                        const hasSome = Object.values(dayHist).some(Boolean);
                        const percent = totalDailyCount > 0 ? Math.round((doneCount / totalDailyCount) * 100) : 0;

                        let bgColor = theme.surface2;
                        if (hasSome) {
                            if (percent <= 33) bgColor = 'rgba(168, 85, 247, 0.3)';
                            else if (percent <= 66) bgColor = 'rgba(168, 85, 247, 0.6)';
                            else if (percent < 100) bgColor = 'rgba(168, 85, 247, 0.85)';
                            else bgColor = '#A855F7';
                        }

                        return (
                            <View key={i} style={s.weekProgDayCol}>
                                {tooltipIndex === i && (
                                    <View style={s.tooltip}>
                                        <Text style={s.tooltipText}>{percent}%</Text>
                                    </View>
                                )}
                                <Pressable
                                    style={[s.weekProgDayBox, { backgroundColor: bgColor }]}
                                    onPressIn={() => setTooltipIndex(i)}
                                    onPressOut={() => setTooltipIndex(null)}
                                >
                                    <Text style={[s.weekProgDayName, { color: hasSome ? '#fff' : theme.textSecondary }]}>{dayName.charAt(0)}</Text>
                                </Pressable>
                                {isDone && <Icon name="check" size={14} color="#22C55E" />}
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* ── Month Summary ── */}
            <View style={[s.card, { backgroundColor: theme.surface }]}>
                <Text style={[s.label, { color: theme.textSecondary, marginBottom: Spacing.lg }]}>{t('history.monthSummary')}</Text>

                <View style={s.statsGridRow}>
                    <View style={s.statBox}>
                        <Text style={[s.valMd, { color: theme.text }]}>{monthHabitsDone}</Text>
                        <Text style={[s.label, { color: theme.textSecondary, marginTop: 4 }]}>{t('history.habitsCompleted')}</Text>
                    </View>
                    {perfectDaysThisMonth > 0 && (
                        <View style={s.statBox}>
                            <Text style={[s.valMd, { color: '#EAB308' }]}>{perfectDaysThisMonth}</Text>
                            <Text style={[s.label, { color: theme.textSecondary, marginTop: 4 }]}>{t('history.perfectDays')}</Text>
                        </View>
                    )}
                    <View style={s.statBox}>
                        <Text style={[s.valMd, { color: '#3B82F6' }]}>{successRateThisMonth}%</Text>
                        <Text style={[s.label, { color: theme.textSecondary, marginTop: 4 }]}>{t('history.successRate')}</Text>
                    </View>
                </View>
            </View>

            {/* ── Time Comparison ── */}
            {(prevWeekHabitsDone > 0 || prevMonthHabitsDone > 0) && (
                <View style={[s.card, { backgroundColor: theme.surface }]}>
                    <Text style={[s.label, { color: theme.textSecondary, marginBottom: Spacing.lg }]}>{t('history.timeComparison')}</Text>

                    {prevWeekHabitsDone > 0 && (
                        <View style={s.compRow}>
                            <Text style={[s.label, { color: theme.text, flex: 1 }]}>{t('history.thisWeekVsLast')}</Text>
                            <View style={[s.badgeLabel, { backgroundColor: thisWeekVsLast >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                                <Icon name="trendingUp" size={14} color={thisWeekVsLast >= 0 ? '#22C55E' : '#EF4444'} />
                                <Text style={[s.badgeText, { color: thisWeekVsLast >= 0 ? '#22C55E' : '#EF4444' }]}>
                                    {thisWeekVsLast >= 0 ? '+' : ''}{thisWeekVsLast}%
                                </Text>
                            </View>
                        </View>
                    )}

                    {prevMonthHabitsDone > 0 && (
                        <View style={s.compRow}>
                            <Text style={[s.label, { color: theme.text, flex: 1 }]}>{t('history.thisMonthVsLast')}</Text>
                            <View style={[s.badgeLabel, { backgroundColor: thisMonthVsLast >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                                <Icon name="trendingUp" size={14} color={thisMonthVsLast >= 0 ? '#22C55E' : '#EF4444'} />
                                <Text style={[s.badgeText, { color: thisMonthVsLast >= 0 ? '#22C55E' : '#EF4444' }]}>
                                    {thisMonthVsLast >= 0 ? '+' : ''}{thisMonthVsLast}%
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

        </View>
    );
}

const makeStyles = (theme: AppTheme) =>
    StyleSheet.create({
        container: {
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.md,
            gap: Spacing.md,
            paddingBottom: 40,
        },
        card: {
            borderRadius: Radius.xl,
            padding: Spacing.lg,
            borderWidth: 1,
            borderColor: theme.borderDim,
        },
        purpleCard: {
            backgroundColor: '#7C3AED',
            borderColor: '#8B5CF6',
        },
        purpleCardSub: {
            color: 'rgba(255,255,255,0.8)',
            fontSize: 13,
            fontWeight: '500',
            marginBottom: 4,
        },
        purpleCardTitle: {
            color: '#FFFFFF',
            fontSize: 20,
            fontWeight: '800',
            marginBottom: 12,
            lineHeight: 28,
        },
        streakHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.md,
            marginBottom: Spacing.lg,
        },
        flameIconWrap: {
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: 'rgba(255, 99, 71, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        label: {
            fontSize: 13,
            fontWeight: '500',
        },
        valLg: {
            fontSize: 28,
            fontWeight: '800',
            marginTop: 2,
        },
        valMd: {
            fontSize: 18,
            fontWeight: '800',
            marginTop: 2,
        },
        progressTrack: {
            height: 6,
            backgroundColor: theme.surface2,
            borderRadius: 3,
            overflow: 'hidden',
        },
        progressBar: {
            height: '100%',
            borderRadius: 3,
        },
        levelHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.md,
            marginBottom: Spacing.xl,
        },
        levelBadge: {
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: '#A855F7',
            alignItems: 'center',
            justifyContent: 'center',
        },
        levelBadgeText: {
            color: '#FFFFFF',
            fontWeight: '800',
            fontSize: 20,
        },
        levelNumbers: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: Spacing.sm,
        },
        levelRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 5,
            paddingHorizontal: 6,
        },
        levelRowBadge: {
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: 'rgba(168,85,247,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        levelRowBadgeText: {
            color: '#A855F7',
            fontWeight: '700',
            fontSize: 12,
        },
        row: {
            flexDirection: 'row',
            gap: Spacing.md,
        },
        iconWrapBlue: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        weekProgHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing.lg,
        },
        weekProgTitleText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: '700',
            backgroundColor: 'rgba(255,255,255,0.1)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            overflow: 'hidden'
        },
        weekProgBadge: {
            backgroundColor: 'rgba(124, 58, 237, 0.2)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
        },
        weekProgBadgeText: {
            color: '#A855F7',
            fontWeight: '700',
            fontSize: 14,
        },
        weekProgDays: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        weekProgDayCol: {
            alignItems: 'center',
            gap: 6,
        },
        weekProgDayBox: {
            width: 38,
            height: 44,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
        },
        weekProgDayName: {
            fontSize: 14,
            fontWeight: '700',
        },
        tooltip: {
            position: 'absolute',
            top: -28,
            backgroundColor: '#1E1E2D',
            paddingHorizontal: 6,
            paddingVertical: 4,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: theme.borderDim,
            zIndex: 10,
        },
        tooltipText: {
            color: '#A855F7',
            fontSize: 12,
            fontWeight: '700',
        },
        statsGridRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        statBox: {
            alignItems: 'center',
            flex: 1,
        },
        compRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.borderDim,
        },
        badgeLabel: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            gap: 4,
        },
        badgeText: {
            fontSize: 13,
            fontWeight: '700',
        }
    });
