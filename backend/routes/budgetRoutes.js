import express from 'express';
import BudgetEngine from '../services/budgetEngine.js';

const router = express.Router();

/**
 * @route   POST /api/budget/calculate
 * @desc    Calculate deterministic, multi-category budget breakdown
 * @access  Public
 */
router.post('/calculate', async (req, res) => {
  try {
    const budgetData = await BudgetEngine.calculateBudget(req.body);
    res.status(200).json(budgetData);
  } catch (error) {
    console.error('Budget Engine Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate budget',
      error: error.message
    });
  }
});

export default router;
