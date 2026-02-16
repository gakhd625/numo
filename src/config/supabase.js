import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { SUPABASE_URL as ENV_URL, SUPABASE_ANON_KEY as ENV_KEY } from '@env';

// EAS Build injects via app.config.js extra; local dev uses .env via @env
const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = ENV_URL ?? extra.SUPABASE_URL ?? '';
const supabaseAnonKey = ENV_KEY ?? extra.SUPABASE_ANON_KEY ?? '';

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    'Numo: Missing SUPABASE_URL or SUPABASE_ANON_KEY. Set EAS Secrets or .env. Login and sync will not work.'
  );
}

/** Real client when URL/key exist; otherwise a no-op stub so the app never crashes on init. */
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ error: { message: 'Supabase not configured' } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          }),
        }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase not configured' } }) }),
      }),
    };

export const supabaseConfigured = isConfigured;