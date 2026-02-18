-- =====================================================
-- Numo Finance App - Savings Goals Feature
-- Supabase Database Setup
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to set up
-- goals and goal_contributions tables with RLS policies
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: goals
-- Stores user savings goals
-- =====================================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  saved_amount NUMERIC NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
  deadline DATE,
  icon TEXT,
  color TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: goal_contributions
-- Stores individual contributions to goals
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on goals table
DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Handle contribution insertion
-- Automatically updates goal saved_amount and is_completed
-- =====================================================
CREATE OR REPLACE FUNCTION handle_goal_contribution()
RETURNS TRIGGER AS $$
DECLARE
  current_saved NUMERIC;
  target_amount NUMERIC;
BEGIN
  -- Get current saved amount and target amount
  SELECT saved_amount, goals.target_amount
  INTO current_saved, target_amount
  FROM goals
  WHERE id = NEW.goal_id;
  
  -- Update saved_amount
  UPDATE goals
  SET saved_amount = current_saved + NEW.amount
  WHERE id = NEW.goal_id;
  
  -- Check if goal is completed
  SELECT saved_amount INTO current_saved
  FROM goals
  WHERE id = NEW.goal_id;
  
  IF current_saved >= target_amount THEN
    UPDATE goals
    SET is_completed = true
    WHERE id = NEW.goal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle contribution insertion
DROP TRIGGER IF EXISTS on_goal_contribution_insert ON goal_contributions;
CREATE TRIGGER on_goal_contribution_insert
  AFTER INSERT ON goal_contributions
  FOR EACH ROW
  EXECUTE FUNCTION handle_goal_contribution();

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: goals
-- Users can only access their own goals
-- =====================================================
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

-- SELECT: Users can only view their own goals
-- Why: Prevents users from seeing other users' financial goals
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only create goals for themselves
-- Why: Prevents users from creating goals for other users
CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own goals
-- Why: Prevents users from modifying other users' goals
CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own goals
-- Why: Prevents users from deleting other users' goals
CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES: goal_contributions
-- Users can only access contributions to their own goals
-- =====================================================
DROP POLICY IF EXISTS "Users can view own goal contributions" ON goal_contributions;
DROP POLICY IF EXISTS "Users can insert own goal contributions" ON goal_contributions;
DROP POLICY IF EXISTS "Users can update own goal contributions" ON goal_contributions;
DROP POLICY IF EXISTS "Users can delete own goal contributions" ON goal_contributions;

-- SELECT: Users can view contributions to their own goals
-- Why: Prevents users from seeing contributions to other users' goals
CREATE POLICY "Users can view own goal contributions"
  ON goal_contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_contributions.goal_id
      AND goals.user_id = auth.uid()
    )
  );

-- INSERT: Users can add contributions to their own goals
-- Why: Prevents users from adding contributions to other users' goals
CREATE POLICY "Users can insert own goal contributions"
  ON goal_contributions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_contributions.goal_id
      AND goals.user_id = auth.uid()
    )
  );

-- UPDATE: Users can update contributions to their own goals
-- Why: Prevents users from modifying contributions to other users' goals
CREATE POLICY "Users can update own goal contributions"
  ON goal_contributions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_contributions.goal_id
      AND goals.user_id = auth.uid()
    )
  );

-- DELETE: Users can delete contributions to their own goals
-- Why: Prevents users from deleting contributions to other users' goals
CREATE POLICY "Users can delete own goal contributions"
  ON goal_contributions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_contributions.goal_id
      AND goals.user_id = auth.uid()
    )
  );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id 
  ON goals(user_id);

CREATE INDEX IF NOT EXISTS idx_goals_is_completed 
  ON goals(is_completed);

CREATE INDEX IF NOT EXISTS idx_goals_created_at 
  ON goals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_goals_deadline 
  ON goals(deadline);

-- Goal contributions indexes
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id 
  ON goal_contributions(goal_id);

CREATE INDEX IF NOT EXISTS idx_goal_contributions_created_at 
  ON goal_contributions(created_at DESC);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_goals_user_completed 
  ON goals(user_id, is_completed);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify your setup

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('goals', 'goal_contributions');

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('goals', 'goal_contributions');

-- Check policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('goals', 'goal_contributions');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('goals', 'goal_contributions');

-- =====================================================
-- END OF SETUP
-- =====================================================
