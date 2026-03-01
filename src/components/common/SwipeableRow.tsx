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
