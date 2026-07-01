import React, { useState } from 'react';
import { X, CreditCard, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { db } from '../../db/database';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface AddCreditModalProps {
  customers: any[];
  initialCustomerId?: string;
  onClose: () => void;
}

const AddCreditModal: React.FC<AddCreditModalProps> = ({ customers, initialCustomerId, onClose }) => {
  const { shopId } = useAuth();
  const [formData, setFormData] = useState({
    customerId: initialCustomerId || (customers.length > 0 ? customers[0].id : ''),
    type: 'charge' as 'charge' | 'payment',
    amount: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      const customer = await db.customers.get(formData.customerId);
      if (!customer) throw new Error('Customer not found');

      const currentBalance = customer.creditBalance || 0;
      const balanceChange = formData.type === 'charge' ? amountNum : -amountNum;
      const newBalance = currentBalance + balanceChange;

      await db.customers.update(formData.customerId, {
        creditBalance: newBalance,
        updatedAt: new Date()
      });

      await db.credits.add({
        shopId,
        customerId: formData.customerId,
        type: formData.type,
        amount: amountNum,
        description: formData.description,
        createdAt: new Date()
      });

      toast.success(formData.type === 'charge' ? 'Credit charged successfully' : 'Payment recorded successfully');
      onClose();
    } catch (error: any) {
      toast.error('Failed to process credit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard size={20} className="text-amber-500" /> Manage Credit</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</label>
            <select 
              required 
              value={formData.customerId} 
              onChange={e => setFormData({...formData, customerId: e.target.value})} 
              className="w-full border rounded-xl px-4 py-2"
            >
              <option value="" disabled>Select Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'charge'})}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${formData.type === 'charge' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ArrowUpRight size={14} /> Charge
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'payment'})}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${formData.type === 'payment' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ArrowDownRight size={14} /> Payment
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</label>
            <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full border rounded-xl px-4 py-2" placeholder="0.00" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded-xl px-4 py-2 h-20 resize-none" placeholder="What is this for?" />
          </div>

          <button disabled={saving || !formData.customerId} type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold mt-4 disabled:opacity-50 transition-all uppercase tracking-widest text-xs">
            {saving ? 'Processing...' : 'Confirm'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCreditModal;
