import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import CheckCircle from '@/components/common/CheckCircle';
import SwipeableRow from '@/components/common/SwipeableRow';
import Icon, { IconName } from '@/components/common/Icon';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/theme';
import { ShoppingItem as T, ShopCategory } from '@/types';

const CAT_ICON: Record<ShopCategory, IconName> = {
  food: 'food',
  cleaning: 'cleaning',
  hygiene: 'hygiene',
  general: 'general',
};
const CAT_COLOR: Record<ShopCategory, string> = {
  food: '#30d158',
  cleaning: '#0a84ff',
  hygiene: '#bf5af2',
  general: '#636366',
};

interface Props {
  item: T;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function ShoppingItemComponent({ item, onToggle, onDelete, onEdit }: Props) {
  const { theme } = useTheme();
  const color = CAT_COLOR[item.category];

  return (
    <SwipeableRow onDelete={onDelete} onEdit={onEdit}>
      <Pressable
        style={[
          s.item,
          { backgroundColor: theme.surface, borderColor: theme.borderDim },
          item.checked && s.done,
        ]}
        onPress={onToggle}
      >
        {/* Ícono de categoría */}
        <View style={[s.catBadge, { backgroundColor: `${color}18` }]}>
          <Icon
            name={CAT_ICON[item.category]}
            size={20}
            color={item.checked ? theme.textMuted : color}
          />
        </View>

        <CheckCircle done={item.checked} onToggle={onToggle} />

        <Text
          style={[
            s.name,
            { color: item.checked ? theme.textSecondary : theme.text },
            item.checked && s.strike,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        <View style={[s.qty, { backgroundColor: theme.accentDim }]}>
          <Text style={[s.qtyText, { color: theme.accent }]}>x{item.quantity}</Text>
        </View>
      </Pressable>
    </SwipeableRow>
  );
}

const s = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  done: { opacity: 0.5 },
  catBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flex: 1, fontSize: 15, fontWeight: '500' },
  strike: { textDecorationLine: 'line-through' },
  qty: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99 },
  qtyText: { fontSize: 12, fontWeight: '700' },
});
