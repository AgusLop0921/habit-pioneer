import React from 'react';
import { Text, TextStyle } from 'react-native';
import { Typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  variant?: 'display' | 'title' | 'body' | 'caption' | 'label';
  color?: string;
  numberOfLines?: number;
}

type VariantStyle = Omit<TextStyle, 'color'>;

const VARIANT_BASE: Record<NonNullable<Props['variant']>, VariantStyle> = {
  display: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: Typography.sizes.md,
    fontWeight: '400',
  },
  caption: {
    fontSize: Typography.sizes.sm,
    fontWeight: '400',
  },
  label: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
};

function variantColor(
  variant: NonNullable<Props['variant']>,
  theme: { text: string; textMuted: string; textSecondary: string }
): string {
  if (variant === 'caption') return theme.textMuted;
  if (variant === 'label') return theme.textSecondary;
  return theme.text;
}

export default function ThemedText({
  children,
  style,
  variant = 'body',
  color,
  numberOfLines,
}: Props) {
  const { theme } = useTheme();

  const computedStyle: TextStyle = {
    ...VARIANT_BASE[variant],
    color: color ?? variantColor(variant, theme),
  };

  return (
    <Text style={[computedStyle, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}
