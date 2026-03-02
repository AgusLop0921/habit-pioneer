/**
 * SleepSession — Modo guiado nocturno
 *
 * Flujo de 5 pasos:
 *  0 → intro / activación
 *  1 → time picker: hora de levantarse
 *  2 → timeline calculada
 *  3 → checklist interactivo (1 ítem por vez)
 *  4 → buenas noches
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Line, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useSleepStore } from '../../store/sleepStore';
import { SLEEP_CHECKLIST } from './sleepChecklist';

const { width: W, height: SCREEN_H } = Dimensions.get('window');

// ─── Paleta que cambia según la hora del día ──────────────
function getPalette(hour: number) {
  if (hour >= 5 && hour < 17)
    return {
      // día
      bg: '#0d0d1f',
      grad1: '#1a1a3e',
      grad2: '#0d0d1f',
      accent: '#818cf8',
      dim: '#312e81',
      text: '#e0e7ff',
      sub: '#a5b4fc',
      muted: '#4338ca',
    };
  if (hour >= 17 && hour < 20)
    return {
      // atardecer
      bg: '#110808',
      grad1: '#2d1200',
      grad2: '#110808',
      accent: '#fb923c',
      dim: '#7c2d12',
      text: '#ffedd5',
      sub: '#fdba74',
      muted: '#9a3412',
    };
  if (hour >= 20 && hour < 22)
    return {
      // noche temprana
      bg: '#080d1a',
      grad1: '#0f1e3d',
      grad2: '#080d1a',
      accent: '#60a5fa',
      dim: '#1e3a5f',
      text: '#dbeafe',
      sub: '#93c5fd',
      muted: '#1d4ed8',
    };
  return {
    // medianoche
    bg: '#050509',
    grad1: '#0e0e1e',
    grad2: '#050509',
    accent: '#a78bfa',
    dim: '#2e1065',
    text: '#ede9fe',
    sub: '#c4b5fd',
    muted: '#4c1d95',
  };
}

// ─── Estrellas de fondo ───────────────────────────────────
const STARS = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 137.5) % W,
  y: (i * 97.3) % SCREEN_H,
  r: 0.8 + (i % 4) * 0.5,
  o: 0.15 + (i % 5) * 0.08,
  d: 2000 + (i % 6) * 500,
}));

// ─── Ilustraciones SVG ────────────────────────────────────
function MoonSVG({ color, size = 120 }: { color: string; size?: number }) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 120 120">
      <Defs>
        <RadialGradient id="mg" cx="40%" cy="40%" r="60%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={60} cy={60} r={52} fill="url(#mg)" />
      <Path
        d="M65 18 C42 23 28 45 33 68 C38 92 60 105 82 99 C63 94 50 78 47 59 C44 40 53 22 65 18 Z"
        fill={color}
        opacity={0.9}
      />
      {[
        [22, 28],
        [98, 35],
        [16, 88],
        [102, 90],
        [60, 108],
      ].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={2 + i * 0.3} fill={color} opacity={0.3 + i * 0.06} />
      ))}
    </Svg>
  );
}

function AlarmSVG({ color, size = 100 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="ag" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={50} cy={52} r={42} fill="url(#ag)" />
      <Circle cx={50} cy={52} r={34} fill={color} opacity={0.15} stroke={color} strokeWidth={2.5} />
      <Circle cx={50} cy={52} r={28} fill="none" stroke={color} strokeWidth={1} opacity={0.3} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180,
          r1 = 24,
          r2 = 28 + (i % 3 === 0 ? 3 : 0);
        return (
          <Line
            key={i}
            x1={50 + r1 * Math.cos(a)}
            y1={52 + r1 * Math.sin(a)}
            x2={50 + r2 * Math.cos(a)}
            y2={52 + r2 * Math.sin(a)}
            stroke={color}
            strokeWidth={i % 3 === 0 ? 2.5 : 1.5}
            opacity={0.6}
          />
        );
      })}
      <Path
        d="M50 52 L50 30"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.9}
      />
      <Path d="M50 52 L64 56" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.9} />
      <Circle cx={50} cy={52} r={4} fill={color} opacity={0.9} />
      <Path
        d="M20 24 C16 18 18 12 24 14"
        stroke={color}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
      <Path
        d="M80 24 C84 18 82 12 76 14"
        stroke={color}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
    </Svg>
  );
}

function _TimelineSVG({ color, steps }: { color: string; steps: TimelineStep[] }) {
  const itemH = 56;
  const h = steps.length * itemH + 20;
  return (
    <Svg width={W - 48} height={h} viewBox={`0 0 ${W - 48} ${h}`}>
      {steps.map((step, i) => {
        const y = 20 + i * itemH;
        const isLast = i === steps.length - 1;
        return (
          <G key={i}>
            {!isLast && (
              <Line
                x1={24}
                y1={y + 12}
                x2={24}
                y2={y + itemH}
                stroke={color}
                strokeWidth={1.5}
                opacity={0.3}
                strokeDasharray="4 4"
              />
            )}
            <Circle
              cx={24}
              cy={y}
              r={10}
              fill={color}
              opacity={step.done ? 0.9 : 0.2}
              stroke={color}
              strokeWidth={step.done ? 0 : 1.5}
            />
            {step.done && (
              <Path
                d={`M19 ${y} L23 ${y + 4} L30 ${y - 4}`}
                stroke="#000"
                strokeWidth={2.2}
                fill="none"
                strokeLinecap="round"
              />
            )}
          </G>
        );
      })}
    </Svg>
  );
}

function _CheckSVG({ color, size = 80 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Circle cx={40} cy={40} r={36} fill={color} opacity={0.15} stroke={color} strokeWidth={2} />
      <Path
        d="M24 40 L34 52 L56 28"
        stroke={color}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Tipos ────────────────────────────────────────────────
interface TimelineStep {
  time: string;
  label: string;
  sublabel: string;
  icon: string;
  done: boolean;
}

// ─── Utils de tiempo ──────────────────────────────────────
function _addMinutes(h: number, m: number, mins: number): [number, number] {
  const total = h * 60 + m + mins;
  return [Math.floor(total / 60) % 24, total % 60];
}
function subMinutes(h: number, m: number, mins: number): [number, number] {
  let total = h * 60 + m - mins;
  if (total < 0) total += 24 * 60;
  return [Math.floor(total / 60), total % 60];
}
function fmt(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── STEP 0: Intro ────────────────────────────────────────
function StepIntro({
  palette,
  onStart: _onStart,
}: {
  palette: ReturnType<typeof getPalette>;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -12, duration: 2200, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeIn, floatY]);

  return (
    <Animated.View style={[ss.stepWrap, { opacity: fadeIn }]}>
      <Animated.View style={{ transform: [{ translateY: floatY }] }}>
        <MoonSVG color={palette.accent} size={140} />
      </Animated.View>

      <View
        style={[
          ss.tagPill,
          { backgroundColor: `${palette.accent}18`, borderColor: `${palette.accent}30` },
        ]}
      >
        <Text style={[ss.tagText, { color: palette.accent }]}>{t('sleep.session.modeTag')}</Text>
      </View>

      <Text style={[ss.stepTitle, { color: palette.text }]}>{t('sleep.session.introTitle')}</Text>
      <Text style={[ss.stepBody, { color: palette.sub }]}>{t('sleep.session.introBody')}</Text>
    </Animated.View>
  );
}

// ─── STEP 1: Time Picker ──────────────────────────────────
function StepTimePicker({
  palette,
  wakeH,
  wakeM,
  onChangeH,
  onChangeM,
  onNext: _onNext,
}: {
  palette: ReturnType<typeof getPalette>;
  wakeH: number;
  wakeM: number;
  onChangeH: (h: number) => void;
  onChangeM: (m: number) => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleIn, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, [fadeIn, scaleIn]);

  const adjH = (d: number) => onChangeH((wakeH + d + 24) % 24);
  const adjM = (d: number) => onChangeM((wakeM + d + 60) % 60);

  return (
    <Animated.View style={[ss.stepWrap, { opacity: fadeIn, transform: [{ scale: scaleIn }] }]}>
      <AlarmSVG color={palette.accent} size={80} />

      <View
        style={[
          ss.tagPill,
          { backgroundColor: `${palette.accent}18`, borderColor: `${palette.accent}30` },
        ]}
      >
        <Text style={[ss.tagText, { color: palette.accent }]}>{t('sleep.session.step1Tag')}</Text>
      </View>

      <Text style={[ss.stepTitle, { color: palette.text }]}>{t('sleep.session.step1Title')}</Text>
      <Text style={[ss.stepBody, { color: palette.sub }]}>{t('sleep.session.step1Body')}</Text>

      {/* Time picker */}
      <View
        style={[
          ss.pickerCard,
          { backgroundColor: `${palette.accent}10`, borderColor: `${palette.accent}20` },
        ]}
      >
        {/* Horas */}
        <View style={ss.pickerCol}>
          <Pressable onPress={() => adjH(1)} style={ss.pickerArrow}>
            <Text style={[ss.arrowChar, { color: palette.accent }]}>▲</Text>
          </Pressable>
          <Text style={[ss.pickerDigit, { color: palette.text }]}>
            {String(wakeH).padStart(2, '0')}
          </Text>
          <Pressable onPress={() => adjH(-1)} style={ss.pickerArrow}>
            <Text style={[ss.arrowChar, { color: palette.accent }]}>▼</Text>
          </Pressable>
          <Text style={[ss.pickerUnit, { color: palette.muted }]}>{t('sleep.session.hours')}</Text>
        </View>

        <Text style={[ss.pickerColon, { color: palette.sub }]}>:</Text>

        {/* Minutos */}
        <View style={ss.pickerCol}>
          <Pressable onPress={() => adjM(15)} style={ss.pickerArrow}>
            <Text style={[ss.arrowChar, { color: palette.accent }]}>▲</Text>
          </Pressable>
          <Text style={[ss.pickerDigit, { color: palette.text }]}>
            {String(wakeM).padStart(2, '0')}
          </Text>
          <Pressable onPress={() => adjM(-15)} style={ss.pickerArrow}>
            <Text style={[ss.arrowChar, { color: palette.accent }]}>▼</Text>
          </Pressable>
          <Text style={[ss.pickerUnit, { color: palette.muted }]}>
            {t('sleep.session.minutes')}
          </Text>
        </View>
      </View>

      {/* Sugerencias rápidas */}
      <View style={ss.quickRow}>
        {[
          [6, 0],
          [6, 30],
          [7, 0],
          [7, 30],
          [8, 0],
        ].map(([h, m]) => {
          const active = wakeH === h && wakeM === m;
          return (
            <Pressable
              key={`${h}${m}`}
              style={[
                ss.quickChip,
                {
                  borderColor: active ? palette.accent : `${palette.accent}25`,
                  backgroundColor: active ? `${palette.accent}20` : 'transparent',
                },
              ]}
              onPress={() => {
                onChangeH(h);
                onChangeM(m);
              }}
            >
              <Text style={[ss.quickChipText, { color: active ? palette.accent : palette.sub }]}>
                {fmt(h, m)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ─── STEP 2: Timeline ─────────────────────────────────────
function StepTimeline({
  palette,
  steps,
  onNext: _onNext,
}: {
  palette: ReturnType<typeof getPalette>;
  steps: TimelineStep[];
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(steps.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.stagger(
      120,
      itemAnims.map((a) =>
        Animated.spring(a, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true })
      )
    ).start();
  }, [fadeIn, itemAnims]);

  return (
    <Animated.View style={[ss.stepWrap, { opacity: fadeIn }]}>
      <View
        style={[
          ss.tagPill,
          { backgroundColor: `${palette.accent}18`, borderColor: `${palette.accent}30` },
        ]}
      >
        <Text style={[ss.tagText, { color: palette.accent }]}>{t('sleep.session.step2Tag')}</Text>
      </View>

      <Text style={[ss.stepTitle, { color: palette.text }]}>{t('sleep.session.step2Title')}</Text>
      <Text style={[ss.stepBody, { color: palette.sub }]}>{t('sleep.session.step2Body')}</Text>

      {/* Cards de timeline */}
      <View style={ss.timelineCards}>
        {steps.map((step, i) => (
          <Animated.View
            key={i}
            style={[
              ss.tlCard,
              {
                backgroundColor: `${palette.accent}0d`,
                borderColor: `${palette.accent}22`,
                opacity: itemAnims[i],
                transform: [
                  {
                    translateY: itemAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[ss.tlCardLeft, { backgroundColor: `${palette.accent}18` }]}>
              <Text style={ss.tlCardIcon}>{step.icon}</Text>
              <Text style={[ss.tlCardTime, { color: palette.accent }]}>{step.time}</Text>
            </View>
            <View style={ss.tlCardRight}>
              <Text style={[ss.tlCardLabel, { color: palette.text }]}>{step.label}</Text>
              <Text style={[ss.tlCardSub, { color: palette.sub }]}>{step.sublabel}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <View
        style={[
          ss.scienceNote,
          { backgroundColor: `${palette.accent}08`, borderColor: `${palette.accent}18` },
        ]}
      >
        <Text style={[ss.scienceNoteText, { color: palette.sub }]}>
          {t('sleep.session.scienceNote')}
        </Text>
      </View>
    </Animated.View>
  );
}

// ─── STEP 3: Checklist interactivo ────────────────────────
// Muestra UN ítem por vez, muy calmo
function StepChecklist({
  palette,
  onDone,
  onActionsUpdate,
}: {
  palette: ReturnType<typeof getPalette>;
  onDone: (doneIds: string[]) => void;
  onActionsUpdate: (
    check: () => void,
    skip: () => void,
    isLast: boolean,
    idx: number,
    total: number
  ) => void;
}) {
  const { t } = useTranslation();
  // Solo los ítems "clave" para no abrumar (los ** del doc original)
  const KEY_ITEMS = SLEEP_CHECKLIST.filter((i) => i.isKeyItem);

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);

  const fadeIn = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const scaleBtn = useRef(new Animated.Value(1)).current;

  const animateNext = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideX, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideX.setValue(30);
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(slideX, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleCheck = (id: string) => {
    // Micro bounce en el botón
    Animated.sequence([
      Animated.timing(scaleBtn, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleBtn, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
    ]).start();

    const newDone = [...done, id];
    setDone(newDone);
    if (idx < KEY_ITEMS.length - 1) {
      animateNext(() => setIdx((i) => i + 1));
    } else {
      onDone(newDone);
    }
  };

  const handleSkip = (id: string) => {
    setSkipped((s) => [...s, id]);
    if (idx < KEY_ITEMS.length - 1) {
      animateNext(() => setIdx((i) => i + 1));
    } else {
      onDone(done);
    }
  };

  const item = KEY_ITEMS[idx];

  // Notify parent of current check/skip handlers whenever idx changes
  useEffect(() => {
    onActionsUpdate(
      () => handleCheck(item.id),
      () => handleSkip(item.id),
      idx === KEY_ITEMS.length - 1,
      idx,
      KEY_ITEMS.length
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const CATEGORY_COLORS: Record<string, string> = {
    before: '#818cf8',
    environment: '#38bdf8',
    behavior: '#34d399',
    crisis: '#f59e0b',
  };
  const itemColor = CATEGORY_COLORS[item.category] || palette.accent;

  return (
    <View style={[ss.stepWrap, { justifyContent: 'center', paddingTop: 0 }]}>
      {/* Animated card only — progress+tag live in the root above ScrollView */}
      <Animated.View
        style={[
          ss.clCard,
          {
            backgroundColor: `${itemColor}0d`,
            borderColor: `${itemColor}25`,
            opacity: fadeIn,
            transform: [{ translateX: slideX }],
          },
        ]}
      >
        <View style={[ss.clIconWrap, { backgroundColor: `${itemColor}18` }]}>
          <Text style={ss.clIcon}>
            {item.category === 'before'
              ? '🌙'
              : item.category === 'environment'
                ? '🏠'
                : item.category === 'behavior'
                  ? '🔄'
                  : '⚡'}
          </Text>
        </View>
        <Text style={[ss.clLabel, { color: palette.text }]}>
          {t(`sleep.checklist.${item.id}.label`)}
        </Text>
        <Text style={[ss.clDesc, { color: palette.sub }]}>
          {t(`sleep.checklist.${item.id}.desc`)}
        </Text>
      </Animated.View>

      {/* Done dots */}
      {done.length > 0 && (
        <View style={ss.clDoneRow}>
          {done.map((id) => (
            <View key={id} style={[ss.clDoneDot, { backgroundColor: palette.accent }]} />
          ))}
          {skipped.map((id) => (
            <View key={id} style={[ss.clDoneDot, { backgroundColor: `${palette.accent}30` }]} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── STEP 4: Buenas noches ────────────────────────────────
function StepGoodnight({
  palette,
  checkedCount,
  totalCount,
  wakeTime,
  onClose: _onClose,
}: {
  palette: ReturnType<typeof getPalette>;
  checkedCount: number;
  totalCount: number;
  wakeTime: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.8)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleIn, { toValue: 1, tension: 45, friction: 8, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeIn, scaleIn, floatY]);

  const pct = Math.round((checkedCount / totalCount) * 100);
  const msg =
    pct === 100
      ? t('sleep.session.msgPerfect')
      : pct >= 60
        ? t('sleep.session.msgGood')
        : t('sleep.session.msgOk');

  // Estrellas que parpadean suavemente en este step
  const starAnims = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(Math.random() * 0.5 + 0.2))
  ).current;

  useEffect(() => {
    starAnims.forEach((a, i) => {
      const loop = () => {
        Animated.sequence([
          Animated.timing(a, { toValue: 0.9, duration: 800 + i * 300, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.2, duration: 1200 + i * 200, useNativeDriver: true }),
        ]).start(loop);
      };
      setTimeout(loop, i * 400);
    });
  }, [starAnims]);

  const STAR_POS = [
    [30, 60],
    [W - 50, 80],
    [W - 30, 200],
    [20, 250],
    [W / 2, 30],
    [W - 60, 300],
  ];

  return (
    <Animated.View style={[ss.stepWrap, { opacity: fadeIn }]}>
      {/* Estrellas animadas */}
      {STAR_POS.map(([x, y], i) => (
        <Animated.View
          key={i}
          style={[ss.gnStar, { left: x - 20, top: y - 20, opacity: starAnims[i] }]}
        >
          <Text style={{ fontSize: 10 + (i % 3) * 4, color: palette.accent }}>★</Text>
        </Animated.View>
      ))}

      <Animated.View style={{ transform: [{ scale: scaleIn }, { translateY: floatY }] }}>
        <MoonSVG color={palette.accent} size={130} />
      </Animated.View>

      <Text style={[ss.gnTitle, { color: palette.text }]}>{t('sleep.session.goodnightTitle')}</Text>

      {/* Stat de compliance */}
      <View
        style={[
          ss.gnStat,
          { backgroundColor: `${palette.accent}12`, borderColor: `${palette.accent}22` },
        ]}
      >
        <Text style={[ss.gnStatNum, { color: palette.accent }]}>
          {checkedCount}/{totalCount}
        </Text>
        <Text style={[ss.gnStatLabel, { color: palette.sub }]}>
          {t('sleep.session.habitsCompleted')}
        </Text>
        <View style={[ss.gnBar, { backgroundColor: `${palette.accent}20` }]}>
          <View
            style={[
              ss.gnBarFill,
              { width: `${pct}%` as `${number}%`, backgroundColor: palette.accent },
            ]}
          />
        </View>
      </View>

      <Text style={[ss.gnMsg, { color: palette.sub }]}>{msg}</Text>

      <View style={[ss.gnWakeRow, { borderColor: `${palette.accent}20` }]}>
        <Text style={[ss.gnWakeLabel, { color: palette.muted }]}>
          {t('sleep.session.wakeUpLabel')}
        </Text>
        <Text style={[ss.gnWakeTime, { color: palette.text }]}>{wakeTime}</Text>
      </View>
    </Animated.View>
  );
}

// ─── COMPONENTE RAÍZ ──────────────────────────────────────
export default function SleepSession({ onClose }: { onClose: () => void }) {
  const { saveLog } = useSleepStore();
  const { t } = useTranslation();
  const hour = new Date().getHours();
  const palette = getPalette(hour);
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [wakeH, setWakeH] = useState(7);
  const [wakeM, setWakeM] = useState(0);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [clActions, setClActions] = useState<{
    check: () => void;
    skip: () => void;
    isLast: boolean;
    idx: number;
    total: number;
  }>({ check: () => {}, skip: () => {}, isLast: false, idx: 0, total: 1 });

  // Fade de fondo entre steps
  const bgFade = useRef(new Animated.Value(1)).current;

  const goStep = useCallback(
    (next: number) => {
      Animated.timing(bgFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setStep(next);
        Animated.timing(bgFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    },
    [bgFade]
  );

  // Calcular timeline basada en la hora de levantarse
  const calcTimeline = (): TimelineStep[] => {
    // Asumir 8hs de sueño objetivo → hora de dormirse
    const [sleepH, sleepM] = subMinutes(wakeH, wakeM, 8 * 60);
    const [windH, windM] = subMinutes(sleepH, sleepM, 30);
    const [dimH, dimM] = subMinutes(sleepH, sleepM, 60);
    const [celuH, celuM] = subMinutes(sleepH, sleepM, 90);

    return [
      {
        time: fmt(celuH, celuM),
        label: t('sleep.session.tl1Label'),
        sublabel: t('sleep.session.tl1Sub'),
        icon: '📵',
        done: false,
      },
      {
        time: fmt(dimH, dimM),
        label: t('sleep.session.tl2Label'),
        sublabel: t('sleep.session.tl2Sub'),
        icon: '🕯️',
        done: false,
      },
      {
        time: fmt(windH, windM),
        label: t('sleep.session.tl3Label'),
        sublabel: t('sleep.session.tl3Sub'),
        icon: '🛁',
        done: false,
      },
      {
        time: fmt(sleepH, sleepM),
        label: t('sleep.session.tl4Label'),
        sublabel: t('sleep.session.tl4Sub', { time: fmt(wakeH, wakeM) }),
        icon: '🛏️',
        done: false,
      },
    ];
  };

  const handleChecklistDone = (ids: string[]) => {
    setDoneIds(ids);
    const today = new Date().toISOString().split('T')[0];
    saveLog(today, {
      checklistDone: ids,
      wakeTime: fmt(wakeH, wakeM),
      bedtime: fmt(...subMinutes(wakeH, wakeM, 8 * 60)),
    });
    goStep(4);
  };

  const KEY_ITEMS = SLEEP_CHECKLIST.filter((i) => i.isKeyItem);

  return (
    <View style={[ss.root, { backgroundColor: palette.bg }]}>
      {/* Estrellas de fondo */}
      {STARS.map((star, i) => (
        <View
          key={i}
          style={[
            ss.star,
            {
              left: star.x,
              top: star.y,
              width: star.r * 2,
              height: star.r * 2,
              borderRadius: star.r,
              opacity: star.o,
              backgroundColor: palette.accent,
            },
          ]}
        />
      ))}

      {/* Gradiente superior sutil */}
      <View style={[ss.gradTop, { backgroundColor: palette.grad1 }]} pointerEvents="none" />

      <Animated.View style={[ss.inner, { opacity: bgFade }]}>
        <SafeAreaView style={ss.safe} edges={['top']}>
          {/* Header con botón cerrar */}
          {step < 4 && (
            <View style={ss.topBar}>
              <Pressable onPress={onClose} style={ss.closeBtn}>
                <Text style={[ss.closeTxt, { color: palette.muted }]}>✕</Text>
              </Pressable>
              {/* Indicador de pasos */}
              <View style={ss.stepDots}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      ss.stepDot,
                      {
                        backgroundColor: i <= step ? palette.accent : `${palette.accent}25`,
                        width: i === step ? 18 : 6,
                      },
                    ]}
                  />
                ))}
              </View>
              <View style={{ width: 40 }} />
            </View>
          )}

          {/* Progress bar + tag — pinned below topBar when on checklist step */}
          {step === 3 && (
            <View style={[ss.clTopBar, { paddingHorizontal: 28 }]}>
              <View style={ss.clProgress}>
                <View style={[ss.clProgressTrack, { backgroundColor: `${palette.accent}20` }]}>
                  <View
                    style={[
                      ss.clProgressFill,
                      {
                        width: `${(clActions.idx / clActions.total) * 100}%` as `${number}%`,
                        backgroundColor: palette.accent,
                      },
                    ]}
                  />
                </View>
                <Text style={[ss.clProgressText, { color: palette.sub }]}>
                  {clActions.idx + 1}/{clActions.total}
                </Text>
              </View>
              <View
                style={[
                  ss.tagPill,
                  {
                    backgroundColor: `${palette.accent}18`,
                    borderColor: `${palette.accent}30`,
                    alignSelf: 'center',
                  },
                ]}
              >
                <Text style={[ss.tagText, { color: palette.accent }]}>
                  {t('sleep.session.step3Tag')}
                </Text>
              </View>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ss.scroll}>
            {step === 0 && <StepIntro palette={palette} onStart={() => goStep(1)} />}
            {step === 1 && (
              <StepTimePicker
                palette={palette}
                wakeH={wakeH}
                wakeM={wakeM}
                onChangeH={setWakeH}
                onChangeM={setWakeM}
                onNext={() => goStep(2)}
              />
            )}
            {step === 2 && (
              <StepTimeline palette={palette} steps={calcTimeline()} onNext={() => goStep(3)} />
            )}
            {step === 3 && (
              <StepChecklist
                palette={palette}
                onDone={handleChecklistDone}
                onActionsUpdate={(check, skip, isLast, idx, total) =>
                  setClActions({ check, skip, isLast, idx, total })
                }
              />
            )}
            {step === 4 && (
              <StepGoodnight
                palette={palette}
                checkedCount={doneIds.length}
                totalCount={KEY_ITEMS.length}
                wakeTime={fmt(wakeH, wakeM)}
                onClose={onClose}
              />
            )}
          </ScrollView>

          {/* Pinned footer — all steps */}
          <View style={[ss.footerWrap, { paddingBottom: insets.bottom + 8 }]}>
            {step === 3 ? (
              // Checklist: Sí / Salteo
              <View style={ss.clBtns}>
                <Pressable
                  style={[ss.clBtnNo, { borderColor: `${palette.accent}30` }]}
                  onPress={clActions.skip}
                >
                  <Text style={[ss.clBtnNoText, { color: palette.sub }]}>
                    {t('sleep.session.skipBtn')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[ss.clBtnYes, { backgroundColor: palette.accent }]}
                  onPress={clActions.check}
                >
                  <Text style={[ss.clBtnYesText, { color: palette.bg }]}>
                    {clActions.isLast
                      ? t('sleep.session.checkBtnLast')
                      : t('sleep.session.checkBtn')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  ss.footer,
                  step === 4
                    ? [ss.footerOutline, { borderColor: `${palette.accent}40` }]
                    : { backgroundColor: palette.accent },
                  { opacity: pressed ? 0.82 : 1 },
                ]}
                onPress={
                  step === 0
                    ? () => goStep(1)
                    : step === 1
                      ? () => goStep(2)
                      : step === 2
                        ? () => goStep(3)
                        : onClose
                }
              >
                <Text style={[ss.footerTxt, { color: step === 4 ? palette.sub : palette.bg }]}>
                  {step === 0
                    ? t('sleep.session.btnStart')
                    : step === 1
                      ? t('sleep.session.btnCalc')
                      : step === 2
                        ? t('sleep.session.btnChecklist')
                        : t('sleep.session.btnClose')}
                </Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────
const ss = StyleSheet.create({
  root: { flex: 1 },
  star: { position: 'absolute' },
  gradTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, opacity: 0.5 },
  inner: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 8 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 18, fontWeight: '300' },
  stepDots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  stepDot: { height: 5, borderRadius: 99 },

  // Wrapper común para todos los steps
  stepWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 12, gap: 18 },

  tagPill: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5 },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  stepTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  stepBody: { fontSize: 15, textAlign: 'center', lineHeight: 23, maxWidth: W - 80 },
  ctaBtn: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 99,
    width: '100%',
    alignItems: 'center',
  },
  ctaBtnText: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  // Picker
  pickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 32,
    gap: 8,
  },
  pickerCol: { alignItems: 'center', gap: 6 },
  pickerArrow: { padding: 10 },
  arrowChar: { fontSize: 16, fontWeight: '700' },
  pickerDigit: {
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -3,
    lineHeight: 70,
    minWidth: 80,
    textAlign: 'center',
  },
  pickerColon: { fontSize: 56, fontWeight: '200', paddingHorizontal: 4, lineHeight: 70 },
  pickerUnit: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  quickRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  quickChip: { borderWidth: 1.5, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  quickChipText: { fontSize: 14, fontWeight: '600' },

  // Timeline cards
  timelineCards: { width: '100%', gap: 10 },
  tlCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
  },
  tlCardLeft: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    minWidth: 76,
  },
  tlCardIcon: { fontSize: 22 },
  tlCardTime: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  tlCardRight: { flex: 1, padding: 14 },
  tlCardLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  tlCardSub: { fontSize: 12, lineHeight: 17 },
  scienceNote: { borderWidth: 1, borderRadius: 14, padding: 14, width: '100%' },
  scienceNoteText: { fontSize: 13, lineHeight: 20 },

  // Checklist
  clProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 4,
  },
  clTopBar: { paddingBottom: 12, gap: 10 },
  clProgressTrack: { flex: 1, height: 4, borderRadius: 99, overflow: 'hidden' },
  clProgressFill: { height: '100%', borderRadius: 99 },
  clProgressText: { fontSize: 12, fontWeight: '600' },
  clCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  clIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clIcon: { fontSize: 36 },
  clLabel: { fontSize: 20, fontWeight: '700', textAlign: 'center', lineHeight: 28 },
  clDesc: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  clBtns: { width: '100%', gap: 10 },
  clBtnYes: { paddingVertical: 16, borderRadius: 99, alignItems: 'center' },
  clBtnYesText: { fontSize: 17, fontWeight: '800' },
  clBtnNo: { paddingVertical: 14, borderRadius: 99, alignItems: 'center', borderWidth: 1 },
  clBtnNoText: { fontSize: 15 },
  clDoneRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  clDoneDot: { width: 8, height: 8, borderRadius: 99 },

  // Goodnight
  gnStar: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gnTitle: { fontSize: 42, fontWeight: '800', letterSpacing: -1.5, textAlign: 'center' },
  gnStat: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  gnStatNum: { fontSize: 44, fontWeight: '800', letterSpacing: -2 },
  gnStatLabel: { fontSize: 14 },
  gnBar: { width: '100%', height: 6, borderRadius: 99, overflow: 'hidden', marginTop: 6 },
  gnBarFill: { height: '100%', borderRadius: 99 },
  gnMsg: { fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: W - 80 },
  gnWakeRow: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    width: '100%',
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
  },
  gnWakeLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  gnWakeTime: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  gnBtn: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 99, borderWidth: 1 },
  gnBtnText: { fontSize: 15 },

  footer: { borderRadius: 99, paddingVertical: 16, alignItems: 'center' },
  footerOutline: { borderWidth: 1 },
  footerTxt: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  footerWrap: { paddingHorizontal: 28, paddingTop: 4 },
});
