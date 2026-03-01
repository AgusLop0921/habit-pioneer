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
import { useTheme } from '../../context/ThemeContext';
import Icon from './Icon';
import { Radius } from '../../theme';

const ACTION_W = 75; // ancho de cada botón
const TOTAL_REV = ACTION_W * 2; // total que se revela
const THRESHOLD = 40; // px para hacer snap a abierto

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
  deleteLabel = 'Borrar',
  editLabel = 'Editar',
  borderColor,
}: Props) {
  const { theme } = useTheme();

  // Valor animado: cuánto se desplaza el contenido hacia la izquierda
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  // Para saber si está abierto y hacer tap-fuera para cerrar
  const isOpen = useRef(false);

  const snapTo = (toValue: number, cb?: () => void) => {
    isOpen.current = toValue !== 0;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start(cb);
    lastOffset.current = toValue;
  };

  const open = () => snapTo(-TOTAL_REV);
  const close = () => snapTo(0);

  const pan = useRef(
    PanResponder.create({
      // Captura gestos más horizontales que verticales
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 && Math.abs(g.dy) < Math.abs(g.dx),

      onPanResponderGrant: () => {
        translateX.setOffset(lastOffset.current);
        translateX.setValue(0);
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

        // Snap: si pasó el umbral o velocidad suficiente → abrir, sino cerrar
        if (current < -THRESHOLD || velocity < -0.3) {
          open();
        } else {
          close();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    snapTo(0, () => setTimeout(onDelete, 50));
  };
  const handleEdit = () => {
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
        <Pressable style={[s.action, { backgroundColor: theme.swipeEdit }]} onPress={handleEdit}>
          <Icon name="edit" size={20} color="#fff" />
          <Text style={s.actionLabel}>{editLabel}</Text>
        </Pressable>

        <Pressable
          style={[s.action, { backgroundColor: theme.swipeDelete }]}
          onPress={handleDelete}
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
