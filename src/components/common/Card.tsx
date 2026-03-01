import React from 'react';
import { View, ViewStyle, StyleSheet, Pressable } from 'react-native';
import { Colors, Radius, Spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'orange' | 'teal';
}

export default function Card({ children, style, onPress, variant = 'default' }: Props) {
  const content = <View style={[styles.card, styles[variant], style]}>{children}</View>;

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  default: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  orange: {
    backgroundColor: 'rgba(120,53,15,0.3)',
    borderColor: 'rgba(249,115,22,0.2)',
  },
  teal: {
    backgroundColor: 'rgba(15,123,108,0.2)',
    borderColor: 'rgba(15,123,108,0.3)',
  },
});
