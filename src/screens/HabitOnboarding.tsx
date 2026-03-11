import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
  DimensionValue,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import Svg, {
  Circle,
  Path,
  Rect,
  G,
  Line,
  Ellipse,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';

// ── Palettes – brand colors ────────────────────────────────────────────────────
const PALETTES = [
  { bg: '#080808', card: '#141414', accent: '#FBBF24', text: '#fef3c7', sub: '#fcd34d' }, // golden – welcome
  { bg: '#0d0019', card: '#180025', accent: '#A855F7', text: '#f3e8ff', sub: '#c084fc' }, // purple – dopamina
  { bg: '#001a0a', card: '#002810', accent: '#22C55E', text: '#dcfce7', sub: '#4ade80' }, // green – crecimiento
  { bg: '#1a0800', card: '#2a1000', accent: '#F97316', text: '#ffedd5', sub: '#fb923c' }, // orange – motivación
  { bg: '#00081a', card: '#001128', accent: '#3B82F6', text: '#dbeafe', sub: '#60a5fa' }, // blue – resiliencia
  { bg: '#0d0019', card: '#180025', accent: '#A855F7', text: '#f3e8ff', sub: '#c084fc' }, // purple – lanzamiento
];

// ── Ilustraciones SVG ──────────────────────────────────────────────────────────

// Slide 0: bienvenida – horizonte con rayos de luz y figura celebrando
function WelcomeSVG({ color }: { color: string }) {
  return (
    <Svg width={220} height={200} viewBox="0 0 220 200">
      <Defs>
        <RadialGradient id="hglow0" cx="50%" cy="75%" r="60%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.38} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={110} cy={148} rx={90} ry={52} fill="url(#hglow0)" />

      {/* Horizonte */}
      <Line x1={22} y1={148} x2={198} y2={148} stroke={color} strokeWidth={2} opacity={0.35} strokeLinecap="round" />

      {/* Rayos de sol */}
      {Array.from({ length: 9 }, (_, i) => {
        const angle = (-80 + i * 20) * (Math.PI / 180);
        const r1 = 28, r2 = 50 + (i % 3) * 6;
        return (
          <Line
            key={i}
            x1={110 + r1 * Math.cos(angle)}
            y1={148 + r1 * Math.sin(angle)}
            x2={110 + r2 * Math.cos(angle)}
            y2={148 + r2 * Math.sin(angle)}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.22 + i * 0.02}
          />
        );
      })}

      {/* Sol */}
      <Circle cx={110} cy={148} r={22} fill={color} opacity={0.18} />
      <Circle cx={110} cy={148} r={14} fill={color} opacity={0.55} />

      {/* Figura humana celebrando (brazos arriba) */}
      {/* Cabeza */}
      <Circle cx={110} cy={86} r={10} fill={color} opacity={0.82} />
      {/* Cuerpo */}
      <Line x1={110} y1={96} x2={110} y2={122} stroke={color} strokeWidth={3.5} strokeLinecap="round" opacity={0.78} />
      {/* Brazo izquierdo levantado */}
      <Path d="M110 104 C100 96 88 86 82 78" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.78} />
      {/* Brazo derecho levantado */}
      <Path d="M110 104 C120 96 132 86 138 78" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.78} />
      {/* Pierna izquierda */}
      <Path d="M110 122 L100 142" stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.72} />
      {/* Pierna derecha */}
      <Path d="M110 122 L120 142" stroke={color} strokeWidth={3} strokeLinecap="round" opacity={0.72} />

      {/* Destellos alrededor de las manos */}
      <Path d="M78 72 L80 66 M74 76 L68 74 M82 68 L80 62" stroke={color} strokeWidth={1.8} strokeLinecap="round" opacity={0.65} />
      <Path d="M142 72 L140 66 M146 76 L152 74 M138 68 L140 62" stroke={color} strokeWidth={1.8} strokeLinecap="round" opacity={0.65} />

      {/* Confeti / partículas */}
      {[[40, 54], [176, 50], [28, 110], [192, 108], [60, 38], [160, 36], [110, 24]].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={2.2 + (i % 3) * 0.6} fill={color} opacity={0.2 + i * 0.04} />
      ))}

      {/* Estrella 4 puntas arriba */}
      <Path d="M110 14 L112 8 L114 14 L120 16 L114 18 L112 24 L110 18 L104 16 Z" fill={color} opacity={0.65} />
    </Svg>
  );
}

// Slide 1: cerebro + checklist con partículas de dopamina
function DopamineSVG({ color }: { color: string }) {
  return (
    <Svg width={220} height={200} viewBox="0 0 220 200">
      <Defs>
        <RadialGradient id="hglow1" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={110} cy={100} rx={80} ry={70} fill="url(#hglow1)" />

      {/* Cerebro */}
      <Path
        d="M70 95 C65 75 75 60 90 58 C95 52 108 50 115 55 C122 50 138 52 142 62 C155 65 162 80 155 95 C162 108 158 125 145 130 C140 140 125 142 115 138 C105 142 88 138 82 130 C68 125 65 110 70 95 Z"
        fill={color}
        opacity={0.2}
        stroke={color}
        strokeWidth={2}
        strokeOpacity={0.5}
      />
      <Path d="M110 58 C108 80 112 100 110 138" stroke="#000" strokeWidth={2} fill="none" opacity={0.2} />

      {/* Checklist */}
      {[0, 1, 2].map((i) => {
        const y = 68 + i * 24;
        return (
          <G key={i}>
            <Rect x={76} y={y - 8} width={68} height={16} rx={5} fill={color} opacity={0.12} />
            <Circle cx={87} cy={y} r={7} fill={color} opacity={0.75} />
            <Path
              d={`M84 ${y} L86.5 ${y + 2.5} L91 ${y - 3}`}
              stroke="#000"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.65}
            />
            <Line x1={100} y1={y} x2={138} y2={y} stroke={color} strokeWidth={2} opacity={0.35} />
          </G>
        );
      })}

      {/* Partículas dopamina */}
      {[
        [48, 52], [172, 48], [42, 148], [178, 144], [110, 178], [32, 100], [188, 100],
      ].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={2.5 + i * 0.3} fill={color} opacity={0.25 + i * 0.05} />
      ))}

      {/* Destellos */}
      <Path
        d="M158 56 L165 50 M161 58 L169 56 M158 62 L165 68"
        stroke={color}
        strokeWidth={1.8}
        opacity={0.55}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Slide 2: semilla → planta → árbol
function GrowthSVG({ color }: { color: string }) {
  return (
    <Svg width={220} height={200} viewBox="0 0 220 200">
      <Defs>
        <RadialGradient id="hglow2" cx="50%" cy="65%" r="55%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={110} cy={135} rx={80} ry={58} fill="url(#hglow2)" />

      {/* Tierra */}
      <Ellipse cx={110} cy={175} rx={52} ry={11} fill={color} opacity={0.12} />

      {/* Tronco */}
      <Path d="M105 170 L107 128 L110 82 L113 128 L115 170 Z" fill={color} opacity={0.45} />

      {/* Rama izquierda */}
      <Path d="M108 122 C95 110 76 106 65 98" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.65} />
      <Circle cx={65} cy={98} r={17} fill={color} opacity={0.28} />
      <Circle cx={53} cy={88} r={12} fill={color} opacity={0.38} />
      <Circle cx={70} cy={80} r={10} fill={color} opacity={0.32} />

      {/* Rama derecha */}
      <Path d="M112 116 C125 104 144 100 154 92" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.65} />
      <Circle cx={154} cy={92} r={17} fill={color} opacity={0.28} />
      <Circle cx={166} cy={82} r={12} fill={color} opacity={0.38} />
      <Circle cx={150} cy={76} r={10} fill={color} opacity={0.32} />

      {/* Copa */}
      <Circle cx={110} cy={62} r={26} fill={color} opacity={0.32} />
      <Circle cx={93} cy={70} r={17} fill={color} opacity={0.28} />
      <Circle cx={127} cy={70} r={17} fill={color} opacity={0.28} />
      <Circle cx={110} cy={44} r={15} fill={color} opacity={0.48} />

      {/* Semilla original (abajo derecha) */}
      <Ellipse cx={160} cy={168} rx={10} ry={6} fill={color} opacity={0.65} />

      {/* Partículas */}
      {[[30, 48], [188, 52], [28, 112], [192, 108], [110, 193]].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={2} fill={color} opacity={0.28 + i * 0.04} />
      ))}
    </Svg>
  );
}

// Slide 3: gráfico ascendente + racha de fuego
function ProgressSVG({ color }: { color: string }) {
  return (
    <Svg width={220} height={200} viewBox="0 0 220 200">
      <Defs>
        <RadialGradient id="hglow3" cx="50%" cy="55%" r="55%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={110} cy={110} rx={88} ry={72} fill="url(#hglow3)" />

      {/* Ejes */}
      <Line x1={42} y1={40} x2={42} y2={152} stroke={color} strokeWidth={1.5} opacity={0.35} strokeLinecap="round" />
      <Line x1={42} y1={152} x2={178} y2={152} stroke={color} strokeWidth={1.5} opacity={0.35} strokeLinecap="round" />

      {/* Grid horizontal */}
      {[152, 122, 92, 62].map((y, i) => (
        <Line key={i} x1={42} y1={y} x2={178} y2={y} stroke={color} strokeWidth={0.7} opacity={0.18} />
      ))}

      {/* Área rellena */}
      <Path
        d="M42 148 L68 138 L94 120 L120 106 L146 88 L172 62 L178 54 L178 152 L42 152 Z"
        fill={color}
        opacity={0.12}
      />

      {/* Línea ascendente */}
      <Path
        d="M42 148 L68 138 L94 120 L120 106 L146 88 L172 62"
        stroke={color}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Puntos */}
      {[[42, 148], [94, 120], [146, 88], [172, 62]].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={4.5} fill={color} opacity={0.9} />
      ))}

      {/* Llama racha */}
      <Path
        d="M170 50 C164 40 170 29 176 26 C172 33 177 36 178 43 C180 36 184 31 187 28 C185 38 180 46 170 50 Z"
        fill={color}
        opacity={0.85}
      />

      {/* Badge "7" */}
      <Rect x={160} y={12} width={32} height={22} rx={7} fill={color} opacity={0.2} />
      <Path
        d="M165 15 L187 15 L177 34"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />

      {/* Estrellas */}
      {[[28, 58], [190, 78], [25, 148], [186, 155]].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={2.5} fill={color} opacity={0.28 + i * 0.05} />
      ))}
    </Svg>
  );
}

// Slide 4: calendario con un día vacío pero la racha continúa
function ResilienceSVG({ color }: { color: string }) {
  const cells = [
    [0, 0, true],  [1, 0, true],  [2, 0, true],  [3, 0, true],  [4, 0, true],
    [0, 1, true],  [1, 1, true],  [2, 1, false], [3, 1, true],  [4, 1, true],
    [0, 2, true],  [1, 2, true],  [2, 2, true],  [3, 2, true],  [4, 2, true],
  ] as [number, number, boolean][];

  return (
    <Svg width={220} height={200} viewBox="0 0 220 200">
      <Defs>
        <RadialGradient id="hglow4" cx="50%" cy="55%" r="55%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={110} cy={112} rx={84} ry={74} fill="url(#hglow4)" />

      {/* Fondo calendario */}
      <Rect x={36} y={44} width={148} height={130} rx={14} fill={color} opacity={0.08} stroke={color} strokeWidth={1.5} strokeOpacity={0.28} />
      {/* Header */}
      <Rect x={36} y={44} width={148} height={28} rx={14} fill={color} opacity={0.22} />
      <Rect x={36} y={58} width={148} height={14} rx={0} fill={color} opacity={0.22} />

      {/* Días */}
      {cells.map(([col, row, done], i) => {
        const x = 60 + col * 26;
        const y = 92 + row * 28;
        return (
          <G key={i}>
            <Rect x={x - 9} y={y - 9} width={18} height={18} rx={5} fill={color} opacity={done ? 0.38 : 0.07} />
            {done ? (
              <Path
                d={`M${x - 4} ${y} L${x - 1} ${y + 3} L${x + 5} ${y - 4}`}
                stroke={color}
                strokeWidth={2.2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
            ) : (
              <>
                <Line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} stroke={color} strokeWidth={1.5} opacity={0.3} />
                <Line x1={x + 4} y1={y - 4} x2={x - 4} y2={y + 4} stroke={color} strokeWidth={1.5} opacity={0.3} />
              </>
            )}
          </G>
        );
      })}

      {/* Flecha "la racha sigue" */}
      <Path
        d="M138 120 C146 116 148 124 142 130"
        stroke={color}
        strokeWidth={2}
        fill="none"
        opacity={0.6}
        strokeLinecap="round"
        strokeDasharray="4 3"
      />

      {/* Partículas */}
      {[[26, 52], [196, 54], [28, 162], [194, 158]].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={2.5} fill={color} opacity={0.3} />
      ))}
    </Svg>
  );
}

// Slide 5: gran check + rayos de luz + estrellas
function LaunchSVG({ color }: { color: string }) {
  return (
    <Svg width={220} height={200} viewBox="0 0 220 200">
      <Defs>
        <RadialGradient id="hglow5" cx="50%" cy="50%" r="55%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.38} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={110} cy={100} rx={86} ry={82} fill="url(#hglow5)" />

      {/* Anillos */}
      <Circle cx={110} cy={100} r={72} fill="none" stroke={color} strokeWidth={1} opacity={0.18} strokeDasharray="8 5" />
      <Circle cx={110} cy={100} r={55} fill={color} opacity={0.1} />
      <Circle cx={110} cy={100} r={42} fill={color} opacity={0.18} />

      {/* Gran check */}
      <Path
        d="M82 100 L102 120 L138 78"
        stroke={color}
        strokeWidth={8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.95}
      />

      {/* Rayos */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45 - 22.5) * (Math.PI / 180);
        const r1 = 58, r2 = 72;
        return (
          <Line
            key={i}
            x1={110 + r1 * Math.cos(angle)}
            y1={100 + r1 * Math.sin(angle)}
            x2={110 + r2 * Math.cos(angle)}
            y2={100 + r2 * Math.sin(angle)}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.45}
          />
        );
      })}

      {/* Estrellas */}
      {[[26, 32], [190, 28], [20, 152], [198, 158], [110, 190], [50, 176], [170, 174]].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={2 + i * 0.25} fill={color} opacity={0.28 + i * 0.06} />
      ))}

      {/* Estrella 4 puntas */}
      <Path
        d="M172 46 L174 40 L176 46 L182 48 L176 50 L174 56 L172 50 L166 48 Z"
        fill={color}
        opacity={0.72}
      />
      <Path
        d="M40 40 L41.5 35 L43 40 L48 41.5 L43 43 L41.5 48 L40 43 L35 41.5 Z"
        fill={color}
        opacity={0.55}
      />
    </Svg>
  );
}

// ── Datos de slides ───────────────────────────────────────────────────────────

type TFunc = (key: string) => string;

const SLIDE_DEFS = [
  { paletteIdx: 0, Illustration: WelcomeSVG,   key: 's0' },
  { paletteIdx: 1, Illustration: DopamineSVG,  key: 's1' },
  { paletteIdx: 2, Illustration: GrowthSVG,    key: 's2' },
  { paletteIdx: 3, Illustration: ProgressSVG,  key: 's3' },
  { paletteIdx: 4, Illustration: ResilienceSVG, key: 's4' },
  { paletteIdx: 5, Illustration: LaunchSVG,    key: 's5' },
];

function getSlides(t: TFunc) {
  return SLIDE_DEFS.map(({ paletteIdx, Illustration, key }) => ({
    paletteIdx,
    Illustration,
    tag: t(`habitOnboarding.${key}.tag`),
    title: t(`habitOnboarding.${key}.title`),
    facts: [
      t(`habitOnboarding.${key}.f0`),
      t(`habitOnboarding.${key}.f1`),
      t(`habitOnboarding.${key}.f2`),
    ],
    funFact: t(`habitOnboarding.${key}.funFact`),
    cta: t(`habitOnboarding.${key}.cta`),
  }));
}

// ── Opciones de idioma ────────────────────────────────────────────────────────

const LANG_OPTIONS = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
] as const;

// ── Posiciones de estrellas de fondo ─────────────────────────────────────────

const STAR_POSITIONS = [
  { x: 14, y: 58, r: 1.5, o: 0.32 },
  { x: 50, y: 24, r: 2, o: 0.26 },
  { x: 292, y: 40, r: 1.8, o: 0.3 },
  { x: 338, y: 82, r: 1.2, o: 0.22 },
  { x: 20, y: 202, r: 1.5, o: 0.28 },
  { x: 352, y: 214, r: 2, o: 0.26 },
  { x: 38, y: 482, r: 1.8, o: 0.22 },
  { x: 344, y: 462, r: 1.5, o: 0.28 },
  { x: 178, y: 20, r: 2.2, o: 0.2 },
  { x: 118, y: 702, r: 1.5, o: 0.18 },
  { x: 262, y: 682, r: 1.8, o: 0.22 },
  { x: 82, y: 582, r: 1.2, o: 0.18 },
  { x: 312, y: 552, r: 1.5, o: 0.2 },
];

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  onDone: () => void;
}

export default function HabitOnboarding({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const setLanguage = useStore((s) => s.setLanguage);

  const [langChosen, setLangChosen] = useState(false);
  const [current, setCurrent] = useState(0);

  const slides = getSlides(t);

  const bgFade = useRef(new Animated.Value(1)).current;
  const illScale = useRef(new Animated.Value(1)).current;
  const illFloat = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(0)).current;
  const titleOpac = useRef(new Animated.Value(1)).current;
  const fact1Opac = useRef(new Animated.Value(0)).current;
  const fact2Opac = useRef(new Animated.Value(0)).current;
  const fact3Opac = useRef(new Animated.Value(0)).current;
  const funFOpac = useRef(new Animated.Value(0)).current;
  const progressW = useRef(new Animated.Value(0)).current;

  const slide = slides[current];
  const palette = PALETTES[slide.paletteIdx];
  const Illustration = slide.Illustration;
  const factAnims = [fact1Opac, fact2Opac, fact3Opac];

  // Float continuo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(illFloat, { toValue: -10, duration: 1900, useNativeDriver: true }),
        Animated.timing(illFloat, { toValue: 0, duration: 1900, useNativeDriver: true }),
      ])
    ).start();
  }, [illFloat]);

  // Entrada staggered al cambiar slide
  useEffect(() => {
    [fact1Opac, fact2Opac, fact3Opac, funFOpac].forEach((a) => a.setValue(0));
    titleOpac.setValue(0);
    titleY.setValue(18);
    illScale.setValue(0.88);

    Animated.timing(progressW, {
      toValue: (current + 1) / slides.length,
      duration: 400,
      useNativeDriver: false,
    }).start();

    Animated.stagger(85, [
      Animated.parallel([
        Animated.timing(titleOpac, { toValue: 1, duration: 360, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 360, useNativeDriver: true }),
        Animated.spring(illScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
      Animated.timing(fact1Opac, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(fact2Opac, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(fact3Opac, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(funFOpac, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [current, fact1Opac, fact2Opac, fact3Opac, funFOpac, illScale, titleOpac, titleY]);

  const handlePickLang = async (code: string) => {
    await i18n.changeLanguage(code);
    setLanguage(code as 'es' | 'en' | 'pt');
    setLangChosen(true);
  };

  const goNext = () => {
    if (current >= slides.length - 1) {
      onDone();
      return;
    }
    Animated.timing(bgFade, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setCurrent((c) => c + 1);
      Animated.timing(bgFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const barWidth = progressW.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ── Language picker ──────────────────────────────────────────────────────────
  if (!langChosen) {
    return (
      <View style={[s.root, s.langRoot]}>
        <StatusBar barStyle="light-content" />
        {/* Stars */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {STAR_POSITIONS.map((star, i) => (
            <View
              key={i}
              style={[s.star, {
                left: star.x, top: star.y,
                width: star.r * 2, height: star.r * 2,
                borderRadius: star.r, opacity: star.o,
                backgroundColor: '#FBBF24',
              }]}
            />
          ))}
        </View>
        <View style={[s.langContent, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}>
          {/* Icono */}
          <View style={s.langIconWrap}>
            <Text style={s.langIconEmoji}>🌍</Text>
          </View>
          {/* Títulos en los 3 idiomas */}
          <Text style={s.langTitle}>{'Choose your language'}</Text>
          <Text style={s.langSub}>{'Elegí tu idioma  ·  Escolha seu idioma'}</Text>
          {/* Opciones */}
          <View style={s.langOptions}>
            {LANG_OPTIONS.map((opt) => (
              <Pressable
                key={opt.code}
                style={({ pressed }) => [s.langOption, pressed && { opacity: 0.75 }]}
                onPress={() => handlePickLang(opt.code)}
              >
                <Text style={s.langFlag}>{opt.flag}</Text>
                <Text style={s.langLabel}>{opt.label}</Text>
                <Text style={s.langArrow}>→</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ── Slides ───────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Estrellas de fondo */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STAR_POSITIONS.map((star, i) => (
          <View
            key={i}
            style={[
              s.star,
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
      </View>

      <Animated.View style={[s.content, { opacity: bgFade }]}>
        {/* Barra superior */}
        <View style={[s.topBar, { paddingHorizontal: 24, paddingTop: insets.top + 12 }]}>
          <Pressable onPress={onDone} style={s.skipBtn}>
            <Text style={[s.skipTxt, { color: palette.sub }]}>{t('habitOnboarding.skip')}</Text>
          </Pressable>
          <View style={[s.progressTrack, { backgroundColor: `${palette.accent}25` }]}>
            <Animated.View
              style={[
                s.progressFill,
                { width: barWidth as unknown as DimensionValue, backgroundColor: palette.accent },
              ]}
            />
          </View>
          <Text style={[s.slideCount, { color: palette.sub }]}>
            {current + 1}/{slides.length}
          </Text>
        </View>

        {/* Contenido scrollable */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingHorizontal: 24 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Ilustración flotante */}
          <Animated.View
            style={[s.illWrap, { transform: [{ translateY: illFloat }, { scale: illScale }] }]}
          >
            <View style={[s.illBg, { backgroundColor: `${palette.accent}12` }]}>
              <Illustration color={palette.accent} />
            </View>
          </Animated.View>

          {/* Tag */}
          <View
            style={[
              s.tagWrap,
              { backgroundColor: `${palette.accent}18`, borderColor: `${palette.accent}35` },
            ]}
          >
            <Text style={[s.tagText, { color: palette.accent }]}>{slide.tag}</Text>
          </View>

          {/* Título */}
          <Animated.View style={{ opacity: titleOpac, transform: [{ translateY: titleY }] }}>
            <Text style={[s.title, { color: palette.text }]}>{slide.title}</Text>
          </Animated.View>

          {/* Facts */}
          <View style={[s.card, { backgroundColor: palette.card }]}>
            {slide.facts.map((fact: string, i: number) => (
              <Animated.View
                key={i}
                style={[
                  s.factRow,
                  { opacity: factAnims[i] },
                  i < slide.facts.length - 1 && [
                    s.factBorder,
                    { borderBottomColor: `${palette.accent}18` },
                  ],
                ]}
              >
                <View style={[s.factDot, { backgroundColor: palette.accent }]} />
                <Text style={[s.factText, { color: palette.text }]}>{fact}</Text>
              </Animated.View>
            ))}
          </View>

          {/* Fun fact */}
          <Animated.View
            style={[
              s.funFact,
              {
                backgroundColor: `${palette.accent}14`,
                borderColor: `${palette.accent}28`,
                opacity: funFOpac,
              },
            ]}
          >
            <Text style={[s.funFactText, { color: palette.accent }]}>{slide.funFact}</Text>
          </Animated.View>
        </ScrollView>

        {/* CTA + dots */}
        <View style={[s.bottomBar, { paddingHorizontal: 24, paddingBottom: 20 }]}>
          <Pressable
            style={({ pressed }) => [
              s.cta,
              { backgroundColor: palette.accent, opacity: pressed ? 0.82 : 1 },
            ]}
            onPress={goNext}
          >
            <Text style={[s.ctaText, { color: palette.bg }]}>{slide.cta}</Text>
          </Pressable>

          <View style={s.dots}>
            {slides.map((_: unknown, i: number) => (
              <View
                key={i}
                style={[
                  s.dot,
                  { backgroundColor: i <= current ? palette.accent : `${palette.accent}30` },
                  i === current && { width: 20 },
                ]}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  star: { position: 'absolute' },
  content: { flex: 1 },
  // ── Language picker ──────────────────────────────────────────────────────────
  langRoot: { backgroundColor: '#080808', justifyContent: 'center' },
  langContent: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 0,
  },
  langIconWrap: { alignItems: 'center', marginBottom: 20 },
  langIconEmoji: { fontSize: 52 },
  langTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fef3c7',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  langSub: {
    fontSize: 13,
    color: '#fcd34d80',
    textAlign: 'center',
    marginBottom: 40,
  },
  langOptions: { gap: 14 },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: '#FBBF2420',
  },
  langFlag: { fontSize: 28 },
  langLabel: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fef3c7' },
  langArrow: { fontSize: 18, color: '#FBBF24', opacity: 0.7 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skipBtn: { minWidth: 48 },
  skipTxt: { fontSize: 14 },
  progressTrack: { flex: 1, height: 4, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  slideCount: { fontSize: 12, minWidth: 28, textAlign: 'right' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 4, paddingBottom: 16 },
  illWrap: { alignItems: 'center', marginVertical: 4 },
  illBg: {
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagWrap: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
  },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: {
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 34,
    marginBottom: 14,
  },
  card: { borderRadius: 18, padding: 16, marginBottom: 12 },
  factRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, alignItems: 'flex-start' },
  factBorder: { borderBottomWidth: 1 },
  factDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  factText: { fontSize: 13.5, lineHeight: 20, flex: 1 },
  funFact: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 4,
  },
  funFactText: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
  bottomBar: { paddingTop: 12 },
  cta: { paddingVertical: 15, borderRadius: 99, alignItems: 'center', marginBottom: 12 },
  ctaText: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7 },
  dot: { height: 5, width: 5, borderRadius: 99 },
});
