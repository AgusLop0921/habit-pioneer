import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import * as SplashScreenExpo from 'expo-splash-screen';

interface Props { onFinish: () => void; }

SplashScreenExpo.preventAutoHideAsync();

const ACCENT = '#7c5cfc';
// ✅ icon.png de assets/
const APP_ICON = require('../../assets/icon.png');

export default function AppSplashScreen({ onFinish }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const opacity  = useRef(new Animated.Value(1)).current;
  const scale    = useRef(new Animated.Value(1)).current;
  const pulse    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    SplashScreenExpo.hideAsync();

    // Pulso suave del ícono
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Barra de carga
    Animated.timing(progress, { toValue: 1, duration: 1600, useNativeDriver: false }).start();

    // Salida
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(scale,   { toValue: 1.05, duration: 400, useNativeDriver: true }),
      ]).start(() => onFinish());
    }, 1900);

    return () => clearTimeout(t);
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[s.container, { opacity, transform: [{ scale }] }]}>
      {/* ✅ icon.png con animación de pulse */}
      <Animated.Image
        source={APP_ICON}
        style={[s.icon, { transform: [{ scale: pulse }] }]}
        resizeMode="contain"
      />
      <Text style={s.title}>Habits Pioneer</Text>
      <View style={s.barTrack}>
        <Animated.View style={[s.barFill, { width: barWidth }]} />
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center', gap: 20,
  },
  // ✅ Tamaño de ícono apropiado para splash + sombra del color acento
  icon: {
    width: 100, height: 100,
    borderRadius: 26,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  barTrack: {
    width: 120, height: 3,
    backgroundColor: '#222', borderRadius: 99,
    overflow: 'hidden', marginTop: 8,
  },
  barFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 99 },
});
