import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigation from './src/navigation';
import { useAuthStore, useThemeStore } from './src/store';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message ?? 'Unknown error'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { initialize } = useAuthStore();
  const { initializeTheme, isDark } = useThemeStore();
  
  useEffect(() => {
    initializeTheme();
    initialize();
  }, []);
  
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Navigation />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#111',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});