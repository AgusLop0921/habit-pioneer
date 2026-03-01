import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import Svg, { Polyline, Circle as SvgCircle, Line, Text as SvgText } from 'react-native-svg';
import { useStore } from '@/store';
import { useTheme } from '@/context/ThemeContext';
import SettingsBar from '@/components/common/SettingsBar';
import Icon, { IconName } from '@/components/common/Icon';
import { Spacing, Radius, type AppTheme } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 48;
const CHART_H = 160;

type Range = '7D' | '31D' | '26W' | '12M';
type View_ = 'trends' | 'habits' | 'archive';

function getDateStr(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { habits, history } = useStore();
  const [range, setRange] = useState<Range>('7D');
  const [view, setView] = useState<View_>('trends');

  const today = new Date();

  // ── Build data points ──
  const getDays = (): Date[] => {
    if (range === '7D') return Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
    if (range === '31D') return Array.from({ length: 31 }, (_, i) => subDays(today, 30 - i));
    if (range === '26W') return Array.from({ length: 26 }, (_, i) => subDays(today, (25 - i) * 7));
    return Array.from({ length: 12 }, (_, i) => subDays(today, (11 - i) * 30));
  };

  const days = getDays();
  const dailyHabits = habits.filter((h) => h.frequency === 'daily');

  const dataPoints = days.map((d) => {
    const dateStr = getDateStr(d);
    const dayHistory = history[dateStr] ?? {};
    const done = Object.values(dayHistory).filter(Boolean).length;
    const total = dailyHabits.length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  });

  const avg =
    dataPoints.length > 0
      ? Math.round(dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length)
      : 0;

  // ── Build SVG line path ──
  const _points = dataPoints
    .map((val, i) => {
      const x = (i / Math.max(dataPoints.length - 1, 1)) * CHART_W;
      const y = CHART_H - (val / 100) * CHART_H;
      return `${x},${y}`;
    })
    .join(' ');

  // ── Stats ──
  const totalCompleted = Object.values(history).reduce((acc, day) => {
    return acc + Object.values(day).filter(Boolean).length;
  }, 0);

  let longestStreak = 0,
    currentStreak = 0,
    tempStreak = 0;
  for (let i = 0; i < 365; i++) {
    const dateStr = getDateStr(subDays(today, i));
    const dayHistory = history[dateStr] ?? {};
    const done = Object.values(dayHistory).filter(Boolean).length;
    if (done > 0) {
      tempStreak++;
      if (i === 0 || currentStreak > 0) currentStreak = tempStreak;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      if (i === 0) currentStreak = 0;
      tempStreak = 0;
    }
  }

  // ── Heatmap (365 days) ──
  const heatmapDays = Array.from({ length: 365 }, (_, i) => subDays(today, 364 - i));
  const CELL = 10,
    GAP = 2,
    _COLS = Math.floor((SCREEN_W - 48) / (CELL + GAP));

  const s = makeStyles(theme);

  const rangeOptions: Range[] = ['7D', '31D', '26W', '12M'];
  const viewOptions: View_[] = ['trends', 'habits', 'archive'];
  const viewLabels: Record<View_, string> = {
    trends: t('history.trends'),
    habits: t('history.habits'),
    archive: t('history.archive'),
  };

  // X-axis labels
  const _xLabels = (() => {
    if (range === '7D') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (range === '31D') return days.filter((_, i) => i % 7 === 0).map((d) => format(d, 'd MMM'));
    if (range === '26W') return days.filter((_, i) => i % 4 === 0).map((d) => format(d, 'd MMM'));
    return days.map((d) => format(d, 'MMM'));
  })();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <SettingsBar />

      {/* Sub-nav: Trends / Habits / Archive */}
      <View style={s.subNav}>
        {viewOptions.map((v) => (
          <Pressable
            key={v}
            style={[s.subNavItem, view === v && { backgroundColor: theme.surface2 }]}
            onPress={() => setView(v)}
          >
            <Text style={[s.subNavLabel, { color: view === v ? theme.text : theme.textSecondary }]}>
              {viewLabels[v]}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── TRENDS ── */}
        {view === 'trends' && (
          <>
            {/* Stats row */}
            <View style={s.statsRow}>
              {[
                {
                  icon: 'completed' as IconName,
                  val: totalCompleted,
                  label: t('history.statCompleted'),
                },
                { icon: 'trophy' as IconName, val: longestStreak, label: t('history.statLongest') },
                { icon: 'flame' as IconName, val: currentStreak, label: t('history.statCurrent') },
              ].map((stat, i) => (
                <View key={i} style={s.statCell}>
                  <Icon name={stat.icon} size={34} color={theme.accent} />
                  <Text style={[s.statVal, { color: theme.text }]}>{stat.val}</Text>
                  <Text style={[s.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Chart section */}
            <View style={s.chartSection}>
              <View style={s.chartHeader}>
                <View>
                  <Text style={[s.chartTitle, { color: theme.text }]}>
                    {t('history.chartTitle')}
                  </Text>
                  <Text style={[s.chartSub, { color: theme.textSecondary }]}>
                    {format(days[0], 'd MMM yyyy')} – {format(days[days.length - 1], 'd MMM yyyy')}
                  </Text>
                </View>
                <Text style={[s.chartAvg, { color: theme.textSecondary }]}>
                  {t('history.avg')}{' '}
                  <Text style={{ color: theme.text, fontWeight: '700' }}>{avg}%</Text>
                </Text>
              </View>

              {/* Line chart */}
              <View style={s.chartWrap}>
                <Svg width={CHART_W} height={CHART_H + 20}>
                  {/* Y labels */}
                  {[0, 50, 100].map((val) => (
                    <SvgText
                      key={val}
                      x={0}
                      y={CHART_H - (val / 100) * CHART_H + 5}
                      fontSize={10}
                      fill={theme.textSecondary}
                    >
                      {val}%
                    </SvgText>
                  ))}
                  {/* Grid lines */}
                  {[0, 50, 100].map((val) => (
                    <Line
                      key={val}
                      x1={32}
                      y1={CHART_H - (val / 100) * CHART_H}
                      x2={CHART_W}
                      y2={CHART_H - (val / 100) * CHART_H}
                      stroke={theme.borderDim}
                      strokeWidth={1}
                    />
                  ))}
                  {/* Line */}
                  {dataPoints.length > 1 && (
                    <Polyline
                      points={dataPoints
                        .map((val, i) => {
                          const x = 32 + (i / Math.max(dataPoints.length - 1, 1)) * (CHART_W - 32);
                          const y = CHART_H - (val / 100) * CHART_H;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke={theme.accent}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {/* Dots */}
                  {dataPoints.map((val, i) => {
                    const x = 32 + (i / Math.max(dataPoints.length - 1, 1)) * (CHART_W - 32);
                    const y = CHART_H - (val / 100) * CHART_H;
                    if (val === 0) return null;
                    return <SvgCircle key={i} cx={x} cy={y} r={4} fill={theme.accent} />;
                  })}
                </Svg>

                {/* X labels */}
                <View style={s.xLabels}>
                  {(range === '7D'
                    ? days
                    : days.filter((_, i) => i % Math.floor(days.length / 6) === 0)
                  )
                    .slice(0, 7)
                    .map((d, i) => (
                      <Text key={i} style={[s.xLabel, { color: theme.textSecondary }]}>
                        {range === '7D' ? format(d, 'EEE').slice(0, 3) : format(d, 'd')}
                      </Text>
                    ))}
                </View>
              </View>

              {/* Range selector */}
              <View style={s.rangeRow}>
                {rangeOptions.map((r) => (
                  <Pressable
                    key={r}
                    style={[s.rangeBtn, range === r && { backgroundColor: theme.surface2 }]}
                    onPress={() => setRange(r)}
                  >
                    <Text
                      style={[
                        s.rangeBtnText,
                        { color: range === r ? theme.text : theme.textSecondary },
                      ]}
                    >
                      {r}
                    </Text>
                  </Pressable>
                ))}
                {/* Heatmap toggle */}
                <Pressable
                  style={[
                    s.rangeBtn,
                    { backgroundColor: range === '12M' ? theme.surface2 : 'transparent' },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>⊞</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {/* ── HABITS ── */}
        {view === 'habits' && (
          <View style={s.chartSection}>
            <View style={s.chartHeader}>
              <Text style={[s.chartTitle, { color: theme.text }]}>{t('history.chartTitle')}</Text>
            </View>
            {dailyHabits.length === 0 ? (
              <Text style={[s.empty, { color: theme.textSecondary }]}>{t('history.noHabits')}</Text>
            ) : (
              dailyHabits.map((h) => {
                // Calculate 7-day bar chart for this habit
                const last7 = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
                const streak = (() => {
                  let s = 0;
                  for (let i = 0; i < 365; i++) {
                    const d = getDateStr(subDays(today, i));
                    if (history[d]?.[h.id]) s++;
                    else break;
                  }
                  return s;
                })();
                const longest = (() => {
                  let max = 0,
                    cur = 0;
                  for (let i = 364; i >= 0; i--) {
                    const d = getDateStr(subDays(today, i));
                    if (history[d]?.[h.id]) {
                      cur++;
                      max = Math.max(max, cur);
                    } else cur = 0;
                  }
                  return max;
                })();
                const completed = Object.values(history).filter((day) => day[h.id]).length;

                return (
                  <View
                    key={h.id}
                    style={[
                      s.habitHistCard,
                      { backgroundColor: theme.surface, borderColor: theme.borderDim },
                    ]}
                  >
                    <View style={s.habitHistHeader}>
                      <Text style={s.habitHistEmoji}>⭐</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.habitHistName, { color: theme.text }]}>{h.name}</Text>
                        <Text style={[s.habitHistStats, { color: theme.textSecondary }]}>
                          {t('history.streak')}:{' '}
                          <Text style={{ color: theme.text, fontWeight: '700' }}>{streak}</Text>
                          {'  '}
                          {t('history.longest')}:{' '}
                          <Text style={{ color: theme.text, fontWeight: '700' }}>{longest}</Text>
                          {'  '}
                          {t('history.completed')}:{' '}
                          <Text style={{ color: theme.text, fontWeight: '700' }}>{completed}</Text>
                        </Text>
                      </View>
                    </View>
                    {/* Mini 7-day bar */}
                    <View style={s.miniBarRow}>
                      {(t('history.weekDaysShort', { returnObjects: true }) as string[]).map(
                        (day, i) => {
                          const d = last7[i];
                          const dateStr = getDateStr(d);
                          const isDone = history[dateStr]?.[h.id] ?? false;
                          const isToday = i === 6;
                          return (
                            <View key={i} style={s.miniBarCol}>
                              <View
                                style={[
                                  s.miniBar,
                                  { backgroundColor: isDone ? theme.accent : theme.surface2 },
                                  isToday &&
                                    isDone && { backgroundColor: theme.accent, height: 48 },
                                ]}
                              />
                              <Text style={[s.miniBarLabel, { color: theme.textSecondary }]}>
                                {day}
                              </Text>
                            </View>
                          );
                        }
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── ARCHIVE (heatmap 365 días) ── */}
        {view === 'archive' && (
          <View style={s.chartSection}>
            <View style={s.chartHeader}>
              <View>
                <Text style={[s.chartTitle, { color: theme.text }]}>{t('history.chartTitle')}</Text>
                <Text style={[s.chartSub, { color: theme.textSecondary }]}>
                  {t('history.days365')} · {format(subDays(today, 364), 'd MMM yyyy')} –{' '}
                  {format(today, 'd MMM yyyy')}
                </Text>
              </View>
              <Text style={[s.chartAvg, { color: theme.textSecondary }]}>
                {t('history.avg')}{' '}
                <Text style={{ color: theme.text, fontWeight: '700' }}>{avg}%</Text>
              </Text>
            </View>
            <View style={s.heatmap}>
              {heatmapDays.map((d, i) => {
                const dateStr = getDateStr(d);
                const dayHistory = history[dateStr] ?? {};
                const done = Object.values(dayHistory).filter(Boolean).length;
                const pct = dailyHabits.length > 0 ? done / dailyHabits.length : 0;
                const opacity = pct === 0 ? 0.08 : 0.2 + pct * 0.8;
                return (
                  <View
                    key={i}
                    style={[s.heatCell, { backgroundColor: `rgba(124,92,252,${opacity})` }]}
                  />
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safe: { flex: 1 },
    subNav: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      marginHorizontal: Spacing.lg,
      marginVertical: Spacing.md,
      borderRadius: Radius.full,
      padding: 3,
    },
    subNavItem: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: Radius.full,
      alignItems: 'center',
    },
    subNavLabel: { fontSize: 14, fontWeight: '600' },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    statCell: { alignItems: 'center', gap: 6 },
    statIcon: { fontSize: 32 },
    statVal: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
    statLabel: { fontSize: 12, textAlign: 'center', lineHeight: 16 },
    chartSection: { paddingHorizontal: Spacing.lg },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    chartTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    chartSub: { fontSize: 12, marginTop: 2 },
    chartAvg: { fontSize: 13 },
    chartWrap: { marginBottom: Spacing.md },
    xLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingLeft: 32,
      marginTop: 4,
    },
    xLabel: { fontSize: 11 },
    rangeRow: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: Radius.full,
      padding: 3,
      gap: 2,
      marginTop: Spacing.md,
    },
    rangeBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: Radius.full,
      alignItems: 'center',
    },
    rangeBtnText: { fontSize: 13, fontWeight: '600' },
    habitHistCard: {
      borderRadius: Radius.xl,
      borderWidth: 1,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    habitHistHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: Spacing.md,
    },
    habitHistEmoji: { fontSize: 28 },
    habitHistName: { fontSize: 15, fontWeight: '600' },
    habitHistStats: { fontSize: 12, marginTop: 2 },
    miniBarRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 56,
    },
    miniBarCol: { alignItems: 'center', gap: 4, flex: 1 },
    miniBar: { width: 8, height: 32, borderRadius: 4 },
    miniBarLabel: { fontSize: 11 },
    heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
    heatCell: { width: 10, height: 10, borderRadius: 2 },
    empty: { textAlign: 'center', padding: Spacing.xl, fontSize: 14 },
  });
