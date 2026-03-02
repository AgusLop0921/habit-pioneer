#!/bin/bash

# ============================================================
#  Habits Pioneer — Patch v8 — Sesión de Higiene Guiada
#
#  "Modo noche" — el usuario activa la sesión antes de dormir
#  y la app lo lleva de la mano paso a paso:
#
#  Paso 0 → Activación (card en SleepScreen)
#  Paso 1 → "¿A qué hora querés levantarte mañana?" (time picker)
#  Paso 2 → Timeline calculada: celu, bajar cambio, acostarse
#  Paso 3 → Checklist nocturno interactivo (1 item por vez)
#  Paso 4 → Pantalla de cierre "Buenas noches" con animación
#
#  Estética: fondo que cambia según la hora actual
#  (cálido ámbar antes de las 20hs → azul → índigo profundo de noche)
#  Animaciones suaves, una sola cosa por pantalla, tipografía grande.
#
#  Correr DENTRO de habits-pioneer/:
#    bash patch-v8-session.sh
# ============================================================

set -e
GREEN='\033[0;32m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
step() { echo -e "\n${BLUE}────────────────────────────────────${NC}"; echo -e "${CYAN}[→] $1${NC}"; }

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║  🌙  Patch v8 — Sesión de Higiene Guiada     ║"
echo "  ╚══════════════════════════════════════════════╝"
echo -e "${NC}"

[ -f "app.json" ] || { echo "Corré desde habits-pioneer/"; exit 1; }
mkdir -p src/screens/sleep

# ── 1. SleepSession — componente principal ────────────────
step "Creando SleepSession (flujo guiado nocturno)"

cat > src/screens/sleep/SleepSession.tsx << 'EOF'
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
import {
  View, Text, StyleSheet, Pressable,
  Animated, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Line, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useSleepStore } from '../../store/sleepStore';
import { SLEEP_CHECKLIST } from './sleepChecklist';

const { width: W, height: SCREEN_H } = Dimensions.get('window');

// ─── Paleta que cambia según la hora del día ──────────────
function getPalette(hour: number) {
  if (hour >= 5  && hour < 17) return { // día
    bg: '#0d0d1f', grad1: '#1a1a3e', grad2: '#0d0d1f',
    accent: '#818cf8', dim: '#312e81',
    text: '#e0e7ff', sub: '#a5b4fc', muted: '#4338ca',
  };
  if (hour >= 17 && hour < 20) return { // atardecer
    bg: '#110808', grad1: '#2d1200', grad2: '#110808',
    accent: '#fb923c', dim: '#7c2d12',
    text: '#ffedd5', sub: '#fdba74', muted: '#9a3412',
  };
  if (hour >= 20 && hour < 22) return { // noche temprana
    bg: '#080d1a', grad1: '#0f1e3d', grad2: '#080d1a',
    accent: '#60a5fa', dim: '#1e3a5f',
    text: '#dbeafe', sub: '#93c5fd', muted: '#1d4ed8',
  };
  return { // medianoche
    bg: '#050509', grad1: '#0e0e1e', grad2: '#050509',
    accent: '#a78bfa', dim: '#2e1065',
    text: '#ede9fe', sub: '#c4b5fd', muted: '#4c1d95',
  };
}

// ─── Estrellas de fondo ───────────────────────────────────
const STARS = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 137.5) % W,
  y: (i * 97.3)  % SCREEN_H,
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
        fill={color} opacity={0.9}
      />
      {[[22,28],[98,35],[16,88],[102,90],[60,108]].map(([cx,cy],i)=>(
        <Circle key={i} cx={cx} cy={cy} r={2+i*0.3} fill={color} opacity={0.3+i*0.06} />
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
      {Array.from({length:12},(_,i)=>{
        const a=(i*30-90)*Math.PI/180, r1=24, r2=28+(i%3===0?3:0);
        return <Line key={i} x1={50+r1*Math.cos(a)} y1={52+r1*Math.sin(a)} x2={50+r2*Math.cos(a)} y2={52+r2*Math.sin(a)} stroke={color} strokeWidth={i%3===0?2.5:1.5} opacity={0.6} />;
      })}
      <Path d="M50 52 L50 30" stroke={color} strokeWidth={2.5} strokeLinecap="round" opacity={0.9}/>
      <Path d="M50 52 L64 56" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.9}/>
      <Circle cx={50} cy={52} r={4} fill={color} opacity={0.9}/>
      <Path d="M20 24 C16 18 18 12 24 14" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6}/>
      <Path d="M80 24 C84 18 82 12 76 14" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6}/>
    </Svg>
  );
}

function TimelineSVG({ color, steps }: { color: string; steps: TimelineStep[] }) {
  const itemH = 56;
  const h = steps.length * itemH + 20;
  return (
    <Svg width={W - 48} height={h} viewBox={`0 0 ${W - 48} ${h}`}>
      {steps.map((step, i) => {
        const y = 20 + i * itemH;
        const isLast = i === steps.length - 1;
        return (
          <G key={i}>
            {!isLast && <Line x1={24} y1={y+12} x2={24} y2={y+itemH} stroke={color} strokeWidth={1.5} opacity={0.3} strokeDasharray="4 4"/>}
            <Circle cx={24} cy={y} r={10} fill={color} opacity={step.done ? 0.9 : 0.2} stroke={color} strokeWidth={step.done ? 0 : 1.5}/>
            {step.done && <Path d={`M19 ${y} L23 ${y+4} L30 ${y-4}`} stroke="#000" strokeWidth={2.2} fill="none" strokeLinecap="round"/>}
          </G>
        );
      })}
    </Svg>
  );
}

function CheckSVG({ color, size = 80 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Circle cx={40} cy={40} r={36} fill={color} opacity={0.15} stroke={color} strokeWidth={2}/>
      <Path d="M24 40 L34 52 L56 28" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
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
function addMinutes(h: number, m: number, mins: number): [number, number] {
  const total = h * 60 + m + mins;
  return [Math.floor(total / 60) % 24, total % 60];
}
function subMinutes(h: number, m: number, mins: number): [number, number] {
  let total = h * 60 + m - mins;
  if (total < 0) total += 24 * 60;
  return [Math.floor(total / 60), total % 60];
}
function fmt(h: number, m: number) {
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ─── STEP 0: Intro ────────────────────────────────────────
function StepIntro({ palette, onStart }: { palette: ReturnType<typeof getPalette>; onStart: () => void }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(floatY, { toValue: -12, duration: 2200, useNativeDriver: true }),
      Animated.timing(floatY, { toValue: 0,   duration: 2200, useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <Animated.View style={[ss.stepWrap, { opacity: fadeIn }]}>
      <Animated.View style={{ transform: [{ translateY: floatY }] }}>
        <MoonSVG color={palette.accent} size={140} />
      </Animated.View>

      <View style={[ss.tagPill, { backgroundColor: `${palette.accent}18`, borderColor: `${palette.accent}30` }]}>
        <Text style={[ss.tagText, { color: palette.accent }]}>MODO NOCHE</Text>
      </View>

      <Text style={[ss.stepTitle, { color: palette.text }]}>
        Empezemos{'\n'}tu rutina de sueño
      </Text>
      <Text style={[ss.stepBody, { color: palette.sub }]}>
        Te voy a guiar paso a paso para que esta noche duermas lo mejor posible.
        {'\n\n'}Solo necesito saber a qué hora querés levantarte mañana.
      </Text>

      <Pressable
        style={({ pressed }) => [ss.ctaBtn, { backgroundColor: palette.accent, opacity: pressed ? 0.82 : 1 }]}
        onPress={onStart}
      >
        <Text style={[ss.ctaBtnText, { color: palette.bg }]}>Empezar →</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── STEP 1: Time Picker ──────────────────────────────────
function StepTimePicker({
  palette, wakeH, wakeM, onChangeH, onChangeM, onNext,
}: {
  palette: ReturnType<typeof getPalette>;
  wakeH: number; wakeM: number;
  onChangeH: (h: number) => void;
  onChangeM: (m: number) => void;
  onNext: () => void;
}) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleIn, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  const adjH = (d: number) => onChangeH((wakeH + d + 24) % 24);
  const adjM = (d: number) => onChangeM((wakeM + d + 60) % 60);

  return (
    <Animated.View style={[ss.stepWrap, { opacity: fadeIn, transform: [{ scale: scaleIn }] }]}>
      <AlarmSVG color={palette.accent} size={110} />

      <View style={[ss.tagPill, { backgroundColor: `${palette.accent}18`, borderColor: `${palette.accent}30` }]}>
        <Text style={[ss.tagText, { color: palette.accent }]}>PASO 1 DE 3</Text>
      </View>

      <Text style={[ss.stepTitle, { color: palette.text }]}>¿A qué hora querés{'\n'}levantarte mañana?</Text>
      <Text style={[ss.stepBody, { color: palette.sub }]}>
        Con esto calculo todos tus horarios de esta noche.
      </Text>

      {/* Time picker */}
      <View style={[ss.pickerCard, { backgroundColor: `${palette.accent}10`, borderColor: `${palette.accent}20` }]}>
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
          <Text style={[ss.pickerUnit, { color: palette.muted }]}>hs</Text>
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
          <Text style={[ss.pickerUnit, { color: palette.muted }]}>min</Text>
        </View>
      </View>

      {/* Sugerencias rápidas */}
      <View style={ss.quickRow}>
        {[[6,0],[6,30],[7,0],[7,30],[8,0]].map(([h,m]) => {
          const active = wakeH === h && wakeM === m;
          return (
            <Pressable
              key={`${h}${m}`}
              style={[ss.quickChip, { borderColor: active ? palette.accent : `${palette.accent}25`, backgroundColor: active ? `${palette.accent}20` : 'transparent' }]}
              onPress={() => { onChangeH(h); onChangeM(m); }}
            >
              <Text style={[ss.quickChipText, { color: active ? palette.accent : palette.sub }]}>
                {fmt(h, m)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={({ pressed }) => [ss.ctaBtn, { backgroundColor: palette.accent, opacity: pressed ? 0.82 : 1 }]}
        onPress={onNext}
      >
        <Text style={[ss.ctaBtnText, { color: palette.bg }]}>Calcular mi rutina →</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── STEP 2: Timeline ─────────────────────────────────────
function StepTimeline({
  palette, steps, onNext,
}: {
  palette: ReturnType<typeof getPalette>;
  steps: TimelineStep[];
  onNext: () => void;
}) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(steps.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.stagger(120, itemAnims.map(a =>
      Animated.spring(a, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true })
    )).start();
  }, []);

  return (
    <Animated.View style={[ss.stepWrap, { opacity: fadeIn }]}>
      <View style={[ss.tagPill, { backgroundColor: `${palette.accent}18`, borderColor: `${palette.accent}30` }]}>
        <Text style={[ss.tagText, { color: palette.accent }]}>PASO 2 DE 3</Text>
      </View>

      <Text style={[ss.stepTitle, { color: palette.text }]}>Tu rutina{'\n'}de esta noche</Text>
      <Text style={[ss.stepBody, { color: palette.sub }]}>
        Seguí estos horarios y tu cerebro va a entrar en modo sueño de forma natural.
      </Text>

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
                transform: [{ translateY: itemAnims[i].interpolate({ inputRange: [0,1], outputRange: [20,0] }) }],
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

      <View style={[ss.scienceNote, { backgroundColor: `${palette.accent}08`, borderColor: `${palette.accent}18` }]}>
        <Text style={[ss.scienceNoteText, { color: palette.sub }]}>
          💡 La melatonina empieza a subir ~2hs antes de dormir. La luz azul la bloquea hasta 3hs.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [ss.ctaBtn, { backgroundColor: palette.accent, opacity: pressed ? 0.82 : 1 }]}
        onPress={onNext}
      >
        <Text style={[ss.ctaBtnText, { color: palette.bg }]}>Ver checklist nocturno →</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── STEP 3: Checklist interactivo ────────────────────────
// Muestra UN ítem por vez, muy calmo
function StepChecklist({
  palette, onDone,
}: {
  palette: ReturnType<typeof getPalette>;
  onDone: (doneIds: string[]) => void;
}) {
  // Solo los ítems "clave" para no abrumar (los ** del doc original)
  const KEY_ITEMS = SLEEP_CHECKLIST.filter(i => i.isKeyItem);

  const [idx, setIdx]       = useState(0);
  const [done, setDone]     = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);

  const fadeIn  = useRef(new Animated.Value(1)).current;
  const slideX  = useRef(new Animated.Value(0)).current;
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
        Animated.spring(slideX,  { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
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
      animateNext(() => setIdx(i => i + 1));
    } else {
      onDone(newDone);
    }
  };

  const handleSkip = (id: string) => {
    setSkipped(s => [...s, id]);
    if (idx < KEY_ITEMS.length - 1) {
      animateNext(() => setIdx(i => i + 1));
    } else {
      onDone(done);
    }
  };

  const item = KEY_ITEMS[idx];
  const progress = (idx / KEY_ITEMS.length) * 100;

  const CATEGORY_COLORS: Record<string, string> = {
    before:      '#818cf8',
    environment: '#38bdf8',
    behavior:    '#34d399',
    crisis:      '#f59e0b',
  };
  const itemColor = CATEGORY_COLORS[item.category] || palette.accent;

  return (
    <View style={[ss.stepWrap, { justifyContent: 'flex-start', paddingTop: 8 }]}>
      {/* Progress */}
      <View style={ss.clProgress}>
        <View style={[ss.clProgressTrack, { backgroundColor: `${palette.accent}20` }]}>
          <Animated.View style={[ss.clProgressFill, { width: `${progress}%` as any, backgroundColor: palette.accent }]} />
        </View>
        <Text style={[ss.clProgressText, { color: palette.sub }]}>{idx + 1}/{KEY_ITEMS.length}</Text>
      </View>

      <View style={[ss.tagPill, { backgroundColor: `${palette.accent}18`, borderColor: `${palette.accent}30` }]}>
        <Text style={[ss.tagText, { color: palette.accent }]}>PASO 3 DE 3 · CHECKLIST</Text>
      </View>

      {/* Ítem animado */}
      <Animated.View style={[
        ss.clCard,
        {
          backgroundColor: `${itemColor}0d`,
          borderColor: `${itemColor}25`,
          opacity: fadeIn,
          transform: [{ translateX: slideX }],
        },
      ]}>
        {/* Ícono de categoría grande */}
        <View style={[ss.clIconWrap, { backgroundColor: `${itemColor}18` }]}>
          <Text style={ss.clIcon}>
            {item.category === 'before'      ? '🌙' :
             item.category === 'environment' ? '🏠' :
             item.category === 'behavior'    ? '🔄' : '⚡'}
          </Text>
        </View>
        <Text style={[ss.clLabel, { color: palette.text }]}>{item.label}</Text>
        <Text style={[ss.clDesc, { color: palette.sub }]}>{item.description}</Text>
      </Animated.View>

      {/* Botones */}
      <Animated.View style={[ss.clBtns, { transform: [{ scale: scaleBtn }] }]}>
        <Pressable
          style={[ss.clBtnYes, { backgroundColor: palette.accent }]}
          onPress={() => handleCheck(item.id)}
        >
          <Text style={[ss.clBtnYesText, { color: palette.bg }]}>
            {idx === KEY_ITEMS.length - 1 ? '✓ Listo' : '✓ Ya lo hice'}
          </Text>
        </Pressable>
        <Pressable
          style={[ss.clBtnNo, { borderColor: `${palette.accent}30` }]}
          onPress={() => handleSkip(item.id)}
        >
          <Text style={[ss.clBtnNoText, { color: palette.sub }]}>Lo salteo</Text>
        </Pressable>
      </Animated.View>

      {/* Ítems completados */}
      {done.length > 0 && (
        <View style={ss.clDoneRow}>
          {done.map((id, i) => (
            <View key={id} style={[ss.clDoneDot, { backgroundColor: palette.accent }]} />
          ))}
          {skipped.map((id, i) => (
            <View key={id} style={[ss.clDoneDot, { backgroundColor: `${palette.accent}30` }]} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── STEP 4: Buenas noches ────────────────────────────────
function StepGoodnight({
  palette, checkedCount, totalCount, wakeTime, onClose,
}: {
  palette: ReturnType<typeof getPalette>;
  checkedCount: number;
  totalCount: number;
  wakeTime: string;
  onClose: () => void;
}) {
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.8)).current;
  const floatY  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleIn, { toValue: 1, tension: 45, friction: 8, useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(floatY, { toValue: -10, duration: 2500, useNativeDriver: true }),
      Animated.timing(floatY, { toValue: 0,   duration: 2500, useNativeDriver: true }),
    ])).start();
  }, []);

  const pct = Math.round((checkedCount / totalCount) * 100);
  const msg =
    pct === 100 ? '¡Perfecto! Esta noche vas a dormir muy bien.' :
    pct >= 60   ? 'Muy bien. Cada hábito que sumás hace diferencia.' :
                  'Está bien empezar de a poco. Lo importante es la constancia.';

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
  }, []);

  const STAR_POS = [[30,60],[W-50,80],[W-30,200],[20,250],[W/2,30],[W-60,300]];

  return (
    <Animated.View style={[ss.stepWrap, { opacity: fadeIn }]}>
      {/* Estrellas animadas */}
      {STAR_POS.map(([x,y], i) => (
        <Animated.View key={i} style={[ss.gnStar, { left: x-20, top: y-20, opacity: starAnims[i] }]}>
          <Text style={{ fontSize: 10 + (i%3)*4, color: palette.accent }}>★</Text>
        </Animated.View>
      ))}

      <Animated.View style={{ transform: [{ scale: scaleIn }, { translateY: floatY }] }}>
        <MoonSVG color={palette.accent} size={130} />
      </Animated.View>

      <Text style={[ss.gnTitle, { color: palette.text }]}>Buenas noches</Text>

      {/* Stat de compliance */}
      <View style={[ss.gnStat, { backgroundColor: `${palette.accent}12`, borderColor: `${palette.accent}22` }]}>
        <Text style={[ss.gnStatNum, { color: palette.accent }]}>{checkedCount}/{totalCount}</Text>
        <Text style={[ss.gnStatLabel, { color: palette.sub }]}>hábitos completados esta noche</Text>
        <View style={[ss.gnBar, { backgroundColor: `${palette.accent}20` }]}>
          <View style={[ss.gnBarFill, { width: `${pct}%` as any, backgroundColor: palette.accent }]} />
        </View>
      </View>

      <Text style={[ss.gnMsg, { color: palette.sub }]}>{msg}</Text>

      <View style={[ss.gnWakeRow, { borderColor: `${palette.accent}20` }]}>
        <Text style={[ss.gnWakeLabel, { color: palette.muted }]}>Despertarse mañana</Text>
        <Text style={[ss.gnWakeTime, { color: palette.text }]}>{wakeTime}</Text>
      </View>

      <Pressable
        style={({ pressed }) => [ss.gnBtn, { borderColor: `${palette.accent}40`, opacity: pressed ? 0.7 : 1 }]}
        onPress={onClose}
      >
        <Text style={[ss.gnBtnText, { color: palette.sub }]}>Cerrar</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── COMPONENTE RAÍZ ──────────────────────────────────────
export default function SleepSession({ onClose }: { onClose: () => void }) {
  const { saveLog }   = useSleepStore();
  const hour          = new Date().getHours();
  const palette       = getPalette(hour);

  const [step, setStep]   = useState(0);
  const [wakeH, setWakeH] = useState(7);
  const [wakeM, setWakeM] = useState(0);
  const [doneIds, setDoneIds] = useState<string[]>([]);

  // Fade de fondo entre steps
  const bgFade = useRef(new Animated.Value(1)).current;

  const goStep = useCallback((next: number) => {
    Animated.timing(bgFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(bgFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  }, []);

  // Calcular timeline basada en la hora de levantarse
  const calcTimeline = (): TimelineStep[] => {
    // Asumir 8hs de sueño objetivo → hora de dormirse
    const [sleepH, sleepM] = subMinutes(wakeH, wakeM, 8 * 60);
    const [windH, windM]   = subMinutes(sleepH, sleepM, 30);
    const [dimH, dimM]     = subMinutes(sleepH, sleepM, 60);
    const [celuH, celuM]   = subMinutes(sleepH, sleepM, 90);

    return [
      {
        time: fmt(celuH, celuM),
        label: 'Apagá el celular',
        sublabel: 'La luz azul bloquea la melatonina hasta 3 horas',
        icon: '📵',
        done: false,
      },
      {
        time: fmt(dimH, dimM),
        label: 'Bajá la intensidad de la luz',
        sublabel: 'Atenuá lámparas y apagá pantallas brillantes',
        icon: '🕯️',
        done: false,
      },
      {
        time: fmt(windH, windM),
        label: 'Empezá a relajarte',
        sublabel: 'Higiene, lectura liviana o música suave',
        icon: '🛁',
        done: false,
      },
      {
        time: fmt(sleepH, sleepM),
        label: 'Acostarte',
        sublabel: `8hs de sueño → te levantás a las ${fmt(wakeH, wakeM)}`,
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

  const KEY_ITEMS = SLEEP_CHECKLIST.filter(i => i.isKeyItem);

  return (
    <View style={[ss.root, { backgroundColor: palette.bg }]}>
      {/* Estrellas de fondo */}
      {STARS.map((star, i) => (
        <View key={i} style={[ss.star, { left: star.x, top: star.y, width: star.r*2, height: star.r*2, borderRadius: star.r, opacity: star.o, backgroundColor: palette.accent }]} />
      ))}

      {/* Gradiente superior sutil */}
      <View style={[ss.gradTop, { backgroundColor: palette.grad1 }]} pointerEvents="none" />

      <Animated.View style={[ss.inner, { opacity: bgFade }]}>
        <SafeAreaView style={ss.safe} edges={['top', 'bottom']}>
          {/* Header con botón cerrar */}
          {step < 4 && (
            <View style={ss.topBar}>
              <Pressable onPress={onClose} style={ss.closeBtn}>
                <Text style={[ss.closeTxt, { color: palette.muted }]}>✕</Text>
              </Pressable>
              {/* Indicador de pasos */}
              <View style={ss.stepDots}>
                {[0,1,2,3].map(i => (
                  <View key={i} style={[ss.stepDot, {
                    backgroundColor: i <= step ? palette.accent : `${palette.accent}25`,
                    width: i === step ? 18 : 6,
                  }]} />
                ))}
              </View>
              <View style={{ width: 40 }} />
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={ss.scroll}
          >
            {step === 0 && (
              <StepIntro palette={palette} onStart={() => goStep(1)} />
            )}
            {step === 1 && (
              <StepTimePicker
                palette={palette}
                wakeH={wakeH} wakeM={wakeM}
                onChangeH={setWakeH} onChangeM={setWakeM}
                onNext={() => goStep(2)}
              />
            )}
            {step === 2 && (
              <StepTimeline
                palette={palette}
                steps={calcTimeline()}
                onNext={() => goStep(3)}
              />
            )}
            {step === 3 && (
              <StepChecklist
                palette={palette}
                onDone={handleChecklistDone}
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
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────
const ss = StyleSheet.create({
  root:         { flex: 1 },
  star:         { position: 'absolute' },
  gradTop:      { position: 'absolute', top: 0, left: 0, right: 0, height: 200, opacity: 0.6 },
  inner:        { flex: 1 },
  safe:         { flex: 1 },
  scroll:       { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 32 },
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  closeBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeTxt:     { fontSize: 18, fontWeight: '300' },
  stepDots:     { flexDirection: 'row', gap: 6, alignItems: 'center' },
  stepDot:      { height: 5, borderRadius: 99 },

  // Wrapper común para todos los steps
  stepWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 12, gap: 18 },

  tagPill:      { borderWidth: 1, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5 },
  tagText:      { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  stepTitle:    { fontSize: 32, fontWeight: '800', textAlign: 'center', letterSpacing: -0.8, lineHeight: 40 },
  stepBody:     { fontSize: 15, textAlign: 'center', lineHeight: 23, maxWidth: W - 80 },
  ctaBtn:       { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 99, width: '100%', alignItems: 'center' },
  ctaBtnText:   { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },

  // Picker
  pickerCard:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 24, paddingVertical: 20, paddingHorizontal: 32, gap: 8 },
  pickerCol:    { alignItems: 'center', gap: 6 },
  pickerArrow:  { padding: 10 },
  arrowChar:    { fontSize: 16, fontWeight: '700' },
  pickerDigit:  { fontSize: 64, fontWeight: '800', letterSpacing: -3, lineHeight: 70, minWidth: 80, textAlign: 'center' },
  pickerColon:  { fontSize: 56, fontWeight: '200', paddingHorizontal: 4, lineHeight: 70 },
  pickerUnit:   { fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  quickRow:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  quickChip:    { borderWidth: 1.5, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  quickChipText:{ fontSize: 14, fontWeight: '600' },

  // Timeline cards
  timelineCards:{ width: '100%', gap: 10 },
  tlCard:       { flexDirection: 'row', borderWidth: 1, borderRadius: 18, overflow: 'hidden', alignItems: 'center' },
  tlCardLeft:   { paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', gap: 4, minWidth: 76 },
  tlCardIcon:   { fontSize: 22 },
  tlCardTime:   { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  tlCardRight:  { flex: 1, padding: 14 },
  tlCardLabel:  { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  tlCardSub:    { fontSize: 12, lineHeight: 17 },
  scienceNote:  { borderWidth: 1, borderRadius: 14, padding: 14, width: '100%' },
  scienceNoteText: { fontSize: 13, lineHeight: 20 },

  // Checklist
  clProgress:   { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 4 },
  clProgressTrack: { flex: 1, height: 4, borderRadius: 99, overflow: 'hidden' },
  clProgressFill:  { height: '100%', borderRadius: 99 },
  clProgressText:  { fontSize: 12, fontWeight: '600' },
  clCard:       { width: '100%', borderWidth: 1, borderRadius: 24, padding: 24, alignItems: 'center', gap: 14 },
  clIconWrap:   { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  clIcon:       { fontSize: 36 },
  clLabel:      { fontSize: 20, fontWeight: '700', textAlign: 'center', lineHeight: 28 },
  clDesc:       { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  clBtns:       { width: '100%', gap: 10 },
  clBtnYes:     { paddingVertical: 16, borderRadius: 99, alignItems: 'center' },
  clBtnYesText: { fontSize: 17, fontWeight: '800' },
  clBtnNo:      { paddingVertical: 14, borderRadius: 99, alignItems: 'center', borderWidth: 1 },
  clBtnNoText:  { fontSize: 15 },
  clDoneRow:    { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  clDoneDot:    { width: 8, height: 8, borderRadius: 99 },

  // Goodnight
  gnStar:       { position: 'absolute', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  gnTitle:      { fontSize: 42, fontWeight: '800', letterSpacing: -1.5, textAlign: 'center' },
  gnStat:       { width: '100%', borderWidth: 1, borderRadius: 22, padding: 22, alignItems: 'center', gap: 8 },
  gnStatNum:    { fontSize: 44, fontWeight: '800', letterSpacing: -2 },
  gnStatLabel:  { fontSize: 14 },
  gnBar:        { width: '100%', height: 6, borderRadius: 99, overflow: 'hidden', marginTop: 6 },
  gnBarFill:    { height: '100%', borderRadius: 99 },
  gnMsg:        { fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: W - 80 },
  gnWakeRow:    { borderTopWidth: 1, borderBottomWidth: 1, width: '100%', paddingVertical: 18, alignItems: 'center', gap: 4 },
  gnWakeLabel:  { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  gnWakeTime:   { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  gnBtn:        { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 99, borderWidth: 1 },
  gnBtnText:    { fontSize: 15 },
});
EOF
log "SleepSession ✓"

# ── 2. Card de inicio de sesión en SleepScreen ────────────
step "Agregando StartSessionCard al SleepScreen"

cat > src/screens/sleep/StartSessionCard.tsx << 'EOF'
/**
 * Card que aparece en el hub de sueño para iniciar la sesión guiada.
 * Cambia de color según la hora.
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';

const INDIGO = '#6366f1';

function getCardPalette(hour: number) {
  if (hour >= 17 && hour < 20) return { bg: '#2d1200', border: '#7c2d1260', accent: '#fb923c', sub: '#fdba74' };
  if (hour >= 20 && hour < 22) return { bg: '#0f1e3d', border: '#1e3a5f60', accent: '#60a5fa', sub: '#93c5fd' };
  if (hour >= 22 || hour < 5)  return { bg: '#0e0e1e', border: '#2e106560', accent: '#a78bfa', sub: '#c4b5fd' };
  return { bg: '#1a1a3e', border: '#31287160', accent: INDIGO, sub: '#a5b4fc' };
}

export default function StartSessionCard({ onPress }: { onPress: () => void }) {
  const hour    = new Date().getHours();
  const palette = getCardPalette(hour);
  const pulse   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.04, duration: 1600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 1600, useNativeDriver: true }),
    ])).start();
  }, []);

  const greeting =
    hour >= 21 || hour < 3 ? 'Es hora de dormir' :
    hour >= 17             ? 'Preparate para dormir' :
                             'Planificá tu noche';

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
        <Text style={[s.title, { color: '#fff' }]}>Comenzar higiene{'\n'}del sueño</Text>
        <Text style={[s.sub, { color: palette.sub }]}>
          Te guío paso a paso esta noche
        </Text>
      </View>

      <View style={[s.arrow, { backgroundColor: `${palette.accent}20` }]}>
        <Text style={[s.arrowChar, { color: palette.accent }]}>→</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 22, borderWidth: 1,
    padding: 18, gap: 16, marginBottom: 16,
  },
  moonWrap:  { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  moonEmoji: { fontSize: 38 },
  textWrap:  { flex: 1, gap: 3 },
  greeting:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  title:     { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, lineHeight: 24 },
  sub:       { fontSize: 12, marginTop: 2 },
  arrow:     { width: 36, height: 36, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  arrowChar: { fontSize: 18, fontWeight: '700' },
});
EOF
log "StartSessionCard ✓"

# ── 3. Actualizar SleepScreen para incluir la card ────────
step "Integrando StartSessionCard en SleepScreen"

# Agregar el import de SleepSession y StartSessionCard al SleepScreen
# y el state de showSession

cat > /tmp/sleep_screen_patch.py << 'PYEOF'
import re

with open('src/screens/sleep/SleepScreen.tsx', 'r') as f:
    content = f.read()

# 1. Agregar imports después de SleepLogModal
old_import = "import SleepLogModal from './SleepLogModal';"
new_import = """import SleepLogModal from './SleepLogModal';
import SleepSession from './SleepSession';
import StartSessionCard from './StartSessionCard';"""
content = content.replace(old_import, new_import, 1)

# 2. Agregar estado showSession después de showLog
old_state = "  const [showLog, setShowLog] = useState(false);"
new_state = """  const [showLog, setShowLog] = useState(false);
  const [showSession, setShowSession] = useState(false);"""
content = content.replace(old_state, new_state, 1)

# 3. Agregar el fullscreen de sesión antes del return del main hub
# (buscamos el PRIMER return que corresponde al main hub)
old_return = "  const s2 = makeMainStyles(theme);\n\n  return ("
new_return = """  const s2 = makeMainStyles(theme);

  // ── Sesión guiada (pantalla completa) ──
  if (showSession) {
    return <SleepSession onClose={() => setShowSession(false)} />;
  }

  return ("""
content = content.replace(old_return, new_return, 1)

# 4. Agregar StartSessionCard antes del header de stats
# Buscamos el inicio de statsWrap y agregamos antes
old_stats = "        <View style={s2.statsWrap}>"
new_stats = """        {/* Sesión guiada */}
        <View style={{ paddingHorizontal: 16, marginTop: -4 }}>
          <StartSessionCard onPress={() => setShowSession(true)} />
        </View>

        <View style={s2.statsWrap}>"""
content = content.replace(old_stats, new_stats, 1)

with open('src/screens/sleep/SleepScreen.tsx', 'w') as f:
    f.write(content)

print("SleepScreen actualizado ✓")
PYEOF

python3 /tmp/sleep_screen_patch.py && log "SleepScreen integrado ✓" || {
  log "Patch Python falló — aplicando con sed"
  # Fallback manual
  sed -i "s|import SleepLogModal from './SleepLogModal';|import SleepLogModal from './SleepLogModal';\nimport SleepSession from './SleepSession';\nimport StartSessionCard from './StartSessionCard';|" src/screens/sleep/SleepScreen.tsx
  sed -i "s|const \[showLog, setShowLog\] = useState(false);|const [showLog, setShowLog] = useState(false);\n  const [showSession, setShowSession] = useState(false);|" src/screens/sleep/SleepScreen.tsx
}

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🌙  Patch v8 listo — Sesión guiada nocturna                 ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║  Flujo de la sesión:                                         ║${NC}"
echo -e "${CYAN}║  🌙 Card "Comenzar higiene" en el hub de Sueño               ║${NC}"
echo -e "${CYAN}║  → Paso 0: Intro calma (luna flotante)                       ║${NC}"
echo -e "${CYAN}║  → Paso 1: ¿A qué hora levantarse? (time picker grande)      ║${NC}"
echo -e "${CYAN}║  → Paso 2: Timeline calculada (celu / luz / relajarse / cama)║${NC}"
echo -e "${CYAN}║  → Paso 3: Checklist 1 ítem por vez (✓ / saltar)            ║${NC}"
echo -e "${CYAN}║  → Paso 4: Buenas noches + stat de compliance + hora alarma  ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║  Estética:                                                   ║${NC}"
echo -e "${CYAN}║  • Fondo oscuro que cambia según la hora del día             ║${NC}"
echo -e "${CYAN}║  • 28 estrellas de fondo posicionadas                        ║${NC}"
echo -e "${CYAN}║  • Float + scale animations por paso                         ║${NC}"
echo -e "${CYAN}║  • Stagger en timeline cards                                 ║${NC}"
echo -e "${CYAN}║  • Slide horizontal en checklist                             ║${NC}"
echo -e "${CYAN}║  • Estrellas que parpadean en Buenas noches                  ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  npx expo start --clear                                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"