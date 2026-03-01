import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Radius, Spacing } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md';
}

export default function OrangeButton({ label, onPress, style, variant = 'primary', size = 'md' }: Props) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        size === 'sm' ? styles.sm : styles.md,
        variant === 'primary'
          ? { backgroundColor: theme.orange }
          : { backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.border },
        { opacity: pressed ? 0.82 : 1 },
        style,
      ]}
    >
      <Text style={[styles.label, variant === 'ghost' && { color: theme.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm - 1 },
  md: { paddingHorizontal: Spacing.md, paddingVertical: 12 },
  label: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
