/**
 * SwipeableRow — patrón iOS nativo
 *
 * El truco: la card completa (fondo + borderRadius) es el contenedor.
 * Las acciones viven DENTRO con position:absolute a la derecha.
 * Solo el contenido visible se traslada con translateX.
 * Resultado: todo queda dentro del mismo rectángulo redondeado,
 * sin bordes extras ni conflictos visuales.
 */
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, PanResponder } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import Icon from './Icon';
import { Radius } from '../../theme';

const ACTION_W = 75; // ancho de cada botón
const TOTAL_REV = ACTION_W * 2; // total que se revela
const THRESHOLD = 30; // px para hacer snap a abierto

// Global reference to ensure only one row is open at a time
let currentlyOpenRow: (() => void) | null = null;

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  onEdit: () => void;
  deleteLabel?: string;
  editLabel?: string;
  borderColor?: string;
}

export default function SwipeableRow({
  children,
  onDelete,
  onEdit,
  deleteLabel: deleteLabelProp,
  editLabel: editLabelProp,
  borderColor,
}: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const deleteLabel = deleteLabelProp ?? t('actions.swipeDelete');
  const editLabel = editLabelProp ?? t('actions.edit');

  // Valor animado: cuánto se desplaza el contenido hacia la izquierda
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  // Para saber si está abierto y hacer tap-fuera para cerrar
  const isOpen = useRef(false);

  const snapTo = (toValue: number, cb?: () => void) => {
    isOpen.current = toValue !== 0;

    // Manage global state for single open row
    if (toValue !== 0) {
      if (currentlyOpenRow && currentlyOpenRow !== close) {
        currentlyOpenRow();
      }
      currentlyOpenRow = close;
    } else {
      if (currentlyOpenRow === close) {
        currentlyOpenRow = null;
      }
    }

    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start(cb);
    lastOffset.current = toValue;
  };

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    snapTo(-TOTAL_REV);
  };
  const close = () => snapTo(0);

  const pan = useRef(
    PanResponder.create({
      // Captura gestos más horizontales que verticales
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < Math.abs(g.dx),

      onPanResponderGrant: () => {
        translateX.setOffset(lastOffset.current);
        translateX.setValue(0);
        // Si hay otra fila abierta, la cerramos inmediatamente al empezar a deslizar
        if (currentlyOpenRow && currentlyOpenRow !== close) {
          currentlyOpenRow();
        }
      },

      onPanResponderMove: (_, g) => {
        // Clamp: no puede ir más allá del total revelado ni a la derecha
        const next = Math.max(-TOTAL_REV, Math.min(0, g.dx));
        translateX.setValue(next);
      },

      onPanResponderRelease: (_, g) => {
        translateX.flattenOffset();
        const velocity = g.vx;
        const current = lastOffset.current + g.dx;

        // Snap: si pasó el umbral o velocidad hacia la izquierda → abrir, sino cerrar
        if ((current < -THRESHOLD && velocity <= 0.2) || velocity < -0.3) {
          open();
        } else {
          close();
        }
      },

      onPanResponderTerminate: () => {
        // En caso de que el ScrollView capture el evento (o se cancele el gesto)
        translateX.flattenOffset();
        close();
      },
    })
  ).current;

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    snapTo(0, () => setTimeout(onDelete, 50));
  };
  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    snapTo(0, () => setTimeout(onEdit, 50));
  };

  return (
    // ── Contenedor: tiene el borderRadius de la card ──────────────
    // overflow:hidden hace que TODO lo que salga del Radius quede cortado
    <View
      style={[
        s.container,
        {
          borderRadius: Radius.xl,
          backgroundColor: theme.surface,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: borderColor ?? theme.border,
        },
      ]}
    >
      {/* ── Acciones: position:absolute, pegadas a la derecha ──── */}
      {/* No necesitan borderRadius propio — el padre ya los contiene */}
      <View style={s.actions}>
        <Pressable
          style={[s.action, { backgroundColor: theme.swipeEdit }]}
          onPress={handleEdit}
          accessibilityRole="button"
          accessibilityLabel={editLabel}
        >
          <Icon name="edit" size={20} color="#fff" />
          <Text style={s.actionLabel}>{editLabel}</Text>
        </Pressable>

        <Pressable
          style={[s.action, { backgroundColor: theme.swipeDelete }]}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
        >
          <Icon name="delete" size={20} color="#fff" />
          <Text style={s.actionLabel}>{deleteLabel}</Text>
        </Pressable>
      </View>

      {/* ── Contenido: se desplaza sobre las acciones ──────────── */}
      {/* También necesita el mismo borderRadius para que al estar
          en posición 0 tape perfectamente las acciones */}
      <Animated.View
        style={[
          s.content,
          {
            borderRadius: Radius.xl,
            backgroundColor: theme.surface,
            transform: [{ translateX }],
          },
        ]}
        {...pan.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    overflow: 'hidden', // ← clave: recorta al Radius del padre
    position: 'relative',
  },
  actions: {
    // Fijas en la derecha, altura 100% del contenedor
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  action: {
    width: ACTION_W,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionLabel: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    // El contenido flota encima de las acciones
    // zIndex no hace falta porque viene después en el árbol
  },
});
