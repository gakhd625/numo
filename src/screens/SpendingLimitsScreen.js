import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useTransactionStore, useThemeStore } from '../store';
import { useSpendingLimitStore } from '../store/spendingLimitsStore';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';
import { formatPesoAmount, PESO } from '../utils/currency';

const PERIODS = [
  {
    key: 'daily',
    label: 'Daily',
    icon: 'today-outline',
    description: 'Resets every day at midnight',
    gradient: ['#F59E0B', '#D97706'],
  },
  {
    key: 'weekly',
    label: 'Weekly',
    icon: 'calendar-outline',
    description: 'Resets every Monday',
    gradient: ['#3B82F6', '#2563EB'],
  },
  {
    key: 'monthly',
    label: 'Monthly',
    icon: 'calendar-number-outline',
    description: 'Resets on the 1st of each month',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
];

function ProgressBar({ percent, exceeded, theme }) {
  const [anim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: percent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const barColor = exceeded
    ? '#EF4444'
    : percent > 80
    ? '#F59E0B'
    : theme.primary;

  return (
    <View style={[pgStyles.track, { backgroundColor: theme.border }]}>
      <Animated.View
        style={[
          pgStyles.fill,
          {
            width,
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
}

const pgStyles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

function LimitCard({ period, limit, status, theme, onEdit, onToggle, onDelete }) {
  const periodMeta = PERIODS.find((p) => p.key === period);
  const isEnabled = limit?.enabled ?? false;

  return (
    <View style={[styles.limitCard, { backgroundColor: theme.surface }, theme.shadow]}>
      {/* Header */}
      <View style={styles.limitCardHeader}>
        <View style={styles.limitCardLeft}>
          <LinearGradient colors={periodMeta.gradient} style={styles.periodIcon}>
            <Ionicons name={periodMeta.icon} size={22} color="#FFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.periodLabel, { color: theme.text }]}>{periodMeta.label} Limit</Text>
            <Text style={[styles.periodDesc, { color: theme.textSecondary }]}>
              {periodMeta.description}
            </Text>
          </View>
        </View>

        {limit ? (
          <Switch
            value={isEnabled}
            onValueChange={() => onToggle(period)}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFF"
          />
        ) : null}
      </View>

      {/* Body */}
      {limit ? (
        <View style={styles.limitBody}>
          {/* Amount display */}
          <View style={styles.limitAmountRow}>
            <Text style={[styles.limitAmountLabel, { color: theme.textSecondary }]}>Limit</Text>
            <TouchableOpacity onPress={() => onEdit(period, limit.amount)} activeOpacity={0.7}>
              <View style={styles.limitAmountValueRow}>
                <Text style={[styles.limitAmountValue, { color: theme.text }]}>
                  {formatPesoAmount(limit.amount)}
                </Text>
                <Ionicons name="pencil" size={14} color={theme.primary} style={{ marginLeft: 6 }} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Progress */}
          {isEnabled && status && (
            <>
              <ProgressBar percent={status.percent} exceeded={status.exceeded} theme={theme} />

              <View style={styles.statusRow}>
                <View>
                  <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Spent</Text>
                  <Text
                    style={[
                      styles.statusValue,
                      { color: status.exceeded ? '#EF4444' : theme.text },
                    ]}
                  >
                    {formatPesoAmount(status.spent)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Remaining</Text>
                  <Text style={[styles.statusValue, { color: theme.primary }]}>
                    {formatPesoAmount(status.remaining)}
                  </Text>
                </View>
              </View>

              {status.exceeded && (
                <View style={styles.exceededBadge}>
                  <Ionicons name="warning" size={14} color="#FFF" />
                  <Text style={styles.exceededText}>Limit exceeded!</Text>
                </View>
              )}
            </>
          )}

          {/* Delete */}
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: theme.border }]}
            onPress={() => onDelete(period)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={[styles.deleteBtnText, { color: '#EF4444' }]}>Remove Limit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* No limit set — show CTA */
        <TouchableOpacity
          style={[styles.setLimitBtn, { borderColor: theme.primary }]}
          onPress={() => onEdit(period, '')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
          <Text style={[styles.setLimitBtnText, { color: theme.primary }]}>Set Limit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function SpendingLimitsScreen({ navigation }) {
  const { user } = useAuthStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;

  const {
    limits,
    loading,
    fetchLimits,
    upsertLimit,
    toggleLimit,
    deleteLimit,
    computeStatus,
  } = useSpendingLimitStore();

  const [refreshing, setRefreshing] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  useEffect(() => {
    if (user) {
      fetchLimits(user.id);
      fetchTransactions(user.id);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLimits(user.id);
    await fetchTransactions(user.id);
    setRefreshing(false);
  }, [user]);

  const statuses = computeStatus(transactions);
  const statusByPeriod = {};
  statuses.forEach((s) => {
    statusByPeriod[s.period] = s;
  });

  const getLimitForPeriod = (period) => limits.find((l) => l.period === period);

  // ----- handlers -----
  const handleEdit = (period, currentAmount) => {
    setEditingPeriod(period);
    setEditAmount(currentAmount ? String(currentAmount) : '');
  };

  const handleAmountChange = (text) => {
    const normalized = text.replace(/,/g, '').replace(/[^\d.]/g, '');
    const [whole, ...decimalParts] = normalized.split('.');
    const decimal = decimalParts.join('').slice(0, 2);
    setEditAmount(decimalParts.length > 0 ? `${whole}.${decimal}` : whole);
  };

  const handleSave = async () => {
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid amount', 'Please enter a positive number.');
      return;
    }
    try {
      await upsertLimit(user.id, editingPeriod, num);
      setEditingPeriod(null);
      setEditAmount('');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleToggle = async (period) => {
    try {
      await toggleLimit(user.id, period);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (period) => {
    const periodLabel = PERIODS.find((p) => p.key === period)?.label || period;
    Alert.alert(
      `Remove ${periodLabel} Limit`,
      'Are you sure you want to remove this spending limit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLimit(user.id, period);
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  // ----- overview stats (across all enabled limits) -----
  const anyEnabled = statuses.length > 0;
  const anyExceeded = statuses.some((s) => s.exceeded);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header Banner */}
        <View style={[styles.banner, theme.shadow]}>
          <LinearGradient
            colors={anyExceeded ? ['#EF4444', '#DC2626'] : [theme.primary, theme.primaryDark]}
            style={styles.bannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons
              name={anyExceeded ? 'warning' : 'shield-checkmark'}
              size={36}
              color="#FFF"
            />
            <Text style={styles.bannerTitle}>
              {anyExceeded
                ? 'Spending Limit Exceeded'
                : anyEnabled
                ? 'Spending On Track'
                : 'Set Your Spending Limits'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {anyEnabled
                ? `${statuses.length} active limit${statuses.length > 1 ? 's' : ''}`
                : 'Control your spending with daily, weekly, or monthly caps'}
            </Text>
          </LinearGradient>
        </View>

        {/* Limit Cards */}
        {PERIODS.map((p) => (
          <LimitCard
            key={p.key}
            period={p.key}
            limit={getLimitForPeriod(p.key)}
            status={statusByPeriod[p.key]}
            theme={theme}
            onEdit={handleEdit}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Amount Bottom Sheet (simple overlay) */}
      {editingPeriod && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBackdrop}
            activeOpacity={1}
            onPress={() => setEditingPeriod(null)}
          />
          <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {PERIODS.find((p) => p.key === editingPeriod)?.label} Spending Limit
            </Text>
            <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
              Enter the maximum amount you want to spend
            </Text>

            {/* Amount Input */}
            <View style={[styles.sheetInput, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.sheetCurrency, { color: theme.text }]}>{PESO}</Text>
              <TextInput
                style={[styles.sheetAmountText, { color: theme.text }]}
                value={editAmount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                autoFocus
              />
            </View>

            {/* Quick amounts */}
            <View style={styles.quickAmounts}>
              {[500, 1000, 2000, 5000, 10000, 20000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickAmountChip, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => setEditAmount(String(amt))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickAmountText, { color: theme.text }]}>
                    {formatPesoAmount(amt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetCancelBtn, { borderColor: theme.border }]}
                onPress={() => setEditingPeriod(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.sheetCancelText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetSaveBtn} onPress={handleSave} activeOpacity={0.8}>
                <LinearGradient
                  colors={[theme.primary, theme.primaryDark]}
                  style={styles.sheetSaveGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.sheetSaveText}>Save Limit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 20,
  },

  // Banner
  banner: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  bannerGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSize.sm,
    textAlign: 'center',
  },

  // Limit Card
  limitCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  limitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    marginRight: spacing.sm,
  },
  periodIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  periodDesc: {
    fontSize: fontSize.xs,
  },

  // Limit Body
  limitBody: {
    marginTop: spacing.md,
  },
  limitAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitAmountLabel: {
    fontSize: fontSize.sm,
  },
  limitAmountValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitAmountValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },

  // Status Row
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statusLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  statusValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  // Exceeded badge
  exceededBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#EF4444',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  exceededText: {
    color: '#FFF',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // Delete button
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  deleteBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Set limit CTA
  setLimitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
  },
  setLimitBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  // Overlay / Sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  sheetSubtitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  sheetInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 64,
    marginBottom: spacing.lg,
  },
  sheetCurrency: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginRight: spacing.sm,
  },
  sheetAmountText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },

  // Quick amounts
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickAmountChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  quickAmountText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Sheet actions
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sheetCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  sheetCancelText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  sheetSaveBtn: {
    flex: 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  sheetSaveGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSaveText: {
    color: '#FFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
