import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useGoalStore, useThemeStore, useTransactionStore } from '../store';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';
import { getErrorMessage } from '../utils/errorMessage';

/**
 * Add Contribution Modal Component
 * Allows users to add a contribution to a goal
 * Also creates an expense transaction to track the contribution
 * @param {boolean} visible - Whether modal is visible
 * @param {Object} goal - Goal object
 * @param {Function} onClose - Callback when modal closes
 * @param {Function} onSuccess - Callback when contribution is added successfully
 */
export default function AddContributionModal({
  visible,
  goal,
  onClose,
  onSuccess,
}) {
  const { user } = useAuthStore();
  const { addContribution, loading } = useGoalStore();
  const { fetchTransactions } = useTransactionStore();
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;

  const [amount, setAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return;
    }

    if (goal.is_completed) {
      setErrorMessage('Cannot add contribution to completed goal');
      return;
    }

    setErrorMessage(null);
    try {
      const result = await addContribution(goal.id, parseFloat(amount), user?.id);

      if (result?.error) {
        const msg = getErrorMessage(result.error, 'Failed to add contribution. Check your connection and try again.');
        setErrorMessage(msg);
        Alert.alert('Cannot add contribution', msg);
        return;
      }

      // Refresh transactions to reflect the new expense
      if (user?.id) {
        fetchTransactions(user.id);
      }

      setAmount('');
      setErrorMessage(null);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const msg = getErrorMessage(error, 'Failed to add contribution.');
      setErrorMessage(msg);
      Alert.alert('Cannot add contribution', msg);
    }
  };

  const handleClose = () => {
    setAmount('');
    setErrorMessage(null);
    onClose();
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const remainingAmount = goal.target_amount - goal.saved_amount;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              Add Contribution
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Goal Info */}
          <View style={styles.goalInfo}>
            <Text style={[styles.goalName, { color: theme.text }]}>
              {goal.name}
            </Text>
            <Text style={[styles.goalRemaining, { color: theme.textSecondary }]}>
              Remaining: {formatCurrency(remainingAmount)}
            </Text>
          </View>

          {/* On-screen error (visible even when Alert doesn't work on web) */}
          {errorMessage ? (
            <View style={[styles.inlineError, { backgroundColor: theme.expense + '20', borderColor: theme.expense }]}>
              <Text style={[styles.inlineErrorText, { color: theme.text }]} numberOfLines={3}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Amount Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={[styles.currencySymbol, { color: theme.text }]}>$</Text>
              <TextInput
                style={[
                  styles.amountInput,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                value={amount}
                onChangeText={(text) => {
                  // Allow only numbers and one decimal point
                  const cleaned = text.replace(/[^0-9.]/g, '');
                  const parts = cleaned.split('.');
                  if (parts.length <= 2) {
                    setAmount(cleaned);
                  }
                }}
                keyboardType="decimal-pad"
                autoFocus={true}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
              onPress={handleClose}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: goal.color || theme.primary,
                  opacity: loading ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding...' : 'Add Contribution'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    borderTopWidth: 1,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  goalInfo: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  inlineError: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  inlineErrorText: {
    fontSize: 14,
  },
  goalName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  goalRemaining: {
    fontSize: fontSize.sm,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    backgroundColor: '#F9FAFB',
  },
  currencySymbol: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    borderWidth: 0,
    padding: spacing.md,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  submitButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
