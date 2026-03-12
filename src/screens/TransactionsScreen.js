import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useTransactionStore, useThemeStore } from '../store';
import CategoryIcon from '../components/CategoryIcon';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';
import { format } from 'date-fns';
import { formatPesoAmount, formatSignedPesoAmount } from '../utils/currency';

export default function TransactionsScreen({ navigation }) {
  const { user } = useAuthStore();
  const { transactions, deleteTransaction, fetchTransactions } = useTransactionStore();
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;
  
  const [filterType, setFilterType] = useState('all'); // all, income, expense
  
  useEffect(() => {
    if (user) {
      fetchTransactions(user.id);
    }
  }, [user]);
  
  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const incomeTotal = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const expenseTotal = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  
  const handleDelete = (id) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(id);
            } catch (err) {
              Alert.alert('Error', err?.message || 'Could not delete transaction.');
            }
          },
        },
      ]
    );
  };
  
  const handleEdit = (transaction) => {
    navigation.navigate('EditTransaction', { transaction });
  };
  
  const renderTransaction = ({ item }) => (
    <TouchableOpacity
      style={[styles.transactionItem, { backgroundColor: theme.surface }, theme.shadow]}
      onPress={() => handleEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: item.categories?.color || theme.primary },
          ]}
        >
          <CategoryIcon
            name={item.categories?.icon}
            size={22}
            color="#FFF"
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionCategory, { color: theme.text }]}>
            {item.categories?.name || 'Uncategorized'}
          </Text>
          <Text style={[styles.transactionNote, { color: theme.textSecondary }]}>
            {item.note || 'No note'}
          </Text>
          <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
            {format(new Date(item.date), 'MMM dd, yyyy')}
          </Text>
        </View>
      </View>
      
      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            {
              color: item.type === 'income' ? theme.income : theme.expense,
            },
          ]}
        >
          {formatSignedPesoAmount(item.amount, item.type)}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  const renderHiddenItem = ({ item }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, { backgroundColor: theme.expense }]}
        onPress={() => handleDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Tap to edit. Swipe left to delete.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }, theme.shadow]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Income</Text>
          <Text style={[styles.summaryIncomeValue, { color: theme.income }]}>{formatPesoAmount(incomeTotal)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }, theme.shadow]}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Expenses</Text>
          <Text style={[styles.summaryExpenseValue, { color: theme.expense }]}>{formatPesoAmount(expenseTotal)}</Text>
        </View>
      </View>
      
      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'all' && [
              styles.filterButtonActive,
              { backgroundColor: theme.primary },
            ],
            { borderColor: theme.border },
          ]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filterType === 'all' ? '#FFF' : theme.text },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'income' && [
              styles.filterButtonActive,
              { backgroundColor: theme.income },
            ],
            { borderColor: theme.border },
          ]}
          onPress={() => setFilterType('income')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filterType === 'income' ? '#FFF' : theme.text },
            ]}
          >
            Income
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterType === 'expense' && [
              styles.filterButtonActive,
              { backgroundColor: theme.expense },
            ],
            { borderColor: theme.border },
          ]}
          onPress={() => setFilterType('expense')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filterType === 'expense' ? '#FFF' : theme.text },
            ]}
          >
            Expenses
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="receipt-outline"
            size={64}
            color={theme.textSecondary}
          />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No transactions found
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('AddTransaction')}
          >
            <Text style={styles.addButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SwipeListView
          data={filteredTransactions}
          renderItem={renderTransaction}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          disableRightSwipe
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  summaryIncomeValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  summaryExpenseValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonActive: {
    borderWidth: 0,
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconText: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  transactionNote: {
    fontSize: fontSize.sm,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: fontSize.xs,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  rowBack: {
    alignItems: 'flex-end',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: spacing.lg,
    marginBottom: spacing.sm,
  },
  backRightBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 75,
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    fontSize: fontSize.md,
  },
  addButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});