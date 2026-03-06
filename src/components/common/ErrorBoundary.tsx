import React, { Component } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import i18n from '../../i18n';

interface Props {
  children: React.ReactNode;
  /** Optional fallback override */
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * React class-based error boundary.
 * Catches render / lifecycle errors in child tree and shows a
 * minimal recovery screen instead of a blank crash.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeScreen />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production swap for Sentry.captureException(error, { extra: info })
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={s.container}>
          <Text style={s.emoji}>⚠️</Text>
          <Text style={s.title}>{i18n.t('error.title')}</Text>
          {__DEV__ && (
            <Text style={s.msg} numberOfLines={6}>
              {this.state.error?.message}
            </Text>
          )}
          <Pressable
            style={s.btn}
            onPress={this.reset}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('error.retry')}
          >
            <Text style={s.btnText}>{i18n.t('error.retry')}</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d0d0d',
    padding: 32,
    gap: 16,
  },
  emoji: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  msg: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
  },
  btn: {
    marginTop: 8,
    backgroundColor: '#f4821f',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
