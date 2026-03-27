-- =====================================================
-- Numo Finance App - Link Goals to Transactions
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to add
-- the link between goal contributions and transactions
-- =====================================================

-- Add goal_contribution_id column to transactions table
-- This links expense transactions to goal contributions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS goal_contribution_id UUID REFERENCES goal_contributions (id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_goal_contribution_id ON transactions (goal_contribution_id)
WHERE
    goal_contribution_id IS NOT NULL;

-- =====================================================
-- IMPORTANT: After running this migration, when a user:
-- 1. Adds a contribution to a goal → an expense transaction is created
--    (reduces their available balance)
-- 2. Deletes a goal → all linked expense transactions are deleted
--    (restores their balance)
-- =====================================================