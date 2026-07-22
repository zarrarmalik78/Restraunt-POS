import React, { useState, useMemo } from 'react';
import { DollarSign, Search, Plus, Edit2, Trash2, Tag, X, Clock, TrendingDown, Wallet } from 'lucide-react';
import { useLiveTable } from '../db/hooks';
import { db } from '../db/database';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const expensesSortFn = (a: any, b: any) => b.expenseDate.getTime() - a.expenseDate.getTime();

const Expenses: React.FC = () => {
  const { shopId, userRole } = useAuth();
  const isCashier = userRole === 'cashier';
  const { documents: expenses, loading } = useLiveTable('expenses', undefined, expensesSortFn);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);

  const categories = [
    'Rent',
    'Electricity',
    'Gas',
    'Water',
    'Internet',
    'Salaries',
    'Ingredients',
    'Maintenance',
    'Cleaning Supplies',
    'Miscellaneous',
    'Other'
  ];

  const filterCategories = useMemo(() => {
    const list = [
      'Rent', 'Electricity', 'Gas', 'Water', 'Internet', 'Salaries', 
      'Ingredients', 'Maintenance', 'Cleaning Supplies', 'Miscellaneous'
    ];
    const set = new Set<string>(list);
    expenses.forEach((e: any) => {
      if (e.category && e.category.trim() !== '' && e.category !== 'Other') {
        set.add(e.category);
      }
    });
    return Array.from(set);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e: any) => 
      (e.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       e.category?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (categoryFilter === 'all' || e.category === categoryFilter)
    );
  }, [expenses, searchTerm, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (isCashier) {
      toast.error('Cashiers are not allowed to delete expenses');
      return;
    }
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await db.expenses.delete(id);
        toast.success('Expense deleted successfully');
      } catch (error) {
        toast.error('Failed to delete expense');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
            <DollarSign size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expense Management</h1>
            <p className="text-slate-500 text-sm">Track your operating costs and miscellaneous shop expenses</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-600/20 uppercase tracking-wider text-sm"
        >
          <Plus size={20} /> Add Expense
        </button>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card-orange rounded-2xl p-6 shadow-lg shadow-orange-500/20 relative overflow-hidden group">
          <div className="absolute top-4 right-4 p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <TrendingDown size={24} className="text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Total Expenses</p>
            <p className="text-3xl font-bold text-white">{expenses.length}</p>
          </div>
        </div>
        <div className="metric-card-red rounded-2xl p-6 shadow-lg shadow-rose-500/20 relative overflow-hidden group">
          <div className="absolute top-4 right-4 p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Wallet size={24} className="text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Total Procurement Cost</p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(expenses.reduce((acc: number, e: any) => acc + (e.amount || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by description or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
          >
            <option value="all">All Categories</option>
            {filterCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                {!isCashier && <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((expense: any) => (
                <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-slate-400" />
                      <span className="text-slate-900 font-bold">{expense.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{expense.description}</td>
                  <td className="px-6 py-4 text-sm text-red-600 font-bold">{formatCurrency(expense.amount)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-slate-400" />
                      {new Date(expense.expenseDate).toLocaleDateString()}
                    </div>
                  </td>
                  {!isCashier && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingExpense(expense)}
                          className="p-2 hover:bg-violet-50 rounded-lg text-slate-400 hover:text-violet-600 transition-all" 
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all" 
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredExpenses.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="text-slate-300" size={40} />
            </div>
            <p className="text-slate-400 font-medium">No expenses found matching your search.</p>
          </div>
        )}
      </div>

      {(showAddModal || (!isCashier && editingExpense)) && (
        <AddExpenseModal
          categories={categories}
          expense={isCashier ? undefined : editingExpense}
          onClose={() => {
            setShowAddModal(false);
            setEditingExpense(null);
          }}
        />
      )}
    </div>
  );
};

const AddExpenseModal: React.FC<{ categories: string[], expense?: any, onClose: () => void }> = ({ categories, expense, onClose }) => {
  const { shopId, userRole } = useAuth();
  const { documents: vendors } = useLiveTable('vendors');
  const { documents: sessions } = useLiveTable('cashSessions');
  const isEditing = !!expense;
  const isCustomCategory = expense && !categories.includes(expense.category) && expense.category !== 'Other';

  const [formData, setFormData] = useState({
    category: isCustomCategory ? 'Other' : (expense?.category || 'Miscellaneous'),
    description: expense?.description || '',
    amount: isEditing ? (expense?.amount || 0) : '' as number | string,
    vendorId: expense?.vendorId || '',
    expenseDate: expense?.expenseDate
      ? new Date(expense.expenseDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  });
  const [customCategory, setCustomCategory] = useState(isCustomCategory ? expense.category : '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    if (Number(formData.amount) <= 0) return toast.error('Expense amount must be greater than 0');
    
    const finalCategory = formData.category === 'Other' ? customCategory.trim() : formData.category;
    if (!finalCategory) return toast.error('Category is required');

    setSaving(true);
    try {
      const payload = {
        ...formData,
        category: finalCategory,
        amount: Number(formData.amount),
        expenseDate: new Date(formData.expenseDate),
        updatedAt: new Date()
      };

      if (isEditing) {
        await db.expenses.update(expense.id, payload);
        toast.success('Expense updated');
      } else {
        const activeSession = sessions.find((s: any) => s.status === 'open');
        await db.expenses.add({
          shopId,
          sessionId: activeSession?.id,
          ...payload,
          actorId: userRole || 'system',
          actorName: 'System',
          actorRole: userRole || 'admin',
          createdAt: new Date()
        });
        toast.success('Expense recorded');
      }
      onClose();
    } catch (error) {
      toast.error('Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">{isEditing ? 'Edit Expense' : 'Record New Expense'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
            <select 
              required
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {formData.category === 'Other' && (
            <div className="space-y-2 animate-in slide-in-from-top duration-200">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Custom Category Name</label>
              <input 
                required
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                placeholder="e.g. Packaging Materials"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Vendor (Optional)</label>
            <select 
              value={formData.vendorId}
              onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
            >
              <option value="">No Vendor</option>
              {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Amount</label>
            <input 
              required
              type="number" 
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value === '' ? '' : parseFloat(e.target.value)})}
              placeholder="0"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
            <textarea 
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all h-24 resize-none"
              placeholder="What was this expense for?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Expense Date</label>
            <input 
              required
              type="date" 
              value={formData.expenseDate}
              onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all uppercase tracking-widest text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="flex-1 py-4 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all uppercase tracking-widest text-xs"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Expense' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Expenses;
