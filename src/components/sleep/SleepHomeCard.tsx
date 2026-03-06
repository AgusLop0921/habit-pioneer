import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSleepStore } from '../../store/sleepStore';
import { useTheme } from '../../context/ThemeContext';
import Icon from '../common/Icon';
import { Spacing, Radius } from '../../theme';

const INDIGO = '#6366f1';
const subDaysStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

export default function SleepHomeCard({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { isEnrolled, logs, getWeekAvg } = useSleepStore();
  if (!isEnrolled) return null;

  const yestLog = logs[subDaysStr(1)];
  const weekAvg = getWeekAvg(0);

  return (
    <Pressable
      style={[s.card, { backgroundColor: `${INDIGO}0d`, borderColor: `${INDIGO}28` }]}
      onPress={onPress}
    >
      <View style={[s.iconWrap, { backgroundColor: `${INDIGO}20` }]}>
        <Icon name="moon" size={22} color={INDIGO} />
      </View>
      <View style={s.info}>
        <Text style={[s.title, { color: theme.text }]}>{t('sleep.homeCard.title')}</Text>
        {yestLog?.hoursSlept > 0 ? (
          <Text style={[s.sub, { color: theme.textSecondary }]}>
            {t('sleep.homeCard.lastNight')} {yestLog.hoursSlept}h · {'★'.repeat(yestLog.quality)}
          </Text>
        ) : (
          <Text style={[s.sub, { color: theme.textMuted }]}>{t('sleep.homeCard.noRecord')}</Text>
        )}
      </View>
      {weekAvg.hours > 0 && (
        <View style={s.avg}>
          <Text style={[s.avgNum, { color: INDIGO }]}>{weekAvg.hours}h</Text>
          <Text style={[s.avgLabel, { color: theme.textSecondary }]}>
            {t('sleep.homeCard.avg7d')}
          </Text>
        </View>
      )}
      <Icon name="chevronDown" size={14} color={theme.textMuted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, marginTop: 2 },
  avg: { alignItems: 'flex-end' },
  avgNum: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  avgLabel: { fontSize: 10 },
});
