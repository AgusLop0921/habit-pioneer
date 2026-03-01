import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  DimensionValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSleepStore } from '../../store/sleepStore';
import { useTheme } from '../../context/ThemeContext';
import { SLEEP_CHECKLIST, CATEGORY_META } from './sleepChecklist';
import { Spacing, Radius } from '../../theme';
import type { AppTheme } from '../../theme';
import Icon from '../../components/common/Icon';
import type { IconName } from '../../components/common/Icon';

const INDIGO = '#6366f1';
const CATEGORIES = ['before', 'environment', 'behavior', 'crisis'] as const;

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
  const { getLog, saveLog } = useSleepStore();

  const [checked, setChecked] = useState<string[]>([]);
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState(0);
  const [wakeUps, setWakeUps] = useState(0);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [tab, setTab] = useState<'checklist' | 'metrics'>('checklist');

  useEffect(() => {
    if (visible) {
      const log = getLog(date);
      setChecked(log?.checklistDone ?? []);
      setHours(log?.hoursSlept ? String(log.hoursSlept) : '');
      setQuality(log?.quality ?? 0);
      setWakeUps(log?.wakeUps ?? 0);
      setBedtime(log?.bedtime || '23:00');
      setWakeTime(log?.wakeTime || '07:00');
      setTab('checklist');
    }
  }, [visible, date]);

  const toggle = (id: string) =>
    setChecked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const save = () => {
    saveLog(date, {
      checklistDone: checked,
      hoursSlept: parseFloat(hours) || 0,
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
            <Text style={[s.headerTitle, { color: theme.text }]}>Registro de sueño</Text>
            <Text style={[s.headerSub, { color: theme.textSecondary }]}>{date}</Text>
          </View>
          <Pressable style={[s.saveBtn, { backgroundColor: INDIGO }]} onPress={save}>
            <Text style={s.saveBtnTxt}>Guardar</Text>
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={[s.tabs, { backgroundColor: theme.surface }]}>
          {(['checklist', 'metrics'] as const).map((t) => (
            <Pressable
              key={t}
              style={[s.tabItem, tab === t && { backgroundColor: theme.surface2 }]}
              onPress={() => setTab(t)}
            >
              <Icon
                name={t === 'checklist' ? 'tasks' : 'chart'}
                size={15}
                color={tab === t ? INDIGO : theme.textSecondary}
              />
              <Text
                style={[
                  s.tabText,
                  { color: tab === t ? INDIGO : theme.textSecondary },
                  tab === t && { fontWeight: '700' },
                ]}
              >
                {t === 'checklist' ? 'Checklist' : 'Métricas'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {tab === 'checklist' && (
            <View style={s.section}>
              {/* Barra de cumplimiento */}
              <View style={[s.compCard, { backgroundColor: `${INDIGO}10` }]}>
                <View style={s.compRow}>
                  <Text style={[s.compLabel, { color: theme.textSecondary }]}>
                    Cumplimiento de esta noche
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
                  {checked.length} de {SLEEP_CHECKLIST.length} hábitos
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
                      <Text style={[s.catTitle, { color: theme.textSecondary }]}>{meta.label}</Text>
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
                                  <Text style={[s.keyBadgeText, { color: INDIGO }]}>★ clave</Text>
                                </View>
                              )}
                              <Text
                                style={[
                                  s.itemLabel,
                                  { color: done ? theme.textSecondary : theme.text },
                                  done && { textDecorationLine: 'line-through' },
                                ]}
                              >
                                {item.label}
                              </Text>
                            </View>
                            <Text style={[s.itemDesc, { color: theme.textSecondary }]}>
                              {item.description}
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

          {tab === 'metrics' && (
            <View style={s.section}>
              <Text style={[s.metricTitle, { color: theme.text }]}>Horarios</Text>
              <View style={s.timeRow}>
                <TimePicker value={bedtime} onChange={setBedtime} label="Me acosté" />
                <TimePicker value={wakeTime} onChange={setWakeTime} label="Me levanté" />
              </View>

              <Text style={[s.metricTitle, { color: theme.text }]}>Horas dormidas</Text>
              <View style={s.chipsRow}>
                {[4, 5, 6, 7, 8, 9, 10].map((h) => (
                  <Pressable
                    key={h}
                    style={[
                      s.chip,
                      { backgroundColor: theme.surface2, borderColor: theme.borderDim },
                      hours === String(h) && {
                        backgroundColor: `${INDIGO}15`,
                        borderColor: INDIGO,
                      },
                    ]}
                    onPress={() => setHours(String(h))}
                  >
                    <Text
                      style={[
                        s.chipText,
                        { color: hours === String(h) ? INDIGO : theme.textSecondary },
                        hours === String(h) && { fontWeight: '700' },
                      ]}
                    >
                      {h}h
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={[
                  s.input,
                  {
                    backgroundColor: theme.surface2,
                    borderColor: theme.borderDim,
                    color: theme.text,
                  },
                ]}
                value={hours}
                onChangeText={setHours}
                keyboardType="decimal-pad"
                placeholder="O escribí (ej: 7.5)"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[s.metricTitle, { color: theme.text }]}>Calidad del sueño</Text>
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
                    ['', 'Muy malo 😞', 'Malo 😕', 'Regular 😐', 'Bueno 😊', 'Excelente 😄'][
                      quality
                    ]
                  }
                </Text>
              )}

              <Text style={[s.metricTitle, { color: theme.text }]}>
                ¿Cuántas veces te despertaste?
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
                      {n === 0 ? 'Ninguna' : n === 5 ? '5+' : String(n)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
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
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
    saveBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
    tabs: {
      flexDirection: 'row',
      marginHorizontal: Spacing.lg,
      marginVertical: 12,
      borderRadius: Radius.full,
      padding: 4,
    },
    tabItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: Radius.full,
    },
    tabText: { fontSize: 14 },
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
    input: {
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.md,
      fontSize: 14,
      marginBottom: Spacing.sm,
    },
    starsRow: { flexDirection: 'row', gap: 6, marginBottom: 8, justifyContent: 'center' },
    starBtn: { padding: 4 },
    qualityHint: { fontSize: 14, textAlign: 'center', marginBottom: Spacing.sm },
  });
