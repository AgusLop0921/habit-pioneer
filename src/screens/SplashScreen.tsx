import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as SplashScreenExpo from 'expo-splash-screen';

interface Props {
  onFinish: () => void;
}

SplashScreenExpo.preventAutoHideAsync();

const ACCENT = '#7c5cfc';
const BG_COLOR = '#0d0d0d'; // Corregido para machear el native splash
const APP_ICON = require('../../assets/icon.png');

export default function AppSplashScreen({ onFinish }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current; // Opacidad para texto/barra
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Esperamos un instante a que React pinte el primer frame antes de ocultar el nativo
    const timer = setTimeout(async () => {
      await SplashScreenExpo.hideAsync();

      // Iniciamos las animaciones una vez que el nativo se fue
      Animated.parallel([
        // Pulso del ícono
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
          ])
        ),
        // Aparece el texto y la barra de carga
        Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        // Progreso de la barra
        Animated.timing(progress, { toValue: 1, duration: 2000, useNativeDriver: false }),
      ]).start();

      // Salida general
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(containerOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        ]).start(() => onFinish());
      }, 2400);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[s.container, { opacity: containerOpacity, transform: [{ scale }] }]}>
      <View style={s.contentWrap}>
        <Animated.Image
          source={APP_ICON}
          style={[s.icon, { transform: [{ scale: pulse }] }]}
          resizeMode="contain"
        />

        <Animated.View style={{ opacity: contentOpacity, alignItems: 'center', marginTop: 24, gap: 16 }}>
          <Text style={s.title}>Habits Pioneer</Text>
          <View style={s.barTrack}>
            <Animated.View style={[s.barFill, { width: barWidth }]} />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    // IMPORTANTE: El ícono debe estar centrado exactamente igual que en el splash nativo
    // En iOS/Android el splash nativo suele centrar la imagen en la pantalla.
  },
  icon: {
    width: 120, // Igualamos al imageWidth de app.json
    height: 120,
    borderRadius: 28,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  barTrack: {
    width: 140,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 99 },
});
