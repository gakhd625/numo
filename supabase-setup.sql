-- =====================================================
-- Numo Finance App - Supabase Database Setup
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to set up
-- all required tables, policies, and indexes
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: profiles
-- Stores user profile information
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: categories
-- type: 'income' = bank accounts / income sources; 'expense' = spending (food, transpo, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add type column if upgrading from an older schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'type') THEN
    ALTER TABLE categories ADD COLUMN type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense'));
  END IF;
END $$;

-- =====================================================
-- TABLE: transactions
-- Stores all income and expense transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: profiles
-- Drop first so this script is idempotent (safe to re-run)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- RLS POLICIES: categories
-- =====================================================
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES: transactions
-- =====================================================
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id 
  ON categories(user_id);

CREATE INDEX IF NOT EXISTS idx_categories_created_at 
  ON categories(created_at DESC);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
  ON transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_date 
  ON transactions(date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_category_id 
  ON transactions(category_id);

CREATE INDEX IF NOT EXISTS idx_transactions_type 
  ON transactions(type);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
  ON transactions(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
  ON transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_type 
  ON transactions(user_id, type);

-- =====================================================
-- TABLE: spending_limits (OPTIONAL)
-- Stores user-defined daily/weekly/monthly spending caps.
-- The app falls back to local AsyncStorage if this table
-- does not exist, so it is safe to skip this section.
-- =====================================================
CREATE TABLE IF NOT EXISTS spending_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, period)
);

ALTER TABLE spending_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own spending_limits" ON spending_limits;
DROP POLICY IF EXISTS "Users can insert own spending_limits" ON spending_limits;
DROP POLICY IF EXISTS "Users can update own spending_limits" ON spending_limits;
DROP POLICY IF EXISTS "Users can delete own spending_limits" ON spending_limits;

CREATE POLICY "Users can view own spending_limits"
  ON spending_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spending_limits"
  ON spending_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spending_limits"
  ON spending_limits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own spending_limits"
  ON spending_limits FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_spending_limits_user_id
  ON spending_limits(user_id);

-- =====================================================
-- FUNCTIONS: Automatic profile creation
-- =====================================================

-- Function to create profile automatically on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SEED DATA: Default categories (optional)
-- =====================================================
-- Uncomment and modify the user_id to add default categories for testing
-- Replace 'YOUR-USER-ID-HERE' with an actual user UUID

/*
INSERT INTO categories (user_id, name, color, icon) VALUES
  ('YOUR-USER-ID-HERE', 'Food', '#EF4444', '🍔'),
  ('YOUR-USER-ID-HERE', 'Transport', '#F59E0B', '🚗'),
  ('YOUR-USER-ID-HERE', 'Housing', '#10B981', '🏠'),
  ('YOUR-USER-ID-HERE', 'Entertainment', '#3B82F6', '🎮'),
  ('YOUR-USER-ID-HERE', 'Healthcare', '#8B5CF6', '💊'),
  ('YOUR-USER-ID-HERE', 'Shopping', '#EC4899', '🛒'),
  ('YOUR-USER-ID-HERE', 'Salary', '#22C55E', '💰'),
  ('YOUR-USER-ID-HERE', 'Investment', '#14B8A6', '📈');
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify your setup

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'categories', 'transactions');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'categories', 'transactions');

-- Check policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'categories', 'transactions');

-- =====================================================
-- CLEANUP (CAUTION: This will delete all data!)
-- =====================================================
-- Uncomment to reset the database (for development only)

/*
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
*/

-- =====================================================
-- END OF SETUP
-- =====================================================