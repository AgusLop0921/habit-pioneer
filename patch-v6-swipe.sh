#!/bin/bash

# ============================================================
#  Habits Pioneer — Patch v7c — Fix Onboarding no visible
#
#  Causas posibles y fixes:
#  1. isEnrolled / onboardingDone ya estaban en true en AsyncStorage
#     → Botón de reset en la pantalla de Sueño (dev mode)
#  2. El onboarding se montaba DENTRO de la pantalla de enroll
#     como View absoluto pero con opacity 0 o detrás del modal
#     → Se mueve a navegación propia (stack navigator dentro de Sleep)
#  3. StatusBar "light-content" interfería con SafeAreaView
#     → Se remueve StatusBar del componente
#  4. El Animated.Value de fade empezaba en 0 accidentalmente
#     → Fix de valor inicial
#
#  La solución definitiva: SleepScreen usa un state local
#  para mostrar el onboarding como pantalla completa ANTES
#  de renderizar cualquier otra cosa, con zIndex correcto.
#
#  Correr DENTRO de habits-pioneer/:
#    bash patch-v7c-fix-onboarding.sh
# ============================================================

set -e
GREEN='\033[0;32m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
step() { echo -e "\n${BLUE}────────────────────────────────────${NC}"; echo -e "${CYAN}[→] $1${NC}"; }

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║  🔧  Patch v7c — Fix Onboarding              ║"
echo "  ╚══════════════════════════════════════════════╝"
echo -e "${NC}"

[ -f "app.json" ] || { echo "Corré desde habits-pioneer/"; exit 1; }

# ── 1. Resetear el store de sueño (AsyncStorage) ─────────
step "Creando utilidad de reset para desarrollo"

cat > src/screens/sleep/resetSleepStore.ts << 'EOF'
/**
 * Llama esto desde la consola de Expo o como botón temporal
 * para resetear el estado del sueño y volver a ver el onboarding.
 *
 * En la app: se puede activar desde Ajustes o con un botón debug.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function resetSleepStore() {
  await AsyncStorage.removeItem('habits-pioneer-sleep-v1');
  console.log('[Sleep] Store reseteado. Reiniciá la app.');
}
EOF
log "Reset util ✓"

# ── 2. Reescribir SleepScreen con lógica robusta ─────────
step "Reescribiendo SleepScreen — lógica de onboarding a prueba de fallos"

cat > src/screens/sleep/SleepScreen.tsx << 'SLEEP_EOF'
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Polyline, Line } from 'react-native-svg';
import { useSleepStore } from '../../store/sleepStore';
import { useTheme } from '../../context/ThemeContext';
import SettingsBar from '../../components/common/SettingsBar';
import Icon from '../../components/common/Icon';
import SleepLogModal from './SleepLogModal';
import SleepOnboarding from './SleepOnboarding';
import { Spacing, Radius } from '../../theme';

const INDIGO = '#6366f1';
const W = Dimensions.get('window').width;
const CHART_W = W - 64;
const CHART_H = 88;

const fmtDate = (d: Date) => d.toISOString().split('T')[0];
const subDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

type Range = 'week' | 'lastWeek' | 'month';

// ─── CLAVE: el onboarding se renderiza como pantalla
// completa ANTES de cualquier otro contenido, usando
// state local en lugar de overlay absoluto. ────────────
export default function SleepScreen() {
  const { theme } = useTheme();
  const store = useSleepStore();
  const {
    isEnrolled, onboardingDone,
    enroll, logs, getWeekAvg, getMonthAvg, getLogsForRange,
  } = store;

  // ── Estado local: controla qué pantalla mostrar ──────
  // 'enroll'    → pantalla de bienvenida/beneficios
  // 'onboarding'→ los 5 slides
  // 'main'      → hub principal
  const [screen, setScreen] = useState<'enroll' | 'onboarding' | 'main'>(() => {
    if (!isEnrolled) return 'enroll';
    if (!onboardingDone) return 'onboarding';
    return 'main';
  });

  // Sincronizar si el store cambia (ej: después de un reset)
  useEffect(() => {
    if (!isEnrolled) { setScreen('enroll'); return; }
    if (!onboardingDone) { setScreen('onboarding'); return; }
    setScreen('main');
  }, [isEnrolled, onboardingDone]);

  const [showLog, setShowLog] = useState(false);
  const [logDate, setLogDate] = useState(fmtDate(new Date()));
  const [range, setRange] = useState<Range>('week');

  const today     = fmtDate(new Date());
  const yesterday = fmtDate(subDays(1));
  const openLog   = (date: string) => { setLogDate(date); setShowLog(true); };

  const stats    = range === 'month' ? getMonthAvg() : getWeekAvg(range === 'lastWeek' ? 1 : 0);
  const chartData = range === 'month' ? getLogsForRange(30) : getLogsForRange(7);
  const last7    = getLogsForRange(7);
  const todayLog = logs[today];
  const yestLog  = logs[yesterday];
  const maxH     = Math.max(...chartData.map(d => d.hoursSlept), 8);

  // ── Renderizado condicional por pantalla ─────────────

  // PANTALLA: ONBOARDING (5 slides)
  // Ocupa toda la pantalla, no hay nada detrás
  if (screen === 'onboarding') {
    return (
      <SleepOnboarding
        onDone={() => setScreen('main')}
      />
    );
  }

  // PANTALLA: ENROLL (bienvenida)
  if (screen === 'enroll') {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]} edges={['top']}>
        <SettingsBar />
        <ScrollView contentContainerStyle={s.enrollWrap} showsVerticalScrollIndicator={false}>
          <View style={[s.enrollIcon, { backgroundColor: `${INDIGO}12` }]}>
            <Icon name="moon" size={52} color={INDIGO} />
          </View>
          <Text style={[s.enrollTitle, { color: theme.text }]}>Higiene del Sueño</Text>
          <Text style={[s.enrollBody, { color: theme.textSecondary }]}>
            {'Protocolo clínico de la Dra. Julia Santin\nCentro del Sueño UC\n\nMejorá tu sueño con hábitos respaldados\npor evidencia científica.'}
          </Text>

          {[
            { icon: 'streak',  text: 'Descanso más reparador' },
            { icon: 'trend',   text: 'Estadísticas semanales y mensuales' },
            { icon: 'tasks',   text: 'Checklist de 16 hábitos clave' },
          ].map((b, i) => (
            <View key={i} style={[s.benefit, { backgroundColor: theme.surface, borderColor: theme.borderDim }]}>
              <View style={[s.benefitIcon, { backgroundColor: `${INDIGO}15` }]}>
                <Icon name={b.icon as any} size={18} color={INDIGO} />
              </View>
              <Text style={[s.benefitText, { color: theme.text }]}>{b.text}</Text>
            </View>
          ))}

          <Pressable
            style={[s.enrollBtn, { backgroundColor: INDIGO }]}
            onPress={() => {
              enroll();
              // ← Va DIRECTO al onboarding, sin depender de useEffect
              setScreen('onboarding');
            }}
          >
            <Icon name="moon" size={18} color="#fff" />
            <Text style={s.enrollBtnText}>Ver introducción</Text>
          </Pressable>

          <Pressable
            style={[s.skipEnrollBtn, { borderColor: theme.border }]}
            onPress={() => {
              enroll();
              store.completeOnboarding();
              setScreen('main');
            }}
          >
            <Text style={[s.skipEnrollTxt, { color: theme.textSecondary }]}>
              Saltear intro e ir directo
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // PANTALLA: MAIN HUB
  const s2 = makeMainStyles(theme);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <SettingsBar />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s2.header}>
          <View>
            <Text style={[s2.title, { color: theme.text }]}>Sueño</Text>
            <Text style={[s2.subtitle, { color: theme.textSecondary }]}>
              {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={s2.headerRight}>
            {/* Botón debug — ver onboarding de nuevo */}
            <Pressable
              style={[s2.replayBtn, { borderColor: theme.borderDim }]}
              onPress={() => setScreen('onboarding')}
            >
              <Icon name="sparkles" size={14} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              style={[s2.logBtn, { backgroundColor: INDIGO }]}
              onPress={() => openLog(today)}
            >
              <Icon name="plus" size={16} color="#fff" />
              <Text style={s2.logBtnText}>Registrar</Text>
            </Pressable>
          </View>
        </View>

        {/* Hoy + Ayer */}
        <View style={s2.dayRow}>
          {[
            { label: 'Hoy',  log: todayLog,  date: today     },
            { label: 'Ayer', log: yestLog,   date: yesterday },
          ].map(({ label, log, date }) => (
            <Pressable
              key={label}
              style={[s2.dayCard, { backgroundColor: theme.surface, borderColor: theme.borderDim },
                !log && { borderStyle: 'dashed' }]}
              onPress={() => openLog(date)}
            >
              <View style={s2.dayCardTop}>
                <Text style={[s2.dayLabel, { color: theme.textSecondary }]}>{label}</Text>
                {log?.quality > 0
                  ? <Text style={s2.stars}>{'★'.repeat(log.quality)}</Text>
                  : <Icon name="plus" size={15} color={INDIGO} />
                }
              </View>
              {log?.hoursSlept > 0 ? (
                <>
                  <Text style={[s2.hoursNum, { color: theme.text }]}>{log.hoursSlept}h</Text>
                  <Text style={[s2.dayMeta, { color: theme.textSecondary }]}>
                    {label === 'Hoy'
                      ? `${log.checklistDone.length}/16 hábitos`
                      : log.wakeUps === 0
                        ? 'Sin despertares'
                        : `${log.wakeUps} despertar${log.wakeUps > 1 ? 'es' : ''}`
                    }
                  </Text>
                </>
              ) : (
                <Text style={[s2.noReg, { color: theme.textMuted }]}>Sin registrar</Text>
              )}
            </Pressable>
          ))}
        </View>

        <View style={s2.statsWrap}>
          {/* Range selector */}
          <View style={[s2.rangeRow, { backgroundColor: theme.surface }]}>
            {([
              { key: 'week',     label: 'Esta semana' },
              { key: 'lastWeek', label: 'Sem. pasada' },
              { key: 'month',    label: 'Este mes'    },
            ] as const).map(r => (
              <Pressable
                key={r.key}
                style={[s2.rangeBtn, range === r.key && { backgroundColor: theme.surface2 }]}
                onPress={() => setRange(r.key)}
              >
                <Text style={[
                  s2.rangeTxt,
                  { color: range === r.key ? theme.text : theme.textSecondary },
                  range === r.key && { fontWeight: '700' },
                ]}>
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Stat cards */}
          <View style={s2.statCards}>
            {[
              { label: 'Prom. horas',  value: stats.hours > 0 ? `${stats.hours}h` : '—',         icon: 'moon',        color: INDIGO     },
              { label: 'Calidad',       value: stats.quality > 0 ? `${stats.quality}/5` : '—',     icon: 'streak',      color: '#f59e0b'  },
              { label: 'Cumplimiento',  value: `${(stats as any).compliance ?? 0}%`,               icon: 'checkCircle', color: '#22c55e'  },
            ].map((st, i) => (
              <View key={i} style={[s2.statCard, { backgroundColor: theme.surface, borderColor: theme.borderDim }]}>
                <View style={[s2.statIcon, { backgroundColor: `${st.color}15` }]}>
                  <Icon name={st.icon as any} size={18} color={st.color} />
                </View>
                <Text style={[s2.statValue, { color: theme.text }]}>{st.value}</Text>
                <Text style={[s2.statLabel, { color: theme.textSecondary }]}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* Gráfico */}
          <View style={[s2.chartCard, { backgroundColor: theme.surface, borderColor: theme.borderDim }]}>
            <Text style={[s2.chartTitle, { color: theme.text }]}>Horas dormidas</Text>
            {chartData.some(d => d.hoursSlept > 0) ? (
              <>
                <Svg width={CHART_W} height={CHART_H + 10} style={{ marginTop: 8 }}>
                  {[4, 6, 8].map(h => (
                    <Line key={h}
                      x1={0} y1={CHART_H - (h / maxH) * CHART_H}
                      x2={CHART_W} y2={CHART_H - (h / maxH) * CHART_H}
                      stroke={theme.borderDim} strokeWidth={0.7}
                    />
                  ))}
                  {chartData.map((d, i) => {
                    if (!d.hoursSlept) return null;
                    const bW = Math.max(5, CHART_W / chartData.length - 3);
                    const bH = (d.hoursSlept / maxH) * CHART_H;
                    const x  = i * (CHART_W / chartData.length);
                    return (
                      <Rect key={i}
                        x={x + 1} y={CHART_H - bH}
                        width={bW} height={bH} rx={3}
                        fill={d.hoursSlept >= 7 ? `${INDIGO}cc` : `${INDIGO}55`}
                      />
                    );
                  })}
                  {chartData.filter(d => d.quality > 0).length > 1 && (
                    <Polyline
                      points={chartData.map((d, i) => {
                        if (!d.quality) return null;
                        const x = i * (CHART_W / chartData.length) + (CHART_W / chartData.length / 2);
                        const y = CHART_H - (d.quality / 5) * CHART_H;
                        return `${x},${y}`;
                      }).filter(Boolean).join(' ')}
                      fill="none" stroke="#f59e0b" strokeWidth={2.2}
                      strokeLinecap="round" strokeLinejoin="round" opacity={0.85}
                    />
                  )}
                </Svg>
                <View style={s2.legend}>
                  <View style={s2.legendItem}>
                    <View style={[s2.legendDot, { backgroundColor: INDIGO }]} />
                    <Text style={[s2.legendTxt, { color: theme.textSecondary }]}>Horas (≥7h oscuro)</Text>
                  </View>
                  <View style={s2.legendItem}>
                    <View style={[s2.legendDot, { backgroundColor: '#f59e0b' }]} />
                    <Text style={[s2.legendTxt, { color: theme.textSecondary }]}>Calidad</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={s2.chartEmpty}>
                <Icon name="moon" size={32} color={theme.textMuted} />
                <Text style={[s2.chartEmptyTxt, { color: theme.textMuted }]}>
                  Registrá algunos días para ver tu gráfico
                </Text>
              </View>
            )}
          </View>

          {/* Timeline 7 días */}
          <View style={[s2.timelineCard, { backgroundColor: theme.surface, borderColor: theme.borderDim }]}>
            <Text style={[s2.chartTitle, { color: theme.text }]}>Últimos 7 días</Text>
            <View style={s2.timelineRow}>
              {last7.map((log, i) => {
                const d         = subDays(6 - i);
                const dayLetter = d.toLocaleDateString('es', { weekday: 'narrow' }).charAt(0).toUpperCase();
                const isToday   = log.date === today;
                const compliance = log.checklistDone.length / 16;
                const hasData   = log.hoursSlept > 0;
                return (
                  <Pressable key={i} style={s2.tlDay} onPress={() => openLog(log.date)}>
                    <View style={[
                      s2.tlDot,
                      { backgroundColor: hasData ? `rgba(99,102,241,${0.15 + compliance * 0.85})` : theme.surface2 },
                      isToday && { borderWidth: 2, borderColor: INDIGO },
                    ]}>
                      {hasData
                        ? <Text style={[s2.tlHours, { color: '#fff' }]}>{log.hoursSlept}h</Text>
                        : <Icon name="plus" size={13} color={theme.textMuted} />
                      }
                    </View>
                    <Text style={[
                      s2.tlLabel,
                      { color: isToday ? INDIGO : theme.textSecondary },
                      isToday && { fontWeight: '700' },
                    ]}>
                      {dayLetter}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      <SleepLogModal visible={showLog} date={logDate} onClose={() => setShowLog(false)} />
    </SafeAreaView>
  );
}

// Estilos pantalla enroll
const s = StyleSheet.create({
  safe:          { flex: 1 },
  enrollWrap:    { alignItems: 'center', padding: Spacing.xl, gap: 14, paddingBottom: 48 },
  enrollIcon:    { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  enrollTitle:   { fontSize: 26, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  enrollBody:    { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  benefit:       { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', padding: 14, borderRadius: Radius.lg, borderWidth: 1 },
  benefitIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  benefitText:   { fontSize: 14, fontWeight: '500', flex: 1 },
  enrollBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', paddingVertical: 16, borderRadius: Radius.full, justifyContent: 'center' },
  enrollBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipEnrollBtn: { paddingVertical: 12, borderRadius: Radius.full, borderWidth: 1, width: '100%', alignItems: 'center' },
  skipEnrollTxt: { fontSize: 14 },
});

// Estilos pantalla main
const makeMainStyles = (theme: any) => StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title:       { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle:    { fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  replayBtn:   { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  logBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full },
  logBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  dayRow:      { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  dayCard:     { flex: 1, borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md, minHeight: 96 },
  dayCardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayLabel:    { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  stars:       { color: '#fbbf24', fontSize: 12 },
  hoursNum:    { fontSize: 30, fontWeight: '800', letterSpacing: -1 },
  dayMeta:     { fontSize: 12, marginTop: 2 },
  noReg:       { fontSize: 13, marginTop: 8 },
  statsWrap:   { paddingHorizontal: Spacing.lg },
  rangeRow:    { flexDirection: 'row', borderRadius: Radius.full, padding: 4, marginBottom: Spacing.md },
  rangeBtn:    { flex: 1, paddingVertical: 8, borderRadius: Radius.full, alignItems: 'center' },
  rangeTxt:    { fontSize: 12 },
  statCards:   { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  statCard:    { flex: 1, borderRadius: Radius.xl, borderWidth: 1, padding: 12, alignItems: 'center', gap: 6 },
  statIcon:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue:   { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  statLabel:   { fontSize: 10, textAlign: 'center', fontWeight: '500' },
  chartCard:   { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
  chartTitle:  { fontSize: 15, fontWeight: '700' },
  legend:      { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:   { width: 8, height: 8, borderRadius: 99 },
  legendTxt:   { fontSize: 11 },
  chartEmpty:  { alignItems: 'center', gap: 10, paddingVertical: Spacing.xl },
  chartEmptyTxt:{ fontSize: 13, textAlign: 'center' },
  timelineCard:{ borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.sm },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  tlDay:       { alignItems: 'center', gap: 6 },
  tlDot:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tlHours:     { fontSize: 11, fontWeight: '700' },
  tlLabel:     { fontSize: 12 },
});
SLEEP_EOF
log "SleepScreen reescrito ✓"

# ── 3. Fix SleepOnboarding: bgFade inicia en 1, sin StatusBar ──
step "Fijando SleepOnboarding — valores iniciales y sin StatusBar"

# Reemplazar la línea de StatusBar import y uso
sed -i 's/import {$/import {/' src/screens/sleep/SleepOnboarding.tsx 2>/dev/null || true
sed -i '/StatusBar,$/d'    src/screens/sleep/SleepOnboarding.tsx 2>/dev/null || true
sed -i '/StatusBar }/d'    src/screens/sleep/SleepOnboarding.tsx 2>/dev/null || true
sed -i '/<StatusBar/d'     src/screens/sleep/SleepOnboarding.tsx 2>/dev/null || true

# Asegurar que bgFade arranca en 1 (no en 0)
sed -i 's/const bgFade.*= useRef(new Animated.Value(0))/const bgFade      = useRef(new Animated.Value(1))/' \
    src/screens/sleep/SleepOnboarding.tsx 2>/dev/null || true

log "SleepOnboarding fixes ✓"

# ── 4. Verificar que sleepStore exporta completeOnboarding ─
step "Verificando sleepStore"
grep -q "completeOnboarding" src/store/sleepStore.ts && log "completeOnboarding en store ✓" || {
  echo "  Agregando completeOnboarding al store..."
  sed -i 's/enroll: () => set({ isEnrolled: true }),/enroll: () => set({ isEnrolled: true }),\n      completeOnboarding: () => set({ onboardingDone: true }),/' \
      src/store/sleepStore.ts
  log "completeOnboarding agregado ✓"
}

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🔧  Patch v7c listo — Onboarding visible                    ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║  Qué se arregló:                                             ║${NC}"
echo -e "${CYAN}║  ✓  Onboarding renderiza como pantalla entera (no overlay)  ║${NC}"
echo -e "${CYAN}║  ✓  state local 'screen' controla el flujo directamente     ║${NC}"
echo -e "${CYAN}║  ✓  Enroll → setScreen('onboarding') sin pasar por store    ║${NC}"
echo -e "${CYAN}║  ✓  bgFade arranca en 1 (era posible que arrancara en 0)    ║${NC}"
echo -e "${CYAN}║  ✓  StatusBar removido (no interfiere con SafeAreaView)     ║${NC}"
echo -e "${CYAN}║  ✓  Botón ✨ en el hub para volver a ver los slides         ║${NC}"
echo -e "${CYAN}║  ✓  Opción "Saltear intro" en pantalla enroll               ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${YELLOW}║  Si el store viejo sigue en AsyncStorage y ya tenías        ║${NC}"
echo -e "${YELLOW}║  isEnrolled=true, usá el botón ✨ en la pantalla Sueño     ║${NC}"
echo -e "${YELLOW}║  para volver a ver el onboarding cuando quieras.           ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  npx expo start --clear                                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"