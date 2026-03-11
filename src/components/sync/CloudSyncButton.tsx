/**
 * CloudSyncButton.tsx
 *
 * Self-contained cloud sync control in the SettingsBar.
 * Handles the full flow: sign-in → optional migration → sync management.
 *
 * Local mode  → shows cloud-upload icon → tap → Google sign-in → migration if needed
 * Cloud mode  → shows cloud-done / syncing / error icon → tap → sync info + sign out
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/theme';
import { useAuthStore, selectIsCloudMode } from '@/store/authStore';
import { getLocalDataSummary, migrateLocalData, flush, downloadAll } from '@/lib/syncManager';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getBackupInfo, restoreFromBackup } from '@/lib/localBackup';
import { format } from 'date-fns';

type InternalPhase = 'idle' | 'signing-in' | 'migrating';

export default function CloudSyncButton() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const s = styles(theme);

  const isCloud = useAuthStore(selectIsCloudMode);
  const { user, syncStatus, lastSyncAt, isMigrating, migrationProgress,
          signInWithGoogle, signOut } = useAuthStore();

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<InternalPhase>('idle');

  // ── Cloud icon color / name based on sync status ───────────────────────────
  const iconForStatus = () => {
    if (!isCloud) return { name: 'cloud-upload-outline' as const, color: theme.textSecondary };
    switch (syncStatus) {
      case 'syncing':  return { name: 'cloud-upload-outline' as const, color: '#6366f1' };
      case 'error':    return { name: 'cloud-offline-outline' as const, color: '#F59E0B' };
      case 'offline':  return { name: 'cloud-offline-outline' as const, color: theme.textSecondary };
      default:         return { name: 'cloud-done-outline' as const, color: '#22C55E' };
    }
  };
  const icon = iconForStatus();

  // ── Sign-in flow ───────────────────────────────────────────────────────────
  const handleEnableCloud = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(t('auth.notConfiguredTitle'), t('auth.notConfiguredBody'));
      return;
    }

    setPhase('signing-in');
    const { error } = await signInWithGoogle();

    if (error) {
      setPhase('idle');
      if (error !== 'cancelled') {
        Alert.alert(t('auth.errorTitle'), error);
      }
      return;
    }

    // Check if there's local data worth migrating
    const summary = getLocalDataSummary();
    const hasData = summary.habits > 0 || summary.tasks > 0 || summary.goals > 0 || summary.shoppingItems > 0;

    if (hasData) {
      setPhase('migrating');
    } else {
      setPhase('idle');
    }
  };

  // ── Migration flow ─────────────────────────────────────────────────────────
  const handleMigrate = async () => {
    const result = await migrateLocalData();
    if (!result.success) {
      Alert.alert(t('auth.migration.errorTitle'), result.error ?? t('auth.migration.errorBody'));
    }
    setPhase('idle');
  };

  const handleSkipMigration = () => {
    setPhase('idle');
  };

  // ── Sign-out ───────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert(
      t('auth.sync.logout'),
      t('auth.sync.logoutWarning'),
      [
        { text: t('auth.sync.logoutCancel'), style: 'cancel' },
        {
          text: t('auth.sync.logoutConfirm'),
          style: 'destructive',
          onPress: async () => {
            setOpen(false);
            await signOut();
          },
        },
      ]
    );
  };

  // ── Sync now ───────────────────────────────────────────────────────────────
  const handleSyncNow = async () => {
    await flush();
  };

  // ── Restore from cloud ─────────────────────────────────────────────────────
  const handleDownloadFromCloud = async () => {
    Alert.alert(
      t('auth.sync.restoreFromCloudTitle'),
      t('auth.sync.restoreFromCloudWarning'),
      [
        { text: t('auth.sync.logoutCancel'), style: 'cancel' },
        {
          text: t('auth.sync.restoreFromCloudConfirm'),
          onPress: async () => {
            const ok = await downloadAll();
            if (ok) {
              Alert.alert(t('auth.sync.restoreFromCloudSuccess'));
              setOpen(false);
            } else {
              Alert.alert(t('auth.sync.restoreFromCloudError'));
            }
          },
        },
      ]
    );
  };

  // ── Emergency restore ──────────────────────────────────────────────────────
  const handleRestoreBackup = async () => {
    const info = await getBackupInfo();
    if (!info) {
      Alert.alert('Sin backup', 'No hay ningún backup guardado en este dispositivo.');
      return;
    }
    const { savedAt, summary: s } = info;
    const dateLabel = format(new Date(savedAt), 'dd/MM/yyyy HH:mm');
    const lines = [
      `Backup del ${dateLabel}:`,
      s.habits > 0 ? `• ${s.habits} hábitos` : '',
      s.tasks > 0 ? `• ${s.tasks} tareas` : '',
      s.goals > 0 ? `• ${s.goals} objetivos` : '',
      s.shoppingItems > 0 ? `• ${s.shoppingItems} items de compras` : '',
      s.sleepLogs > 0 ? `• ${s.sleepLogs} registros de sueño` : '',
    ].filter(Boolean).join('\n');

    Alert.alert(
      'Restaurar backup',
      `${lines}\n\n¿Restaurar estos datos? Esto reemplazará los datos actuales.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          onPress: async () => {
            const result = await restoreFromBackup();
            if (result.success) {
              Alert.alert('Listo', 'Datos restaurados correctamente.');
              setOpen(false);
            } else {
              Alert.alert('Error', result.error ?? 'No se pudo restaurar el backup.');
            }
          },
        },
      ]
    );
  };

  // ── Formatted last sync time ───────────────────────────────────────────────
  const lastSyncLabel = lastSyncAt
    ? format(new Date(lastSyncAt), 'dd/MM HH:mm')
    : t('auth.sync.never');

  const summary = phase === 'migrating' ? getLocalDataSummary() : null;

  return (
    <>
      {/* The button in the SettingsBar */}
      <Pressable
        style={({ pressed }) => [
          s.btn,
          { backgroundColor: theme.surface, borderColor: theme.borderDim },
          pressed && { opacity: 0.75 },
        ]}
        onPress={() => setOpen(true)}
      >
        <Ionicons name={icon.name} size={18} color={icon.color} />
      </Pressable>

      {/* Modal sheet */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => { if (phase === 'idle') setOpen(false); }}
      >
        <TouchableOpacity
          style={[s.overlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => { if (phase === 'idle') setOpen(false); }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[s.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={(e) => e.stopPropagation()}
          >

            {/* ── Local mode: sign-in prompt ── */}
            {!isCloud && phase === 'idle' && (
              <>
                <View style={s.sheetHeader}>
                  <Ionicons name="cloud-upload-outline" size={22} color={theme.accent} />
                  <Text style={[s.sheetTitle, { color: theme.text }]}>{t('auth.sync.enableCloud')}</Text>
                </View>
                <Text style={[s.sheetDesc, { color: theme.textSecondary }]}>
                  {'• ' + (t('auth.onboarding.cloudBenefits', { returnObjects: true }) as string[]).join('\n• ')}
                </Text>
                <Pressable
                  style={({ pressed }) => [s.actionBtn, s.actionBtnPrimary, pressed && s.pressed]}
                  onPress={handleEnableCloud}
                >
                  <Ionicons name="logo-google" size={16} color="#fff" />
                  <Text style={s.actionBtnTextPrimary}>{t('auth.onboarding.cloudTitle')}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [s.actionBtn, pressed && s.pressed]}
                  onPress={handleRestoreBackup}
                >
                  <Ionicons name="shield-checkmark-outline" size={14} color={theme.textSecondary} />
                  <Text style={[s.actionBtnTextSecondary, { color: theme.textSecondary, fontSize: 12 }]}>
                    Restaurar backup de emergencia
                  </Text>
                </Pressable>
              </>
            )}

            {/* ── Signing in spinner ── */}
            {phase === 'signing-in' && (
              <View style={s.centerContent}>
                <ActivityIndicator color={theme.accent} size="large" />
                <Text style={[s.sheetDesc, { color: theme.textSecondary, marginTop: 12 }]}>
                  {t('auth.onboarding.cloudTitle')}…
                </Text>
              </View>
            )}

            {/* ── Migration prompt ── */}
            {phase === 'migrating' && (
              <>
                <View style={s.sheetHeader}>
                  <Ionicons name="cloud-upload-outline" size={22} color={theme.accent} />
                  <Text style={[s.sheetTitle, { color: theme.text }]}>{t('auth.migration.title')}</Text>
                </View>
                <Text style={[s.sheetDesc, { color: theme.textSecondary }]}>
                  {t('auth.migration.subtitle')}
                </Text>

                {isMigrating ? (
                  <View style={s.progressWrap}>
                    <View style={[s.progressTrack, { backgroundColor: theme.surface2 }]}>
                      <View style={[s.progressFill, { width: `${Math.round(migrationProgress * 100)}%`, backgroundColor: theme.accent }]} />
                    </View>
                    <Text style={[s.progressLabel, { color: theme.textSecondary }]}>
                      {Math.round(migrationProgress * 100)}%
                    </Text>
                  </View>
                ) : (
                  <>
                    {summary && (
                      <View style={s.summaryBox}>
                        {summary.habits > 0 && <SummaryRow icon="repeat" label={t('auth.migration.habits', { count: summary.habits })} theme={theme} />}
                        {summary.tasks > 0 && <SummaryRow icon="checkmark-done" label={t('auth.migration.tasks', { count: summary.tasks })} theme={theme} />}
                        {summary.goals > 0 && <SummaryRow icon="trophy" label={t('auth.migration.goals', { count: summary.goals })} theme={theme} />}
                        {summary.shoppingItems > 0 && <SummaryRow icon="cart" label={t('auth.migration.shopping', { count: summary.shoppingItems })} theme={theme} />}
                        {summary.sleepLogs > 0 && <SummaryRow icon="moon" label={t('auth.migration.sleep', { count: summary.sleepLogs })} theme={theme} />}
                        {summary.pomodoroSessions > 0 && <SummaryRow icon="timer" label={t('auth.migration.pomodoro', { count: summary.pomodoroSessions })} theme={theme} />}
                      </View>
                    )}
                    <Pressable
                      style={({ pressed }) => [s.actionBtn, s.actionBtnPrimary, pressed && s.pressed]}
                      onPress={handleMigrate}
                    >
                      <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                      <Text style={s.actionBtnTextPrimary}>{t('auth.migration.upload')}</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [s.actionBtn, pressed && s.pressed]}
                      onPress={handleSkipMigration}
                    >
                      <Text style={[s.actionBtnTextSecondary, { color: theme.textSecondary }]}>
                        {t('auth.migration.skipUpload')}
                      </Text>
                    </Pressable>
                  </>
                )}
              </>
            )}

            {/* ── Cloud mode: sync info ── */}
            {isCloud && phase === 'idle' && (
              <>
                <View style={s.sheetHeader}>
                  <Ionicons name="cloud-done-outline" size={22} color="#22C55E" />
                  <Text style={[s.sheetTitle, { color: theme.text }]}>{t('auth.sync.cloud')}</Text>
                </View>

                {user?.email && (
                  <View style={[s.infoRow, { borderColor: theme.borderDim }]}>
                    <Ionicons name="person-circle-outline" size={18} color={theme.textSecondary} />
                    <Text style={[s.infoText, { color: theme.textSecondary }]} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                )}

                <View style={[s.infoRow, { borderColor: theme.borderDim }]}>
                  <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
                  <Text style={[s.infoText, { color: theme.textSecondary }]}>
                    {t('auth.sync.lastSync')}: {lastSyncLabel}
                  </Text>
                  {syncStatus === 'syncing' && <ActivityIndicator size="small" color={theme.accent} />}
                </View>

                <Pressable
                  style={({ pressed }) => [s.actionBtn, s.actionBtnPrimary, pressed && s.pressed]}
                  onPress={handleSyncNow}
                  disabled={syncStatus === 'syncing'}
                >
                  <Ionicons name="sync-outline" size={16} color="#fff" />
                  <Text style={s.actionBtnTextPrimary}>{t('auth.sync.syncNow')}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [s.actionBtn, pressed && s.pressed]}
                  onPress={handleDownloadFromCloud}
                >
                  <Ionicons name="cloud-download-outline" size={16} color={theme.textSecondary} />
                  <Text style={[s.actionBtnTextSecondary, { color: theme.textSecondary }]}>
                    {t('auth.sync.restoreFromCloud')}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [s.actionBtn, pressed && s.pressed]}
                  onPress={handleSignOut}
                >
                  <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                  <Text style={[s.actionBtnTextSecondary, { color: '#EF4444' }]}>
                    {t('auth.sync.logout')}
                  </Text>
                </Pressable>
              </>
            )}

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function SummaryRow({ icon, label, theme }: { icon: any; label: string; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 }}>
      <Ionicons name={icon} size={14} color={theme.accent} />
      <Text style={{ color: theme.text, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    btn: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlay: {
      flex: 1,
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
      paddingTop: 72,
      paddingRight: Spacing.lg,
    },
    sheet: {
      width: 280,
      borderRadius: Radius.lg,
      borderWidth: 1,
      padding: 16,
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
    },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sheetTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
    sheetDesc: { fontSize: 13, lineHeight: 19 },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      borderBottomWidth: 1,
    },
    infoText: { fontSize: 13, flex: 1 },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 11,
      paddingHorizontal: 16,
      borderRadius: Radius.md,
    },
    actionBtnPrimary: { backgroundColor: theme.accent },
    actionBtnTextPrimary: { color: '#fff', fontSize: 14, fontWeight: '700' },
    actionBtnTextSecondary: { fontSize: 14, fontWeight: '600' },
    centerContent: { alignItems: 'center', paddingVertical: 16 },
    pressed: { opacity: 0.8 },
    progressWrap: { gap: 6 },
    progressTrack: { height: 5, borderRadius: 99, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 99 },
    progressLabel: { fontSize: 12, fontWeight: '600', textAlign: 'right' },
    summaryBox: {
      backgroundColor: theme.surface2 ?? theme.bg,
      borderRadius: Radius.md,
      padding: 10,
      gap: 2,
    },
  });
