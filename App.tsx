import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import i18n from './src/i18n';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import AppSplashScreen from './src/screens/SplashScreen';
import MotivationalScreen from './src/screens/MotivationalScreen';
import MainNavigator from './src/screens/MainNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import MigrationScreen from './src/screens/MigrationScreen';
import SyncStatusBadge from './src/components/sync/SyncStatusBadge';
import { useStore } from './src/store';
import { useAuthStore } from './src/store/authStore';
import { bootstrapSync } from './src/lib/syncBootstrap';
import { getLocalDataSummary, downloadAll } from './src/lib/syncManager';
import { FloatingPomodoroButton, PomodoroModal } from './src/components/pomodoro';
import { usePomodoroStore } from './src/store/pomodoroStore';

type Phase =
  | 'splash'
  | 'onboarding'    // new user — choose local vs cloud
  | 'migration'     // existing user who just signed in — prompt to upload
  | 'motivational'
  | 'app';

/**
 * Sync i18n language with the persisted store value after Zustand hydration.
 * Without this, i18n always starts with the device locale and ignores
 * the user's saved preference.
 */
function useLanguageSync() {
  const language = useStore((s) => s.language);

  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);
}

function hasLocalData(): boolean {
  const s = getLocalDataSummary();
  return s.habits > 0 || s.tasks > 0 || s.shoppingItems > 0;
}

function usePomodoroTick() {
  const tick = usePomodoroStore((s) => s.tick);
  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);
}

function AppContent() {
  useLanguageSync();
  usePomodoroTick();
  const [phase, setPhase] = useState<Phase>('splash');
  const { isDark } = useTheme();

  const { onboardingComplete, mode, isAuthenticated, restoreSession, completeOnboarding } = useAuthStore();

  // On app start: restore Supabase session + wire up sync listeners
  // If already logged in on a device with no local data (e.g. fresh install),
  // auto-download from cloud so the user sees their data immediately.
  useEffect(() => {
    bootstrapSync();
    void restoreSession().then(() => {
      const { mode, isAuthenticated } = useAuthStore.getState();
      if (mode === 'cloud' && isAuthenticated && !hasLocalData()) {
        void downloadAll();
      }
    });
  }, []);

  const handleSplashFinish = () => {
    if (!onboardingComplete) {
      setPhase('onboarding');
    } else {
      setPhase('motivational');
    }
  };

  const handleOnboardingDone = () => {
    // Mark onboarding as complete regardless of path (local or Google)
    completeOnboarding();

    // If user just signed in (cloud mode) and already has local data → migration prompt
    if (mode === 'cloud' || isAuthenticated) {
      if (hasLocalData()) {
        setPhase('migration');
        return;
      }
      // No local data but signed in → silently pull from cloud (second device / reinstall)
      void downloadAll();
    }
    setPhase('motivational');
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {phase === 'splash' && (
        <AppSplashScreen onFinish={handleSplashFinish} />
      )}

      {phase === 'onboarding' && (
        <OnboardingScreen onDone={handleOnboardingDone} />
      )}

      {phase === 'migration' && (
        <MigrationScreen
          onDone={() => setPhase('motivational')}
          onSkip={() => setPhase('motivational')}
        />
      )}

      {phase === 'motivational' && (
        <MotivationalScreen onContinue={() => setPhase('app')} />
      )}

      {phase === 'app' && (
        <>
          <MainNavigator />
          <FloatingPomodoroButton />
          <PomodoroModal />
          <SyncStatusBadge />
        </>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
