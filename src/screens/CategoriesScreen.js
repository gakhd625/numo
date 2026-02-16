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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useTransactionStore, useThemeStore } from '../store';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';

const DEFAULT_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#6366F1',
];

const DEFAULT_ICONS = [
  '🍔', '🏠', '🚗', '🎮', '💊', '✈️', '🎬', '📚', '👕', '💰',
  '🏋️', '☕', '🎵', '🛒', '💼', '🎓', '🏥', '🔧', '🎨', '📱',
];

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
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_ICONS[0]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  useEffect(() => {
    if (user && user.id !== GUEST_ID) {
      fetchCategories(user.id);
    }
  }, [user]);
  
  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setSelectedColor(category.color);
      setSelectedIcon(category.icon);
    } else {
      setEditingCategory(null);
      setName('');
      setSelectedColor(DEFAULT_COLORS[0]);
      setSelectedIcon(DEFAULT_ICONS[0]);
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
          name: name.trim(),
          color: selectedColor,
          icon: selectedIcon,
        });
      } else {
        await addCategory({
          user_id: user.id,
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
    setName('');
    setSelectedColor(DEFAULT_COLORS[0]);
    setSelectedIcon(DEFAULT_ICONS[0]);
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
        <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
          <Text style={styles.categoryIconText}>{item.icon}</Text>
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
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Categories</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => handleOpenModal()}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      {categories.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="pricetags-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No categories yet
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.primary }]}
            onPress={() => handleOpenModal()}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>Create Category</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
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
            
            <View style={styles.modalBody}>
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
                  placeholder="Category name"
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
                  {DEFAULT_ICONS.map((icon) => (
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
                      <Text style={styles.iconOptionText}>{icon}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
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
  modalBody: {
    marginBottom: spacing.lg,
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
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconOptionText: {
    fontSize: 24,
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