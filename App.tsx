import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import i18n from './src/i18n';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import AppSplashScreen from './src/screens/SplashScreen';
import MotivationalScreen from './src/screens/MotivationalScreen';
import MainNavigator from './src/screens/MainNavigator';
import { useStore } from './src/store';

type Phase = 'splash' | 'motivational' | 'app';

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

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {phase === 'splash' && (
        <AppSplashScreen onFinish={() => setPhase('motivational')} />
      )}
      {phase === 'motivational' && (
        <MotivationalScreen onContinue={() => setPhase('app')} />
      )}
      {phase === 'app' && (
        <MainNavigator />
      )}
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
