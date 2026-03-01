import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Icon from './Icon';

interface Props {
  done: boolean;
  onToggle: () => void;
  size?: number;
}

export default function CheckCircle({ done, onToggle, size = 24 }: Props) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={done ? 'Marcar como pendiente' : 'Marcar como completado'}
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
