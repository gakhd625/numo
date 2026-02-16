import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useTransactionStore, useThemeStore } from '../store';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';
import { format } from 'date-fns';
import CategoryIcon from '../components/CategoryIcon';

export default function AddTransactionScreen({ navigation }) {
  const { user } = useAuthStore();
  const { categories, addTransaction, fetchCategories } = useTransactionStore();
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;
  
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const categoriesByType = categories.filter((c) => (c.type || 'expense') === type);
  
  useEffect(() => {
    if (user) {
      fetchCategories(user.id);
    }
  }, [user]);

  useEffect(() => {
    const selected = categories.find((c) => c.id === categoryId);
    if (selected && (selected.type || 'expense') !== type) {
      setCategoryId('');
    }
  }, [type, categories, categoryId]);
  
  const handleSubmit = async () => {
    if (!amount || !categoryId) {
      Alert.alert('Error', 'Please fill in amount and select a category');
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    try {
      await addTransaction({
        user_id: user.id,
        type,
        amount: amountNum,
        category_id: categoryId,
        note,
        date: format(date, 'yyyy-MM-dd'),
      });
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'income' && [
                styles.typeButtonActive,
                { backgroundColor: theme.income },
              ],
              { borderColor: theme.border },
            ]}
            onPress={() => setType('income')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-down"
              size={20}
              color={type === 'income' ? '#FFF' : theme.text}
            />
            <Text
              style={[
                styles.typeText,
                { color: type === 'income' ? '#FFF' : theme.text },
              ]}
            >
              Income
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'expense' && [
                styles.typeButtonActive,
                { backgroundColor: theme.expense },
              ],
              { borderColor: theme.border },
            ]}
            onPress={() => setType('expense')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={type === 'expense' ? '#FFF' : theme.text}
            />
            <Text
              style={[
                styles.typeText,
                { color: type === 'expense' ? '#FFF' : theme.text },
              ]}
            >
              Expense
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
            Amount
          </Text>
          <View style={styles.amountInput}>
            <Text style={[styles.currencySymbol, { color: theme.text }]}>$</Text>
            <TextInput
              style={[styles.amountValue, { color: theme.text }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>
        
        {/* Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.label, { color: theme.text }]}>
              Category ({type === 'income' ? 'bank accounts' : 'spending'})
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Categories')} activeOpacity={0.8}>
              <Text style={[styles.link, { color: theme.primary }]}>
                Manage
              </Text>
            </TouchableOpacity>
          </View>
          
          {categoriesByType.length === 0 ? (
            <View style={[styles.emptyCategory, { backgroundColor: theme.surface }]}>
              <Text style={[styles.emptyCategoryText, { color: theme.textSecondary }]}>
                No {type} categories yet. Add one in Categories tab.
              </Text>
            </View>
          ) : (
            <View style={styles.categoryGrid}>
              {categoriesByType.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    categoryId === category.id && styles.categoryItemActive,
                    {
                      backgroundColor:
                        categoryId === category.id
                          ? category.color
                          : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setCategoryId(category.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.categoryIconWrap, { backgroundColor: categoryId === category.id ? 'rgba(255,255,255,0.3)' : category.color }]}>
                    <CategoryIcon name={category.icon} size={20} color={categoryId === category.id ? '#FFF' : theme.text} />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      {
                        color:
                          categoryId === category.id ? '#FFF' : theme.text,
                      },
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        {/* Note */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Note</Text>
          <TextInput
            style={[
              styles.noteInput,
              {
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
        
        {/* Date */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Date</Text>
          <TouchableOpacity
            style={[
              styles.dateContainer,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={20} color={theme.primary} />
            <Text style={[styles.dateText, { color: theme.text }]}>
              {format(date, 'MMMM dd, yyyy')}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setDate(selectedDate);
              }}
              maximumDate={new Date()}
            />
          )}
        </View>
      </ScrollView>
      
      {/* Submit Button */}
      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={[styles.submitButton, theme.shadow]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Add Transaction</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  typeButtonActive: {
    borderWidth: 0,
  },
  typeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  amountLabel: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    marginRight: spacing.xs,
  },
  amountValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    minWidth: 100,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  link: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  emptyCategory: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
  },
  categoryItemActive: {
    borderWidth: 0,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  noteInput: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    borderWidth: 1,
    minHeight: 100,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  dateText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  submitGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});