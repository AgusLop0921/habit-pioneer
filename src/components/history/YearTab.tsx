import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useHistory, useDateLocale } from '@/hooks';
import { useTheme } from '@/context/ThemeContext';
import Icon from '@/components/common/Icon';
import { Spacing, Radius, type AppTheme } from '@/theme';
import { format, startOfMonth, endOfMonth, isSameMonth, eachDayOfInterval, isAfter, isBefore, startOfDay, isValid, subDays, startOfWeek, addDays, getDay } from 'date-fns';

const SCREEN_W = Dimensions.get('window').width;

export default function YearTab() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { habits, history, currentStreak, longestStreak } = useHistory();
    const locale = useDateLocale();
    const [tooltipData, setTooltipData] = useState<{ date: Date, pct: number, x: number, y: number } | null>(null);
    const today = new Date();

    const dailyHabits = habits.filter((h) => h.frequency === 'daily');
    const totalDailyCount = dailyHabits.length;

    // ── Find First Active Date ──
    const sortedHistoryKeys = Object.keys(history).sort();
    let firstActiveDate = today;
    for (const key of sortedHistoryKeys) {
        if (Object.values(history[key]).some(Boolean)) {
            firstActiveDate = new Date(key);
            break;
        }
    }

    if (isNaN(firstActiveDate.getTime()) || isAfter(firstActiveDate, today)) {
        firstActiveDate = today;
    }

    // ── Build Data for Actividad Anual ──
    const totalActiveDays = Object.values(history).filter(day => Object.values(day).some(Boolean)).length;

    // Calculate global completion rate from first active date to today
    let activePeriodHabitsDone = 0;
    const daysSinceStart = Math.max(1, Math.floor((today.getTime() - firstActiveDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const totalHabitsPossible = daysSinceStart * totalDailyCount;

    if (totalDailyCount > 0) {
        for (const key of Object.keys(history)) {
            const d = new Date(key);
            if (isValid(d) && !isBefore(d, startOfDay(firstActiveDate))) {
                activePeriodHabitsDone += dailyHabits.filter(h => history[key][h.id]).length;
            }
        }
    }
    const fulfillmentRate = totalHabitsPossible > 0 ? Math.round((activePeriodHabitsDone / totalHabitsPossible) * 100) : 0;

    // ── Build Monthly Summary Data ──
    type MonthData = { month: Date; activeDays: number; completionRate: number; key: string };
    const monthlyData: MonthData[] = [];
    let bestMonth: MonthData | null = null;
    let currentIterDate = startOfMonth(firstActiveDate);
    const endMonthlyIter = startOfMonth(today);

    while (!isAfter(currentIterDate, endMonthlyIter)) {
        const _endOfMonth = isSameMonth(currentIterDate, today) ? today : endOfMonth(currentIterDate);
        const daysInPeriod = eachDayOfInterval({ start: currentIterDate, end: _endOfMonth });

        let mActiveDays = 0;
        let mHabitsDone = 0;
        const mPossibleHabits = daysInPeriod.length * totalDailyCount;

        daysInPeriod.forEach(day => {
            const dateStr = day.toISOString().split('T')[0];
            const hist = history[dateStr];
            if (hist && Object.values(hist).some(Boolean)) {
                mActiveDays++;
                mHabitsDone += dailyHabits.filter(h => hist[h.id]).length;
            }
        });

        const mRate = mPossibleHabits > 0 ? Math.round((mHabitsDone / mPossibleHabits) * 100) : 0;
        const monthObj = {
            month: new Date(currentIterDate),
            activeDays: mActiveDays,
            completionRate: mRate,
            key: currentIterDate.toISOString()
        };

        monthlyData.unshift(monthObj); // desc (newest first)

        if (mRate > 0 && (!bestMonth || mRate > bestMonth.completionRate)) {
            bestMonth = monthObj;
        }

        currentIterDate.setMonth(currentIterDate.getMonth() + 1);
    }

    // ── Build Heatmap (Últimos 365 días) ──
    const heatmapStartDate = subDays(today, 364);
    const heatmapDays = Array.from({ length: 365 }, (_, i) => subDays(today, 364 - i));
    const getDateStr = (d: Date) => format(d, 'yyyy-MM-dd');

    const getOpacityForPct = (pct: number) => {
        if (pct === 0) return 0.08;
        return 0.2 + pct * 0.8;
    };

    const s = makeStyles(theme);

    return (
        <View style={s.container}>
            {/* ── Actividad Anual ── */}
            <View>
                <Text style={[s.sectionTitle, { color: theme.text }]}>{t('history.yearlyActivity')}</Text>
                <Text style={[s.sectionSub, { color: theme.textSecondary }]}>{t('history.yearlyActivitySub')}</Text>
            </View>

            <View style={[s.card, { backgroundColor: theme.surface }]}>
                <View style={s.statsGridRow}>
                    <View style={s.statBoxLeft}>
                        <Text style={[s.valXl, { color: '#A855F7' }]}>{fulfillmentRate}%</Text>
                        <Text style={[s.label, { color: theme.textSecondary, marginTop: Spacing.sm }]}>{t('history.fulfillmentRate')}</Text>
                    </View>
                    <View style={s.statBoxLeft}>
                        <Text style={[s.valXl, { color: '#22C55E' }]}>{totalActiveDays}</Text>
                        <Text style={[s.label, { color: theme.textSecondary, marginTop: Spacing.sm }]}>{t('history.activeDays')}</Text>
                    </View>
                </View>
                <View style={[s.statsGridRow, { marginBottom: 0 }]}>
                    <View style={s.statBoxLeft}>
                        <Text style={[s.valXl, { color: '#F97316' }]}>{currentStreak}</Text>
                        <Text style={[s.label, { color: theme.textSecondary, marginTop: Spacing.sm }]}>{t('history.currentStreak')}</Text>
                    </View>
                    <View style={s.statBoxLeft}>
                        <Text style={[s.valXl, { color: '#3B82F6' }]}>{longestStreak}</Text>
                        <Text style={[s.label, { color: theme.textSecondary, marginTop: Spacing.sm }]}>{t('history.longestStreak')}</Text>
                    </View>
                </View>
            </View>

            {/* ── Últimos 365 Días (Heatmap) ── */}
            <View style={[s.card, { backgroundColor: theme.surface }]}>
                <Text style={[s.cardTitle, { color: theme.text, marginBottom: 4 }]}>{t('history.last365Days')}</Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: Spacing.lg }}>
                    {format(heatmapStartDate, 'd MMM yyyy', { locale })} - {format(today, 'd MMM yyyy', { locale })}
                </Text>

                <View style={s.heatmap}>
                    {heatmapDays.map((d, i) => {
                        const dateStr = getDateStr(d);
                        const dayHistory = history[dateStr] ?? {};
                        const done = Object.values(dayHistory).filter(Boolean).length;
                        const pct = totalDailyCount > 0 ? done / totalDailyCount : 0;
                        return (
                            <Pressable
                                key={i}
                                onPressIn={(e) => setTooltipData({
                                    date: d,
                                    pct,
                                    x: e.nativeEvent.pageX,
                                    y: e.nativeEvent.pageY
                                })}
                                onPressOut={() => setTooltipData(null)}
                            >
                                <View
                                    style={[
                                        s.heatCell,
                                        { backgroundColor: `rgba(168, 85, 247, ${getOpacityForPct(pct)})` }
                                    ]}
                                />
                            </Pressable>
                        );
                    })}
                </View>

                {/* Legend */}
                <View style={s.legendRow}>
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>{t('history.less')}</Text>
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                        <View key={i} style={[s.heatCell, { backgroundColor: `rgba(168, 85, 247, ${getOpacityForPct(pct)})` }]} />
                    ))}
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>{t('history.more')}</Text>
                </View>
            </View>

            {/* ── Resumen por mes ── */}
            <View style={[s.card, { backgroundColor: theme.surface }]}>
                <Text style={[s.cardTitle, { color: theme.text }]}>{t('history.monthSummaryTitle')}</Text>

                {monthlyData.map((m, i) => (
                    <View key={m.key} style={[s.monthRow, i === monthlyData.length - 1 && s.lastMonthRow]}>
                        <View style={s.monthHeader}>
                            <Text style={[s.monthName, { color: theme.text }]}>
                                {format(m.month, 'MMMM yyyy', { locale }).replace(/^\w/, c => c.toUpperCase())}
                            </Text>
                            <Text style={[s.monthActiveDays, { color: theme.textSecondary }]}>
                                {m.activeDays} {t('history.activeDays').toLowerCase()}
                            </Text>
                        </View>
                        <View style={s.progressTrack}>
                            <View style={[s.progressBar, { width: `${m.completionRate}%`, backgroundColor: '#A855F7' }]} />
                        </View>
                        <Text style={[s.monthRateText, { color: theme.textSecondary }]}>
                            {m.completionRate}% {t('history.completed').toLowerCase()}
                        </Text>
                    </View>
                ))}
            </View>

            {/* ── Mejor mes del año ── */}
            {bestMonth && monthlyData.length > 1 && (
                <View style={[s.card, s.goldCard]}>
                    <View style={s.goldHeader}>
                        <Text style={s.goldEmoji}>🏆</Text>
                        <Text style={s.goldTitle}>{t('history.bestMonthTitle')}</Text>
                    </View>
                    <Text style={s.goldSubTitle}>
                        {format(bestMonth.month, 'MMMM yyyy', { locale }).replace(/^\w/, c => c.toUpperCase())} - {bestMonth.completionRate}% {t('history.fulfillmentLowerCase')}
                    </Text>
                    <Text style={s.goldDesc}>
                        {t('history.bestMonthDesc')} {bestMonth.activeDays} {t('history.bestMonthDescEnding')}
                    </Text>
                </View>
            )}

            {/* Tooltip Overlay */}
            {tooltipData && (
                <View
                    style={[
                        s.tooltip,
                        {
                            top: tooltipData.y - 120, // offset above finger
                            left: Math.min(Math.max(tooltipData.x - 50, 20), SCREEN_W - 120), // keep on screen
                        }
                    ]}
                >
                    <Text style={s.tooltipText}>
                        {format(tooltipData.date, 'd MMM yyyy', { locale })}
                    </Text>
                    <Text style={[s.tooltipText, { fontWeight: '700', marginTop: 2, color: theme.text }]}>
                        {Math.round(tooltipData.pct * 100)}% {t('history.completed').toLowerCase()}
                    </Text>
                </View>
            )}
        </View>
    );
}

const makeStyles = (theme: AppTheme) =>
    StyleSheet.create({
        container: {
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.lg,
            gap: Spacing.lg,
            paddingBottom: 40,
        },
        sectionTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
        sectionSub: { fontSize: 16, marginTop: 4 },
        card: {
            borderRadius: Radius.xl,
            padding: Spacing.xl,
            borderWidth: 1,
            borderColor: theme.borderDim,
        },
        cardTitle: { fontSize: 20, fontWeight: '800', marginBottom: Spacing.xl },
        statsGridRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: Spacing.xl,
        },
        statBoxLeft: {
            flex: 1,
            alignItems: 'center',
        },
        valXl: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
        label: { fontSize: 13 },
        monthRow: {
            marginBottom: Spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: theme.borderDim,
            paddingBottom: Spacing.lg,
        },
        lastMonthRow: {
            marginBottom: 0,
            borderBottomWidth: 0,
            paddingBottom: 0,
        },
        monthHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing.sm,
        },
        monthName: { fontSize: 16, fontWeight: '600' },
        monthActiveDays: { fontSize: 13 },
        progressTrack: {
            height: 6,
            backgroundColor: theme.surface2,
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: Spacing.xs,
        },
        progressBar: {
            height: '100%',
            borderRadius: 3,
        },
        monthRateText: { fontSize: 13 },
        goldCard: {
            backgroundColor: 'rgba(180, 83, 9, 0.15)',
            borderColor: 'rgba(180, 83, 9, 0.3)',
        },
        goldHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.xs },
        goldEmoji: { fontSize: 24 },
        goldTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
        goldSubTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: Spacing.sm },
        goldDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
        heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
        heatCell: {
            width: 10,
            height: 10,
            borderRadius: 2,
        },
        legendRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: Spacing.md,
        },
        tooltip: {
            position: 'absolute',
            backgroundColor: theme.surface2,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            borderRadius: Radius.md,
            borderWidth: 1,
            borderColor: theme.borderDim,
            zIndex: 1000,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            alignItems: 'center',
            minWidth: 100,
        },
        tooltipText: {
            color: theme.textSecondary,
            fontSize: 12,
        },
    });
