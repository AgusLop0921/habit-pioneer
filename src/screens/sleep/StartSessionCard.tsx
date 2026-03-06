/**
 * Card que aparece en el hub de sueño para iniciar la sesión guiada.
 * Cambia de color según la hora.
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';

const INDIGO = '#6366f1';

function getCardPalette(hour: number) {
  if (hour >= 17 && hour < 20)
    return { bg: '#2d1200', border: '#7c2d1260', accent: '#fb923c', sub: '#fdba74' };
  if (hour >= 20 && hour < 22)
    return { bg: '#0f1e3d', border: '#1e3a5f60', accent: '#60a5fa', sub: '#93c5fd' };
  if (hour >= 22 || hour < 5)
    return { bg: '#0e0e1e', border: '#2e106560', accent: '#a78bfa', sub: '#c4b5fd' };
  return { bg: '#1a1a3e', border: '#31287160', accent: INDIGO, sub: '#a5b4fc' };
}

export default function StartSessionCard({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const hour = new Date().getHours();
  const palette = getCardPalette(hour);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const greeting =
    hour >= 21 || hour < 3
      ? t('sleep.sessionCard.greetingNight')
      : hour >= 17
        ? t('sleep.sessionCard.greetingEvening')
        : t('sleep.sessionCard.greetingDay');

  return (
    <Pressable
      style={({ pressed }) => [
        s.card,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: pressed ? 0.88 : 1 },
      ]}
      onPress={onPress}
    >
      {/* Luna pulsante */}
      <Animated.View style={[s.moonWrap, { transform: [{ scale: pulse }] }]}>
        <Text style={s.moonEmoji}>🌙</Text>
      </Animated.View>

      <View style={s.textWrap}>
        <Text style={[s.greeting, { color: palette.sub }]}>{greeting}</Text>
        <Text style={[s.title, { color: '#fff' }]}>{t('sleep.sessionCard.startTitle')}</Text>
        <Text style={[s.sub, { color: palette.sub }]}>{t('sleep.sessionCard.startSubtitle')}</Text>
      </View>

      <View style={[s.arrow, { backgroundColor: `${palette.accent}20` }]}>
        <Text style={[s.arrowChar, { color: palette.accent }]}>→</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    marginBottom: 16,
  },
  moonWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  moonEmoji: { fontSize: 38 },
  textWrap: { flex: 1, gap: 3 },
  greeting: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, lineHeight: 24 },
  sub: { fontSize: 12, marginTop: 2 },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowChar: { fontSize: 18, fontWeight: '700' },
});
