import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { useTheme } from '@/context/ThemeContext';
import Icon from './Icon';
import { Spacing, Radius } from '@/theme';
import { Language } from '@/types';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇦🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
];
const APP_ICON = require('../../../assets/icon.png');

export default function SettingsBar() {
  const { i18n, t } = useTranslation();
  const { language, setLanguage } = useStore();
  const { theme, isDark, toggleTheme } = useTheme();
  const [showLang, setShowLang] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const handleSelectLang = (code: Language) => {
    setLanguage(code);
    i18n.changeLanguage(code);
    setShowLang(false);
  };

  return (
    <>
      <View style={[s.bar, { backgroundColor: theme.bg, borderBottomColor: theme.borderDim }]}>
        <View style={s.logoRow}>
          <Image source={APP_ICON} style={s.logoImg} resizeMode="contain" />
          <Text style={[s.logoText, { color: theme.text }]}>Habits Pioneer</Text>
        </View>

        <View style={s.actions}>
          {/* Theme toggle */}
          <Pressable
            style={[s.iconBtn, { backgroundColor: theme.surface, borderColor: theme.borderDim }]}
            onPress={toggleTheme}
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={18} color={theme.textSecondary} />
          </Pressable>

          {/* Language picker */}
          <Pressable
            style={[s.langBtn, { backgroundColor: theme.surface, borderColor: theme.borderDim }]}
            onPress={() => setShowLang(true)}
          >
            <Text style={s.langFlag}>{currentLang.flag}</Text>
            <Text style={[s.langCode, { color: theme.textSecondary }]}>
              {currentLang.code.toUpperCase()}
            </Text>
            <Icon name="chevronDown" size={13} color={theme.textMuted} />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showLang}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLang(false)}
      >
        <TouchableOpacity
          style={[s.overlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => setShowLang(false)}
        >
          <View style={[s.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[s.dropTitle, { color: theme.textSecondary }]}>{t('language')}</Text>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={({ pressed }) => [
                  s.dropItem,
                  { borderColor: 'transparent' },
                  language === lang.code && {
                    backgroundColor: theme.accentDim,
                    borderColor: theme.accent,
                  },
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => handleSelectLang(lang.code)}
              >
                <Text style={s.dropFlag}>{lang.flag}</Text>
                <Text style={[s.dropLabel, { color: theme.text }]}>{lang.label}</Text>
                {language === lang.code && <Icon name="check" size={16} color={theme.accent} />}
              </Pressable>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImg: { width: 34, height: 34, borderRadius: 9 },
  logoText: { fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  langFlag: { fontSize: 16 },
  langCode: { fontSize: 12, fontWeight: '600' },
  overlay: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 72,
    paddingRight: Spacing.lg,
  },
  dropdown: {
    width: 200,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  dropTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 4,
  },
  dropFlag: { fontSize: 20 },
  dropLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
});
