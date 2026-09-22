/**
 * Discovery Uttarakhand — Partner Expense Model
 * Supports real deterministic accounting & Profit/Loss analytics for business partners.
 */

import mongoose from 'mongoose';
import { imageSchema } from './sharedSchemas.js';

const partnerExpenseSchema = new mongoose.Schema({
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true,
    index: true
  },
  ownerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PartnerListing',
    default: null
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Maintenance', 'Fuel', 'Repair', 'Cleaning', 'Staff', 
      'Platform Fee', 'Insurance', 'Marketing', 'Rent', 'Taxes', 'Other'
    ],
    default: 'Other'
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Expense amount cannot be negative']
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  note: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  receiptImage: {
    type: imageSchema,
    default: null
  }
}, {
  timestamps: true
});

partnerExpenseSchema.index({ partner: 1, date: -1 });
partnerExpenseSchema.index({ ownerUser: 1, date: -1 });

const PartnerExpense = mongoose.model('PartnerExpense', partnerExpenseSchema);
export default PartnerExpense;
