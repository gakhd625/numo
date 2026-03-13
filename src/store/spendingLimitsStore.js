import { create } from 'zustand';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

const STORAGE_KEY = '@numo_spending_limits';

/**
 * Spending Limits Store
 *
 * Each limit has the shape:
 * {
 *   id: string,
 *   user_id: string,
 *   period: 'daily' | 'weekly' | 'monthly',
 *   amount: number,          // the cap
 *   enabled: boolean,
 *   created_at: string,
 *   updated_at: string,
 * }
 *
 * For simplicity the limits are stored locally via AsyncStorage (keyed per user)
 * so the feature works offline / without a new Supabase migration.
 * If a `spending_limits` table exists on the server, the store will sync with it.
 */

/** Try to use Supabase table; returns false if the table does not exist. */
async function supabaseTableExists() {
  try {
    const { error } = await supabase
      .from('spending_limits')
      .select('id')
      .limit(1);
    // If the table doesn't exist Supabase returns a 404-class error
    if (error && (error.code === '42P01' || error.message?.includes('not configured'))) return false;
    if (error && error.code) return false; // other DB errors – fallback to local
    return true;
  } catch {
    return false;
  }
}

function getDateRange(period) {
  const now = new Date();
  switch (period) {
    case 'daily':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'weekly':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'monthly':
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

export const useSpendingLimitStore = create((set, get) => ({
  limits: [],          // array of limit objects
  loading: false,
  useRemote: false,    // whether Supabase table is available

  /** Initialise: try remote, fall back to AsyncStorage. */
  fetchLimits: async (userId) => {
    set({ loading: true });
    try {
      const remote = await supabaseTableExists();
      if (remote) {
        const { data, error } = await supabase
          .from('spending_limits')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        if (!error) {
          set({ limits: data || [], useRemote: true, loading: false });
          return;
        }
      }
      // Fallback: local
      const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
      set({ limits: raw ? JSON.parse(raw) : [], useRemote: false, loading: false });
    } catch (e) {
      console.error('fetchLimits error', e);
      set({ loading: false });
    }
  },

  /** Persist locally for given userId. */
  _persistLocal: async (userId) => {
    const { limits } = get();
    await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(limits));
  },

  /** Add or update a limit for a given period. Only one limit per period. */
  upsertLimit: async (userId, period, amount, enabled = true) => {
    const { limits, useRemote, _persistLocal } = get();
    const existing = limits.find((l) => l.period === period);
    const now = new Date().toISOString();

    if (existing) {
      // UPDATE
      const updated = { ...existing, amount, enabled, updated_at: now };
      if (useRemote) {
        const { data, error } = await supabase
          .from('spending_limits')
          .update({ amount, enabled, updated_at: now })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        set((s) => ({ limits: s.limits.map((l) => (l.id === existing.id ? data : l)) }));
      } else {
        set((s) => ({ limits: s.limits.map((l) => (l.id === existing.id ? updated : l)) }));
        await _persistLocal(userId);
      }
    } else {
      // INSERT
      const newLimit = {
        id: useRemote ? undefined : `local-${Date.now()}`,
        user_id: userId,
        period,
        amount,
        enabled,
        created_at: now,
        updated_at: now,
      };

      if (useRemote) {
        delete newLimit.id; // let the DB assign it
        const { data, error } = await supabase
          .from('spending_limits')
          .insert(newLimit)
          .select()
          .single();
        if (error) throw error;
        set((s) => ({ limits: [...s.limits, data] }));
      } else {
        set((s) => ({ limits: [...s.limits, newLimit] }));
        await _persistLocal(userId);
      }
    }
  },

  /** Toggle a limit on/off. */
  toggleLimit: async (userId, period) => {
    const { limits } = get();
    const limit = limits.find((l) => l.period === period);
    if (!limit) return;
    await get().upsertLimit(userId, period, limit.amount, !limit.enabled);
  },

  /** Delete a limit for a given period. */
  deleteLimit: async (userId, period) => {
    const { limits, useRemote, _persistLocal } = get();
    const limit = limits.find((l) => l.period === period);
    if (!limit) return;

    if (useRemote) {
      const { error } = await supabase
        .from('spending_limits')
        .delete()
        .eq('id', limit.id);
      if (error) throw error;
    }

    set((s) => ({ limits: s.limits.filter((l) => l.period !== period) }));
    if (!useRemote) await _persistLocal(userId);
  },

  /** Get the enabled limit object for a period (or null). */
  getLimitForPeriod: (period) => {
    const { limits } = get();
    return limits.find((l) => l.period === period && l.enabled) || null;
  },

  /**
   * Compute current spending vs each enabled limit.
   * Returns an array of { period, limit, spent, remaining, percent, exceeded }.
   */
  computeStatus: (transactions) => {
    const { limits } = get();
    return limits
      .filter((l) => l.enabled)
      .map((l) => {
        const { start, end } = getDateRange(l.period);
        const spent = transactions
          .filter((t) => {
            if (t.type !== 'expense') return false;
            const d = new Date(t.date);
            return d >= start && d <= end;
          })
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const remaining = Math.max(l.amount - spent, 0);
        const percent = l.amount > 0 ? Math.min((spent / l.amount) * 100, 100) : 0;

        return {
          period: l.period,
          limit: l.amount,
          spent,
          remaining,
          percent,
          exceeded: spent > l.amount,
        };
      });
  },

  /**
   * Check whether adding `additionalAmount` would exceed any enabled limit.
   * Returns an array of warnings (empty if all OK).
   */
  checkLimits: (transactions, additionalAmount) => {
    const { limits } = get();
    const warnings = [];

    limits
      .filter((l) => l.enabled)
      .forEach((l) => {
        const { start, end } = getDateRange(l.period);
        const spent = transactions
          .filter((t) => {
            if (t.type !== 'expense') return false;
            const d = new Date(t.date);
            return d >= start && d <= end;
          })
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const newTotal = spent + additionalAmount;
        if (newTotal > l.amount) {
          const periodLabel = l.period.charAt(0).toUpperCase() + l.period.slice(1);
          warnings.push(
            `${periodLabel} limit: This expense will put you at ₱${newTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })} / ₱${l.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
          );
        }
      });

    return warnings;
  },

  clearLimits: () => set({ limits: [] }),
}));
