import api from './api';

/**
 * Calculate deterministic budget breakdown with provenance
 * @param {Object} budgetParams
 */
export const calculateBudget = async (budgetParams) => {
  try {
    const response = await api.post('/budget/calculate', budgetParams);
    return response.data;
  } catch (error) {
    console.error('Error calculating budget:', error);
    return {
      success: false,
      message: 'Unable to calculate budget breakdown'
    };
  }
};
