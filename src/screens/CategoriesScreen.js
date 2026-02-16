import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore, useTransactionStore, useThemeStore } from '../store';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';
import CategoryIcon from '../components/CategoryIcon';

const DEFAULT_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#6366F1',
];

// FontAwesome5 icon names: income = bank accounts; expense = food, transpo, etc.
const ICONS_INCOME = ['wallet', 'university', 'landmark', 'money-bill-wave', 'piggy-bank', 'credit-card', 'building', 'chart-line'];
const ICONS_EXPENSE = ['utensils', 'car', 'home', 'gas-pump', 'gamepad', 'pills', 'plane', 'film', 'book', 'tshirt', 'shopping-cart', 'dumbbell', 'coffee', 'music', 'graduation-cap', 'hospital', 'wrench', 'palette', 'mobile-alt'];
const DEFAULT_ICONS = [...ICONS_INCOME, ...ICONS_EXPENSE];

const GUEST_ID = '00000000-0000-0000-0000-000000000000';

export default function CategoriesScreen() {
  const { user } = useAuthStore();
  const {
    categories,
    fetchCategories,
    addCategory,
    addCategoryLocal,
    deleteCategory,
    updateCategory,
  } = useTransactionStore();
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryType, setCategoryType] = useState('expense'); // 'income' | 'expense'
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS_EXPENSE[0]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const incomeCategories = categories.filter((c) => (c.type || 'expense') === 'income');
  const expenseCategories = categories.filter((c) => (c.type || 'expense') === 'expense');
  
  useEffect(() => {
    if (user && user.id !== GUEST_ID) {
      fetchCategories(user.id);
    }
  }, [user]);
  
  const handleOpenModal = (category = null, type = 'expense') => {
    if (category) {
      setEditingCategory(category);
      setCategoryType(category.type || 'expense');
      setName(category.name);
      setSelectedColor(category.color);
      setSelectedIcon(category.icon || ICONS_EXPENSE[0]);
    } else {
      setEditingCategory(null);
      setCategoryType(type);
      setName('');
      setSelectedColor(DEFAULT_COLORS[0]);
      setSelectedIcon(type === 'income' ? ICONS_INCOME[0] : ICONS_EXPENSE[0]);
    }
    setModalVisible(true);
  };
  
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    const isGuest = user?.id === GUEST_ID;
    setSaving(true);
    try {
      if (isGuest) {
        addCategoryLocal({
          type: categoryType,
          name: name.trim(),
          color: selectedColor,
          icon: selectedIcon,
        });
        setModalVisible(false);
        resetModal();
        return;
      }
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          type: categoryType,
          name: name.trim(),
          color: selectedColor,
          icon: selectedIcon,
        });
      } else {
        await addCategory({
          user_id: user.id,
          type: categoryType,
          name: name.trim(),
          color: selectedColor,
          icon: selectedIcon,
        });
      }
      setModalVisible(false);
      resetModal();
    } catch (err) {
      Alert.alert('Error', err?.message || 'Could not save category. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetModal = () => {
    setEditingCategory(null);
    setCategoryType('expense');
    setName('');
    setSelectedColor(DEFAULT_COLORS[0]);
    setSelectedIcon(ICONS_EXPENSE[0]);
  };
  
  const handleDelete = (category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(category.id);
            try {
              await deleteCategory(category.id);
            } catch (err) {
              Alert.alert('Error', err?.message || 'Could not delete category.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };
  
  const renderCategory = ({ item }) => (
    <View
      style={[
        styles.categoryCard,
        { backgroundColor: theme.surface },
        theme.shadow,
      ]}
    >
      <View style={styles.categoryLeft}>
        <View style={[styles.categoryIconWrap, { backgroundColor: item.color }]}>
          <CategoryIcon name={item.icon} size={22} color="#FFF" />
        </View>
        <Text style={[styles.categoryName, { color: theme.text }]}>
          {item.name}
        </Text>
      </View>
      
      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleOpenModal(item)}
          activeOpacity={0.7}
          disabled={deletingId === item.id}
        >
          <Ionicons name="create-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item)}
          activeOpacity={0.7}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator size="small" color={theme.expense} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={theme.expense} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSection = (title, data, type) => (
    <View key={type} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
        <TouchableOpacity
          onPress={() => handleOpenModal(null, type)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>
      {data.length === 0 ? (
        <Text style={[styles.sectionEmpty, { color: theme.textSecondary }]}>
          No {type} categories yet
        </Text>
      ) : (
        data.map((item) => (
          <View key={item.id}>
            {renderCategory({ item })}
          </View>
        ))
      )}
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Categories</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => handleOpenModal(null, 'expense')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      {categories.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="pricetags-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Income = bank accounts. Expense = food, transpo, etc.
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.income }]}
            onPress={() => handleOpenModal(null, 'income')}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>Add income category</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.primary, marginTop: spacing.sm }]}
            onPress={() => handleOpenModal(null, 'expense')}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>Add expense category</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.listContent}>
          {renderSection('Income (bank accounts)', incomeCategories, 'income')}
          {renderSection('Expense (food, transpo, etc.)', expenseCategories, 'expense')}
        </ScrollView>
      )}
      
      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          resetModal();
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingCategory ? 'Edit Category' : 'New Category'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetModal();
                }}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>Type</Text>
                  <View style={styles.typeRow}>
                    <TouchableOpacity
                      style={[
                        styles.typeChip,
                        { borderColor: theme.border, backgroundColor: categoryType === 'income' ? theme.income + '25' : theme.surface },
                      ]}
                      onPress={() => { setCategoryType('income'); setSelectedIcon(ICONS_INCOME.includes(selectedIcon) ? selectedIcon : ICONS_INCOME[0]); }}
                    >
                      <FontAwesome5 name="wallet" size={16} color={categoryType === 'income' ? theme.income : theme.textSecondary} solid />
                      <Text style={[styles.typeChipText, { color: categoryType === 'income' ? theme.income : theme.textSecondary }]}>Income</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.typeChip,
                        { borderColor: theme.border, backgroundColor: categoryType === 'expense' ? theme.expense + '25' : theme.surface },
                      ]}
                      onPress={() => { setCategoryType('expense'); setSelectedIcon(ICONS_EXPENSE.includes(selectedIcon) ? selectedIcon : ICONS_EXPENSE[0]); }}
                    >
                      <FontAwesome5 name="utensils" size={16} color={categoryType === 'expense' ? theme.expense : theme.textSecondary} solid />
                      <Text style={[styles.typeChipText, { color: categoryType === 'expense' ? theme.expense : theme.textSecondary }]}>Expense</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.background,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder={categoryType === 'income' ? 'e.g. Checking, Salary' : 'e.g. Food, Transport'}
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>Color</Text>
                  <View style={styles.colorGrid}>
                    {DEFAULT_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          selectedColor === color && styles.colorOptionSelected,
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
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: theme.text }]}>Icon</Text>
                  <View style={styles.iconGrid}>
                    {(categoryType === 'income' ? ICONS_INCOME : ICONS_EXPENSE).map((icon) => (
                      <TouchableOpacity
                        key={icon}
                        style={[
                          styles.iconOption,
                          {
                            backgroundColor:
                              selectedIcon === icon
                                ? selectedColor
                                : theme.background,
                            borderColor: theme.border,
                          },
                        ]}
                        onPress={() => setSelectedIcon(icon)}
                      >
                        <FontAwesome5 name={icon} size={22} color={selectedIcon === icon ? '#FFF' : theme.text} solid />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
            
            <TouchableOpacity
              style={[styles.saveButton, theme.shadow]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                style={styles.saveGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveText}>
                    {editingCategory ? 'Update' : 'Create'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  sectionEmpty: {
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
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
  createButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  modalBodyScroll: {
    maxHeight: 320,
  },
  modalBody: {
    marginBottom: spacing.lg,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  input: {
    height: 50,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    borderWidth: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  saveGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});