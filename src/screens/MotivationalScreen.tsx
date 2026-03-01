import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { Spacing } from '@/theme';

interface Quote {
  text: string;
  author: string;
}
interface Props {
  onContinue: () => void;
}

export default function MotivationalScreen({ onContinue }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const quotes: Quote[] = t('quotes', { returnObjects: true }) as Quote[];
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
    const timer = setTimeout(() => handleContinue(), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    Animated.timing(screenOpacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(() =>
      onContinue()
    );
  };

  return (
    <Animated.View
      style={[styles.container, { opacity: screenOpacity, backgroundColor: theme.bg }]}
    >
      <Pressable style={styles.inner} onPress={handleContinue}>
        <Animated.Text style={[styles.emoji, { transform: [{ translateY: floatAnim }] }]}>
          ✨
        </Animated.Text>
        <View style={[styles.line, { backgroundColor: theme.orange }]} />
        <Animated.Text
          style={[styles.quote, { color: theme.text, opacity, transform: [{ translateY }] }]}
        >
          "{quote.text}"
        </Animated.Text>
        <Animated.Text style={[styles.author, { color: theme.orange, opacity }]}>
          — {quote.author}
        </Animated.Text>
        <Text style={[styles.tap, { color: theme.textMuted }]}>{t('tapToContinue')}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emoji: { fontSize: 52, marginBottom: Spacing.xl },
  line: { width: 40, height: 3, borderRadius: 99, marginBottom: Spacing.lg },
  quote: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  author: {
    fontSize: 13,
    marginTop: Spacing.lg,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tap: {
    position: 'absolute',
    bottom: 56,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
