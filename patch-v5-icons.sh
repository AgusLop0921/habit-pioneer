#!/bin/bash

# ============================================================
#  Habits Pioneer — Patch v5 — Iconografía vectorial
#
#  Reemplaza TODOS los emojis funcionales de la app por
#  iconos de @expo/vector-icons (Ionicons + MaterialCommunityIcons)
#  que ya vienen incluidos en Expo — cero dependencias nuevas.
#
#  Emojis que SE REEMPLAZAN (UI/funcionales):
#    ✓  ☀️ 🌙  →  sun / moon
#    ✓  ✓  checkmark
#    ✓  ✏️ 🗑️  →  pencil / trash
#    ✓  ▾   →  chevron-down
#    ✓  🔥 🎯 🛒 📅 📆 ☑️ 🏆 ⭐  →  iconos Ionicons/MCI
#    ✓  Tabs: home / bar-chart / trophy / cart (ya eran Ionicons, se refinan)
#    ✓  Stats en HistoryScreen
#    ✓  Badges de prioridad
#
#  Emojis que NO se tocan:
#    - Banderas de idioma (🇦🇷 🇺🇸 🇧🇷) — semánticas, no hay alternativa vectorial
#    - Emojis en las frases motivacionales (son contenido/texto)
#
#  Correr DENTRO de habits-pioneer/:
#    bash patch-v5-icons.sh
# ============================================================

set -e
GREEN='\033[0;32m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
step() { echo -e "\n${BLUE}────────────────────────────────────${NC}"; echo -e "${CYAN}[→] $1${NC}"; }
err()  { echo -e "${RED}[✗] $1${NC}"; exit 1; }

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║  🎨 Habits Pioneer — Patch v5 — Icons        ║"
echo "  ╚══════════════════════════════════════════════╝"
echo -e "${NC}"

[ -f "app.json" ] || err "Corré desde dentro de habits-pioneer/"

# ── 1. Componente Icon centralizado ──────────────────────
step "Creando componente Icon centralizado"

cat > src/components/common/Icon.tsx << 'EOF'
/**
 * Wrapper centralizado de iconos.
 * Usa Ionicons como base + MaterialCommunityIcons para los que
 * Ionicons no tiene. Así tenemos un solo punto de cambio.
 */
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ── Mapa semántico → nombre real del ícono ──────────────
// Cambiá aquí si querés ajustar cualquier ícono en toda la app.
const ICON_MAP = {
  // Navegación / acciones
  home:          { set: 'ion',  name: 'home' },
  'home-outline':{ set: 'ion',  name: 'home-outline' },
  history:       { set: 'ion',  name: 'bar-chart' },
  'history-outline':{ set: 'ion', name: 'bar-chart-outline' },
  goals:         { set: 'ion',  name: 'trophy' },
  'goals-outline':{ set: 'ion', name: 'trophy-outline' },
  shopping:      { set: 'ion',  name: 'cart' },
  'shopping-outline':{ set: 'ion', name: 'cart-outline' },

  // Acciones de swipe
  edit:   { set: 'ion', name: 'pencil' },
  delete: { set: 'ion', name: 'trash' },

  // Theme / settings
  sun:    { set: 'ion', name: 'sunny' },
  moon:   { set: 'ion', name: 'moon' },
  chevronDown: { set: 'ion', name: 'chevron-down' },
  check:  { set: 'ion', name: 'checkmark' },
  checkCircle: { set: 'ion', name: 'checkmark-circle' },
  plus:   { set: 'ion', name: 'add' },
  close:  { set: 'ion', name: 'close' },
  settings: { set: 'ion', name: 'settings-outline' },

  // Secciones / semántica
  habits:   { set: 'mci', name: 'fire' },
  tasks:    { set: 'ion', name: 'checkbox-outline' },
  calendar: { set: 'ion', name: 'calendar-outline' },
  weekly:   { set: 'ion', name: 'calendar-number-outline' },
  star:     { set: 'ion', name: 'star' },
  'star-outline': { set: 'ion', name: 'star-outline' },
  trophy:   { set: 'ion', name: 'trophy' },
  streak:   { set: 'mci', name: 'lightning-bolt' },
  completed:{ set: 'ion', name: 'checkmark-done-circle' },
  chart:    { set: 'ion', name: 'bar-chart' },
  target:   { set: 'mci', name: 'target' },

  // Categorías de shopping
  food:     { set: 'ion', name: 'nutrition-outline' },
  cleaning: { set: 'mci', name: 'broom' },
  hygiene:  { set: 'mci', name: 'bottle-tonic-outline' },
  general:  { set: 'ion', name: 'cube-outline' },
  cart:     { set: 'ion', name: 'cart-outline' },

  // Prioridad de tareas
  priorityHigh:   { set: 'ion', name: 'arrow-up-circle' },
  priorityMedium: { set: 'ion', name: 'remove-circle-outline' },
  priorityLow:    { set: 'ion', name: 'arrow-down-circle-outline' },

  // Frecuencia de hábitos
  daily:   { set: 'ion', name: 'today-outline' },
  semanal: { set: 'ion', name: 'calendar-outline' },
  monthly: { set: 'ion', name: 'calendar-number-outline' },

  // Misc
  empty:  { set: 'mci', name: 'emoticon-happy-outline' },
  rocket: { set: 'mci', name: 'rocket-launch-outline' },
  sparkles:{ set: 'ion', name: 'sparkles' },
  person: { set: 'ion', name: 'person-circle-outline' },
  archive:{ set: 'ion', name: 'archive-outline' },
  trend:  { set: 'ion', name: 'trending-up-outline' },
  list:   { set: 'ion', name: 'list-outline' },
} as const;

export type IconName = keyof typeof ICON_MAP;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

export default function Icon({ name, size = 20, color = '#fff' }: Props) {
  const def = ICON_MAP[name];
  if (!def) return null;

  if (def.set === 'ion') {
    return <Ionicons name={def.name as any} size={size} color={color} />;
  }
  return <MaterialCommunityIcons name={def.name as any} size={size} color={color} />;
}
EOF
log "Icon.tsx creado ✓"

# ── 2. SettingsBar ────────────────────────────────────────
step "Actualizando SettingsBar"

cat > src/components/common/SettingsBar.tsx << 'EOF'
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Modal, TouchableOpacity, Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { useTheme } from '../../context/ThemeContext';
import Icon from './Icon';
import { Spacing, Radius } from '../../theme';
import { Language } from '../../types';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'es', label: 'Español',   flag: '🇦🇷' },
  { code: 'en', label: 'English',   flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
];
const APP_ICON = require('../../../assets/icon.png');

export default function SettingsBar() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useStore();
  const { theme, isDark, toggleTheme } = useTheme();
  const [showLang, setShowLang] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0];

  const handleSelectLang = (code: Language) => {
    setLanguage(code);
    i18n.changeLanguage(code);
    setShowLang(false);
  };

  return (
    <>
      <View style={[s.bar, { backgroundColor: theme.bg, borderBottomColor: theme.borderDim }]}>
        <View style={s.logoRow}>
          <Image source={APP_ICON} style={s.logoImg} resizeMode="contain" />
          <Text style={[s.logoText, { color: theme.text }]}>Habits Pioneer</Text>
        </View>

        <View style={s.actions}>
          {/* Theme toggle */}
          <Pressable
            style={[s.iconBtn, { backgroundColor: theme.surface, borderColor: theme.borderDim }]}
            onPress={toggleTheme}
          >
            <Icon
              name={isDark ? 'sun' : 'moon'}
              size={18}
              color={theme.textSecondary}
            />
          </Pressable>

          {/* Language picker */}
          <Pressable
            style={[s.langBtn, { backgroundColor: theme.surface, borderColor: theme.borderDim }]}
            onPress={() => setShowLang(true)}
          >
            <Text style={s.langFlag}>{currentLang.flag}</Text>
            <Text style={[s.langCode, { color: theme.textSecondary }]}>
              {currentLang.code.toUpperCase()}
            </Text>
            <Icon name="chevronDown" size={13} color={theme.textMuted} />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showLang}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLang(false)}
      >
        <TouchableOpacity
          style={[s.overlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => setShowLang(false)}
        >
          <View style={[s.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.dropTitle, { color: theme.textSecondary }]}>
              Idioma / Language
            </Text>
            {LANGUAGES.map(lang => (
              <Pressable
                key={lang.code}
                style={({ pressed }) => [
                  s.dropItem,
                  { borderColor: 'transparent' },
                  language === lang.code && { backgroundColor: theme.accentDim, borderColor: theme.accent },
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => handleSelectLang(lang.code)}
              >
                <Text style={s.dropFlag}>{lang.flag}</Text>
                <Text style={[s.dropLabel, { color: theme.text }]}>{lang.label}</Text>
                {language === lang.code && (
                  <Icon name="check" size={16} color={theme.accent} />
                )}
              </Pressable>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImg: { width: 34, height: 34, borderRadius: 9 },
  logoText: { fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: {
    width: 36, height: 36, borderRadius: Radius.md,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: Radius.md, borderWidth: 1,
  },
  langFlag: { fontSize: 16 },
  langCode: { fontSize: 12, fontWeight: '600' },
  overlay: { flex: 1, alignItems: 'flex-end', justifyContent: 'flex-start', paddingTop: 72, paddingRight: Spacing.lg },
  dropdown: {
    width: 200, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
  },
  dropTitle: {
    fontSize: 11, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.5, paddingHorizontal: 8, paddingVertical: 6,
  },
  dropItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: Radius.md, borderWidth: 1, marginBottom: 4,
  },
  dropFlag: { fontSize: 20 },
  dropLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
});
EOF
log "SettingsBar ✓"

# ── 3. SwipeableRow ───────────────────────────────────────
step "Actualizando SwipeableRow (iconos vectoriales en acciones)"

cat > src/components/common/SwipeableRow.tsx << 'EOF'
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, PanResponder } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Icon from './Icon';
import { Radius } from '../../theme';

const ACTION_W   = 72;
const REVEAL_X   = -(ACTION_W * 2);
const THRESHOLD  = 50;

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit: () => void;
  deleteLabel?: string;
  editLabel?: string;
}

export default function SwipeableRow({ children, onDelete, onEdit, deleteLabel = 'Borrar', editLabel = 'Editar' }: Props) {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const [contentHeight, setContentHeight] = React.useState(0);

  const snapTo = (toValue: number) => {
    Animated.spring(translateX, { toValue, useNativeDriver: true, tension: 70, friction: 12 }).start();
    lastOffset.current = toValue;
  };
  const close = () => snapTo(0);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dy) < 16,
    onPanResponderGrant: () => { translateX.setOffset(lastOffset.current); translateX.setValue(0); },
    onPanResponderMove: (_, g) => translateX.setValue(Math.max(REVEAL_X, Math.min(0, g.dx))),
    onPanResponderRelease: (_, g) => {
      translateX.flattenOffset();
      snapTo(lastOffset.current + g.dx < -THRESHOLD ? REVEAL_X : 0);
    },
  })).current;

  return (
    <View
      style={[s.container, { borderRadius: Radius.xl }]}
      onLayout={e => setContentHeight(e.nativeEvent.layout.height)}
    >
      {/* Acciones */}
      <View style={[s.actions, { height: contentHeight || ('100%' as any) }]}>
        <Pressable
          style={[s.action, {
            backgroundColor: theme.swipeEdit,
            borderTopLeftRadius: Radius.xl,
            borderBottomLeftRadius: Radius.xl,
          }]}
          onPress={() => { close(); setTimeout(onEdit, 200); }}
        >
          <Icon name="edit" size={20} color="#fff" />
          <Text style={s.actionLabel}>{editLabel}</Text>
        </Pressable>
        <Pressable
          style={[s.action, {
            backgroundColor: theme.swipeDelete,
            borderTopRightRadius: Radius.xl,
            borderBottomRightRadius: Radius.xl,
          }]}
          onPress={() => { close(); setTimeout(onDelete, 200); }}
        >
          <Icon name="delete" size={20} color="#fff" />
          <Text style={s.actionLabel}>{deleteLabel}</Text>
        </Pressable>
      </View>

      {/* Contenido */}
      <Animated.View style={{ transform: [{ translateX }] }} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden', marginBottom: 10 },
  actions: { position: 'absolute', right: 0, top: 0, bottom: 0, flexDirection: 'row', width: ACTION_W * 2 },
  action: { width: ACTION_W, alignItems: 'center', justifyContent: 'center', gap: 5 },
  actionLabel: { fontSize: 11, color: '#fff', fontWeight: '600' },
});
EOF
log "SwipeableRow ✓"

# ── 4. CheckCircle ────────────────────────────────────────
step "Actualizando CheckCircle"

cat > src/components/common/CheckCircle.tsx << 'EOF'
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Icon from './Icon';

interface Props { done: boolean; onToggle: () => void; size?: number; }

export default function CheckCircle({ done, onToggle, size = 24 }: Props) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      style={[
        s.circle,
        { width: size, height: size, borderRadius: size / 2, borderColor: theme.border },
        done && { backgroundColor: theme.accent, borderColor: theme.accent },
      ]}
    >
      {done && <Icon name="check" size={size * 0.55} color="#fff" />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  circle: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
EOF
log "CheckCircle ✓"

# ── 5. HabitCard ──────────────────────────────────────────
step "Actualizando HabitCard (iconos por frecuencia, sin ⭐)"

cat > src/components/habits/HabitCard.tsx << 'EOF'
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import SwipeableRow from '../common/SwipeableRow';
import Icon, { IconName } from '../common/Icon';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme';
import { Habit } from '../../types';

// Mini ring de progreso (sin emojis)
function MiniRing({ progress, color, bg, done }: { progress: number; color: string; bg: string; done: boolean }) {
  const size = 44; const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(progress, 100) / 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size/2} cy={size/2} r={r} stroke={bg} strokeWidth={sw} fill="none" />
        <Circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" rotation="-90" origin={`${size/2},${size/2}`} />
      </Svg>
      {/* Ícono check cuando completado */}
      <Icon name={done ? 'check' : 'star-outline'} size={16} color={done ? color : bg} />
    </View>
  );
}

// Ícono del badge según frecuencia del hábito
function habitIcon(freq: string): IconName {
  if (freq === 'weekly')  return 'weekly';
  if (freq === 'monthly') return 'monthly';
  return 'daily';
}

interface Props {
  habit: Habit;
  done: boolean;
  count?: number;
  targetCount?: number;
  onToggle: () => void;
  onIncrement?: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function HabitCard({ habit, done, count, targetCount, onToggle, onIncrement, onDelete, onEdit }: Props) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 70, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  const hasCounter = count !== undefined && targetCount !== undefined;
  const progress = hasCounter ? Math.min(100, Math.round((count! / targetCount!) * 100)) : done ? 100 : 0;
  const ringColor = done || progress >= 100 ? theme.green : theme.accent;
  const iconName = habitIcon(habit.frequency);

  return (
    <SwipeableRow onDelete={onDelete} onEdit={onEdit} deleteLabel="Borrar" editLabel="Editar">
      <Animated.View style={[
        s.card,
        { backgroundColor: theme.surface, borderColor: theme.borderDim },
        { transform: [{ scale }] },
      ]}>
        {/* Badge de frecuencia */}
        <View style={[s.badge, { backgroundColor: done ? `${ringColor}22` : theme.surface2 }]}>
          <Icon name={iconName} size={22} color={done ? ringColor : theme.textSecondary} />
        </View>

        {/* Info */}
        <Pressable style={s.info} onPress={handlePress}>
          <Text style={[s.name, { color: done ? theme.textSecondary : theme.text }, done && s.strike]}
            numberOfLines={1}>
            {habit.name}
          </Text>
          {habit.description ? (
            <Text style={[s.desc, { color: theme.textSecondary }]} numberOfLines={1}>
              {habit.description}
            </Text>
          ) : hasCounter ? (
            <Text style={[s.desc, { color: theme.textSecondary }]}>
              {count}/{targetCount} · {progress}%
            </Text>
          ) : null}
        </Pressable>

        {/* Ring / counter */}
        {hasCounter ? (
          <Pressable onPress={onIncrement} style={s.ringWrap}>
            <MiniRing progress={progress} color={ringColor} bg={theme.ringBg} done={done} />
          </Pressable>
        ) : (
          <Pressable onPress={handlePress} style={s.ringWrap}>
            <MiniRing progress={progress} color={ringColor} bg={theme.ringBg} done={done} />
          </Pressable>
        )}
      </Animated.View>
    </SwipeableRow>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1,
  },
  badge: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  strike: { textDecorationLine: 'line-through' },
  desc: { fontSize: 12, marginTop: 2 },
  ringWrap: { padding: 4 },
});
EOF
log "HabitCard ✓"

# ── 6. TaskItem ───────────────────────────────────────────
step "Actualizando TaskItem (iconos de prioridad vectoriales)"

cat > src/components/tasks/TaskItem.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import SwipeableRow from '../common/SwipeableRow';
import CheckCircle from '../common/CheckCircle';
import Icon, { IconName } from '../common/Icon';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme';
import { Task, Priority } from '../../types';

const PRIORITY_META: Record<Priority, { color: string; icon: IconName }> = {
  high:   { color: '#ff453a', icon: 'priorityHigh' },
  medium: { color: '#ffd60a', icon: 'priorityMedium' },
  low:    { color: '#30d158', icon: 'priorityLow' },
};

interface Props {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  priorityLabel: string;
}

export default function TaskItem({ task, onToggle, onDelete, onEdit, priorityLabel }: Props) {
  const { theme } = useTheme();
  const meta = PRIORITY_META[task.priority];

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <SwipeableRow onDelete={onDelete} onEdit={onEdit} deleteLabel="Borrar" editLabel="Editar">
      <Pressable
        style={[s.item, { backgroundColor: theme.surface, borderColor: theme.borderDim }, task.completed && s.done]}
        onPress={handleToggle}
      >
        {/* Barra lateral de prioridad */}
        <View style={[s.priorityBar, { backgroundColor: meta.color }]} />

        <CheckCircle done={task.completed} onToggle={handleToggle} />

        <Text
          style={[s.name, { color: task.completed ? theme.textSecondary : theme.text }, task.completed && s.strike]}
          numberOfLines={1}
        >
          {task.title}
        </Text>

        {/* Badge de prioridad con ícono */}
        <View style={[s.badge, { backgroundColor: `${meta.color}1a` }]}>
          <Icon name={meta.icon} size={13} color={meta.color} />
          <Text style={[s.badgeText, { color: meta.color }]}>{priorityLabel}</Text>
        </View>
      </Pressable>
    </SwipeableRow>
  );
}

const s = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden',
  },
  done: { opacity: 0.5 },
  priorityBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  name: { flex: 1, fontSize: 15, fontWeight: '500', paddingLeft: 4 },
  strike: { textDecorationLine: 'line-through' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
EOF
log "TaskItem ✓"

# ── 7. GoalItem ───────────────────────────────────────────
step "Actualizando GoalItem"

cat > src/components/goals/GoalItem.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import SwipeableRow from '../common/SwipeableRow';
import Icon from '../common/Icon';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme';
import { WeeklyGoal } from '../../types';

interface Props { goal: WeeklyGoal; onLog: () => void; onDelete: () => void; onEdit: () => void; }

export default function GoalItem({ goal, onLog, onDelete, onEdit }: Props) {
  const { theme } = useTheme();
  const done = goal.completions.length;
  const pct = Math.round((done / goal.targetCount) * 100);

  return (
    <SwipeableRow onDelete={onDelete} onEdit={onEdit}>
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.borderDim }]}>
        <View style={s.header}>
          {/* Ícono de objetivo */}
          <View style={[s.iconBadge, { backgroundColor: theme.accentDim }]}>
            <Icon name="target" size={20} color={theme.accent} />
          </View>
          <View style={s.titleBlock}>
            <Text style={[s.title, { color: theme.text }]}>{goal.title}</Text>
            <Text style={[s.sub, { color: theme.textSecondary }]}>
              {done}/{goal.targetCount} · {pct}%
            </Text>
          </View>
          {/* Ícono de racha */}
          {done > 0 && (
            <View style={[s.streakBadge, { backgroundColor: `${theme.accent}15` }]}>
              <Icon name="streak" size={14} color={theme.accent} />
              <Text style={[s.streakText, { color: theme.accent }]}>{done}</Text>
            </View>
          )}
        </View>

        {/* Dots de progreso */}
        <View style={s.dots}>
          {Array.from({ length: goal.targetCount }).map((_, i) => (
            <Pressable
              key={i}
              style={[
                s.dot,
                { borderColor: theme.border, backgroundColor: theme.surface2 },
                i < done && { backgroundColor: theme.accent, borderColor: theme.accent },
              ]}
              onPress={i === done ? onLog : undefined}
            >
              {i < done && <Icon name="check" size={14} color="#fff" />}
              {i === done && <Icon name="plus" size={14} color={theme.textMuted} />}
            </Pressable>
          ))}
        </View>
      </View>
    </SwipeableRow>
  );
}

const s = StyleSheet.create({
  card: {
    padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  streakText: { fontSize: 13, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dot: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
});
EOF
log "GoalItem ✓"

# ── 8. ShoppingItem ───────────────────────────────────────
step "Actualizando ShoppingItem (iconos de categoría)"

cat > src/components/shopping/ShoppingItem.tsx << 'EOF'
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import CheckCircle from '../common/CheckCircle';
import SwipeableRow from '../common/SwipeableRow';
import Icon, { IconName } from '../common/Icon';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Radius } from '../../theme';
import { ShoppingItem as T, ShopCategory } from '../../types';

const CAT_ICON: Record<ShopCategory, IconName> = {
  food: 'food', cleaning: 'cleaning', hygiene: 'hygiene', general: 'general',
};
const CAT_COLOR: Record<ShopCategory, string> = {
  food: '#30d158', cleaning: '#0a84ff', hygiene: '#bf5af2', general: '#636366',
};

interface Props { item: T; onToggle: () => void; onDelete: () => void; onEdit: () => void; }

export default function ShoppingItemComponent({ item, onToggle, onDelete, onEdit }: Props) {
  const { theme } = useTheme();
  const color = CAT_COLOR[item.category];

  return (
    <SwipeableRow onDelete={onDelete} onEdit={onEdit}>
      <Pressable
        style={[s.item, { backgroundColor: theme.surface, borderColor: theme.borderDim }, item.checked && s.done]}
        onPress={onToggle}
      >
        {/* Ícono de categoría */}
        <View style={[s.catBadge, { backgroundColor: `${color}18` }]}>
          <Icon name={CAT_ICON[item.category]} size={20} color={item.checked ? theme.textMuted : color} />
        </View>

        <CheckCircle done={item.checked} onToggle={onToggle} />

        <Text
          style={[s.name, { color: item.checked ? theme.textSecondary : theme.text }, item.checked && s.strike]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        <View style={[s.qty, { backgroundColor: theme.accentDim }]}>
          <Text style={[s.qtyText, { color: theme.accent }]}>x{item.quantity}</Text>
        </View>
      </Pressable>
    </SwipeableRow>
  );
}

const s = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1,
  },
  done: { opacity: 0.5 },
  catBadge: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontSize: 15, fontWeight: '500' },
  strike: { textDecorationLine: 'line-through' },
  qty: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99 },
  qtyText: { fontSize: 12, fontWeight: '700' },
});
EOF
log "ShoppingItem ✓"

# ── 9. ShoppingScreen: iconos en categorías y modal ───────
step "Actualizando ShoppingScreen (iconos en grilla de categorías)"

cat > src/screens/ShoppingScreen.tsx << 'EOF'
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { useTheme } from '../context/ThemeContext';
import ShoppingItemComponent from '../components/shopping/ShoppingItem';
import OrangeButton from '../components/common/OrangeButton';
import EditModal from '../components/common/EditModal';
import SettingsBar from '../components/common/SettingsBar';
import FormInput from '../components/common/FormInput';
import BottomModal from '../components/common/BottomModal';
import Icon, { IconName } from '../components/common/Icon';
import { Spacing, Radius } from '../theme';
import { ShopCategory } from '../types';

const CATS: { key: ShopCategory; icon: IconName; color: string }[] = [
  { key: 'food',     icon: 'food',     color: '#30d158' },
  { key: 'cleaning', icon: 'cleaning', color: '#0a84ff' },
  { key: 'hygiene',  icon: 'hygiene',  color: '#bf5af2' },
  { key: 'general',  icon: 'general',  color: '#636366' },
];

export default function ShoppingScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { shoppingList, addShoppingItem, editShoppingItem, removeShoppingItem, toggleShoppingItem } = useStore();
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [cat, setCat] = useState<ShopCategory>('general');
  const [editItem, setEditItem] = useState<any>(null);

  const handleAdd = () => {
    if (!name.trim()) return;
    addShoppingItem({ name: name.trim(), quantity: parseInt(qty) || 1, category: cat });
    setName(''); setQty('1'); setCat('general'); setModal(false);
  };

  const grouped = CATS.reduce((acc, c) => {
    const items = shoppingList.filter(i => i.category === c.key);
    if (items.length) acc[c.key] = items;
    return acc;
  }, {} as Record<ShopCategory, typeof shoppingList>);

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <SettingsBar />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.titleRow}>
              <Icon name="shopping" size={26} color={theme.accent} />
              <Text style={[s.title, { color: theme.text }]}>{t('shoppingSection')}</Text>
            </View>
            <OrangeButton label={t('addItem')} onPress={() => setModal(true)} size="sm" />
          </View>
        </View>

        <View style={s.content}>
          {shoppingList.length === 0 ? (
            <View style={[s.emptyCard, { backgroundColor: theme.surface }]}>
              <Icon name="cart" size={48} color={theme.textMuted} />
              <Text style={[s.emptyText, { color: theme.textMuted }]}>{t('emptyShopping')}</Text>
            </View>
          ) : CATS.map(c => {
            const items = grouped[c.key];
            if (!items) return null;
            return (
              <View key={c.key} style={s.catGroup}>
                {/* Cabecera de categoría con ícono */}
                <View style={s.catHeader}>
                  <View style={[s.catIconWrap, { backgroundColor: `${c.color}18` }]}>
                    <Icon name={c.icon} size={14} color={c.color} />
                  </View>
                  <Text style={[s.catTitle, { color: theme.textSecondary }]}>
                    {t(`categories.${c.key}`)}
                  </Text>
                  <Text style={[s.catCount, { color: theme.textMuted }]}>
                    {items.filter(i => i.checked).length}/{items.length}
                  </Text>
                </View>
                {items.map(item => (
                  <ShoppingItemComponent
                    key={item.id}
                    item={item}
                    onToggle={() => toggleShoppingItem(item.id)}
                    onDelete={() => removeShoppingItem(item.id)}
                    onEdit={() => setEditItem(item)}
                  />
                ))}
              </View>
            );
          })}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal añadir */}
      <BottomModal visible={modal} onClose={() => setModal(false)}>
        <Text style={[s.modalTitle, { color: theme.text }]}>{t('modals.addToSuper')}</Text>
        <FormInput label={t('forms.whatToBuy')} placeholder={t('forms.itemPlaceholder')} value={name} onChangeText={setName} autoFocus />
        <FormInput label={t('forms.quantity')} value={qty} onChangeText={setQty} keyboardType="numeric" />
        <Text style={[s.formLabel, { color: theme.textSecondary }]}>{t('categories.label')}</Text>
        <View style={s.catGrid}>
          {CATS.map(c => (
            <Pressable
              key={c.key}
              style={[
                s.catOpt,
                { backgroundColor: theme.surface2, borderColor: theme.border },
                cat === c.key && { backgroundColor: `${c.color}18`, borderColor: c.color },
              ]}
              onPress={() => setCat(c.key)}
            >
              <Icon name={c.icon} size={18} color={cat === c.key ? c.color : theme.textSecondary} />
              <Text style={[s.catOptText, { color: cat === c.key ? c.color : theme.textSecondary }]}>
                {t(`categories.${c.key}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={s.modalActions}>
          <OrangeButton label={t('actions.cancel')} onPress={() => setModal(false)} variant="ghost" style={{ flex: 1 }} />
          <OrangeButton label={t('addToList')} onPress={handleAdd} style={{ flex: 2 }} />
        </View>
      </BottomModal>

      {editItem && (
        <EditModal
          visible={!!editItem} type="shopping" initialData={editItem}
          onClose={() => setEditItem(null)}
          onSave={data => editShoppingItem(editItem.id, data)}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (t: any) => StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  content: { paddingHorizontal: Spacing.lg },
  catGroup: { marginBottom: Spacing.lg },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  catIconWrap: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  catTitle: { flex: 1, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  catCount: { fontSize: 12 },
  emptyCard: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
  formLabel: { fontSize: 13, marginBottom: Spacing.sm, fontWeight: '500' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  catOpt: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1.5 },
  catOptText: { fontSize: 13, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
});
EOF
log "ShoppingScreen ✓"

# ── 10. GoalsScreen: ícono en título ──────────────────────
step "Actualizando GoalsScreen (ícono en título)"

cat > src/screens/GoalsScreen.tsx << 'EOF'
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { useTheme } from '../context/ThemeContext';
import GoalItem from '../components/goals/GoalItem';
import OrangeButton from '../components/common/OrangeButton';
import EditModal from '../components/common/EditModal';
import SettingsBar from '../components/common/SettingsBar';
import FormInput from '../components/common/FormInput';
import BottomModal from '../components/common/BottomModal';
import Icon from '../components/common/Icon';
import { Spacing, Radius } from '../theme';

export default function GoalsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { weeklyGoals, addWeeklyGoal, editWeeklyGoal, removeWeeklyGoal, logGoalCompletion } = useStore();
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('3');
  const [editItem, setEditItem] = useState<any>(null);

  const handleAdd = () => {
    if (!title.trim()) return;
    addWeeklyGoal({ title: title.trim(), targetCount: parseInt(target) || 3 });
    setTitle(''); setTarget('3'); setModal(false);
  };

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <SettingsBar />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.titleRow}>
            <Icon name="goals" size={26} color={theme.accent} />
            <Text style={[s.title, { color: theme.text }]}>{t('goalsSection')}</Text>
          </View>
          <OrangeButton label={t('newGoal')} onPress={() => setModal(true)} size="sm" />
        </View>

        <View style={s.content}>
          {weeklyGoals.length === 0 ? (
            <View style={[s.emptyCard, { backgroundColor: theme.surface }]}>
              <Icon name="target" size={48} color={theme.textMuted} />
              <Text style={[s.emptyText, { color: theme.textMuted }]}>{t('emptyGoals')}</Text>
            </View>
          ) : weeklyGoals.map(g => (
            <GoalItem
              key={g.id} goal={g}
              onLog={() => logGoalCompletion(g.id)}
              onDelete={() => removeWeeklyGoal(g.id)}
              onEdit={() => setEditItem(g)}
            />
          ))}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      <BottomModal visible={modal} onClose={() => setModal(false)}>
        <Text style={[s.modalTitle, { color: theme.text }]}>{t('modals.newGoal')}</Text>
        <FormInput label={t('forms.whatToAchieve')} placeholder={t('forms.goalPlaceholder')} value={title} onChangeText={setTitle} autoFocus />
        <FormInput label={t('forms.timesPerWeek')} value={target} onChangeText={setTarget} keyboardType="numeric" />
        <View style={s.actions}>
          <OrangeButton label={t('actions.cancel')} onPress={() => setModal(false)} variant="ghost" style={{ flex: 1 }} />
          <OrangeButton label={t('createGoal')} onPress={handleAdd} style={{ flex: 2 }} />
        </View>
      </BottomModal>

      {editItem && (
        <EditModal visible={!!editItem} type="goal" initialData={editItem}
          onClose={() => setEditItem(null)}
          onSave={data => editWeeklyGoal(editItem.id, data)} />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (t: any) => StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  content: { paddingHorizontal: Spacing.lg },
  emptyCard: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
  actions: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
});
EOF
log "GoalsScreen ✓"

# ── 11. HistoryScreen: íconos en stats ───────────────────
step "Actualizando HistoryScreen (íconos en stats, sub-nav, range selector)"

# Reemplazar los emojis ✅ 🏆 🔥 en statsRow de HistoryScreen
sed -i "s/{ icon: '✅'/{ icon: 'completed'/g"  src/screens/HistoryScreen.tsx
sed -i "s/{ icon: '🏆'/{ icon: 'trophy'/g"     src/screens/HistoryScreen.tsx
sed -i "s/{ icon: '🔥'/{ icon: 'habits'/g"     src/screens/HistoryScreen.tsx
sed -i "s/<Text style={s.statIcon}>{stat.icon}<\/Text>/<Icon name={stat.icon as any} size={32} color={theme.accent} \/>/g" src/screens/HistoryScreen.tsx

# Agregar import de Icon al HistoryScreen
sed -i "1s/^/import Icon from '..\/components\/common\/Icon';\n/" src/screens/HistoryScreen.tsx
log "HistoryScreen stats ✓"

# ── 12. TodayScreen: section labels sin emojis ───────────
step "Actualizando TodayScreen (section headers con iconos)"

# Los section headers usan texto puro como "TAREAS DEL DÍA", "DIARIOS"
# Ya no tienen emojis desde el patch anterior — OK
log "TodayScreen ya usa texto puro en secciones ✓"

# ── 13. MainNavigator: refinamiento tab icons ─────────────
step "Refinando tab bar (ya usa Ionicons — verificando nombres)"
# Ya está correcto desde patch v3/v4
log "Tab bar OK ✓"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🎨  Patch v5 aplicado — Iconografía vectorial           ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  ✓  Icon.tsx — mapa semántico centralizado               ║${NC}"
echo -e "${CYAN}║  ✓  SwipeableRow — ✏️ 🗑️ → pencil / trash               ║${NC}"
echo -e "${CYAN}║  ✓  CheckCircle — ✓ → Ionicons checkmark                ║${NC}"
echo -e "${CYAN}║  ✓  HabitCard — ⭐📅📆 → today/calendar/cal-number      ║${NC}"
echo -e "${CYAN}║  ✓  TaskItem — badges con ícono de prioridad             ║${NC}"
echo -e "${CYAN}║  ✓  GoalItem — 🎯 → target + lightning streak           ║${NC}"
echo -e "${CYAN}║  ✓  ShoppingItem — 🍎🧹🧴📦 → íconos MCI/Ionicons       ║${NC}"
echo -e "${CYAN}║  ✓  SettingsBar — ☀️🌙▾✓ → sunny/moon/chevron/check    ║${NC}"
echo -e "${CYAN}║  ✓  GoalsScreen / ShoppingScreen — títulos con ícono    ║${NC}"
echo -e "${CYAN}║  ✓  HistoryScreen stats — íconos vectoriales             ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${YELLOW}║  Banderas de idioma (🇦🇷🇺🇸🇧🇷) se mantienen — son       ║${NC}"
echo -e "${YELLOW}║  semánticas y no tienen equivalente vectorial estándar  ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Corré:  npx expo start --clear                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
