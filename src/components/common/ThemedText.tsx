import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  variant?: 'display' | 'title' | 'body' | 'caption' | 'label';
  color?: string;
  numberOfLines?: number;
}

export default function ThemedText({ children, style, variant = 'body', color, numberOfLines }: Props) {
  return (
    <Text
      style={[styles[variant], color ? { color } : null, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  display: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: Typography.sizes.md,
    fontWeight: '400',
    color: Colors.text,
  },
  caption: {
    fontSize: Typography.sizes.sm,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  label: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
