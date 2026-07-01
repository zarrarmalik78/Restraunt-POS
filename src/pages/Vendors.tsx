import React, { useState, useMemo } from 'react';
import { Factory, Plus, Search, Trash2, Edit2, X, Phone, Mail, MapPin, History, DollarSign, Package, TrendingUp } from 'lucide-react';
import { useLiveTable } from '../db/hooks';
import { db } from '../db/database';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

// Stable sort fn — must be at module scope to avoid re-subscribing on every render
const vendorsSortFn = (a: any, b: any) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);

const Vendors: React.FC = () => {
  const { shopId } = useAuth();
  const { documents: vendors, loading } = useLiveTable('vendors', undefined, vendorsSortFn);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<any | null>(null);

  // Memoized — only recomputes when vendors list or searchTerm changes
  const filteredVendors = useMemo(() =>
    vendors.filter((v: any) =>
      v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [vendors, searchTerm]
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await db.vendors.delete(id);
        toast.success('Vendor deleted');
      } catch (error) {
        toast.error('Failed to delete vendor');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 glass-card p-6 border-l-4 border-l-emerald-600">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Factory size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vendor Management</h1>
            <p className="text-slate-500 text-sm">Manage your suppliers and wholesalers</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-wider"
        >
          <Plus size={18} /> Add New Vendor
        </button>
      </div>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search vendors by name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor: any) => (
          <div key={vendor.id} className="glass-card p-6 group hover:border-emerald-200 transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                <Factory size={24} />
              </div>
              <button 
                onClick={() => handleDelete(vendor.id)}
                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-4">{vendor.name}</h3>
            
            <div className="space-y-3">
              {vendor.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Phone size={14} className="text-slate-400" />
                  <span>{vendor.phone}</span>
                </div>
              )}
              {vendor.email && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Mail size={14} className="text-slate-400" />
                  <span className="truncate">{vendor.email}</span>
                </div>
              )}
              {vendor.address && (
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <MapPin size={14} className="text-slate-400" />
                  <span className="line-clamp-1">{vendor.address}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added On</p>
                  <p className="text-xs text-slate-600 font-medium">{vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'}</p>
               </div>
               <button 
                 onClick={() => setShowHistoryModal(vendor)}
                 className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all"
               >
                 <History size={14} /> History
               </button>
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="glass-card p-20 text-center text-slate-400">
           <Factory size={48} className="mx-auto mb-4 opacity-10" />
           <p className="font-medium">No vendors found. Add your first supplier to start tracking.</p>
        </div>
      )}

      {showAddModal && <AddVendorModal onClose={() => setShowAddModal(false)} />}
      {showHistoryModal && <VendorHistoryModal vendor={showHistoryModal} onClose={() => setShowHistoryModal(null)} />}
    </div>
  );
};

const AddVendorModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { shopId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Vendor name is required');
    if (!formData.phone) return toast.error('Phone number is required');
    setIsSubmitting(true);
    try {
      await db.vendors.add({
        shopId: shopId!,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        creditBalance: 0,
        type: 'vendor',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      toast.success('Vendor added');
      onClose();
    } catch (error) {
      toast.error('Failed to add vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900">Add Vendor</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vendor Name *</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder="Wholesale Supplier Name" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number *</label>
            <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder="+1..." />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address (Optional)</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 outline-none" placeholder="vendor@example.com" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Address (Optional)</label>
            <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none" placeholder="Business address..." />
          </div>
          <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]">
            {isSubmitting ? 'Saving...' : 'Save Vendor'}
          </button>
        </form>
      </div>
    </div>
  );
};

const VendorHistoryModal: React.FC<{ vendor: any, onClose: () => void }> = ({ vendor, onClose }) => {
  const { documents: serialUnits, loading: serialsLoading } = useLiveTable('serialUnits', (u: any) => u.vendorId === vendor.id);
  const { documents: expenses, loading: expensesLoading } = useLiveTable('expenses', (e: any) => e.vendorId === vendor.id);
  const { documents: logsDocs, loading: logsLoading } = useLiveTable('inventoryLogs', (p: any) => p.vendorId === vendor.id && p.action === 'purchase');
  const { documents: credits, loading: creditsLoading } = useLiveTable('credits', (c: any) => c.customerId === vendor.id);

  const purchases = useMemo(() => {
    // Only include purchases that have a credit component (not full cash/online)
    const newPurchases = logsDocs
      .filter((p: any) => p.paymentMethod === 'credit' || p.paymentMethod === 'split')
      .map((p: any) => ({
        id: p.id,
        date: p.createdAt,
        type: 'purchase',
        description: `${p.change}x ${p.productName}`,
        amount: p.amount || 0,
        paymentMethod: p.paymentMethod || 'cash',
        isBulk: true
      }));

    const legacySerials = serialUnits.map((u: any) => ({
      id: u.id,
      date: u.purchaseDate || u.createdAt,
      type: 'purchase',
      description: `Stock In: ${u.serialNumber}`,
      amount: u.costPrice || 0,
      isBulk: false
    }));

    // Add manual credit logs as purchases if transactionType is 'taken'
    const creditPurchases = credits
      .filter((c: any) => c.transactionType === 'taken')
      .map((c: any) => ({
        id: c.id,
        date: c.createdAt,
        type: 'purchase',
        description: c.notes || 'Credit Taken',
        amount: c.amount || 0,
        isBulk: false
      }));

    return [...newPurchases, ...legacySerials, ...creditPurchases];
  }, [logsDocs, serialUnits, credits]);

  const payments = useMemo(() => {
    // Only include expenses that are NOT automated inventory cash/online splits
    const vendorExpenses = expenses
      .filter((e: any) => e.category !== 'inventory')
      .map((e: any) => ({
        id: e.id,
        date: e.expenseDate || e.createdAt,
        type: 'payment',
        description: e.description || 'Vendor Payment',
        amount: e.amount || 0
      }));

    // Add credit logs as payments if transactionType is 'given'
    const creditPayments = credits
      .filter((c: any) => c.transactionType === 'given')
      .map((c: any) => ({
        id: c.id,
        date: c.createdAt,
        type: 'payment',
        description: c.notes || 'Vendor Payment',
        amount: c.amount || 0
      }));

    return [...vendorExpenses, ...creditPayments];
  }, [expenses, credits]);

  const history = useMemo(() => {
    return [...purchases, ...payments].sort((a: any, b: any) => {
      const dateA = a.date ? (a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime()) : 0;
      const dateB = b.date ? (b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime()) : 0;
      return dateB - dateA;
    });
  }, [purchases, payments]);

  const totalPurchased = purchases.reduce((acc, p) => acc + p.amount, 0);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const balance = totalPurchased - totalPaid;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{vendor.name} - History</h2>
              <p className="text-xs text-slate-500 font-medium">Transaction logs and credit balance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Purchased</p>
            <p className="text-lg font-black text-slate-900">{formatCurrency(totalPurchased)}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Paid</p>
            <p className="text-lg font-black text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining Credit</p>
            <p className={cn("text-lg font-black", balance > 0 ? "text-rose-600" : "text-emerald-600")}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 style-scrollbar">
          {serialsLoading || expensesLoading || logsLoading || creditsLoading ? (
            <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
          ) : history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item: any) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      item.type === 'purchase' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                      {item.type === 'purchase' ? <Package size={18} /> : <DollarSign size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{item.description}</p>
                        {item.paymentMethod && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            {item.paymentMethod}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase">
                        {item.date ? new Date(item.date).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-black",
                      item.type === 'purchase' ? "text-slate-900" : "text-emerald-600"
                    )}>
                      {item.type === 'purchase' ? '-' : '+'}{formatCurrency(item.amount)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <History size={48} className="mx-auto mb-4 opacity-10" />
              <p className="font-bold">No transaction history found for this vendor.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vendors;
