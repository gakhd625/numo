import { create } from 'zustand';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as goalService from '../services/goalService';

/** Parse Supabase auth params from URL hash or search (e.g. recovery redirect). */
function parseAuthParamsFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    const hash = u.hash ? u.hash.slice(1) : '';
    const search = u.search ? u.search.slice(1) : '';
    const params = new URLSearchParams(hash || search);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const type = params.get('type');
    if (access_token && refresh_token && type === 'recovery') {
      return { access_token, refresh_token };
    }
    return null;
  } catch {
    return null;
  }
}

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  /** When true, user landed from recovery link and must set a new password. */
  pendingPasswordReset: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  /** Call when app is opened via reset-password link (deep link or universal link). */
  setSessionFromRecoveryUrl: async (url) => {
    const params = parseAuthParamsFromUrl(url);
    if (!params) return false;
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (error) throw error;
      set({
        session: data.session,
        user: data.user,
        pendingPasswordReset: true,
      });
      return true;
    } catch (e) {
      console.error('Recovery setSession failed:', e);
      return false;
    }
  },

  clearPendingPasswordReset: () => set({ pendingPasswordReset: false }),

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    set({ user: data.user, session: data.session });
    return data;
  },
  
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Profile is created by DB trigger (handle_new_user) on auth.users insert.
    // Do not insert from client — RLS would block it and trigger already does it.
    // Do not set user/session here so user can be sent to Login (e.g. if email confirm is on).
    return data;
  },
  
  signOut: async () => {
    // Clear app state first so UI switches to Login immediately (for switching users).
    set({ user: null, session: null });
    try {
      await supabase.auth.signOut();
    } catch (_) {
      // Offline or error: we already cleared state so user can still switch account.
    }
  },
  
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://numo-auth.vercel.app/reset-password',
    });
    if (error) throw error;
    return true;
  },

  /** Call after opening app from recovery link; clears pendingPasswordReset on success. */
  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    get().clearPendingPasswordReset();
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      });
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false });
    }
  },
}));

export const useThemeStore = create((set) => ({
  isDark: false,
  toggleTheme: async () => {
    set((state) => {
      const newValue = !state.isDark;
      AsyncStorage.setItem('isDark', JSON.stringify(newValue));
      return { isDark: newValue };
    });
  },
  initializeTheme: async () => {
    const isDark = await AsyncStorage.getItem('isDark');
    if (isDark !== null) {
      set({ isDark: JSON.parse(isDark) });
    }
  },
}));

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  categories: [],
  loading: false,
  
  fetchTransactions: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      set({ transactions: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      set({ loading: false });
    }
  },
  
  addTransaction: async (transaction) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .single();
    
    if (error) throw error;
    
    set((state) => ({
      transactions: [data, ...state.transactions],
    }));
    
    return data;
  },
  
  updateTransaction: async (id, updates) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        categories (
          id,
          name,
          color,
          icon
        )
      `)
      .single();
    
    if (error) throw error;
    
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? data : t
      ),
    }));
    
    return data;
  },
  
  deleteTransaction: async (id) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },
  
  fetchCategories: async (userId) => {
    if (userId === '00000000-0000-0000-0000-000000000000') {
      set({ categories: [] });
      return;
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) throw error;
    set({ categories: data || [] });
  },

  /** Guest-only: add category in memory (no Supabase). */
  addCategoryLocal: (category) => {
    const id = 'local-' + Date.now();
    const withType = { type: 'expense', ...category };
    if (!withType.type) withType.type = 'expense';
    set((state) => ({
      categories: [...state.categories, { id, ...withType }],
    }));
    return { id, ...withType };
  },
  
  addCategory: async (category) => {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();
    
    if (error) throw error;
    
    set((state) => ({
      categories: [...state.categories, data],
    }));
    
    return data;
  },
  
  updateCategory: async (id, updates) => {
    if (String(id).startsWith('local-')) {
      set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }));
      return { id, ...updates };
    }
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? data : c
      ),
    }));
    return data;
  },

  deleteCategory: async (id) => {
    if (String(id).startsWith('local-')) {
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));
      return;
    }
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },
  
  /** Clear all transactions and categories (e.g. on logout). */
  clearData: () => {
    set({ transactions: [], categories: [] });
  },

  getStats: () => {
    const { transactions } = get();
    
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const balance = totalIncome - totalExpense;
    
    // Expenses by category
    const expensesByCategory = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        const categoryName = t.categories?.name || 'Uncategorized';
        const categoryColor = t.categories?.color || '#6B7280';
        
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            amount: 0,
            color: categoryColor,
          };
        }
        
        acc[categoryName].amount += parseFloat(t.amount);
        return acc;
      }, {});
    
    return {
      balance,
      totalIncome,
      totalExpense,
      expensesByCategory: Object.values(expensesByCategory),
    };
  },
}));

export const useGoalStore = create((set, get) => ({
  goals: [],
  contributions: {},
  loading: false,
  error: null,

  /**
   * Fetch all goals for a user
   */
  fetchGoals: async (userId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await goalService.getUserGoals(userId);
      if (error) throw error;
      set({ goals: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching goals:', error);
      set({ error, loading: false });
    }
  },

  /**
   * Create a new goal
   */
  createGoal: async (goalData, userId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await goalService.createGoal(goalData, userId);
      if (error) throw error;
      set((state) => ({
        goals: [data, ...state.goals],
        loading: false,
      }));
      return { data, error: null };
    } catch (error) {
      console.error('Error creating goal:', error);
      set({ error, loading: false });
      return { data: null, error };
    }
  },

  /**
   * Update a goal
   */
  updateGoal: async (goalId, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await goalService.updateGoal(goalId, updates);
      if (error) throw error;
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? data : g)),
        loading: false,
      }));
      return { data, error: null };
    } catch (error) {
      console.error('Error updating goal:', error);
      set({ error, loading: false });
      return { data: null, error };
    }
  },

  /**
   * Delete a goal
   */
  deleteGoal: async (goalId) => {
    set({ loading: true, error: null });
    try {
      const result = await goalService.deleteGoal(goalId);
      if (result?.error) {
        console.error('Error deleting goal:', result.error);
        set({ error: result.error, loading: false });
        return { error: result.error };
      }
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== goalId),
        contributions: Object.fromEntries(
          Object.entries(state.contributions).filter(([key]) => key !== goalId)
        ),
        loading: false,
      }));
      return { error: null };
    } catch (error) {
      console.error('Error deleting goal (exception):', error);
      set({ error, loading: false });
      return { error };
    }
  },

  /**
   * Add a contribution to a goal
   */
  addContribution: async (goalId, amount) => {
    set({ loading: true, error: null });
    try {
      const result = await goalService.addContribution(goalId, amount);
      if (result?.error) {
        set({ error: result.error, loading: false });
        return { data: null, error: result.error };
      }
      const { data } = result;
      // Update goal in store
      if (data?.goal) {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? data.goal : g
          ),
        }));
      }
      await get().fetchContributions(goalId);
      set({ loading: false });
      return { data, error: null };
    } catch (error) {
      set({ error, loading: false });
      return { data: null, error };
    }
  },

  /**
   * Fetch contributions for a specific goal
   */
  fetchContributions: async (goalId) => {
    try {
      const { data, error } = await goalService.getGoalContributions(goalId);
      if (error) throw error;
      set((state) => ({
        contributions: {
          ...state.contributions,
          [goalId]: data || [],
        },
      }));
    } catch (error) {
      console.error('Error fetching contributions:', error);
    }
  },

  /**
   * Delete a contribution
   */
  deleteContribution: async (contributionId, goalId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await goalService.deleteContribution(
        contributionId,
        goalId
      );
      if (error) throw error;
      
      // Update goal in store
      if (data) {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? data : g
          ),
          loading: false,
        }));
      }
      
      // Refresh contributions
      await get().fetchContributions(goalId);
      
      return { data, error: null };
    } catch (error) {
      console.error('Error deleting contribution:', error);
      set({ error, loading: false });
      return { data: null, error };
    }
  },

  /**
   * Clear last error (e.g. so user can dismiss on-screen message)
   */
  clearError: () => set({ error: null }),

  /**
   * Clear all goals data (e.g. on logout)
   */
  clearData: () => {
    set({ goals: [], contributions: {}, error: null });
  },
}));