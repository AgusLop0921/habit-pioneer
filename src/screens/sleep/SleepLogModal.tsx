import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, DimensionValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSleepStore } from '../../store/sleepStore';
import { useTheme } from '../../context/ThemeContext';
import { SLEEP_CHECKLIST, CATEGORY_META } from './sleepChecklist';
import { Spacing, Radius } from '../../theme';
import type { AppTheme } from '../../theme';
import Icon from '../../components/common/Icon';
import type { IconName } from '../../components/common/Icon';

const INDIGO = '#6366f1';
const CATEGORIES = ['before', 'environment', 'behavior', 'crisis'] as const;

function calcSleepHours(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  const bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  if (wakeMin <= bedMin) wakeMin += 24 * 60;
  return Math.round(((wakeMin - bedMin) / 60) * 10) / 10;
}

function sleepColor(hours: number): string {
  if (hours >= 7 && hours <= 9) return '#22c55e'; // green – optimal
  if (hours >= 6 && hours < 7) return '#f59e0b'; // yellow – a bit short
  if (hours > 9 && hours <= 10) return '#f59e0b'; // yellow – a bit long
  return '#ef4444'; // red – too short or too long
}

function sleepLabelKey(hours: number): string {
  if (hours >= 7 && hours <= 9) return 'sleep.log.hoursOptimal';
  if (hours >= 6 && hours < 7) return 'sleep.log.hoursShort';
  if (hours > 9 && hours <= 10) return 'sleep.log.hoursLong';
  if (hours < 6) return 'sleep.log.hoursInsufficient';
  return 'sleep.log.hoursTooLong';
}

function SleepHoursCard({
  hours,
  theme,
  t,
}: {
  hours: number;
  theme: AppTheme;
  t: (key: string) => string;
}) {
  const color = sleepColor(hours);
  return (
    <View style={[shc.card, { backgroundColor: `${color}15`, borderColor: `${color}55` }]}>
      <Text style={[shc.big, { color }]}>{hours % 1 === 0 ? `${hours}h` : `${hours}h`}</Text>
      <View style={shc.right}>
        <Text style={[shc.label, { color }]}>{t(sleepLabelKey(hours))}</Text>
        <Text style={[shc.sub, { color: theme.textSecondary }]}>{t('sleep.log.hoursCalc')}</Text>
      </View>
    </View>
  );
}

const shc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  big: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  right: { flex: 1 },
  label: { fontSize: 15, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
});

function TimePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const { theme } = useTheme();
  const parts = value ? value.split(':') : ['22', '00'];
  let hh = parseInt(parts[0]),
    mm = parseInt(parts[1]);

  const adj = (field: 'h' | 'm', delta: number) => {
    if (field === 'h') hh = (hh + delta + 24) % 24;
    else mm = (mm + delta + 60) % 60;
    onChange(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  };

  return (
    <View style={tp.wrap}>
      <Text style={[tp.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[tp.box, { backgroundColor: theme.surface2, borderColor: theme.borderDim }]}>
        <View style={tp.col}>
          <Pressable onPress={() => adj('h', 1)} style={tp.arrow}>
            <Text style={[tp.arrowTxt, { color: INDIGO }]}>▲</Text>
          </Pressable>
          <Text style={[tp.digit, { color: theme.text }]}>{String(hh).padStart(2, '0')}</Text>
          <Pressable onPress={() => adj('h', -1)} style={tp.arrow}>
            <Text style={[tp.arrowTxt, { color: INDIGO }]}>▼</Text>
          </Pressable>
        </View>
        <Text style={[tp.colon, { color: theme.textSecondary }]}>:</Text>
        <View style={tp.col}>
          <Pressable onPress={() => adj('m', 5)} style={tp.arrow}>
            <Text style={[tp.arrowTxt, { color: INDIGO }]}>▲</Text>
          </Pressable>
          <Text style={[tp.digit, { color: theme.text }]}>{String(mm).padStart(2, '0')}</Text>
          <Pressable onPress={() => adj('m', -5)} style={tp.arrow}>
            <Text style={[tp.arrowTxt, { color: INDIGO }]}>▼</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const tp = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 8 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  box: {
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  col: { alignItems: 'center', gap: 4 },
  arrow: { padding: 6 },
  arrowTxt: { fontSize: 12, fontWeight: '700' },
  digit: { fontSize: 28, fontWeight: '800', letterSpacing: -1, width: 44, textAlign: 'center' },
  colon: { fontSize: 24, fontWeight: '300', paddingHorizontal: 2 },
});

export default function SleepLogModal({
  visible,
  date,
  onClose,
}: {
  visible: boolean;
  date: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { getLog, saveLog } = useSleepStore();

  const [checked, setChecked] = useState<string[]>([]);
  const [quality, setQuality] = useState(0);
  const [wakeUps, setWakeUps] = useState(0);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (visible) {
      const log = getLog(date);
      setChecked(log?.checklistDone ?? []);
      setQuality(log?.quality ?? 0);
      setWakeUps(log?.wakeUps ?? 0);
      setBedtime(log?.bedtime || '23:00');
      setWakeTime(log?.wakeTime || '07:00');
      setStep(1);
    }
  }, [visible, date, getLog]);

  const toggle = (id: string) =>
    setChecked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const computedHours = calcSleepHours(bedtime, wakeTime);

  const save = () => {
    saveLog(date, {
      checklistDone: checked,
      hoursSlept: computedHours,
      quality,
      wakeUps,
      bedtime,
      wakeTime,
    });
    onClose();
  };

  const compliance = Math.round((checked.length / SLEEP_CHECKLIST.length) * 100);
  const s = makeStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[s.modal, { backgroundColor: theme.bg }]}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: theme.borderDim }]}>
          <Pressable onPress={onClose} style={s.closeBtn}>
            <Icon name="close" size={20} color={theme.textSecondary} />
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: theme.text }]}>{t('sleep.log.title')}</Text>
            <Text style={[s.headerSub, { color: theme.textSecondary }]}>{date}</Text>
          </View>
          <View style={s.stepDots}>
            {[1, 2].map((n) => (
              <View
                key={n}
                style={[s.stepDot, { backgroundColor: n <= step ? INDIGO : theme.borderDim }]}
              />
            ))}
          </View>
        </View>

        {/* Step label */}
        <View style={[s.stepHeader, { backgroundColor: theme.surface }]}>
          <Icon name={step === 1 ? 'tasks' : 'chart'} size={15} color={INDIGO} />
          <Text style={[s.stepLabel, { color: INDIGO }]}>
            {step === 1 ? t('sleep.log.step1Label') : t('sleep.log.step2Label')}
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {step === 1 && (
            <View style={s.section}>
              {/* Barra de cumplimiento */}
              <View style={[s.compCard, { backgroundColor: `${INDIGO}10` }]}>
                <View style={s.compRow}>
                  <Text style={[s.compLabel, { color: theme.textSecondary }]}>
                    {t('sleep.log.complianceTitle')}
                  </Text>
                  <Text style={[s.compPct, { color: INDIGO }]}>{compliance}%</Text>
                </View>
                <View style={[s.bar, { backgroundColor: theme.borderDim }]}>
                  <View
                    style={[
                      s.barFill,
                      { width: `${compliance}%` as DimensionValue, backgroundColor: INDIGO },
                    ]}
                  />
                </View>
                <Text style={[s.compCount, { color: theme.textSecondary }]}>
                  {t('sleep.log.habitsCount', {
                    done: checked.length,
                    total: SLEEP_CHECKLIST.length,
                  })}
                </Text>
              </View>

              {/* Items por categoría */}
              {CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const items = SLEEP_CHECKLIST.filter((i) => i.category === cat);
                return (
                  <View key={cat} style={s.catBlock}>
                    <View style={[s.catHeader, { borderLeftColor: meta.color }]}>
                      <Icon name={meta.icon as IconName} size={13} color={meta.color} />
                      <Text style={[s.catTitle, { color: theme.textSecondary }]}>
                        {t(`sleep.checklist.categories.${cat}`)}
                      </Text>
                    </View>
                    {items.map((item) => {
                      const done = checked.includes(item.id);
                      return (
                        <Pressable
                          key={item.id}
                          style={[
                            s.item,
                            { backgroundColor: theme.surface, borderColor: theme.borderDim },
                            done && { backgroundColor: `${INDIGO}08`, borderColor: `${INDIGO}35` },
                          ]}
                          onPress={() => toggle(item.id)}
                        >
                          <View
                            style={[
                              s.circle,
                              { borderColor: done ? INDIGO : theme.border },
                              done && { backgroundColor: INDIGO },
                            ]}
                          >
                            {done && <Icon name="check" size={13} color="#fff" />}
                          </View>
                          <View style={s.itemInfo}>
                            <View style={s.itemLabelRow}>
                              {item.isKeyItem && (
                                <View style={[s.keyBadge, { backgroundColor: `${INDIGO}18` }]}>
                                  <Text style={[s.keyBadgeText, { color: INDIGO }]}>
                                    {t('sleep.log.keyBadge')}
                                  </Text>
                                </View>
                              )}
                              <Text
                                style={[
                                  s.itemLabel,
                                  { color: done ? theme.textSecondary : theme.text },
                                  done && { textDecorationLine: 'line-through' },
                                ]}
                              >
                                {t(`sleep.checklist.${item.id}.label`)}
                              </Text>
                            </View>
                            <Text style={[s.itemDesc, { color: theme.textSecondary }]}>
                              {t(`sleep.checklist.${item.id}.desc`)}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}

          {step === 2 && (
            <View style={s.section}>
              <Text style={[s.metricTitle, { color: theme.text }]}>{t('sleep.log.schedules')}</Text>
              <View style={s.timeRow}>
                <TimePicker value={bedtime} onChange={setBedtime} label={t('sleep.log.bedtime')} />
                <TimePicker
                  value={wakeTime}
                  onChange={setWakeTime}
                  label={t('sleep.log.wakeTime')}
                />
              </View>

              <Text style={[s.metricTitle, { color: theme.text }]}>
                {t('sleep.log.hoursSlept')}
              </Text>
              <SleepHoursCard hours={computedHours} theme={theme} t={t} />

              <Text style={[s.metricTitle, { color: theme.text }]}>
                {t('sleep.log.qualityTitle')}
              </Text>
              <View style={s.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setQuality(star)} style={s.starBtn}>
                    <Ionicons
                      name={star <= quality ? 'star' : 'star-outline'}
                      size={38}
                      color={star <= quality ? '#fbbf24' : theme.border}
                    />
                  </Pressable>
                ))}
              </View>
              {quality > 0 && (
                <Text style={[s.qualityHint, { color: theme.textSecondary }]}>
                  {
                    [
                      '',
                      t('sleep.log.quality1'),
                      t('sleep.log.quality2'),
                      t('sleep.log.quality3'),
                      t('sleep.log.quality4'),
                      t('sleep.log.quality5'),
                    ][quality]
                  }
                </Text>
              )}

              <Text style={[s.metricTitle, { color: theme.text }]}>
                {t('sleep.log.wakeUpsTitle')}
              </Text>
              <View style={s.chipsRow}>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    style={[
                      s.chip,
                      { backgroundColor: theme.surface2, borderColor: theme.borderDim },
                      wakeUps === n && { backgroundColor: `${INDIGO}15`, borderColor: INDIGO },
                    ]}
                    onPress={() => setWakeUps(n)}
                  >
                    <Text
                      style={[
                        s.chipText,
                        { color: wakeUps === n ? INDIGO : theme.textSecondary },
                        wakeUps === n && { fontWeight: '700' },
                      ]}
                    >
                      {n === 0
                        ? t('sleep.log.noneWakeUps')
                        : n === 5
                          ? t('sleep.log.moreThan5')
                          : String(n)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Step CTA — pinned bottom */}
        <View style={[s.stepBar, { borderTopColor: theme.borderDim }]}>
          {step === 1 ? (
            <Pressable style={[s.ctaBtn, { backgroundColor: INDIGO }]} onPress={() => setStep(2)}>
              <Text style={s.ctaBtnTxt}>{t('sleep.log.continue')}</Text>
            </Pressable>
          ) : (
            <View style={s.stepBarRow}>
              <Pressable
                style={[s.backBtn, { borderColor: theme.border }]}
                onPress={() => setStep(1)}
              >
                <Text style={[s.backBtnTxt, { color: theme.textSecondary }]}>
                  {t('sleep.log.back')}
                </Text>
              </Pressable>
              <Pressable style={[s.ctaBtn, { backgroundColor: INDIGO, flex: 1 }]} onPress={save}>
                <Text style={s.ctaBtnTxt}>{t('sleep.log.save')}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (_theme: AppTheme) =>
  StyleSheet.create({
    modal: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: 56,
      paddingBottom: 14,
      borderBottomWidth: 1,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    headerSub: { fontSize: 12, marginTop: 2 },
    stepDots: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
      width: 36,
      justifyContent: 'flex-end',
    },
    stepDot: { width: 8, height: 8, borderRadius: 4 },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: Spacing.lg,
      marginVertical: 12,
      borderRadius: Radius.lg,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    stepLabel: { fontSize: 13, fontWeight: '600' },
    stepBar: {
      paddingHorizontal: Spacing.lg,
      paddingTop: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
    },
    stepBarRow: { flexDirection: 'row', gap: 10 },
    ctaBtn: { borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center' },
    ctaBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
    backBtn: {
      borderRadius: Radius.full,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backBtnTxt: { fontWeight: '600', fontSize: 14 },
    section: { paddingHorizontal: Spacing.lg },
    compCard: { borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.lg },
    compRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    compLabel: { fontSize: 13, fontWeight: '500' },
    compPct: { fontSize: 20, fontWeight: '800' },
    bar: { height: 7, borderRadius: 99, overflow: 'hidden', marginBottom: 6 },
    barFill: { height: '100%', borderRadius: 99 },
    compCount: { fontSize: 12 },
    catBlock: { marginBottom: Spacing.lg },
    catHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginBottom: 10,
      borderLeftWidth: 3,
      paddingLeft: 8,
    },
    catTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      marginBottom: 8,
    },
    circle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
      flexShrink: 0,
    },
    itemInfo: { flex: 1 },
    itemLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      marginBottom: 3,
    },
    keyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 },
    keyBadgeText: { fontSize: 10, fontWeight: '700' },
    itemLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
    itemDesc: { fontSize: 12, lineHeight: 17 },
    metricTitle: {
      fontSize: 15,
      fontWeight: '700',
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    timeRow: { flexDirection: 'row', gap: 16, marginBottom: Spacing.sm },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    chip: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: Radius.full,
      borderWidth: 1.5,
    },
    chipText: { fontSize: 14 },
    starsRow: { flexDirection: 'row', gap: 6, marginBottom: 8, justifyContent: 'center' },
    starBtn: { padding: 4 },
    qualityHint: { fontSize: 14, textAlign: 'center', marginBottom: Spacing.sm },
  });
