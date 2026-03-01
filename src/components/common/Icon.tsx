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
  flame:    { set: 'ion', name: 'flame' },
  chart:    { set: 'ion', name: 'bar-chart' },
  target:   { set: 'ion', name: 'flag-outline' },

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
