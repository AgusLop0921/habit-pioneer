import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import './src/i18n';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import AppSplashScreen from './src/screens/SplashScreen';
import MotivationalScreen from './src/screens/MotivationalScreen';
import MainNavigator from './src/screens/MainNavigator';

type Phase = 'splash' | 'motivational' | 'app';

function AppContent() {
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
