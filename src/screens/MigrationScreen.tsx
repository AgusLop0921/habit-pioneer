/**
 * MigrationScreen.tsx
 *
 * Shown to existing users who signed in (have local data to upload).
 * Displays a summary of what will be migrated, then runs the upload.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { getLocalDataSummary, migrateLocalData } from '../lib/syncManager';

interface Props {
  onDone: () => void;
  onSkip: () => void;
}

export default function MigrationScreen({ onDone, onSkip }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const s = styles(theme);
  const { isMigrating, migrationProgress } = useAuthStore();
  const summary = getLocalDataSummary();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMigrating) {
      Animated.timing(progress, {
        toValue: migrationProgress,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [migrationProgress, isMigrating]);

  const handleMigrate = async () => {
    setStarted(true);
    const result = await migrateLocalData();
    if (result.success) {
      setDone(true);
      setTimeout(() => onDone(), 1200);
    } else {
      setStarted(false);
      Alert.alert(t('auth.migration.errorTitle'), result.error ?? t('auth.migration.errorBody'));
    }
  };

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const hasData =
    summary.habits > 0 ||
    summary.tasks > 0 ||
    summary.goals > 0 ||
    summary.shoppingItems > 0 ||
    summary.sleepLogs > 0 ||
    summary.pomodoroSessions > 0;

  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>
      <View style={s.content}>
        {/* Icon */}
        <View style={s.iconWrap}>
          {done ? (
            <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={64} color={theme.accent} />
          )}
        </View>

        {/* Title */}
        <Text style={s.title}>
          {done
            ? t('auth.migration.doneTitle')
            : hasData
            ? t('auth.migration.title')
            : t('auth.migration.emptyTitle')}
        </Text>
        <Text style={s.subtitle}>
          {done
            ? t('auth.migration.doneSubtitle')
            : hasData
            ? t('auth.migration.subtitle')
            : t('auth.migration.emptySubtitle')}
        </Text>

        {/* Data summary */}
        {hasData && !done && (
          <View style={s.summary}>
            {summary.habits > 0 && (
              <SummaryRow icon="repeat" label={t('auth.migration.habits', { count: summary.habits })} theme={theme} />
            )}
            {summary.tasks > 0 && (
              <SummaryRow icon="checkmark-done" label={t('auth.migration.tasks', { count: summary.tasks })} theme={theme} />
            )}
            {summary.goals > 0 && (
              <SummaryRow icon="trophy" label={t('auth.migration.goals', { count: summary.goals })} theme={theme} />
            )}
            {summary.shoppingItems > 0 && (
              <SummaryRow icon="cart" label={t('auth.migration.shopping', { count: summary.shoppingItems })} theme={theme} />
            )}
            {summary.sleepLogs > 0 && (
              <SummaryRow icon="moon" label={t('auth.migration.sleep', { count: summary.sleepLogs })} theme={theme} />
            )}
            {summary.pomodoroSessions > 0 && (
              <SummaryRow icon="timer" label={t('auth.migration.pomodoro', { count: summary.pomodoroSessions })} theme={theme} />
            )}
          </View>
        )}

        {/* Progress bar */}
        {started && !done && (
          <View style={s.progressWrap}>
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, { width: barWidth }]} />
            </View>
            <Text style={s.progressLabel}>
              {Math.round(migrationProgress * 100)}%
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      {!started && !done && (
        <View style={s.actions}>
          <Pressable
            style={({ pressed }) => [s.btn, s.btnPrimary, pressed && s.pressed]}
            onPress={handleMigrate}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            <Text style={s.btnTextPrimary}>
              {hasData ? t('auth.migration.upload') : t('auth.migration.continue')}
            </Text>
          </Pressable>

          {hasData && (
            <Pressable
              style={({ pressed }) => [s.btn, pressed && s.pressed]}
              onPress={onSkip}
            >
              <Text style={s.btnTextSecondary}>{t('auth.migration.skipUpload')}</Text>
            </Pressable>
          )}
        </View>
      )}

      {started && !done && (
        <View style={s.actions}>
          <ActivityIndicator color={theme.accent} />
          <Text style={[s.btnTextSecondary, { marginTop: 8 }]}>
            {t('auth.migration.uploading')}
          </Text>
        </View>
      )}
    </View>
  );
}

function SummaryRow({ icon, label, theme }: { icon: any; label: string; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
      <Ionicons name={icon} size={16} color={theme.accent} />
      <Text style={{ color: theme.text, fontSize: 14 }}>{label}</Text>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: 'space-between', padding: 24, paddingTop: 80 },
    content: { flex: 1, alignItems: 'center', gap: 20 },
    iconWrap: {
      width: 100,
      height: 100,
      borderRadius: 28,
      backgroundColor: `${theme.accent}15`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.text,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 16,
    },
    summary: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      gap: 4,
    },
    progressWrap: { width: '100%', alignItems: 'center', gap: 8, marginTop: 8 },
    progressTrack: {
      width: '100%',
      height: 6,
      backgroundColor: theme.surface2,
      borderRadius: 99,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: theme.accent, borderRadius: 99 },
    progressLabel: { fontSize: 13, color: theme.textSecondary, fontWeight: '600' },
    actions: { gap: 12, alignItems: 'center', paddingBottom: 16 },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 16,
      minWidth: 240,
    },
    btnPrimary: { backgroundColor: theme.accent },
    btnTextPrimary: { color: '#fff', fontSize: 16, fontWeight: '700' },
    btnTextSecondary: { color: theme.textSecondary, fontSize: 14, fontWeight: '600' },
    pressed: { opacity: 0.8 },
  });
