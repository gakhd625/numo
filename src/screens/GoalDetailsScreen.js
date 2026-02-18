import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useGoalStore, useThemeStore, useTransactionStore } from '../store';
import ProgressBar from '../components/ProgressBar';
import ContributionItem from '../components/ContributionItem';
import AddContributionModal from '../components/AddContributionModal';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';
import { getErrorMessage } from '../utils/errorMessage';
import { format } from 'date-fns';

export default function GoalDetailsScreen({ route, navigation }) {
  const { goal: initialGoal } = route.params;
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();
  const { fetchTransactions } = useTransactionStore();
  const theme = isDark ? darkTheme : lightTheme;
  const {
    goals,
    contributions,
    fetchContributions,
    deleteGoal,
    updateGoal,
    loading,
    error: goalError,
    clearError,
  } = useGoalStore();

  const [goal, setGoal] = useState(initialGoal);
  const [refreshing, setRefreshing] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    // Update goal from store if it changed
    const updatedGoal = goals.find((g) => g.id === goal.id);
    if (updatedGoal) {
      setGoal(updatedGoal);
    }
  }, [goals]);

  useEffect(() => {
    loadContributions();
  }, [goal.id]);

  const loadContributions = async () => {
    await fetchContributions(goal.id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContributions();
    setRefreshing(false);
  };

  const handleDelete = () => {
    // On web, use window.confirm for more reliable behavior
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this goal? All contributions will be deleted.');
      if (confirmed) {
        performDelete();
      }
      return;
    }
    
    // On native, use Alert.alert
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? All contributions will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(),
        },
      ]
    );
  };

  const performDelete = async () => {
    setDeleteError(null);
    console.log('Attempting to delete goal:', goal.id);
    try {
      const result = await deleteGoal(goal.id);
      console.log('Delete result:', result);
      if (result?.error) {
        const msg = getErrorMessage(result.error, 'Failed to delete goal. Check your connection and try again.');
        console.error('Delete failed:', msg);
        setDeleteError(msg);
        Alert.alert('Cannot delete goal', msg);
      } else {
        // Refresh transactions - this restores balance since goal expense transactions are deleted
        if (user?.id) {
          fetchTransactions(user.id);
        }
        // Success - navigate back immediately (works better on web)
        console.log('Delete succeeded, navigating back');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Delete exception:', error);
      const msg = getErrorMessage(error, 'Failed to delete goal.');
      setDeleteError(msg);
      Alert.alert('Cannot delete goal', msg);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditGoal', { goal });
  };

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

  const progress = goal.target_amount > 0
    ? (parseFloat(goal.saved_amount) / parseFloat(goal.target_amount)) * 100
    : 0;

  const daysRemaining = calculateDaysRemaining();
  const goalContributions = contributions[goal.id] || [];
  const goalColor = goal.color || theme.primary;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* On-screen error so it's visible even when Alert doesn't show (e.g. Expo Web) */}
      {(deleteError || goalError) ? (
        <View style={[styles.errorBanner, { backgroundColor: theme.expense + '20', borderColor: theme.expense }]}>
          <Text style={[styles.errorBannerText, { color: theme.text }]} numberOfLines={4}>
            {deleteError || getErrorMessage(goalError)}
          </Text>
          <TouchableOpacity
            onPress={() => { setDeleteError(null); clearError(); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close-circle" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Goal Header Card */}
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            theme.shadow,
          ]}
        >
          <View style={styles.iconHeader}>
            {goal.icon ? (
              <Text style={styles.iconEmoji}>{goal.icon}</Text>
            ) : (
              <Ionicons name="flag" size={48} color={goalColor} />
            )}
          </View>
          <Text style={[styles.goalName, { color: theme.text }]}>
            {goal.name}
          </Text>
          {goal.is_completed && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}
        </View>

        {/* Progress Section */}
        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            theme.shadow,
          ]}
        >
          <View style={styles.amountRow}>
            <View>
              <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
                Saved
              </Text>
              <Text style={[styles.savedAmount, { color: goalColor }]}>
                {formatCurrency(parseFloat(goal.saved_amount))}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.targetContainer}>
              <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
                Target
              </Text>
              <Text style={[styles.targetAmount, { color: theme.text }]}>
                {formatCurrency(parseFloat(goal.target_amount))}
              </Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              color={goalColor}
              height={12}
              animated={true}
            />
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {Math.round(progress)}% Complete
            </Text>
          </View>
          {daysRemaining !== null && !goal.is_completed && (
            <View style={styles.deadlineContainer}>
              <Ionicons
                name="calendar"
                size={16}
                color={daysRemaining < 0 ? theme.expense : theme.textSecondary}
              />
              <Text
                style={[
                  styles.deadlineText,
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
          )}
        </View>

        {/* Contributions Section */}
        <View style={styles.contributionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Contributions ({goalContributions.length})
            </Text>
            {!goal.is_completed && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: goalColor }]}
                onPress={() => setShowContributionModal(true)}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {goalContributions.length === 0 ? (
            <View style={styles.emptyContributions}>
              <Ionicons
                name="wallet-outline"
                size={48}
                color={theme.textSecondary}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No contributions yet
              </Text>
              {!goal.is_completed && (
                <TouchableOpacity
                  style={[styles.emptyAddButton, { borderColor: goalColor }]}
                  onPress={() => setShowContributionModal(true)}
                >
                  <Text style={[styles.emptyAddButtonText, { color: goalColor }]}>
                    Add First Contribution
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.contributionsList}>
              {goalContributions.map((contribution) => (
                <ContributionItem
                  key={contribution.id}
                  contribution={contribution}
                  goalColor={goalColor}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: theme.border }]}
          onPress={handleEdit}
        >
          <Ionicons name="pencil" size={20} color={theme.text} />
          <Text style={[styles.actionButtonText, { color: theme.text }]}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color={theme.expense} />
          <Text style={[styles.actionButtonText, { color: theme.expense }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Contribution Modal */}
      <AddContributionModal
        visible={showContributionModal}
        goal={goal}
        onClose={() => setShowContributionModal(false)}
        onSuccess={() => {
          setShowContributionModal(false);
          loadContributions();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  headerCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconHeader: {
    marginBottom: spacing.sm,
  },
  iconEmoji: {
    fontSize: 64,
  },
  goalName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  completedText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: '#10B981',
  },
  progressCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  amountLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  savedAmount: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  targetContainer: {
    alignItems: 'flex-end',
  },
  targetAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  deadlineText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  contributionsSection: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  emptyContributions: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  emptyAddButton: {
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  emptyAddButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  contributionsList: {
    gap: spacing.sm,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  deleteButton: {
    borderColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
