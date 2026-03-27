import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useTransactionStore, useThemeStore } from '../store';
import CategoryIcon from '../components/CategoryIcon';
import BalanceCard from '../components/BalanceCard';
import QuickActions from '../components/QuickActions';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen({ navigation }) {
  const { user } = useAuthStore();
  const { transactions, fetchTransactions, fetchCategories, getStats } = useTransactionStore();
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    await fetchTransactions(user.id);
    await fetchCategories(user.id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const stats = getStats();
  const displayName = user?.email?.split('@')[0] || 'User';

  // Prepare pie chart data
  const pieData = stats.expensesByCategory.slice(0, 5).map((cat) => ({
    name: cat.name,
    amount: cat.amount,
    color: cat.color,
    legendFontColor: theme.text,
    legendFontSize: 12,
  }));

  // Prepare line chart data for last 6 months
  const getMonthlyData = () => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    const monthlyIncome = months.map((month) => {
      const monthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          t.type === 'income' &&
          transactionDate >= startOfMonth(month) &&
          transactionDate <= endOfMonth(month)
        );
      });
      return monthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    });

    const monthlyExpense = months.map((month) => {
      const monthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          t.type === 'expense' &&
          transactionDate >= startOfMonth(month) &&
          transactionDate <= endOfMonth(month)
        );
      });
      return monthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    });

    return {
      labels: months.map((m) => format(m, 'MMM')),
      datasets: [
        {
          data: monthlyIncome.length > 0 ? monthlyIncome : [0],
          color: (opacity = 1) => theme.income,
          strokeWidth: 3,
        },
        {
          data: monthlyExpense.length > 0 ? monthlyExpense : [0],
          color: (opacity = 1) => theme.expense,
          strokeWidth: 3,
        },
      ],
      legend: ['Income', 'Expenses'],
    };
  };

  const lineData = getMonthlyData();
  const recentTransactions = transactions.slice(0, 5);

  const handleQuickAction = (key) => {
    switch (key) {
      case 'transfer':
      case 'send':
        navigation.navigate('AddTransaction');
        break;
      case 'voucher':
        navigation.navigate('Categories');
        break;
      case 'request':
        navigation.navigate('Transactions');
        break;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="person" size={20} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                Hello, {displayName}
              </Text>
              <Text style={[styles.welcomeBack, { color: theme.text }]}>
                Welcome Back!
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.notificationBtn, { backgroundColor: theme.surface }, theme.shadowLight]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <BalanceCard balance={stats.balance} theme={theme} />

        {/* Income / Expense summary row */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }, theme.shadowLight]}>
            <View style={[styles.summaryIconBox, { backgroundColor: theme.income + '18' }]}>
              <Ionicons name="arrow-down" size={18} color={theme.income} />
            </View>
            <View>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Income</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                ${stats.totalIncome.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }, theme.shadowLight]}>
            <View style={[styles.summaryIconBox, { backgroundColor: theme.expense + '18' }]}>
              <Ionicons name="arrow-up" size={18} color={theme.expense} />
            </View>
            <View>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Expenses</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                ${stats.totalExpense.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <QuickActions theme={theme} onAction={handleQuickAction} />

        {/* Monthly Trend Chart */}
        {transactions.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.surface }, theme.shadow]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Monthly Trends
            </Text>
            <LineChart
              data={lineData}
              width={screenWidth - 80}
              height={200}
              chartConfig={{
                backgroundColor: theme.surface,
                backgroundGradientFrom: theme.surface,
                backgroundGradientTo: theme.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => theme.textTertiary || theme.textSecondary,
                labelColor: (opacity = 1) => theme.textSecondary,
                style: {
                  borderRadius: borderRadius.lg,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                },
              }}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
            />
          </View>
        )}

        {/* Expenses by Category */}
        {pieData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.surface }, theme.shadow]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Expenses by Category
            </Text>
            <PieChart
              data={pieData}
              width={screenWidth - 80}
              height={200}
              chartConfig={{
                color: (opacity = 1) => theme.text,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        )}

        {/* Last Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Last Transactions
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={[styles.seeAll, { color: theme.primary }]}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.surface }, theme.shadow]}>
              <View style={[styles.emptyIconBox, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="wallet-outline" size={36} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No transactions yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Tap + to add your first transaction
              </Text>
            </View>
          ) : (
            <View style={[styles.transactionList, { backgroundColor: theme.surface }, theme.shadow]}>
              {recentTransactions.map((transaction, index) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={[
                    styles.transactionItem,
                    index < recentTransactions.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.borderLight,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('EditTransaction', { transaction })}
                >
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: (transaction.categories?.color || theme.primary) + '18' },
                      ]}
                    >
                      <CategoryIcon
                        name={transaction.categories?.icon}
                        size={20}
                        color={transaction.categories?.color || theme.primary}
                      />
                    </View>
                    <View style={styles.transactionMeta}>
                      <Text style={[styles.transactionCategory, { color: theme.text }]}>
                        {transaction.categories?.name || 'Uncategorized'}
                      </Text>
                      <Text style={[styles.transactionDate, { color: theme.textTertiary || theme.textSecondary }]}>
                        {format(new Date(transaction.date), 'MMM dd')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color:
                            transaction.type === 'income'
                              ? theme.income
                              : theme.expense,
                        },
                      ]}
                    >
                      {transaction.type === 'income' ? '+' : '-'}$
                      {parseFloat(transaction.amount).toFixed(2)}
                    </Text>
                    <Text style={[styles.transactionType, { color: theme.textTertiary || theme.textSecondary }]}>
                      {transaction.note || transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, theme.shadow]}
        onPress={() => navigation.navigate('AddTransaction')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[theme.cardGradientStart, theme.cardGradientEnd]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* ───── Header ───── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg + 8,
    paddingBottom: spacing.md + 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  welcomeBack: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ───── Summary Row ───── */
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm + 2,
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  /* ───── Charts ───── */
  chartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  chart: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
  },

  /* ───── Section header ───── */
  transactionsSection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  seeAll: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  /* ───── Transactions ───── */
  transactionList: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  categoryIcon: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionMeta: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 3,
  },
  transactionDate: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    marginBottom: 3,
  },
  transactionType: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
  },

  /* ───── Empty state ───── */
  emptyState: {
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
  },

  /* ───── FAB ───── */
  fab: {
    position: 'absolute',
    bottom: 94,
    right: spacing.lg,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
});