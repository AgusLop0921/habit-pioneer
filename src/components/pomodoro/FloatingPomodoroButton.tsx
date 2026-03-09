/**
 * FloatingPomodoroButton.tsx
 * Global FAB (Floating Action Button) for the Pomodoro Timer.
 * Renders a floating circle with an animated SVG progress ring.
 * Shows a breathe/pulse animation while the timer is running.
 */
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { usePomodoroStore, POMODORO_COLORS } from '@/store/pomodoroStore';

const SIZE = 60;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function FloatingPomodoroButton() {
    const {
        status,
        currentMode,
        secondsRemaining,
        settings,
        openModal,
        getModeDurationSeconds,
    } = usePomodoroStore();

    const isRunning = status === 'running';
    const isActive = status === 'running' || status === 'paused';
    const accentColor = POMODORO_COLORS[currentMode];

    // ── Animated progress ring ─────────────────────────────────────
    const totalSeconds = getModeDurationSeconds(currentMode);
    const progressRatio = isActive ? 1 - secondsRemaining / totalSeconds : 0;

    const animatedProgress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: progressRatio,
            duration: 600,
            useNativeDriver: false,
        }).start();
    }, [progressRatio]);

    const strokeDashoffset = animatedProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [CIRCUMFERENCE, 0],
    });

    // ── Breathe animation while running ───────────────────────────
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isRunning) {
            const breathe = Animated.loop(
                Animated.sequence([
                    Animated.timing(scale, {
                        toValue: 1.06,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scale, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
            );
            breathe.start();
            return () => breathe.stop();
        } else {
            Animated.timing(scale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [isRunning]);

    return (
        <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
            <Pressable
                onPress={openModal}
                style={[styles.button, { backgroundColor: accentColor }]}
            >
                {/* SVG ring */}
                <Svg
                    width={SIZE}
                    height={SIZE}
                    style={StyleSheet.absoluteFill}
                >
                    {/* Track */}
                    <Circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth={STROKE}
                        fill="none"
                    />
                    {/* Progress */}
                    <AnimatedCircle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        stroke="rgba(255,255,255,0.9)"
                        strokeWidth={STROKE}
                        fill="none"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        rotation="-90"
                        origin={`${SIZE / 2}, ${SIZE / 2}`}
                    />
                </Svg>

                {/* Inner content */}
                <View style={styles.inner}>
                    {isActive ? (
                        <Text style={styles.timeText}>{formatTime(secondsRemaining)}</Text>
                    ) : (
                        <Ionicons name="timer-outline" size={24} color="#fff" />
                    )}
                </View>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 105,
        right: 20,
        zIndex: 999,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    button: {
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        letterSpacing: -0.5,
    },
});
