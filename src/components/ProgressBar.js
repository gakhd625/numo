import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { lightTheme, darkTheme, borderRadius } from '../config/theme';
import { useThemeStore } from '../store';

/**
 * Animated progress bar component
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} color - Progress bar color (hex)
 * @param {number} height - Height of the progress bar
 * @param {boolean} animated - Whether to animate the progress
 */
export default function ProgressBar({ 
  progress, 
  color, 
  height = 8, 
  animated = true 
}) {
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: Math.min(Math.max(progress, 0), 100),
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(Math.min(Math.max(progress, 0), 100));
    }
  }, [progress, animated]);

  const width = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor: theme.border,
          borderRadius: borderRadius.sm,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            width,
            height,
            backgroundColor: color || theme.primary,
            borderRadius: borderRadius.sm,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  progress: {
    minWidth: 0,
  },
});
