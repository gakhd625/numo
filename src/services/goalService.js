import { supabase } from '../config/supabase';

/**
 * Goal Service
 * Handles all Supabase operations for savings goals and contributions
 */

/**
 * Create a new savings goal
 * @param {Object} goalData - Goal data (name, target_amount, deadline, icon, color)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created goal object
 */
export const createGoal = async (goalData, userId) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        ...goalData,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating goal:', error);
    return { data: null, error };
  }
};

/**
 * Get all goals for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Array of goals
 */
export const getUserGoals = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching goals:', error);
    return { data: [], error };
  }
};

/**
 * Get a single goal by ID
 * @param {string} goalId - Goal ID
 * @returns {Promise<Object>} Goal object
 */
export const getGoalById = async (goalId) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching goal:', error);
    return { data: null, error };
  }
};

/**
 * Update a goal
 * @param {string} goalId - Goal ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated goal object
 */
export const updateGoal = async (goalId, updates) => {
  try {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating goal:', error);
    return { data: null, error };
  }
};

/**
 * Delete a goal (contributions are cascade deleted)
 * @param {string} goalId - Goal ID
 * @returns {Promise<Object>} Success status
 */
export const deleteGoal = async (goalId) => {
  try {
    console.log('goalService.deleteGoal called with id:', goalId);
    const { data, error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .select();

    console.log('Supabase delete response - data:', data, 'error:', error);

    if (error) {
      throw error;
    }
    
    // Verify deletion succeeded - if RLS blocks or goal doesn't exist, data will be empty
    if (!data || data.length === 0) {
      console.log('Delete returned empty data - RLS might be blocking or goal does not exist');
      return { 
        error: { 
          message: 'Goal could not be deleted. You may not have permission or the goal no longer exists.' 
        } 
      };
    }
    
    console.log('Goal successfully deleted:', data);
    return { error: null, deleted: data };
  } catch (error) {
    console.error('Error deleting goal:', error);
    return { error };
  }
};

/**
 * Add a contribution to a goal
 * Validates that goal is not completed and amount is positive
 * Also creates an expense transaction to track the contribution
 * @param {string} goalId - Goal ID
 * @param {number} amount - Contribution amount (must be > 0)
 * @param {string} userId - User ID for creating the transaction
 * @returns {Promise<Object>} Created contribution and updated goal
 */
export const addContribution = async (goalId, amount, userId) => {
  try {
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Contribution amount must be greater than 0');
    }

    // Check if goal exists and is not completed
    const goalResult = await getGoalById(goalId);
    if (goalResult.error) {
      // Include the actual error message for better debugging
      throw new Error(`Cannot verify goal: ${goalResult.error.message || goalResult.error.toString()}`);
    }
    if (!goalResult.data) {
      throw new Error(`Goal not found (ID: ${goalId}). This may be due to permissions or the goal may have been deleted.`);
    }
    if (goalResult.data.is_completed) {
      throw new Error('Cannot add contribution to completed goal');
    }

    const goal = goalResult.data;

    // Insert contribution (trigger will update goal saved_amount)
    const { data, error } = await supabase
      .from('goal_contributions')
      .insert({
        goal_id: goalId,
        amount: amount,
      })
      .select()
      .single();

    if (error) throw error;

    // Create an expense transaction linked to this contribution
    // This reduces the user's available balance
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId || goal.user_id,
        amount: amount,
        type: 'expense',
        category_id: null, // No category - it's a savings contribution
        note: `Savings: ${goal.name}`,
        date: new Date().toISOString().split('T')[0],
        goal_contribution_id: data.id,
      });

    if (transactionError) {
      console.warn('Could not create transaction for contribution:', transactionError);
      // Don't fail the whole operation - contribution was still added
    }

    // Fetch updated goal
    const updatedGoalResult = await getGoalById(goalId);
    if (updatedGoalResult.error) {
      // If we can't fetch updated goal, still return success with contribution
      console.warn('Could not fetch updated goal after contribution:', updatedGoalResult.error);
    }
    
    return { 
      data: { 
        contribution: data, 
        goal: updatedGoalResult.data || null
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error adding contribution:', error);
    return { data: null, error };
  }
};

/**
 * Get all contributions for a goal
 * @param {string} goalId - Goal ID
 * @returns {Promise<Object>} Array of contributions
 */
export const getGoalContributions = async (goalId) => {
  try {
    const { data, error } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return { data: [], error };
  }
};

/**
 * Delete a contribution
 * Note: This will decrease the goal's saved_amount (manual update needed)
 * @param {string} contributionId - Contribution ID
 * @param {string} goalId - Goal ID (for updating saved_amount)
 * @returns {Promise<Object>} Success status
 */
export const deleteContribution = async (contributionId, goalId) => {
  try {
    // Get contribution amount before deleting
    const { data: contribution, error: contribError } = await supabase
      .from('goal_contributions')
      .select('amount')
      .eq('id', contributionId)
      .single();

    if (contribError) throw contribError;

    // Delete contribution
    const { error: deleteError } = await supabase
      .from('goal_contributions')
      .delete()
      .eq('id', contributionId);

    if (deleteError) throw deleteError;

    // Update goal saved_amount (decrease by contribution amount)
    const { data: goal, error: goalError } = await getGoalById(goalId);
    if (goalError) throw goalError;

    const newSavedAmount = Math.max(0, parseFloat(goal.data.saved_amount) - parseFloat(contribution.amount));
    const isCompleted = newSavedAmount >= parseFloat(goal.data.target_amount);

    const { data: updatedGoal, error: updateError } = await supabase
      .from('goals')
      .update({
        saved_amount: newSavedAmount,
        is_completed: isCompleted,
      })
      .eq('id', goalId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { data: updatedGoal, error: null };
  } catch (error) {
    console.error('Error deleting contribution:', error);
    return { data: null, error };
  }
};
