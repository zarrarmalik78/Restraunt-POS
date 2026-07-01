import React, { useState, useMemo } from 'react';
import { Users, Search, Plus, Edit2, Trash2, Phone, Mail, CreditCard, X, UserPlus, Banknote, DollarSign, TrendingUp, History, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { useLiveTable } from '../db/hooks';
import { db } from '../db/database';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import ReportToolbar from '../components/ui/ReportToolbar';
import ReportHeader from '../components/ui/ReportHeader';

const customersSortFn = (a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime();

const Customers: React.FC = () => {
  const { shopId } = useAuth();
  const { documents: customers, loading: customersLoading } = useLiveTable('customers', undefined, customersSortFn);
  const { documents: sales, loading: salesLoading } = useLiveTable('sales');
  
  const loading = customersLoading || salesLoading;

  const totalSpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s: any) => {
      if (s.customerId) {
        map[s.customerId] = (map[s.customerId] || 0) + (s.totalAmount || 0);
      }
    });
    return map;
  }, [sales]);

  const allEntities = useMemo(() => {
    return customers.map(c => ({ ...c, type: 'customer' }));
  }, [customers]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [viewingHistory, setViewingHistory] = useState<any | null>(null);

  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 365)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredEntities = useMemo(() => {
    return allEntities.filter((c: any) => {
      const createdAt = c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '';
      const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.phone?.includes(searchTerm) ||
                           c.cardNumber?.includes(searchTerm) ||
                           c.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !createdAt || (createdAt >= startDate && createdAt <= endDate);
      return matchesSearch && matchesDate;
    });
  }, [allEntities, searchTerm, startDate, endDate]);

  const handlePrint = () => window.print();

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await db.customers.delete(id);
        toast.success('Deleted successfully');
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Members & Credit</h1>
            <p className="text-slate-500 text-sm">Manage restaurant members, card distributors, and credits</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-600/20 uppercase tracking-wider text-sm"
          >
            <Plus size={20} /> Add Member
          </button>
        </div>
      </header>
      <ReportHeader title="Credit / Customers Report" subtitle={`Entities joined between ${startDate} and ${endDate}`} />

      <ReportToolbar 
        title="Customer Reports"
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPrint={handlePrint}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="TOTAL MEMBERS" 
          value={allEntities.length} 
          icon={<Users size={24} className="text-white" />} 
          colorClass="bg-gradient-to-br from-indigo-600 to-blue-600 shadow-indigo-600/20" 
        />
      </div>

      <div className="glass-card p-4 bg-slate-50/50 flex items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search members by name, phone, email, or Card #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Card Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Spent</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntities.map((entity: any) => (
                <tr key={entity.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                        entity.type === 'vendor' ? "bg-emerald-100 text-emerald-600" : "bg-violet-100 text-violet-600"
                      )}>
                        {entity.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className={cn(
                        "font-bold transition-colors",
                        entity.type === 'vendor' ? "text-emerald-700 group-hover:text-emerald-500" : "text-slate-900 group-hover:text-violet-600"
                      )}>
                        {entity.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setViewingHistory(entity)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                        title="Purchase History"
                      >
                        <History size={18} />
                      </button>
                      <button 
                        onClick={() => setEditingCustomer(entity)}
                        className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all" 
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(entity.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingHistory && (
        <PurchaseHistoryModal 
          customer={viewingHistory} 
          onClose={() => setViewingHistory(null)} 
        />
      )}
      {(showAddModal || editingCustomer) && (
        <CustomerModal 
          customer={editingCustomer} 
          onClose={() => {
            setShowAddModal(false);
            setEditingCustomer(null);
          }} 
        />
      )}
    </div>
  );
};

const PurchaseHistoryModal: React.FC<{ customer: any; onClose: () => void }> = ({ customer, onClose }) => {
  const { documents: sales, loading } = useLiveTable('sales');

  const customerSales = useMemo(() => {
    return sales
      .filter((s: any) => s.customerId === customer.id)
      .sort((a: any, b: any) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }, [sales, customer.id]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 animate-pulse">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Purchase History</h2>
              <p className="text-sm text-slate-500 font-medium">{customer.name} {customer.cardNumber ? `(Card: ${customer.cardNumber})` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 style-scrollbar bg-slate-50/50">
          {loading ? (
            <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : customerSales.length === 0 ? (
            <div className="py-20 text-center">
               <History size={48} className="mx-auto mb-4 text-slate-200" />
               <p className="text-slate-400 font-medium">No purchase history found for {customer.name}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerSales.map((sale: any) => (
                <div key={sale.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm hover:border-slate-200 transition-colors">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Order #{sale.id?.toString().substring(0, 8).toUpperCase()}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-1">
                      <Clock size={12} />
                      {new Date(sale.saleDate).toLocaleString()}
                    </div>
                    <span className="text-[9px] uppercase font-extrabold text-slate-400 mt-2 block tracking-wider bg-slate-50 p-1 rounded inline-block border border-slate-100">
                      Type: {sale.orderType?.replace('_', ' ')} | Payment: {sale.paymentMethod}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-violet-600 text-lg leading-none">{formatCurrency(sale.totalAmount)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
                      By {sale.actorName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomerModal: React.FC<{ customer?: any, onClose: () => void }> = ({ customer, onClose }) => {
  const { shopId } = useAuth();
  const isEditing = !!customer;
  const isCustomer = !customer || customer.type === 'customer';

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    cardNumber: customer?.cardNumber || '',
    dateOfIssue: customer?.dateOfIssue ? new Date(customer.dateOfIssue).toISOString().split('T')[0] : '',
    distributor: customer?.distributor || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    setSaving(true);
    try {
      const parsedData = {
        ...formData,
        dateOfIssue: formData.dateOfIssue ? new Date(formData.dateOfIssue) : undefined,
      };

      if (customer) {
        await db.customers.update(customer.id, {
          ...parsedData,
          updatedAt: new Date()
        });
        toast.success('Updated successfully');
      } else {
        await db.customers.add({
          shopId,
          ...parsedData,
          creditBalance: 0,
          type: 'customer',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast.success('Member added');
      }
      onClose();
    } catch (error) {
      toast.error('Failed to save details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-md shadow-2xl animate-in zoom-in overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold">{customer ? 'Edit Member' : 'New Member'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto style-scrollbar">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
            <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-violet-500/20" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone</label>
            <input required type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-violet-500/20" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email (Optional)</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-violet-500/20" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Address (Optional)</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-violet-500/20" />
          </div>

          {isCustomer && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Card # (Optional)</label>
                  <input type="text" value={formData.cardNumber} onChange={(e) => setFormData({...formData, cardNumber: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-violet-500/20" placeholder="e.g. 6190" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Distributor (Optional)</label>
                  <input type="text" value={formData.distributor} onChange={(e) => setFormData({...formData, distributor: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-violet-500/20" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Date of Issue (Optional)</label>
                <input type="date" value={formData.dateOfIssue} onChange={(e) => setFormData({...formData, dateOfIssue: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-violet-500/20" />
              </div>
            </>
          )}

          <button type="submit" disabled={saving} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold mt-4 shadow-lg shadow-violet-600/10 active:scale-[0.98] transition-all">{saving ? 'Saving...' : 'Save Details'}</button>
        </form>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, colorClass: string }> = ({ title, value, icon, colorClass }) => (
  <div className={cn(colorClass, "rounded-[24px] p-6 shadow-lg relative overflow-hidden group border border-white/10")}>
    <div className="absolute top-4 right-4 p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform duration-300 text-white">
      {icon}
    </div>
    <div className="relative z-10">
      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-white tracking-tight">{value}</p>
    </div>
  </div>
);

export default Customers;
