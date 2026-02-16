import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius, fontSize, fontWeight } from '../config/theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>N</Text>
          </View>
          <Text style={styles.appName}>Numo</Text>
          <Text style={styles.tagline}>Smart Finance Tracking</Text>
        </View>
        
        <ActivityIndicator size="large" color="#FFF" style={styles.loader} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: '#FFF',
  },
  appName: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: '#FFF',
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loader: {
    marginTop: spacing.xxl,
  },
});