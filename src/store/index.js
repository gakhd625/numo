import { create } from 'zustand';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  
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
    
    // Create profile
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
      });
    }

    // Do not set user or session here to prevent automatic login
    return data;
  },
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
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
      // Guest mode: do not fetch from Supabase
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
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
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