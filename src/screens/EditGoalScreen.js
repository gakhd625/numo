import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useGoalStore, useThemeStore } from '../store';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';

// Predefined colors for goal customization
const GOAL_COLORS = [
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#6366F1', // Indigo
];

// Common emoji icons for goals
const GOAL_ICONS = [
  '🏠', '🚗', '💻', '✈️', '🎓', '💍', '💰', '🎮',
  '📱', '⌚', '🎨', '🎵', '🏖️', '🍕', '👕', '🎁',
];

export default function EditGoalScreen({ route, navigation }) {
  const { goal: initialGoal } = route.params;
  const { updateGoal, loading } = useGoalStore();
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;

  const [name, setName] = useState(initialGoal.name || '');
  const [targetAmount, setTargetAmount] = useState(
    initialGoal.target_amount?.toString() || ''
  );
  const [deadline, setDeadline] = useState(
    initialGoal.deadline ? new Date(initialGoal.deadline) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(initialGoal.icon || '🎯');
  const [selectedColor, setSelectedColor] = useState(
    initialGoal.color || GOAL_COLORS[0]
  );

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    // Don't allow reducing target below current saved amount
    if (parseFloat(targetAmount) < parseFloat(initialGoal.saved_amount)) {
      Alert.alert(
        'Error',
        `Target amount cannot be less than saved amount (${parseFloat(initialGoal.saved_amount).toFixed(2)})`
      );
      return;
    }

    try {
      const updates = {
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        deadline: deadline ? deadline.toISOString().split('T')[0] : null,
        icon: selectedIcon,
        color: selectedColor,
      };

      const { error } = await updateGoal(initialGoal.id, updates);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Goal updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to update goal');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No deadline';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Goal Name */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Goal Name</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="e.g., New Car, Vacation, Emergency Fund"
          placeholderTextColor={theme.textSecondary}
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Target Amount */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Target Amount</Text>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Current saved: ${parseFloat(initialGoal.saved_amount).toFixed(2)}
        </Text>
        <View style={styles.amountContainer}>
          <Text style={[styles.currencySymbol, { color: theme.text }]}>$</Text>
          <TextInput
            style={[
              styles.amountInput,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="0.00"
            placeholderTextColor={theme.textSecondary}
            value={targetAmount}
            onChangeText={(text) => {
              // Allow only numbers and one decimal point
              const cleaned = text.replace(/[^0-9.]/g, '');
              const parts = cleaned.split('.');
              if (parts.length <= 2) {
                setTargetAmount(cleaned);
              }
            }}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Deadline */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Deadline (Optional)</Text>
        <TouchableOpacity
          style={[
            styles.dateButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={theme.textSecondary}
          />
          <Text
            style={[
              styles.dateText,
              { color: deadline ? theme.text : theme.textSecondary },
            ]}
          >
            {formatDate(deadline)}
          </Text>
          {deadline && (
            <TouchableOpacity
              onPress={() => setDeadline(null)}
              style={styles.clearDateButton}
            >
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={deadline || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>

      {/* Icon Selection */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Icon</Text>
        <View style={styles.iconGrid}>
          {GOAL_ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[
                styles.iconButton,
                {
                  backgroundColor:
                    selectedIcon === icon
                      ? selectedColor + '20'
                      : theme.surface,
                  borderColor:
                    selectedIcon === icon ? selectedColor : theme.border,
                },
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconEmoji}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Color Selection */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Color</Text>
        <View style={styles.colorGrid}>
          {GOAL_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                {
                  backgroundColor: color,
                  borderColor:
                    selectedColor === color ? theme.text : 'transparent',
                  borderWidth: selectedColor === color ? 3 : 0,
                },
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          {
            backgroundColor: theme.primary,
            opacity: loading ? 0.6 : 1,
          },
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Updating...' : 'Update Goal'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFF',
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
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  dateText: {
    flex: 1,
    fontSize: fontSize.md,
  },
  clearDateButton: {
    marginLeft: 'auto',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
