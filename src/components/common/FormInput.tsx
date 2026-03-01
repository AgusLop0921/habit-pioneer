import React from 'react';
import { TextInput, Text, View, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Radius, Spacing } from '@/theme';

interface Props extends TextInputProps {
  label?: string;
}

export default function FormInput({ label, style, ...props }: Props) {
  const { theme } = useTheme();
  return (
    <View style={styles.group}>
      {label && <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.surface2, borderColor: theme.border, color: theme.text },
          style,
        ]}
        placeholderTextColor={theme.textMuted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: Spacing.md },
  label: { fontSize: 13, marginBottom: Spacing.sm, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, fontSize: 14 },
});
