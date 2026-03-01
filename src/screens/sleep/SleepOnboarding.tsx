import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  DimensionValue,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useSleepStore } from '../../store/sleepStore';

const PALETTES = [
  { bg: '#0a0a1a', card: '#12122a', accent: '#818cf8', text: '#e0e7ff', sub: '#94a3b8' }, // índigo noche
  { bg: '#0f0a00', card: '#1c1400', accent: '#f59e0b', text: '#fef3c7', sub: '#92400e' }, // ámbar oscuro
  { bg: '#000d1a', card: '#001a33', accent: '#38bdf8', text: '#e0f2fe', sub: '#0369a1' }, // azul cielo noche
  { bg: '#0a0014', card: '#14002a', accent: '#a78bfa', text: '#ede9fe', sub: '#7c3aed' }, // violeta profundo
  { bg: '#001a0a', card: '#002614', accent: '#34d399', text: '#d1fae5', sub: '#065f46' }, // verde esmeralda
];

// ─────────────────────────────────────────────
//  ILUSTRACIONES SVG
// ─────────────────────────────────────────────

// Slide 1: cerebro durmiendo con ondas
function BrainSleepSVG({ color, pulse: _pulse }: { color: string; pulse: Animated.Value }) {
  return (
    <Svg width={220} height={200} viewBox="0 0 220 200">
      <Defs>
        <RadialGradient id="glow1" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* Glow fondo */}
      <Ellipse cx={110} cy={100} rx={80} ry={70} fill="url(#glow1)" />

      {/* Cerebro simplificado */}
      <Path
        d="M70 95 C65 75 75 60 90 58 C95 52 108 50 115 55
           C122 50 138 52 142 62 C155 65 162 80 155 95
           C162 108 158 125 145 130 C140 140 125 142 115 138
           C105 142 88 138 82 130 C68 125 65 110 70 95 Z"
        fill={color}
        opacity={0.85}
      />
      {/* Surco central */}
      <Path
        d="M110 58 C108 80 112 100 110 138"
        stroke="#000"
        strokeWidth={2}
        fill="none"
        opacity={0.3}
      />
      {/* Surcos laterales */}
      <Path
        d="M85 70 C88 85 85 100 88 115"
        stroke="#000"
        strokeWidth={1.5}
        fill="none"
        opacity={0.25}
      />
      <Path
        d="M135 70 C132 85 135 100 132 115"
        stroke="#000"
        strokeWidth={1.5}
        fill="none"
        opacity={0.25}
      />

      {/* Zzz animadas - posiciones fijas, se animan con opacidad en el padre */}
      {[
        { x: 155, y: 65, size: 22, op: 0.9 },
        { x: 172, y: 45, size: 17, op: 0.65 },
        { x: 186, y: 30, size: 13, op: 0.4 },
      ].map((z, i) => (
        <G key={i}>
          <Path
            d={`M${z.x} ${z.y + z.size * 0.4} L${z.x + z.size} ${z.y + z.size * 0.4} L${z.x} ${z.y - z.size * 0.4} L${z.x + z.size} ${z.y - z.size * 0.4}`}
            stroke={color}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={z.op}
          />
        </G>
      ))}

      {/* Estrellas */}
      {[
        [30, 40],
        [195, 90],
        [25, 150],
        [200, 155],
        [110, 185],
      ].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={2.5} fill={color} opacity={0.4 + i * 0.08} />
      ))}

      {/* Ondas de sueño (EEG-like) */}
      <Path
        d="M30 165 C40 165 45 150 55 165 C65 180 70 150 80 165 C90 180 95 150 105 165 C115 180 120 150 130 165 C140 180 145 155 155 165 C165 175 170 155 185 165"
        stroke={color}
        strokeWidth={2}
        fill="none"
        opacity={0.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Slide 2: reloj roto / deuda de sueño
function DebtClockSVG({ color }: { color: string }) {
  return (
    <Svg width={220} height={200} viewBox="0 0 220 200">
      <Defs>
        <RadialGradient id="glow2" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={110} cy={100} rx={85} ry={80} fill="url(#glow2)" />

      {/* Cara del reloj roto */}
      <Circle cx={110} cy={100} r={65} fill={color} opacity={0.12} stroke={color} strokeWidth={3} />
      <Circle cx={110} cy={100} r={58} fill="none" stroke={color} strokeWidth={1} opacity={0.3} />

      {/* Grieta en el reloj */}
      <Path
        d="M110 42 L118 70 L130 85 L120 100 L135 130 L110 160"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        opacity={0.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M118 70 L140 75 L150 65"
        stroke={color}
        strokeWidth={2}
        fill="none"
        opacity={0.5}
        strokeLinecap="round"
      />

      {/* Marcas de horas */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const r1 = 50,
          r2 = 58;
        return (
          <Line
            key={i}
            x1={110 + r1 * Math.cos(angle)}
            y1={100 + r1 * Math.sin(angle)}
            x2={110 + r2 * Math.cos(angle)}
            y2={100 + r2 * Math.sin(angle)}
            stroke={color}
            strokeWidth={i % 3 === 0 ? 2.5 : 1.5}
            opacity={0.6}
          />
        );
      })}

      {/* Agujas torcidas */}
      <Path
        d="M110 100 L110 62"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.9}
      />
      <Path
        d="M110 100 L138 108"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.9}
      />
      <Circle cx={110} cy={100} r={5} fill={color} opacity={0.9} />

      {/* Ojos cansados */}
      <Ellipse
        cx={90}
        cy={90}
        rx={8}
        ry={5}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.6}
      />
      <Ellipse
        cx={130}
        cy={90}
        rx={8}
        ry={5}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.6}
      />
      {/* Ojeras */}
      <Path
        d="M83 96 C86 100 94 100 97 96"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        opacity={0.5}
        strokeLinecap="round"
      />
      <Path
        d="M123 96 C126 100 134 100 137 96"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        opacity={0.5}
        strokeLinecap="round"
      />
      {/* Boca triste */}
      <Path
        d="M97 118 C104 112 116 112 123 118"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        opacity={0.7}
        strokeLinecap="round"
      />

      {/* Números flotantes representando horas perdidas */}
      {(
        [
          [-5, { x: 35, y: 55 }],
          [-3, { x: 175, y: 55 }],
          [-2, { x: 22, y: 140 }],
          [-4, { x: 182, y: 140 }],
        ] as [number, { x: number; y: number }][]
      ).map(([_n, pos], i) => (
        <G key={i}>
          <Rect
            x={pos.x - 14}
            y={pos.y - 12}
            width={28}
            height={22}
            rx={6}
            fill={color}
            opacity={0.15}
          />
          <Path d="" />
        </G>
      ))}
    </Svg>
  );
}

// Slide 3: reloj circadiano (sol/luna girando)
function CircadianSVG({ color }: { color: string }) {
  return (
    <Svg width={220} height={200} viewBox="0 0 220 200">
      <Defs>
        <RadialGradient id="glow3" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={110} cy={100} rx={90} ry={85} fill="url(#glow3)" />

      {/* Órbita */}
      <Circle
        cx={110}
        cy={100}
        r={72}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.25}
        strokeDasharray="6 4"
      />

      {/* Sol (arriba-derecha = día) */}
      <Circle cx={161} cy={48} r={22} fill={color} opacity={0.2} />
      <Circle cx={161} cy={48} r={16} fill={color} opacity={0.8} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = i * 45 * (Math.PI / 180);
        return (
          <Line
            key={i}
            x1={161 + 20 * Math.cos(a)}
            y1={48 + 20 * Math.sin(a)}
            x2={161 + 28 * Math.cos(a)}
            y2={48 + 28 * Math.sin(a)}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.7}
          />
        );
      })}

      {/* Luna (abajo-izquierda = noche) */}
      <Path
        d="M67 152 C58 147 54 137 56 127 C58 118 66 112 75 112 C65 116 60 125 62 134 C64 143 72 149 82 148 C76 151 71 153 67 152 Z"
        fill={color}
        opacity={0.85}
      />
      {/* Estrellitas cerca de la luna */}
      <Circle cx={52} cy={122} r={2.5} fill={color} opacity={0.6} />
      <Circle cx={95} cy={138} r={2} fill={color} opacity={0.4} />
      <Circle cx={58} cy={160} r={1.8} fill={color} opacity={0.5} />

      {/* Cuerpo humano silueta */}
      <Circle cx={110} cy={78} r={14} fill={color} opacity={0.18} />
      <Circle cx={110} cy={78} r={10} fill={color} opacity={0.5} />
      <Path
        d="M100 92 C98 110 100 125 102 138 C106 142 114 142 118 138 C120 125 122 110 120 92 Z"
        fill={color}
        opacity={0.4}
      />
      {/* Brazos */}
      <Path
        d="M100 98 L86 108 M120 98 L134 108"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.4}
      />
      {/* Piernas */}
      <Path
        d="M104 138 L100 158 M116 138 L120 158"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.4}
      />

      {/* Flecha indicando el ciclo */}
      <Path
        d="M143 68 C155 80 158 98 150 114 C144 126 132 134 118 136"
        stroke={color}
        strokeWidth={2}
        fill="none"
        opacity={0.45}
        strokeLinecap="round"
        strokeDasharray="5 4"
      />
      <Path
        d="M116 133 L118 140 L124 135"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        opacity={0.45}
      />

      {/* Etiquetas 24h */}
      <Circle cx={110} cy={22} r={12} fill={color} opacity={0.15} />
      <Line x1={110} y1={28} x2={110} y2={178} stroke={color} strokeWidth={0.5} opacity={0.12} />
      <Line x1={32} y1={100} x2={188} y2={100} stroke={color} strokeWidth={0.5} opacity={0.12} />
    </Svg>
  );
}

// Slide 4: las 3 reglas de oro (podio)
function GoldenRulesSVG({ color }: { color: string }) {
  return (
    <Svg width={220} height={200} viewBox="0 0 220 200">
      <Defs>
        <RadialGradient id="glow4" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={110} cy={130} rx={90} ry={60} fill="url(#glow4)" />

      {/* Podio 2do lugar */}
      <Rect x={32} y={118} width={52} height={52} rx={8} fill={color} opacity={0.25} />
      <Rect x={32} y={118} width={52} height={8} rx={4} fill={color} opacity={0.5} />
      {/* Podio 1ro */}
      <Rect x={92} y={95} width={56} height={75} rx={8} fill={color} opacity={0.35} />
      <Rect x={92} y={95} width={56} height={8} rx={4} fill={color} opacity={0.7} />
      {/* Podio 3ro */}
      <Rect x={156} y={133} width={50} height={37} rx={8} fill={color} opacity={0.2} />
      <Rect x={156} y={133} width={50} height={8} rx={4} fill={color} opacity={0.4} />

      {/* Número 1 */}
      <Circle cx={120} cy={75} r={18} fill={color} opacity={0.2} />
      <Circle cx={120} cy={75} r={14} fill={color} opacity={0.8} />
      <Path
        d="M117 68 L120 65 L120 85"
        stroke="#000"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      <Line
        x1={114}
        y1={85}
        x2={126}
        y2={85}
        stroke="#000"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.6}
      />

      {/* Número 2 */}
      <Circle cx={58} cy={100} r={15} fill={color} opacity={0.7} />
      <Path
        d="M51 95 C51 89 65 89 65 95 C65 100 51 108 51 108 L65 108"
        stroke="#000"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />

      {/* Número 3 */}
      <Circle cx={181} cy={118} r={13} fill={color} opacity={0.65} />
      <Path
        d="M175 110 C175 106 187 106 187 112 C187 116 182 117 182 117 C187 118 187 124 187 124 C187 130 175 130 175 126"
        stroke="#000"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />

      {/* Corona arriba del 1 */}
      <Path
        d="M108 58 L110 48 L120 56 L130 48 L132 58 Z"
        fill={color}
        opacity={0.9}
        stroke={color}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {/* Perlas de la corona */}
      <Circle cx={108} cy={58} r={3} fill={color} opacity={1} />
      <Circle cx={120} cy={56} r={3} fill={color} opacity={1} />
      <Circle cx={132} cy={58} r={3} fill={color} opacity={1} />
      <Line
        x1={108}
        y1={58}
        x2={132}
        y2={58}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.8}
      />

      {/* Estrellas decorativas */}
      {[
        [22, 50],
        [195, 60],
        [15, 170],
        [202, 170],
      ].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={2.5} fill={color} opacity={0.35 + i * 0.05} />
      ))}
    </Svg>
  );
}

// Slide 5: cohete despegando (lanzamiento)
function RocketSVG({ color }: { color: string }) {
  return (
    <Svg width={220} height={200} viewBox="0 0 220 200">
      <Defs>
        <RadialGradient id="glow5" cx="50%" cy="70%" r="60%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={110} cy={140} rx={80} ry={55} fill="url(#glow5)" />

      {/* Cohete */}
      {/* Cuerpo */}
      <Path
        d="M110 30 C95 45 88 75 88 105 L132 105 C132 75 125 45 110 30 Z"
        fill={color}
        opacity={0.85}
      />
      {/* Nariz */}
      <Path
        d="M110 30 C104 36 101 44 100 52 L120 52 C119 44 116 36 110 30 Z"
        fill={color}
        opacity={1}
      />
      {/* Ventana */}
      <Circle cx={110} cy={72} r={10} fill={color} opacity={0.2} stroke={color} strokeWidth={2.5} />
      <Circle cx={110} cy={72} r={6} fill={color} opacity={0.4} />
      {/* Aletas */}
      <Path d="M88 105 L70 125 L88 120 Z" fill={color} opacity={0.7} />
      <Path d="M132 105 L150 125 L132 120 Z" fill={color} opacity={0.7} />
      {/* Fuego */}
      <Path
        d="M96 120 C98 135 100 145 110 155 C120 145 122 135 124 120 Z"
        fill={color}
        opacity={0.5}
      />
      <Path
        d="M100 120 C102 132 105 140 110 148 C115 140 118 132 120 120 Z"
        fill={color}
        opacity={0.8}
      />
      <Path
        d="M104 120 C106 128 108 133 110 140 C112 133 114 128 116 120 Z"
        fill="#fff"
        opacity={0.6}
      />

      {/* Estelas del cohete */}
      {[
        [-18, 138],
        [-10, 150],
        [10, 150],
        [18, 138],
      ].map(([dx, y], i) => (
        <Path
          key={i}
          d={`M${110 + dx} ${y} L${110 + dx} ${y + 20 + i * 5}`}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.3 + i * 0.08}
        />
      ))}

      {/* Estrellas */}
      {[
        [25, 35],
        [190, 30],
        [35, 85],
        [185, 90],
        [20, 135],
        [200, 125],
      ].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={2 + i * 0.3} fill={color} opacity={0.3 + i * 0.08} />
      ))}
      {/* Estrella grande decorativa */}
      <Path
        d="M170 50 L172 44 L174 50 L180 52 L174 54 L172 60 L170 54 L164 52 Z"
        fill={color}
        opacity={0.6}
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
//  DATOS DE LOS SLIDES
// ─────────────────────────────────────────────
const SLIDES = [
  {
    paletteIdx: 0,
    Illustration: BrainSleepSVG,
    emoji: '🧠',
    tag: 'NEUROCIENCIA DEL SUEÑO',
    title: 'Tu cerebro tiene turno noche',
    facts: [
      'Mientras dormís, tu cerebro literalmente se lava.',
      'El sistema glinfático elimina proteínas tóxicas (incluyendo las asociadas al Alzheimer) solo durante el sueño profundo.',
      '8 horas de sueño no es un lujo — es mantenimiento obligatorio del hardware.',
    ],
    funFact: '💡 Los que duermen menos de 6h tienen 4× más probabilidad de resfriarse.',
    cta: 'Siguiente →',
  },
  {
    paletteIdx: 1,
    Illustration: DebtClockSVG,
    emoji: '💸',
    tag: 'LA DEUDA DE SUEÑO',
    title: 'Una deuda que no podés ignorar',
    facts: [
      'Cada hora de sueño perdida se acumula como "deuda de sueño".',
      'Después de 17hs sin dormir, tu rendimiento cognitivo equivale a tener 0.5% de alcohol en sangre.',
      'El "recuperar sueño el fin de semana" ayuda un poco... pero no cancela la deuda de la semana.',
    ],
    funFact: '😬 1 noche de 5h baja la testosterona un 15% — más que 10 años de envejecimiento.',
    cta: 'Siguiente →',
  },
  {
    paletteIdx: 2,
    Illustration: CircadianSVG,
    emoji: '🕐',
    tag: 'RITMO CIRCADIANO',
    title: 'Tu reloj interno manda',
    facts: [
      'Tenés un reloj biológico de 24hs controlado por la luz. Lo llaman ritmo circadiano.',
      'La melatonina (hormona del sueño) empieza a subir 2h antes de tu hora habitual de dormir.',
      'La luz azul del celular la suprime hasta 3 horas. Básicamente le decís a tu cerebro "es mediodía".',
    ],
    funFact:
      '☀️ Salir al sol 10 min por la mañana sincroniza tu reloj mejor que cualquier pastilla.',
    cta: 'Siguiente →',
  },
  {
    paletteIdx: 3,
    Illustration: GoldenRulesSVG,
    emoji: '🏆',
    tag: 'LAS REGLAS DE ORO',
    title: 'Tres cosas que cambian todo',
    facts: [
      '① Misma hora de levantarte todos los días (sí, el finde también). Es el ancla de tu ritmo.',
      '② La cama solo para dormir. Tu cerebro aprende asociaciones. Entrenalo bien.',
      '③ 0 pantallas 30 min antes. No es opcional — es el interruptor del sueño.',
    ],
    funFact: '🔬 Estos 3 hábitos solos mejoran la calidad del sueño en un 60% en 2 semanas.',
    cta: 'Siguiente →',
  },
  {
    paletteIdx: 4,
    Illustration: RocketSVG,
    emoji: '🚀',
    tag: 'EMPEZAMOS',
    title: '16 hábitos. 30 segundos por día.',
    facts: [
      'El protocolo que vas a seguir fue diseñado por la Dra. Julia Santin del Centro del Sueño UC.',
      'Cada mañana registrás cómo dormiste: 30 segundos, datos reales.',
      'En 2 semanas empezás a ver el patrón. En 4 semanas, el cambio.',
    ],
    funFact: '✨ Las personas que trackean su sueño duermen en promedio 47 min más por noche.',
    cta: '¡Empezar el programa!',
  },
];

// ─────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function SleepOnboarding({ onDone }: { onDone: () => void }) {
  const { completeOnboarding } = useSleepStore();
  const [current, setCurrent] = useState(0);

  // Animations
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

  const slide = SLIDES[current];
  const palette = PALETTES[slide.paletteIdx];
  const Illustration = slide.Illustration;

  // Float continuo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(illFloat, { toValue: -10, duration: 1800, useNativeDriver: true }),
        Animated.timing(illFloat, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Entrada staggered al montar y cuando cambia slide
  useEffect(() => {
    // Reset
    [fact1Opac, fact2Opac, fact3Opac, funFOpac].forEach((a) => a.setValue(0));
    titleOpac.setValue(0);
    titleY.setValue(18);
    illScale.setValue(0.88);

    // Progreso barra
    Animated.timing(progressW, {
      toValue: (current + 1) / SLIDES.length,
      duration: 400,
      useNativeDriver: false,
    }).start();

    // Stagger entrada
    Animated.stagger(90, [
      Animated.parallel([
        Animated.timing(titleOpac, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.spring(illScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
      Animated.timing(fact1Opac, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(fact2Opac, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(fact3Opac, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(funFOpac, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [current]);

  const goNext = () => {
    if (current >= SLIDES.length - 1) {
      completeOnboarding();
      onDone();
      return;
    }
    // Fade out rápido → cambiar slide → entrada se dispara por useEffect
    Animated.timing(bgFade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setCurrent((c) => c + 1);
      Animated.timing(bgFade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  const skip = () => {
    completeOnboarding();
    onDone();
  };

  const factAnims = [fact1Opac, fact2Opac, fact3Opac];

  const barWidth = progressW.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[s.root, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Partículas de fondo (estrellas estáticas) */}
      <View style={s.stars} pointerEvents="none">
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
        <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
          {/* Header: skip + progress */}
          <View style={s.topBar}>
            <Pressable onPress={skip} style={s.skipBtn}>
              <Text style={[s.skipTxt, { color: palette.sub }]}>Saltar</Text>
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
              {current + 1}/{SLIDES.length}
            </Text>
          </View>

          {/* Ilustración flotante */}
          <Animated.View
            style={[
              s.illWrap,
              {
                transform: [{ translateY: illFloat }, { scale: illScale }],
              },
            ]}
          >
            <View style={[s.illBg, { backgroundColor: `${palette.accent}12` }]}>
              <Illustration color={palette.accent} pulse={illScale} />
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

          {/* Facts con stagger */}
          <View style={[s.card, { backgroundColor: palette.card }]}>
            {slide.facts.map((fact, i) => (
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
                backgroundColor: `${palette.accent}15`,
                borderColor: `${palette.accent}30`,
                opacity: funFOpac,
              },
            ]}
          >
            <Text style={[s.funFactText, { color: palette.accent }]}>{slide.funFact}</Text>
          </Animated.View>

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [
              s.cta,
              { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={goNext}
          >
            <Text style={[s.ctaText, { color: palette.bg }]}>{slide.cta}</Text>
          </Pressable>

          {/* Dots */}
          <View style={s.dots}>
            {SLIDES.map((_, i) => (
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
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// Posiciones pre-calculadas de estrellas de fondo
const STAR_POSITIONS = [
  { x: 12, y: 55, r: 1.5, o: 0.35 },
  { x: 48, y: 22, r: 2, o: 0.28 },
  { x: 290, y: 38, r: 1.8, o: 0.32 },
  { x: 340, y: 80, r: 1.2, o: 0.25 },
  { x: 22, y: 200, r: 1.5, o: 0.3 },
  { x: 355, y: 210, r: 2, o: 0.28 },
  { x: 35, y: 480, r: 1.8, o: 0.25 },
  { x: 345, y: 460, r: 1.5, o: 0.3 },
  { x: 175, y: 18, r: 2.2, o: 0.22 },
  { x: 120, y: 700, r: 1.5, o: 0.2 },
  { x: 260, y: 680, r: 1.8, o: 0.25 },
  { x: 80, y: 580, r: 1.2, o: 0.2 },
  { x: 310, y: 550, r: 1.5, o: 0.22 },
];

const s = StyleSheet.create({
  root: { flex: 1 },
  stars: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
  star: { position: 'absolute' },
  content: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 4 },
  skipBtn: { minWidth: 44 },
  skipTxt: { fontSize: 14 },
  progressTrack: { flex: 1, height: 4, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  slideCount: { fontSize: 12, minWidth: 28, textAlign: 'right' },
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
  title: { fontSize: 27, fontWeight: '800', letterSpacing: -0.6, lineHeight: 34, marginBottom: 14 },
  card: { borderRadius: 18, padding: 16, marginBottom: 12 },
  factRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, alignItems: 'flex-start' },
  factBorder: { borderBottomWidth: 1 },
  factDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  factText: { fontSize: 13.5, lineHeight: 20, flex: 1, fontWeight: '400' },
  funFact: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 16,
  },
  funFactText: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
  cta: { paddingVertical: 15, borderRadius: 99, alignItems: 'center', marginBottom: 16 },
  ctaText: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7 },
  dot: { height: 5, width: 5, borderRadius: 99 },
});
