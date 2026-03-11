/**
 * OnboardingScreen.tsx
 *
 * Shown to new users (or users who haven't chosen a mode yet).
 * Offers two options:
 *   1. "Use without account" → local only (MMKV, no sync)
 *   2. "Sign in with Google" → cloud sync via Supabase
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured } from '../lib/supabase';
import HabitOnboarding from './HabitOnboarding';

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const s = styles(theme);
  const { chooseLocalMode, signInWithGoogle } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [slidesComplete, setSlidesComplete] = useState(false);

  if (!slidesComplete) {
    return <HabitOnboarding onDone={() => setSlidesComplete(true)} />;
  }

  const handleLocalMode = () => {
    chooseLocalMode();
    onDone();
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        t('auth.notConfiguredTitle'),
        t('auth.notConfiguredBody'),
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);

    if (error) {
      if (error === 'cancelled') return; // User dismissed browser
      Alert.alert(t('auth.errorTitle'), error);
      return;
    }

    onDone();
  };

  return (
    <ScrollView
      style={[s.root, { backgroundColor: theme.bg }]}
      contentContainerStyle={s.content}
      bounces={false}
    >
      {/* Header */}
      <View style={s.header}>
        <Image
          source={require('../../assets/icon.png')}
          style={s.icon}
          resizeMode="contain"
        />
        <Text style={s.title}>{t('auth.onboarding.title')}</Text>
        <Text style={s.subtitle}>{t('auth.onboarding.subtitle')}</Text>
      </View>

      {/* Options */}
      <View style={s.cards}>

        {/* Cloud option */}
        <Pressable
          style={({ pressed }) => [s.card, s.cardCloud, pressed && s.pressed]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <View style={s.cardBadge}>
            <Text style={s.cardBadgeText}>{t('auth.onboarding.recommended')}</Text>
          </View>
          <View style={s.cardHeader}>
            <View style={[s.cardIcon, { backgroundColor: '#4285F4' }]}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="logo-google" size={22} color="#fff" />
              )}
            </View>
            <Text style={s.cardTitle}>{t('auth.onboarding.cloudTitle')}</Text>
          </View>
          <View style={s.benefits}>
            {(t('auth.onboarding.cloudBenefits', { returnObjects: true }) as string[]).map((b, i) => (
              <View key={i} style={s.benefit}>
                <Ionicons name="checkmark-circle" size={16} color="#4285F4" />
                <Text style={s.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
        </Pressable>

        {/* Local option */}
        <Pressable
          style={({ pressed }) => [s.card, pressed && s.pressed]}
          onPress={handleLocalMode}
          disabled={loading}
        >
          <View style={s.cardHeader}>
            <View style={[s.cardIcon, { backgroundColor: theme.surface2 }]}>
              <Ionicons name="phone-portrait-outline" size={22} color={theme.textSecondary} />
            </View>
            <Text style={s.cardTitle}>{t('auth.onboarding.localTitle')}</Text>
          </View>
          <View style={s.benefits}>
            {(t('auth.onboarding.localBenefits', { returnObjects: true }) as string[]).map((b, i) => (
              <View key={i} style={s.benefit}>
                <Ionicons name="checkmark-circle" size={16} color={theme.textSecondary} />
                <Text style={[s.benefitText, { color: theme.textSecondary }]}>{b}</Text>
              </View>
            ))}
          </View>
          <Text style={s.localNote}>{t('auth.onboarding.localNote')}</Text>
        </Pressable>
      </View>

      <Text style={s.privacy}>{t('auth.onboarding.privacy')}</Text>
    </ScrollView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    root: { flex: 1 },
    content: {
      paddingHorizontal: 24,
      paddingTop: 64,
      paddingBottom: 40,
      gap: 24,
    },
    header: { alignItems: 'center', gap: 16 },
    icon: { width: 80, height: 80, borderRadius: 20 },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.text,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    cards: { gap: 12 },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 20,
      gap: 16,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    cardCloud: {
      borderColor: '#4285F420',
      backgroundColor: `${theme.surface}`,
    },
    cardBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#4285F420',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    cardBadgeText: { fontSize: 11, fontWeight: '700', color: '#4285F4', letterSpacing: 0.5 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { fontSize: 18, fontWeight: '700', color: theme.text, flex: 1 },
    benefits: { gap: 8 },
    benefit: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    benefitText: { fontSize: 14, color: theme.text, flex: 1 },
    localNote: { fontSize: 13, color: theme.textSecondary, fontStyle: 'italic' },
    pressed: { opacity: 0.85 },
    privacy: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
