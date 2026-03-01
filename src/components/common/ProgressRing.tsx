import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  progress: number;   // 0–100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

// Wrap Circle para poder animarlo
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ProgressRing({
  progress,
  size = 200,
  strokeWidth = 14,
  label,
}: Props) {
  const { theme } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.ringBg}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.ringStroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.percent, { color: theme.text }]}>{Math.round(progress)}</Text>
        <Text style={[styles.symbol, { color: theme.textSecondary }]}>%</Text>
        {label && <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute' },
  center: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  percent: { fontSize: 52, fontWeight: '700', letterSpacing: -2 },
  symbol: { fontSize: 24, fontWeight: '400', marginTop: 10 },
  label: { width: '100%', textAlign: 'center', fontSize: 13, marginTop: 4 },
});
