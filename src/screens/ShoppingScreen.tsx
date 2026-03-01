import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { useTheme } from '../context/ThemeContext';
import ShoppingItemComponent from '../components/shopping/ShoppingItem';
import OrangeButton from '../components/common/OrangeButton';
import EditModal from '../components/common/EditModal';
import SettingsBar from '../components/common/SettingsBar';
import FormInput from '../components/common/FormInput';
import BottomModal from '../components/common/BottomModal';
import Icon, { IconName } from '../components/common/Icon';
import { Spacing, Radius } from '../theme';
import { ShopCategory } from '../types';

const CATS: { key: ShopCategory; icon: IconName; color: string }[] = [
  { key: 'food',     icon: 'food',     color: '#30d158' },
  { key: 'cleaning', icon: 'cleaning', color: '#0a84ff' },
  { key: 'hygiene',  icon: 'hygiene',  color: '#bf5af2' },
  { key: 'general',  icon: 'general',  color: '#636366' },
];

export default function ShoppingScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { shoppingList, addShoppingItem, editShoppingItem, removeShoppingItem, toggleShoppingItem } = useStore();
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [cat, setCat] = useState<ShopCategory>('general');
  const [editItem, setEditItem] = useState<any>(null);

  const handleAdd = () => {
    if (!name.trim()) return;
    addShoppingItem({ name: name.trim(), quantity: parseInt(qty) || 1, category: cat });
    setName(''); setQty('1'); setCat('general'); setModal(false);
  };

  const grouped = CATS.reduce((acc, c) => {
    const items = shoppingList.filter(i => i.category === c.key);
    if (items.length) acc[c.key] = items;
    return acc;
  }, {} as Record<ShopCategory, typeof shoppingList>);

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <SettingsBar />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.titleRow}>
              <Icon name="shopping" size={26} color={theme.accent} />
              <Text style={[s.title, { color: theme.text }]}>{t('shoppingSection')}</Text>
            </View>
            <OrangeButton label={t('addItem')} onPress={() => setModal(true)} size="sm" />
          </View>
        </View>

        <View style={s.content}>
          {shoppingList.length === 0 ? (
            <View style={[s.emptyCard, { backgroundColor: theme.surface }]}>
              <Icon name="cart" size={48} color={theme.textMuted} />
              <Text style={[s.emptyText, { color: theme.textMuted }]}>{t('emptyShopping')}</Text>
            </View>
          ) : CATS.map(c => {
            const items = grouped[c.key];
            if (!items) return null;
            return (
              <View key={c.key} style={s.catGroup}>
                {/* Cabecera de categoría con ícono */}
                <View style={s.catHeader}>
                  <View style={[s.catIconWrap, { backgroundColor: `${c.color}18` }]}>
                    <Icon name={c.icon} size={14} color={c.color} />
                  </View>
                  <Text style={[s.catTitle, { color: theme.textSecondary }]}>
                    {t(`categories.${c.key}`)}
                  </Text>
                  <Text style={[s.catCount, { color: theme.textMuted }]}>
                    {items.filter(i => i.checked).length}/{items.length}
                  </Text>
                </View>
                {items.map(item => (
                  <ShoppingItemComponent
                    key={item.id}
                    item={item}
                    onToggle={() => toggleShoppingItem(item.id)}
                    onDelete={() => removeShoppingItem(item.id)}
                    onEdit={() => setEditItem(item)}
                  />
                ))}
              </View>
            );
          })}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal añadir */}
      <BottomModal visible={modal} onClose={() => setModal(false)}>
        <Text style={[s.modalTitle, { color: theme.text }]}>{t('modals.addToSuper')}</Text>
        <FormInput label={t('forms.whatToBuy')} placeholder={t('forms.itemPlaceholder')} value={name} onChangeText={setName} autoFocus />
        <FormInput label={t('forms.quantity')} value={qty} onChangeText={setQty} keyboardType="numeric" />
        <Text style={[s.formLabel, { color: theme.textSecondary }]}>{t('categories.label')}</Text>
        <View style={s.catGrid}>
          {CATS.map(c => (
            <Pressable
              key={c.key}
              style={[
                s.catOpt,
                { backgroundColor: theme.surface2, borderColor: theme.border },
                cat === c.key && { backgroundColor: `${c.color}18`, borderColor: c.color },
              ]}
              onPress={() => setCat(c.key)}
            >
              <Icon name={c.icon} size={18} color={cat === c.key ? c.color : theme.textSecondary} />
              <Text style={[s.catOptText, { color: cat === c.key ? c.color : theme.textSecondary }]}>
                {t(`categories.${c.key}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={s.modalActions}>
          <OrangeButton label={t('actions.cancel')} onPress={() => setModal(false)} variant="ghost" style={{ flex: 1 }} />
          <OrangeButton label={t('addToList')} onPress={handleAdd} style={{ flex: 2 }} />
        </View>
      </BottomModal>

      {editItem && (
        <EditModal
          visible={!!editItem} type="shopping" initialData={editItem}
          onClose={() => setEditItem(null)}
          onSave={data => editShoppingItem(editItem.id, data)}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (t: any) => StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  content: { paddingHorizontal: Spacing.lg },
  catGroup: { marginBottom: Spacing.lg },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  catIconWrap: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  catTitle: { flex: 1, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  catCount: { fontSize: 12 },
  emptyCard: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
  formLabel: { fontSize: 13, marginBottom: Spacing.sm, fontWeight: '500' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  catOpt: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1.5 },
  catOptText: { fontSize: 13, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
});
