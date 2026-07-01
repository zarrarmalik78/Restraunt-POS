import React, { useState, useMemo } from 'react';
import { History, Search, ArrowDownLeft, Package, Clock, User, Filter, DollarSign, Truck, Eye, X, ChevronRight } from 'lucide-react';
import { useLiveTable } from '../db/hooks';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ReportToolbar from '../components/ui/ReportToolbar';
import ReportHeader from '../components/ui/ReportHeader';

// Both fns at module scope — prevents Firestore re-subscription on every render
const purchasesFilterFn = (l: any) => l.action === 'purchase';
const purchasesSortFn = (a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime();

const Purchases: React.FC = () => {
  const { documents: logs, loading } = useLiveTable('inventoryLogs', purchasesFilterFn, purchasesSortFn);
  const { documents: vendors } = useLiveTable('vendors');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);

  // Build a map for O(1) vendor lookup instead of O(n) .find() per table row
  const vendorMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const v of vendors as any[]) map.set(v.id, v);
    return map;
  }, [vendors]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      const logDate = new Date(log.createdAt).toISOString().split('T')[0];
      const matchesSearch = log.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = logDate >= startDate && logDate <= endDate;
      return matchesSearch && matchesDate;
    });
  }, [logs, searchTerm, startDate, endDate]);

  const handlePrint = () => window.print();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase History</h1>
            <p className="text-slate-500 text-sm">Review all inward stock and procurement events</p>
          </div>
        </div>
      </header>

      <ReportHeader title="Inventory Purchase Report" subtitle={`From ${startDate} to ${endDate}`} />

      <ReportToolbar 
        title="Purchases Audit"
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPrint={handlePrint}
      />

      <div className="glass-card p-4 bg-slate-50/50 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by product, SN, or reason..."
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
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Qty</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total Cost</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log: any) => {
                // O(1) lookup via pre-built map
                const vendor = vendorMap.get(log.vendorId);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-slate-900 font-bold text-sm">{new Date(log.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <p className="text-slate-900 font-bold text-sm">{log.productName}</p>
                        {log.isSerialized && (
                          <span className="text-[9px] font-black text-violet-600 uppercase tracking-tighter">Serialized</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-600 font-medium text-sm">{vendor?.name || 'Walk-in Vendor'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-black text-slate-700">
                        {log.change}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        log.paymentMethod === 'cash' ? "bg-emerald-100 text-emerald-700" :
                        log.paymentMethod === 'online' ? "bg-blue-100 text-blue-700" :
                        log.paymentMethod === 'credit' ? "bg-amber-100 text-amber-700" :
                        "bg-violet-100 text-violet-700"
                      )}>
                        {log.paymentMethod || 'cash'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-black text-slate-900">{formatCurrency(log.amount || 0)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedPurchase(log)}
                        className="p-2 hover:bg-violet-50 text-slate-400 hover:text-violet-600 rounded-lg transition-all"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
             <div className="text-center py-20 text-slate-400">
                <Truck size={48} className="mx-auto mb-4 opacity-10" />
                <p className="font-bold">No purchase records found.</p>
             </div>
          )}
        </div>
      </div>

      {selectedPurchase && (
        <PurchaseDetailsModal 
          purchase={selectedPurchase} 
          vendor={vendorMap.get(selectedPurchase.vendorId)}
          onClose={() => setSelectedPurchase(null)} 
        />
      )}
    </div>
  );
};

const PurchaseDetailsModal: React.FC<{ purchase: any; vendor: any; onClose: () => void }> = ({ purchase, vendor, onClose }) => {
  const splitData = useMemo(() => {
    if (purchase.paymentMethod === 'split' && purchase.notes?.startsWith('Split: ')) {
      try {
        return JSON.parse(purchase.notes.replace('Split: ', ''));
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [purchase]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Purchase Details</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">{new Date(purchase.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 style-scrollbar">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Procured From</label>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-base font-black text-slate-900">{vendor?.name || 'Walk-in Vendor'}</p>
                {vendor?.phone && <p className="text-xs text-slate-500 font-medium mt-1">{vendor.phone}</p>}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Financial Summary</label>
              <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100">
                <p className="text-base font-black text-violet-700">{formatCurrency(purchase.amount || 0)}</p>
                <p className="text-[10px] text-violet-500 font-black uppercase mt-1">Paid via {purchase.paymentMethod}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Item Details</label>
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 flex items-center justify-between border-b border-slate-50">
                <div>
                  <p className="text-sm font-black text-slate-900">{purchase.productName}</p>
                  <p className="text-xs text-slate-500 font-medium">Quantity: {purchase.change} Units</p>
                </div>
                <div className="text-right">
                   <p className="text-xs font-black text-slate-400">Unit Price</p>
                   <p className="text-sm font-black text-slate-900">{formatCurrency((purchase.amount || 0) / (purchase.change || 1))}</p>
                </div>
              </div>

              {purchase.serialNumbers && purchase.serialNumbers.length > 0 && (
                <div className="p-4 bg-slate-50/50">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Serial Numbers</p>
                   <div className="flex flex-wrap gap-2">
                     {purchase.serialNumbers.map((sn: string) => (
                       <span key={sn} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-600 uppercase">
                         {sn}
                       </span>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Split if applicable */}
          {splitData && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Split Payment Breakdown</label>
              <div className="grid grid-cols-3 gap-4">
                 <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Cash</p>
                    <p className="text-sm font-black text-emerald-700">{formatCurrency(splitData.cash || 0)}</p>
                 </div>
                 <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-[8px] font-black text-blue-600 uppercase mb-1">Online</p>
                    <p className="text-sm font-black text-blue-700">{formatCurrency(splitData.online || 0)}</p>
                 </div>
                 <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[8px] font-black text-amber-600 uppercase mb-1">Credit</p>
                    <p className="text-sm font-black text-amber-700">{formatCurrency(splitData.credit || 0)}</p>
                 </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
             <div className="flex items-center gap-2">
               <User size={14} className="text-slate-400" />
               <p className="text-xs text-slate-500 font-medium">Logged by <span className="font-bold text-slate-900">{purchase.actorName}</span> ({purchase.actorRole})</p>
             </div>
             {purchase.reason && (
               <p className="text-xs text-slate-500 italic">"{purchase.reason}"</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchases;
