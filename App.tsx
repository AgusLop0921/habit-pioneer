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
import { getLocalDataSummary } from './src/lib/syncManager';
import { FloatingPomodoroButton, PomodoroModal } from './src/components/pomodoro';

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

function AppContent() {
  useLanguageSync();
  const [phase, setPhase] = useState<Phase>('splash');
  const { isDark } = useTheme();

  const { onboardingComplete, mode, isAuthenticated, restoreSession } = useAuthStore();

  // On app start: restore Supabase session + wire up sync listeners
  useEffect(() => {
    bootstrapSync();
    void restoreSession();
  }, []);

  const handleSplashFinish = () => {
    if (!onboardingComplete) {
      setPhase('onboarding');
    } else {
      setPhase('motivational');
    }
  };

  const handleOnboardingDone = () => {
    // If user just signed in (cloud mode) and already has local data → migration prompt
    if (mode === 'cloud' || isAuthenticated) {
      const summary = getLocalDataSummary();
      const hasData =
        summary.habits > 0 ||
        summary.tasks > 0 ||
        summary.goals > 0 ||
        summary.shoppingItems > 0;

      if (hasData) {
        setPhase('migration');
        return;
      }
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
