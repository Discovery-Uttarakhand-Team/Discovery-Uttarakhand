import React, { useState } from 'react';
import { 
  TrendingDown, 
  Plus, 
  Trash2, 
  DollarSign, 
  Receipt, 
  TrendingUp, 
  Percent, 
  AlertCircle,
  X,
  Loader2,
  Calendar
} from 'lucide-react';

const expenseCategories = [
  'Maintenance',
  'Fuel',
  'Insurance',
  'Staff',
  'Cleaning',
  'Marketing',
  'Rent',
  'Taxes',
  'Other'
];

const ExpensesTab = ({ 
  expenses = [], 
  listings = [],
  grossRevenue = 0,
  onCreateExpense, 
  onDeleteExpense, 
  isSubmitting 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    category: 'Maintenance',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    listing: ''
  });
  const [modalError, setModalError] = useState('');

  // Calculations
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const netProfit = grossRevenue - totalExpenses;
  const profitMargin = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : 0;

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!form.amount || Number(form.amount) <= 0) {
      setModalError('Please enter a valid expense amount.');
      return;
    }

    const payload = {
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      note: form.note.trim(),
      listing: form.listing || null
    };

    await onCreateExpense(payload);
    setIsModalOpen(false);
    setForm({
      category: 'Maintenance',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      listing: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* P&L Financial Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-forest-green/10 text-forest-green flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-gray-900">
              ₹{grossRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Bookings income</p>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-rose-700">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{expenses.length} recorded entries</p>
        </div>

        {/* Net Operating Profit */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Net Profit
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-extrabold ${
              netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              ₹{netProfit.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Revenue minus expenses</p>
        </div>

        {/* Profit Margin */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Profit Margin
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-gray-900">
              {profitMargin}%
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Operating efficiency</p>
        </div>
      </div>

      {/* Expenses Controls & Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Expense Ledger & Audit</h3>
            <p className="text-xs text-gray-500 mt-0.5">Track servicing, fuel, fleet parts, wages, and operating costs</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus size={16} />
            Add Expense Entry
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            <Receipt size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="font-semibold text-gray-700">No expenses recorded yet.</p>
            <p className="text-gray-400 mt-1">Click "Add Expense Entry" above to track maintenance, fuel, insurance and operational costs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Note / Details</th>
                  <th className="px-5 py-3.5">Associated Unit</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      {new Date(exp.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-xs truncate">
                      {exp.note || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {exp.listing?.title || 'General Fleet'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-rose-700">
                      -₹{(exp.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => onDeleteExpense(exp._id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Record Business Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Expense Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Associated Listing / Vehicle [Optional]</label>
                <select
                  value={form.listing}
                  onChange={(e) => setForm({ ...form, listing: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                >
                  <option value="">General Overhead / Fleet-wide</option>
                  {listings.map((l) => (
                    <option key={l._id} value={l._id}>{l.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="e.g. Engine oil change & brake pad replacement"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white font-semibold"
                >
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesTab;
