import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useThemeStore } from '../store';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';

/**
 * Contribution Item Component
 * Displays a single contribution in the history list
 * @param {Object} contribution - Contribution object
 * @param {string} goalColor - Color theme for the goal
 */
export default function ContributionItem({ contribution, goalColor }) {
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name="add-circle"
          size={20}
          color={goalColor || theme.primary}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.amount, { color: theme.text }]}>
          {formatCurrency(parseFloat(contribution.amount))}
        </Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {formatDate(contribution.created_at)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  date: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
  },
});
