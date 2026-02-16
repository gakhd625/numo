import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigation from './src/navigation';
import { useAuthStore, useThemeStore } from './src/store';

export default function App() {
  const { initialize } = useAuthStore();
  const { initializeTheme, isDark } = useThemeStore();
  
  useEffect(() => {
    initializeTheme();
    initialize();
  }, []);
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Navigation />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </GestureHandlerRootView>
  );
}