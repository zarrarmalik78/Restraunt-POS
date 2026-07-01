import React, { useState, useMemo } from 'react';
import { Shield, Search, Calendar, ChevronRight, History, AlertTriangle, CheckCircle2, Clock, Filter, Download, Truck, X } from 'lucide-react';
import { useLiveTable } from '../db/hooks';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Warranty: React.FC = () => {
  const { documents: serialUnits, loading: serialsLoading } = useLiveTable('serialUnits');
  const { documents: products, loading: productsLoading } = useLiveTable('products');
  const { documents: customers } = useLiveTable('customers');
  const { documents: vendors } = useLiveTable('vendors');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedHistoryUnit, setSelectedHistoryUnit] = useState<any | null>(null);

  const stats = useMemo(() => {
    const now = new Date();
    const active = serialUnits.filter((s: any) => new Date(s.warrantyExpiryDate) > now && s.status !== 'returned').length;
    const expired = serialUnits.filter((s: any) => new Date(s.warrantyExpiryDate) <= now).length;
    const claimed = serialUnits.filter((s: any) => s.status === 'warranty_claimed').length;
    const expiringSoon = serialUnits.filter((s: any) => {
      const expiry = new Date(s.warrantyExpiryDate);
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    }).length;

    return { active, expired, claimed, expiringSoon };
  }, [serialUnits]);

  const filteredUnits = useMemo(() => {
    return serialUnits.filter((unit: any) => {
      const product = products.find((p: any) => p.id === unit.productId);
      const matchesSearch = 
        unit.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || unit.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [serialUnits, products, searchTerm, statusFilter]);

  if (serialsLoading || productsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-slate-900">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 glass-card p-6 border-l-4 border-l-violet-600">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Warranty Registry</h1>
            <p className="text-slate-500 text-sm font-medium">Verify hardware coverage and audit lifecycle logs</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search serial or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 outline-none w-64 lg:w-80 transition-all text-slate-900 font-bold"
            />
          </div>
          <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg uppercase tracking-wider">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Warranties" value={stats.active} icon={<CheckCircle2 size={24} />} subtitle="Units under coverage" variant="emerald" />
        <StatCard title="Expiring (30d)" value={stats.expiringSoon} icon={<Clock size={24} />} subtitle="Requires attention" variant="amber" />
        <StatCard title="Expired" value={stats.expired} icon={<AlertTriangle size={24} />} subtitle="Out of coverage" variant="rose" />
        <StatCard title="Claims History" value={stats.claimed} icon={<History size={24} />} subtitle="Historical RMA" variant="blue" />
      </div>

      {/* Filters & Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
           <div className="flex gap-2">
              {['all', 'in_stock', 'sold', 'warranty_claimed'].map((status) => (
                <button 
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                    statusFilter === status ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-500 border-slate-200 hover:border-violet-200"
                  )}
                >
                  {status.replace('_', ' ').toUpperCase()}
                </button>
              ))}
           </div>
           <p className="text-xs text-slate-400 font-bold">Showing {filteredUnits.length} Units</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Serial Number</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer / Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warranty Expiry</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUnits.map((unit: any) => {
                const product = products.find((p: any) => p.id === unit.productId);
                const customer = customers.find((c: any) => c.id === unit.soldToCustomerId);
                const diffDays = Math.ceil((new Date(unit.warrantyExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <tr 
                    key={unit.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedHistoryUnit(unit)}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono font-bold text-slate-900 group-hover:text-violet-600">{unit.serialNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{product?.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{product?.brand}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className={cn(
                         "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
                         unit.status === 'in_stock' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                         unit.status === 'sold' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                         "bg-amber-50 text-amber-600 border border-amber-100"
                       )}>
                         {unit.status.replace('_', ' ')}
                       </span>
                       <p className="text-[10px] text-slate-400 font-bold mt-1.5">{customer?.name || (unit.status === 'in_stock' ? 'Not Sold' : 'Walk-in')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{new Date(unit.warrantyExpiryDate).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{diffDays > 0 ? `${diffDays} days left` : 'Expired'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                                className={cn(
                                  "h-full transition-all duration-1000",
                                  diffDays > 90 ? "bg-emerald-500" : diffDays > 30 ? "bg-amber-500" : "bg-rose-500"
                                )}
                                style={{ width: `${Math.max(0, Math.min(100, (diffDays / 365) * 100))}%` }}
                             />
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredUnits.length === 0 && (
            <div className="p-12 text-center text-slate-400 border-dashed border-2 border-slate-50 m-6 rounded-3xl">
              <Shield className="mx-auto mb-4 opacity-10" size={48} />
              <p className="font-bold">No units found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      {selectedHistoryUnit && (
        <UnitHistoryModal 
          unit={selectedHistoryUnit} 
          onClose={() => setSelectedHistoryUnit(null)} 
          products={products}
          vendors={vendors}
          customers={customers}
        />
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; subtitle: string; variant: 'emerald' | 'amber' | 'rose' | 'blue' }> = ({ title, value, icon, subtitle, variant }) => {
  const gradients = {
    emerald: "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/20",
    amber: "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20",
    rose: "bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/20",
    blue: "bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/20"
  };

  return (
    <div className={cn("rounded-3xl p-6 group transition-all relative overflow-hidden border border-white/10", gradients[variant])}>
      <div className="absolute top-4 right-4 p-2 bg-white/20 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-white mb-1 tracking-tight">{value}</p>
        <p className="text-[10px] text-white/80 font-bold uppercase tracking-tighter">{subtitle}</p>
      </div>
    </div>
  );
};

const UnitHistoryModal: React.FC<{ unit: any; onClose: () => void; products: any[]; vendors: any[]; customers: any[] }> = ({ unit, onClose, products, vendors, customers }) => {
  const product = products.find(p => p.id === unit.productId);
  const vendor = vendors.find(v => v.id === unit.vendorId);
  const customer = customers.find(c => c.id === unit.soldToCustomerId);
  const { documents: claims } = useLiveTable('rmaClaims', (c: any) => c.serialNumber === unit.serialNumber);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-violet-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Unit Lifecycle History</h2>
            <p className="text-xs font-mono text-violet-600 font-bold uppercase">{unit.serialNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>
        
        <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Information</p>
                <p className="font-bold text-slate-900">{product?.name}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</p>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider block w-fit shadow-sm border",
                  unit.status === 'in_stock' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                )}>
                  {unit.status.replace('_', ' ')}
                </span>
             </div>
          </div>

          <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
             <div className="relative pl-8">
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div>
                <h4 className="text-sm font-bold text-slate-900">Procurement</h4>
                <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                   <div className="flex justify-between text-xs font-bold"><span className="text-slate-500 font-medium">Vendor:</span><span className="text-slate-900">{vendor?.name || 'Walk-in'}</span></div>
                   <div className="flex justify-between text-xs font-bold mt-1"><span className="text-slate-500 font-medium">Date:</span><span className="text-slate-900">{new Date(unit.purchaseDate).toLocaleDateString()}</span></div>
                </div>
             </div>
             {unit.soldDate && (
               <div className="relative pl-8">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                  <h4 className="text-sm font-bold text-slate-900">Item Sold</h4>
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs font-bold"><span className="text-slate-500 font-medium">Customer:</span><span className="text-slate-900">{customer?.name || 'Guest'}</span></div>
                    <div className="flex justify-between text-xs font-bold mt-1"><span className="text-slate-500 font-medium">Date:</span><span className="text-slate-900">{new Date(unit.soldDate).toLocaleDateString()}</span></div>
                  </div>
               </div>
             )}
             {claims.map((claim: any) => (
               <div key={claim.id} className="relative pl-8">
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow-sm"></div>
                  <h4 className="text-sm font-bold text-slate-900">RMA Claim</h4>
                  <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex justify-between text-xs font-bold text-slate-600"><span className="font-medium">Issue:</span><span className="text-slate-900 italic">"{claim.issueDescription}"</span></div>
                    <div className="flex justify-between text-xs font-bold mt-1 text-slate-600"><span className="font-medium">Status:</span><span className="text-amber-700 uppercase">{claim.status.replace(/_/g, ' ')}</span></div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Warranty;
