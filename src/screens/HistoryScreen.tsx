import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { format, subDays, addDays, isAfter } from 'date-fns';
import Svg, { Polyline, Circle as SvgCircle, Line, Text as SvgText, Rect, Path } from 'react-native-svg';
import { useHistory, useDateLocale } from '@/hooks';
import { useTheme } from '@/context/ThemeContext';
import SettingsBar from '@/components/common/SettingsBar';
import Icon, { IconName } from '@/components/common/Icon';
import PomodoroStatsCard from '@/components/history/PomodoroStatsCard';
import ResumenTab from '@/components/history/ResumenTab';
import YearTab from '@/components/history/YearTab';
import { Spacing, Radius, type AppTheme } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 80; // Enough room for y-axis (40px) + padding (32px) + margin (8px)
const CHART_H = 160;
const BAR_H = 110;
// Logros mini chart: card width = SCREEN_W - 2*Spacing.lg(chartSection) - 2*Spacing.md(card padding)
const HABIT_BAR_W = SCREEN_W - 80;
const HABIT_BAR_H = 60;
const MONTH_GAP = 4;
const MONTH_CELL = Math.floor((HABIT_BAR_W - 6 * MONTH_GAP) / 7);
const YEAR_CELL = 8;
const YEAR_GAP = 2;
const YEAR_COLS = Math.floor(HABIT_BAR_W / (YEAR_CELL + YEAR_GAP));
// Line chart: full-width with symmetric margins so the data area is centered
const LINE_LEFT = 56;  // y-axis label area (left padding Spacing.lg=24 + y-axis 32px)
const LINE_RIGHT = 56; // mirrors left for centering
const LINE_DATA_W = SCREEN_W - LINE_LEFT - LINE_RIGHT;
const LINE_TOP = 14;   // top padding so the 100% label isn't clipped

type Range = '7D' | '31D' | '26W' | '12M';
type View_ = 'trends' | 'habits' | 'archive' | 'year';

function getDateStr(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { habits, history, totalCompleted, currentStreak, longestStreak } = useHistory();
  const locale = useDateLocale();
  const [range, setRange] = useState<Range>('7D');
  const [view, setView] = useState<View_>('trends');
  const [archiveRange, setArchiveRange] = useState<'week' | 'month' | 'year'>('week');

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

  // ── Last 7 days (fixed, for bar chart — independent of range selector) ──
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  const weekDayShort = t('history.weekDaysShort', { returnObjects: true }) as string[];

  // ── Insights data ──
  const totalPossibleWeek = dailyHabits.length * 7;
  const weekHabitsDone = last7Days.reduce((acc, d) => {
    const dateStr = getDateStr(d);
    const h = history[dateStr] ?? {};
    return acc + dailyHabits.filter((hab) => h[hab.id]).length;
  }, 0);
  const prev7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 13 - i));
  const prevWeekHabitsDone = prev7Days.reduce((acc, d) => {
    const dateStr = getDateStr(d);
    const h = history[dateStr] ?? {};
    return acc + dailyHabits.filter((hab) => h[hab.id]).length;
  }, 0);
  // Tasas absolutas (% de hábitos posibles completados), no % relativo
  const thisWeekRate = totalPossibleWeek > 0 ? Math.round((weekHabitsDone / totalPossibleWeek) * 100) : 0;
  const prevWeekRate = totalPossibleWeek > 0 ? Math.round((prevWeekHabitsDone / totalPossibleWeek) * 100) : 0;
  const weekRatesDelta = (thisWeekRate > 0 || prevWeekRate > 0) ? thisWeekRate - prevWeekRate : null;

  // Worst weekday (last 28 days, Mon=0 … Sun=6)
  const last28Days = Array.from({ length: 28 }, (_, i) => subDays(today, 27 - i));
  const weekdayRates = [0, 1, 2, 3, 4, 5, 6].map((wd) => {
    const daysOfWd = last28Days.filter((d) => (d.getDay() + 6) % 7 === wd);
    const rates = daysOfWd.map((d) => {
      const dateStr = getDateStr(d);
      const h = history[dateStr] ?? {};
      const done = dailyHabits.filter((hab) => h[hab.id]).length;
      return dailyHabits.length > 0 ? done / dailyHabits.length : 1;
    });
    return rates.reduce((a, b) => a + b, 0) / Math.max(rates.length, 1);
  });
  const worstDayIdx = weekdayRates.indexOf(Math.min(...weekdayRates));
  const worstDayRate = weekdayRates[worstDayIdx];

  // Full weekday name (2024-01-01 is a Monday = idx 0)
  const worstDayName = format(addDays(new Date(2024, 0, 1), worstDayIdx), 'EEEE', { locale });

  // Only show worst-day insight if at least 3 of the last 4 weeks have activity
  const weeksWithData = [0, 1, 2, 3].filter((w) =>
    Array.from({ length: 7 }, (_, d) => subDays(today, w * 7 + d)).some(
      (day) => Object.values(history[getDateStr(day)] ?? {}).some(Boolean)
    )
  ).length;
  const hasEnoughHistoryForInsight = weeksWithData >= 3;


  // ── Archive: month calendar helpers ──
  const archiveMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const archiveMonthStartWd = (archiveMonthStart.getDay() + 6) % 7; // Mon=0
  const archiveMonthDays = Array.from(
    { length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() },
    (_, i) => new Date(today.getFullYear(), today.getMonth(), i + 1)
  );
  const archiveMonthRows = Math.ceil((archiveMonthStartWd + archiveMonthDays.length) / 7);

  // ── Archive: year heatmap helpers ──
  const archiveYearDays = Array.from(
    { length: new Date(today.getFullYear(), 1, 29).getMonth() === 1 ? 366 : 365 },
    (_, i) => new Date(today.getFullYear(), 0, 1 + i)
  );
  const archiveYearRows = Math.ceil(archiveYearDays.length / YEAR_COLS);

  const s = makeStyles(theme);

  const rangeOptions: Range[] = ['7D', '31D', '26W', '12M'];
  const viewOptions: View_[] = ['trends', 'habits', 'archive', 'year'];
  const viewLabels: Record<View_, string> = {
    trends: t('history.trends'),
    habits: t('history.habits'),
    archive: t('history.archive'),
    year: t('history.year'),
  };

  // X-axis labels
  const _xLabels = (() => {
    if (range === '7D') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (range === '31D')
      return days.filter((_, i) => i % 7 === 0).map((d) => format(d, 'd MMM', { locale }));
    if (range === '26W')
      return days.filter((_, i) => i % 4 === 0).map((d) => format(d, 'd MMM', { locale }));
    return days.map((d) => format(d, 'MMM', { locale }));
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
        {/* ── RESUMEN ── */}
        {view === 'trends' && <ResumenTab />}

        {/* ── TENDENCIAS ── */}
        {view === 'habits' && (
          <View style={{ paddingTop: Spacing.md }}>
            {/* Pomodoro — solo si tiene datos */}
            <View style={{ marginHorizontal: Spacing.lg }}>
              <PomodoroStatsCard />
            </View>

            {/* ── Bar chart semanal ── */}
            {dailyHabits.length > 0 && (
              <View style={[s.chartSection, { marginBottom: Spacing.lg }]}>
                <View>
                  <Text style={[s.chartTitle, { color: theme.text }]}>
                    Hábitos completados esta semana
                  </Text>
                  <Text style={[s.chartAvg, { color: theme.textSecondary, marginBottom: Spacing.md }]}>
                    {t('history.avg')}{' '}
                    <Text style={{ color: theme.text, fontWeight: '700' }}>
                      {dailyHabits.length > 0
                        ? Math.round(
                            (last7Days.reduce((acc, d) => {
                              const ds = getDateStr(d);
                              const h = history[ds] ?? {};
                              return acc + dailyHabits.filter((hab) => h[hab.id]).length;
                            }, 0) /
                              (dailyHabits.length * 7)) *
                              100
                          )
                        : 0}
                      %
                    </Text>
                  </Text>
                </View>
                <View style={s.chartWrap}>
                  <Svg width={CHART_W} height={BAR_H + 24}>
                    {last7Days.map((d, i) => {
                      const ds = getDateStr(d);
                      const dayHist = history[ds] ?? {};
                      const done = dailyHabits.filter((h) => dayHist[h.id]).length;
                      const total = dailyHabits.length;
                      const barW = Math.floor((CHART_W / 7) * 0.55);
                      const barX = i * (CHART_W / 7) + (CHART_W / 7 - barW) / 2;
                      const completedH = total > 0 ? Math.round((done / total) * BAR_H) : 0;
                      return (
                        <React.Fragment key={i}>
                          {/* Background (target) bar */}
                          <Rect
                            x={barX}
                            y={0}
                            width={barW}
                            height={BAR_H}
                            rx={6}
                            fill={theme.surface2}
                          />
                          {/* Completed bar */}
                          {completedH > 0 && (
                            <Rect
                              x={barX}
                              y={BAR_H - completedH}
                              width={barW}
                              height={completedH}
                              rx={6}
                              fill="#A855F7"
                            />
                          )}
                          {/* Day label */}
                          <SvgText
                            x={barX + barW / 2}
                            y={BAR_H + 18}
                            fontSize={11}
                            fill={theme.textSecondary}
                            textAnchor="middle"
                          >
                            {weekDayShort[i]}
                          </SvgText>
                        </React.Fragment>
                      );
                    })}
                  </Svg>
                </View>
              </View>
            )}

            {/* ── Line chart — full-width, symmetric margins ── */}
            <View>
              {/* Title text with padding */}
              <View style={{ paddingHorizontal: Spacing.lg }}>
                <Text style={[s.chartTitle, { color: theme.text }]}>
                  {t('history.chartTitle')}
                </Text>
                <Text style={[s.chartSub, { color: theme.textSecondary, marginBottom: 4 }]}>
                  {format(days[0], 'd MMM yyyy', { locale })} –{' '}
                  {format(days[days.length - 1], 'd MMM yyyy', { locale })}
                </Text>
                <Text style={[s.chartAvg, { color: theme.textSecondary, marginBottom: Spacing.md }]}>
                  {t('history.avg')}{' '}
                  <Text style={{ color: theme.text, fontWeight: '700' }}>{avg}%</Text>
                </Text>
              </View>

              {/* Full-width SVG: LINE_LEFT px y-axis, LINE_DATA_W chart, LINE_RIGHT px right */}
              <View style={s.chartWrap}>
                <Svg width={SCREEN_W} height={LINE_TOP + CHART_H + 20}>
                  {/* Y-axis labels */}
                  {[0, 50, 100].map((val) => (
                    <SvgText
                      key={val}
                      x={LINE_LEFT - 6}
                      y={LINE_TOP + CHART_H - (val / 100) * CHART_H + 4}
                      fontSize={10}
                      fill={theme.textSecondary}
                      textAnchor="end"
                    >
                      {val}%
                    </SvgText>
                  ))}
                  {/* Grid lines */}
                  {[0, 50, 100].map((val) => (
                    <Line
                      key={val}
                      x1={LINE_LEFT}
                      y1={LINE_TOP + CHART_H - (val / 100) * CHART_H}
                      x2={LINE_LEFT + LINE_DATA_W}
                      y2={LINE_TOP + CHART_H - (val / 100) * CHART_H}
                      stroke={theme.borderDim}
                      strokeWidth={1}
                    />
                  ))}
                  {/* Fill area */}
                  {dataPoints.length > 1 && (
                    <Path
                      d={
                        dataPoints
                          .map((val, i) => {
                            const x = LINE_LEFT + (i / Math.max(dataPoints.length - 1, 1)) * LINE_DATA_W;
                            const y = LINE_TOP + CHART_H - (val / 100) * CHART_H;
                            return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                          })
                          .join(' ') +
                        ` L ${LINE_LEFT + LINE_DATA_W},${LINE_TOP + CHART_H} L ${LINE_LEFT},${LINE_TOP + CHART_H} Z`
                      }
                      fill="#A855F7"
                      fillOpacity={0.12}
                    />
                  )}
                  {/* Line */}
                  {dataPoints.length > 1 && (
                    <Polyline
                      points={dataPoints
                        .map((val, i) => {
                          const x = LINE_LEFT + (i / Math.max(dataPoints.length - 1, 1)) * LINE_DATA_W;
                          const y = LINE_TOP + CHART_H - (val / 100) * CHART_H;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#A855F7"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {/* Dots (solo para 7D) */}
                  {range === '7D' &&
                    dataPoints.map((val, i) => {
                      const x = LINE_LEFT + (i / Math.max(dataPoints.length - 1, 1)) * LINE_DATA_W;
                      const y = LINE_TOP + CHART_H - (val / 100) * CHART_H;
                      if (val === 0) return null;
                      return <SvgCircle key={i} cx={x} cy={y} r={4} fill="#A855F7" />;
                    })}
                </Svg>
                {/* X-axis labels aligned with the data area */}
                <View style={[s.xLabels, { paddingLeft: LINE_LEFT, paddingRight: LINE_RIGHT }]}>
                  {(range === '7D'
                    ? days
                    : days.filter((_, i) => i % Math.floor(days.length / 6) === 0)
                  )
                    .slice(0, 7)
                    .map((d, i) => (
                      <Text key={i} style={[s.xLabel, { color: theme.textSecondary }]}>
                        {range === '7D'
                          ? format(d, 'EEE', { locale }).slice(0, 3)
                          : format(d, 'd')}
                      </Text>
                    ))}
                </View>
              </View>

              {/* Range selector with horizontal padding */}
              <View style={[s.rangeRow, { marginHorizontal: Spacing.lg }]}>
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
              </View>
            </View>

            {/* ── Stats row ── */}
            <View style={s.statsRow}>
              {[
                {
                  icon: 'completed' as IconName,
                  val: totalCompleted,
                  label: t('history.statCompleted'),
                },
                {
                  icon: 'trophy' as IconName,
                  val: longestStreak,
                  label: t('history.statLongest'),
                },
                {
                  icon: 'flame' as IconName,
                  val: currentStreak,
                  label: t('history.statCurrent'),
                },
              ].map((stat, i) => (
                <View key={i} style={s.statCell}>
                  <Icon name={stat.icon} size={34} color={theme.accent} />
                  <Text style={[s.statVal, { color: theme.text }]}>{stat.val}</Text>
                  <Text style={[s.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* ── Insights de la semana ── */}
            {dailyHabits.length > 0 && (
              <View
                style={[
                  s.insightsCard,
                  { backgroundColor: theme.surface, borderColor: theme.borderDim },
                ]}
              >
                <View style={s.insightsHeader}>
                  <Text style={s.insightsEmoji}>💡</Text>
                  <Text style={[s.insightsTitle, { color: theme.text }]}>
                    Insights de la semana
                  </Text>
                </View>

                {weekRatesDelta !== null && (
                  <View style={[s.insightRow, { borderTopColor: theme.borderDim }]}>
                    <Text
                      style={[
                        s.insightIcon,
                        { color: weekRatesDelta >= 0 ? '#22C55E' : '#EF4444' },
                      ]}
                    >
                      {weekRatesDelta >= 0 ? '✓' : '↓'}
                    </Text>
                    <Text style={[s.insightText, { color: theme.textSecondary }]}>
                      {weekRatesDelta > 0
                        ? `Subiste del ${prevWeekRate}% al ${thisWeekRate}% esta semana`
                        : weekRatesDelta < 0
                          ? `Bajaste del ${prevWeekRate}% al ${thisWeekRate}% esta semana`
                          : `Esta semana: ${thisWeekRate}%, igual que la semana anterior`}
                    </Text>
                  </View>
                )}

                {hasEnoughHistoryForInsight && worstDayRate < 0.65 && (
                  <View style={[s.insightRow, { borderTopColor: theme.borderDim }]}>
                    <Text style={[s.insightIcon, { color: '#EAB308' }]}>⚠</Text>
                    <Text style={[s.insightText, { color: theme.textSecondary }]}>
                      Los {worstDayName} son tu día más difícil. ¡Planificá con anticipación!
                    </Text>
                  </View>
                )}

                <View style={[s.insightRow, { borderTopColor: theme.borderDim }]}>
                  <Text style={[s.insightIcon, { color: '#A855F7' }]}>📊</Text>
                  <Text style={[s.insightText, { color: theme.textSecondary }]}>
                    {currentStreak >= longestStreak && longestStreak > 0
                      ? `¡Récord personal en racha: ${currentStreak} días! ¡Seguí así!`
                      : longestStreak > 0
                        ? `Tu racha más larga fue de ${longestStreak} días. ¡Podés superarla!`
                        : `Empezá una racha completando hábitos varios días seguidos.`}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ height: 24 }} />
          </View>
        )}

        {/* ── LOGROS ── */}
        {view === 'archive' && (
          <View style={[s.chartSection, { paddingTop: Spacing.md }]}>
            {/* Sub-range selector */}
            <View style={[s.rangeRow, { marginBottom: Spacing.lg }]}>
              {(['week', 'month', 'year'] as const).map((r) => (
                <Pressable
                  key={r}
                  style={[s.rangeBtn, archiveRange === r && { backgroundColor: theme.surface2 }]}
                  onPress={() => setArchiveRange(r)}
                >
                  <Text style={[s.rangeBtnText, { color: archiveRange === r ? theme.text : theme.textSecondary }]}>
                    {r === 'week' ? 'Semana' : r === 'month' ? 'Mes' : 'Año'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {dailyHabits.length === 0 ? (
              <Text style={[s.empty, { color: theme.textSecondary }]}>{t('history.noHabits')}</Text>
            ) : (
              dailyHabits.map((h) => {
                const streak = (() => {
                  let streak = 0;
                  for (let i = 0; i < 365; i++) {
                    const d = getDateStr(subDays(today, i));
                    if (history[d]?.[h.id]) streak++;
                    else break;
                  }
                  return streak;
                })();
                const longest = (() => {
                  let max = 0, cur = 0;
                  for (let i = 364; i >= 0; i--) {
                    const d = getDateStr(subDays(today, i));
                    if (history[d]?.[h.id]) { cur++; max = Math.max(max, cur); }
                    else cur = 0;
                  }
                  return max;
                })();
                const completed = Object.values(history).filter((day) => day[h.id]).length;

                return (
                  <View
                    key={h.id}
                    style={[s.habitHistCard, { backgroundColor: theme.surface, borderColor: theme.borderDim }]}
                  >
                    <View style={s.habitHistHeader}>
                      <Text style={s.habitHistEmoji}>{h.emoji || '⭐'}</Text>
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

                    {/* ── Semana: 7-day bar chart ── */}
                    {archiveRange === 'week' && (
                      <Svg width={HABIT_BAR_W} height={HABIT_BAR_H + 20}>
                        {last7Days.map((d, i) => {
                          const ds = getDateStr(d);
                          const isDone = history[ds]?.[h.id] ?? false;
                          const bW = Math.floor((HABIT_BAR_W / 7) * 0.55);
                          const bX = i * (HABIT_BAR_W / 7) + (HABIT_BAR_W / 7 - bW) / 2;
                          return (
                            <React.Fragment key={i}>
                              <Rect x={bX} y={0} width={bW} height={HABIT_BAR_H} rx={6} fill={theme.surface2} />
                              {isDone && (
                                <Rect x={bX} y={0} width={bW} height={HABIT_BAR_H} rx={6} fill="#A855F7" />
                              )}
                              <SvgText x={bX + bW / 2} y={HABIT_BAR_H + 16} fontSize={10} fill={theme.textSecondary} textAnchor="middle">
                                {weekDayShort[i]}
                              </SvgText>
                            </React.Fragment>
                          );
                        })}
                      </Svg>
                    )}

                    {/* ── Mes: GitHub-style month calendar ── */}
                    {archiveRange === 'month' && (
                      <Svg width={HABIT_BAR_W} height={20 + archiveMonthRows * (MONTH_CELL + MONTH_GAP)}>
                        {/* Day-of-week headers */}
                        {weekDayShort.map((label, col) => (
                          <SvgText
                            key={col}
                            x={col * (MONTH_CELL + MONTH_GAP) + MONTH_CELL / 2}
                            y={13}
                            fontSize={10}
                            fill={theme.textSecondary}
                            textAnchor="middle"
                          >
                            {label}
                          </SvgText>
                        ))}
                        {/* Day cells */}
                        {archiveMonthDays.map((day, dayIdx) => {
                          const cellIdx = dayIdx + archiveMonthStartWd;
                          const col = cellIdx % 7;
                          const row = Math.floor(cellIdx / 7);
                          const ds = getDateStr(day);
                          const isDone = history[ds]?.[h.id] ?? false;
                          const future = isAfter(day, today);
                          return (
                            <Rect
                              key={dayIdx}
                              x={col * (MONTH_CELL + MONTH_GAP)}
                              y={20 + row * (MONTH_CELL + MONTH_GAP)}
                              width={MONTH_CELL}
                              height={MONTH_CELL}
                              rx={6}
                              fill={isDone ? '#A855F7' : theme.surface2}
                              fillOpacity={future ? 0.3 : 1}
                            />
                          );
                        })}
                      </Svg>
                    )}

                    {/* ── Año: compact heatmap ── */}
                    {archiveRange === 'year' && (
                      <Svg width={HABIT_BAR_W} height={archiveYearRows * (YEAR_CELL + YEAR_GAP)}>
                        {archiveYearDays.map((day, i) => {
                          const col = i % YEAR_COLS;
                          const row = Math.floor(i / YEAR_COLS);
                          const ds = getDateStr(day);
                          const isDone = history[ds]?.[h.id] ?? false;
                          const future = isAfter(day, today);
                          return (
                            <Rect
                              key={i}
                              x={col * (YEAR_CELL + YEAR_GAP)}
                              y={row * (YEAR_CELL + YEAR_GAP)}
                              width={YEAR_CELL}
                              height={YEAR_CELL}
                              rx={2}
                              fill={future ? theme.surface2 : (isDone ? '#A855F7' : theme.surface2)}
                              fillOpacity={future ? 0.25 : (isDone ? 1 : 0.6)}
                            />
                          );
                        })}
                      </Svg>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── AÑO (New YearTab view) ── */}
        {view === 'year' && <YearTab />}

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
      marginTop: Spacing.xl,
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
    empty: { textAlign: 'center', padding: Spacing.xl, fontSize: 14 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, fontWeight: '500' },
    trendBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    trendBadgeText: { fontSize: 14, fontWeight: '800' },
    insightsCard: {
      borderRadius: Radius.xl,
      borderWidth: 1,
      padding: Spacing.lg,
      marginTop: Spacing.md,
      marginHorizontal: Spacing.lg,
    },
    insightsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: Spacing.md,
    },
    insightsEmoji: { fontSize: 22 },
    insightsTitle: { fontSize: 16, fontWeight: '700' },
    insightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    insightIcon: { fontSize: 15, width: 20, textAlign: 'center', marginTop: 1 },
    insightText: { flex: 1, fontSize: 13, lineHeight: 19 },
  });
