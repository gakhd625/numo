import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useTransactionStore, useThemeStore } from '../store';
import CategoryIcon from '../components/CategoryIcon';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';
import { formatPesoAmount, formatSignedPesoAmount } from '../utils/currency';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { useSpendingLimitStore } from '../store/spendingLimitsStore';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen({ navigation }) {
  const { user } = useAuthStore();
  const { transactions, fetchTransactions, fetchCategories, getStats } = useTransactionStore();
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;
  
  const [refreshing, setRefreshing] = useState(false);
  const { limits, fetchLimits, computeStatus } = useSpendingLimitStore();
  const limitStatuses = computeStatus(transactions);
  
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);
  
  const loadData = async () => {
    await fetchTransactions(user.id);
    await fetchCategories(user.id);
    await fetchLimits(user.id);
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  const stats = getStats();
  
  // Prepare pie chart data
  const pieData = stats.expensesByCategory.slice(0, 5).map((cat, index) => ({
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
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              Welcome back
            </Text>
            <Text style={[styles.name, { color: theme.text }]}>
              {user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={[styles.helperText, { color: theme.textSecondary }]}>
              Here is your latest financial snapshot
            </Text>
          </View>
        </View>
        
        {/* Balance Card */}
        <TouchableOpacity style={[styles.balanceCard, theme.shadow]}>
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            style={styles.balanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatPesoAmount(stats.balance)}
            </Text>
            
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <View style={styles.balanceIcon}>
                  <Ionicons name="arrow-down" size={16} color={theme.income} />
                </View>
                <View>
                  <Text style={styles.balanceItemLabel}>Income</Text>
                  <Text style={styles.balanceItemValue}>
                    {formatPesoAmount(stats.totalIncome)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.balanceItem}>
                <View style={styles.balanceIcon}>
                  <Ionicons name="arrow-up" size={16} color={theme.expense} />
                </View>
                <View>
                  <Text style={styles.balanceItemLabel}>Expenses</Text>
                  <Text style={styles.balanceItemValue}>
                    {formatPesoAmount(stats.totalExpense)}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: theme.surface, borderColor: theme.border }, theme.shadow]}
            onPress={() => navigation.navigate('AddTransaction')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color={theme.primary} />
            <Text style={[styles.quickActionText, { color: theme.text }]}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: theme.surface, borderColor: theme.border }, theme.shadow]}
            onPress={() => navigation.navigate('Transactions')}
            activeOpacity={0.8}
          >
            <Ionicons name="receipt" size={20} color={theme.primary} />
            <Text style={[styles.quickActionText, { color: theme.text }]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: theme.surface, borderColor: theme.border }, theme.shadow]}
            onPress={() => navigation.navigate('Categories')}
            activeOpacity={0.8}
          >
            <Ionicons name="pricetags" size={20} color={theme.primary} />
            <Text style={[styles.quickActionText, { color: theme.text }]}>Categories</Text>
          </TouchableOpacity>
        </View>
        
        {/* Spending Limits Status */}
        {limitStatuses.length > 0 && (
          <TouchableOpacity
            style={[styles.section, styles.card, { backgroundColor: theme.surface }, theme.shadow]}
            onPress={() => navigation.navigate('SpendingLimits')}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Spending Limits
              </Text>
              <Text style={[styles.seeAll, { color: theme.primary }]}>Manage</Text>
            </View>
            {limitStatuses.map((s) => {
              const barColor = s.exceeded ? '#EF4444' : s.percent > 80 ? '#F59E0B' : theme.primary;
              const periodLabel = s.period.charAt(0).toUpperCase() + s.period.slice(1);
              return (
                <View key={s.period} style={{ marginBottom: spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: theme.text }}>
                      {periodLabel}
                    </Text>
                    <Text style={{ fontSize: fontSize.xs, color: s.exceeded ? '#EF4444' : theme.textSecondary }}>
                      {formatPesoAmount(s.spent)} / {formatPesoAmount(s.limit)}
                    </Text>
                  </View>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.border, overflow: 'hidden' }}>
                    <View
                      style={{
                        height: '100%',
                        borderRadius: 3,
                        width: `${Math.min(s.percent, 100)}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </TouchableOpacity>
        )}

        {/* Monthly Trend Chart */}
        {transactions.length > 0 && (
          <View style={[styles.section, styles.card, { backgroundColor: theme.surface }, theme.shadow]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Monthly Trends
            </Text>
            <LineChart
              data={lineData}
              width={screenWidth - 64}
              height={220}
              chartConfig={{
                backgroundColor: theme.surface,
                backgroundGradientFrom: theme.surface,
                backgroundGradientTo: theme.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => theme.text,
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
          <View style={[styles.section, styles.card, { backgroundColor: theme.surface }, theme.shadow]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Expenses by Category
            </Text>
            <PieChart
              data={pieData}
              width={screenWidth - 64}
              height={220}
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
        
        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Transactions
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={[styles.seeAll, { color: theme.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.surface }, theme.shadow]}>
              <Ionicons name="wallet-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No transactions yet
              </Text>
            </View>
          ) : (
            recentTransactions.map((transaction) => (
              <View
                key={transaction.id}
                style={[styles.transactionItem, { backgroundColor: theme.surface }, theme.shadow]}
              >
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: transaction.categories?.color || theme.primary },
                    ]}
                  >
                    <CategoryIcon
                      name={transaction.categories?.icon}
                      size={22}
                      color="#FFF"
                    />
                  </View>
                  <View>
                    <Text style={[styles.transactionCategory, { color: theme.text }]}>
                      {transaction.categories?.name || 'Uncategorized'}
                    </Text>
                    <Text style={[styles.transactionNote, { color: theme.textSecondary }]}>
                      {transaction.note || 'No note'}
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
                    {formatSignedPesoAmount(transaction.amount, transaction.type)}
                  </Text>
                  <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
                    {format(new Date(transaction.date), 'MMM dd')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, theme.shadow]}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textTransform: 'capitalize',
  },
  balanceCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  balanceGradient: {
    padding: spacing.lg,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  balanceIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceItemLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: fontSize.xs,
  },
  balanceItemValue: {
    color: '#FFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  section: {
    marginBottom: spacing.lg,
  },
  quickActionsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
  },
  quickActionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  card: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
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
    fontWeight: fontWeight.semibold,
  },
  seeAll: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  emptyState: {
    marginHorizontal: spacing.lg,
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconText: {
    fontSize: 20,
  },
  transactionCategory: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  transactionNote: {
    fontSize: fontSize.xs,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: fontSize.xs,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});