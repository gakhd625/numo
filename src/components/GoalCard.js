import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useThemeStore } from '../store';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';
import ProgressBar from './ProgressBar';

/**
 * Goal Card Component
 * Displays a goal with progress, amounts, and deadline
 * @param {Object} goal - Goal object
 * @param {Function} onPress - Callback when card is pressed
 */
export default function GoalCard({ goal, onPress }) {
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;

  const progress = goal.target_amount > 0
    ? (parseFloat(goal.saved_amount) / parseFloat(goal.target_amount)) * 100
    : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateDaysRemaining = () => {
    if (!goal.deadline) return null;
    const today = new Date();
    const deadline = new Date(goal.deadline);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining();
  const goalColor = goal.color || theme.primary;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        theme.shadow,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {goal.icon ? (
            <Text style={styles.iconEmoji}>{goal.icon}</Text>
          ) : (
            <Ionicons
              name="flag"
              size={24}
              color={goalColor}
            />
          )}
        </View>
        <View style={styles.headerText}>
          <Text
            style={[styles.goalName, { color: theme.text }]}
            numberOfLines={1}
          >
            {goal.name}
          </Text>
          {goal.is_completed && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.amountRow}>
          <Text style={[styles.savedAmount, { color: goalColor }]}>
            {formatCurrency(parseFloat(goal.saved_amount))}
          </Text>
          <Text style={[styles.targetAmount, { color: theme.textSecondary }]}>
            / {formatCurrency(parseFloat(goal.target_amount))}
          </Text>
        </View>
        <View style={styles.progressRow}>
          <ProgressBar
            progress={progress}
            color={goalColor}
            height={10}
            animated={true}
          />
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      </View>

      {/* Footer */}
      {(daysRemaining !== null || goal.is_completed) && (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          {goal.is_completed ? (
            <View style={styles.footerItem}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={theme.primary}
              />
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Goal achieved!
              </Text>
            </View>
          ) : daysRemaining !== null ? (
            <View style={styles.footerItem}>
              <Ionicons
                name="calendar"
                size={16}
                color={daysRemaining < 0 ? theme.expense : theme.textSecondary}
              />
              <Text
                style={[
                  styles.footerText,
                  {
                    color: daysRemaining < 0 ? theme.expense : theme.textSecondary,
                  },
                ]}
              >
                {daysRemaining < 0
                  ? `${Math.abs(daysRemaining)} days overdue`
                  : daysRemaining === 0
                  ? 'Due today'
                  : `${daysRemaining} days remaining`}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconEmoji: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  completedText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: '#10B981',
  },
  progressSection: {
    marginBottom: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  savedAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  targetAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    minWidth: 40,
  },
  footer: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
  },
});
