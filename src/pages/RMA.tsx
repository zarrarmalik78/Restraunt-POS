import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCcw, Search, Plus, Filter, Calendar, User, Package, ArrowRight, CheckCircle2, Clock, AlertCircle, X, Truck, Undo2 } from 'lucide-react';
import { useLiveTable } from '../db/hooks';
import { db } from '../db/database';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const RMA: React.FC = () => {
  const { shopId } = useAuth();
  const { documents: claims, loading: claimsLoading } = useLiveTable('rmaClaims');
  const { documents: serialUnits } = useLiveTable('serialUnits');
  const { documents: products } = useLiveTable('products');
  const { documents: customers } = useLiveTable('customers');
  const { documents: vendors } = useLiveTable('vendors');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHistoryUnit, setSelectedHistoryUnit] = useState<any | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState<any | null>(null);

  const filteredClaims = useMemo(() => {
    return claims.filter((c: any) => {
      const matchesSearch = 
        c.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [claims, searchTerm, statusFilter]);

  const updateClaimStatus = async (id: string, newStatus: any) => {
    try {
      await db.rmaClaims.update(id, { 
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'sent_to_vendor' ? { sentDate: new Date() } : {}),
        ...(newStatus === 'returned_to_shop' ? { returnDate: new Date() } : {})
      });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const handleFinalizeRMA = async (claim: any, destination: 'stock' | 'customer') => {
    try {
      await db.rmaClaims.update(claim.id, { 
        status: 'completed',
        updatedAt: new Date()
      });

      const unit = serialUnits.find((u: any) => u.serialNumber === claim.serialNumber);
      if (unit) {
        // If returning to stock, status is 'in_stock'
        // If returning to customer, status remains 'sold' (or update back to 'sold' if it was 'warranty_claimed')
        const newUnitStatus = destination === 'stock' ? 'in_stock' : 'sold';
        await db.serialUnits.update(unit.id, { 
          status: newUnitStatus,
          soldToCustomerId: destination === 'stock' ? undefined : unit.soldToCustomerId,
          soldDate: destination === 'stock' ? undefined : unit.soldDate
        });
      }

      toast.success(destination === 'stock' ? 'Unit returned to stock' : 'Unit returned to customer');
      setShowCompletionModal(null);
    } catch (error) {
      toast.error('Finalization failed');
    }
  };

  if (claimsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-slate-900">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 glass-card p-6 border-l-4 border-l-amber-500">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <RefreshCcw size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">RMA Management</h1>
            <p className="text-slate-500 text-sm font-medium">Track hardware returns and supplier claims</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg uppercase tracking-wider"
        >
          <Plus size={18} /> New RMA Claim
        </button>
      </div>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by SN, Product or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="sent_to_vendor">Sent to Vendor</option>
          <option value="returned_to_shop">Returned to Shop</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredClaims.map((claim: any) => {
           const unit = serialUnits.find((u: any) => u.serialNumber === claim.serialNumber);
           return (
          <div key={claim.id} className="glass-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-amber-200 transition-all group">
            <div className="flex gap-4 items-start cursor-pointer" onClick={() => {
              if (unit) setSelectedHistoryUnit(unit);
            }}>
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                claim.status === 'completed' ? "bg-emerald-100 text-emerald-600" :
                claim.status === 'sent_to_vendor' ? "bg-blue-100 text-blue-600" :
                "bg-amber-100 text-amber-600"
              )}>
                <Package size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-900">{claim.productName}</h3>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                    SN: {claim.serialNumber}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                    <User size={14} className="text-slate-400" />
                    {claim.customerName || 'Walk-in'}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                    <Truck size={14} className="text-slate-400" />
                    {claim.vendorName || 'General Vendor'}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={14} className="text-slate-400" />
                    Created: {new Date(claim.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                  "{claim.issueDescription}"
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <div className="text-center sm:text-right">
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit sm:ml-auto mb-2 shadow-sm border",
                  claim.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                  claim.status === 'sent_to_vendor' ? "bg-blue-50 text-blue-700 border-blue-100" :
                  "bg-amber-50 text-amber-700 border-amber-100"
                )}>
                  {claim.status.replace(/_/g, ' ')}
                </p>
                <p className="text-[10px] text-slate-400 font-bold">
                  Last Update: {new Date(claim.updatedAt).toLocaleTimeString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {claim.status === 'pending' && (
                  <button onClick={() => updateClaimStatus(claim.id, 'sent_to_vendor')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20">
                    Send to Vendor <ArrowRight size={14} />
                  </button>
                )}
                {claim.status === 'sent_to_vendor' && (
                  <button onClick={() => updateClaimStatus(claim.id, 'returned_to_shop')} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/20">
                    Receive from Vendor <CheckCircle2 size={14} />
                  </button>
                )}
                {claim.status === 'returned_to_shop' && (
                  <button onClick={() => setShowCompletionModal(claim)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20">
                    Complete Claim <CheckCircle2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );})}

        {filteredClaims.length === 0 && (
          <div className="glass-card p-12 text-center text-slate-400 border-dashed">
            <RefreshCcw className="mx-auto mb-4 opacity-20" size={48} />
            <p className="text-lg font-bold">No RMA claims found.</p>
            <p className="text-sm">Create a new claim to track hardware returns.</p>
          </div>
        )}
      </div>

      {showAddModal && <AddRmaModal onClose={() => setShowAddModal(false)} serialUnits={serialUnits} products={products} customers={customers} vendors={vendors} />}
      {showCompletionModal && <CompletionModal claim={showCompletionModal} onClose={() => setShowCompletionModal(null)} onFinalize={handleFinalizeRMA} unit={serialUnits.find((u: any) => u.serialNumber === showCompletionModal.serialNumber)} />}
      {selectedHistoryUnit && <UnitHistoryModal unit={selectedHistoryUnit} onClose={() => setSelectedHistoryUnit(null)} products={products} vendors={vendors} customers={customers} />}
    </div>
  );
};

const CompletionModal: React.FC<{ claim: any; unit: any; onClose: () => void; onFinalize: (claim: any, dest: 'stock' | 'customer') => void }> = ({ claim, unit, onClose, onFinalize }) => {
   const isSold = unit?.status === 'sold' || unit?.status === 'warranty_claimed' && unit?.soldToCustomerId;

   return (
     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
         <div className="p-8 text-center">
           <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
           </div>
           <h2 className="text-xl font-black text-slate-900 mb-2">Finalize RMA Claim</h2>
           <p className="text-slate-500 text-sm mb-8 leading-relaxed">
             The item <strong>{claim.serialNumber}</strong> is back from the vendor. Where should it go?
           </p>

           <div className="space-y-3">
              {isSold && (
                <button onClick={() => onFinalize(claim, 'customer')} className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                   <Undo2 size={18} /> Return to Customer
                </button>
              )}
              <button onClick={() => onFinalize(claim, 'stock')} className="w-full p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                 <Package size={18} /> Return to Shop Stock
              </button>
              <button onClick={onClose} className="w-full p-4 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl font-bold transition-all">
                 Cancel
              </button>
           </div>
         </div>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-slate-900">
      <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-violet-50/50">
          <div>
            <h2 className="text-xl font-bold">Lifecycle History</h2>
            <p className="text-xs font-mono text-violet-600 font-bold uppercase">{unit.serialNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</p>
                <p className="font-bold">{product?.name}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider block w-fit", unit.status === 'in_stock' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600")}>{unit.status.replace('_', ' ')}</span>
             </div>
          </div>
          <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
             <div className="relative pl-8"><div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm"></div><h4 className="text-sm font-bold">Procurement</h4><div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="flex justify-between text-xs text-slate-500"><span>Vendor:</span><span className="font-bold text-slate-900">{vendor?.name || 'Walk-in Vendor'}</span></div><div className="flex justify-between text-xs text-slate-500 mt-1"><span>Date:</span><span className="font-bold text-slate-900">{new Date(unit.purchaseDate).toLocaleDateString()}</span></div></div></div>
             {unit.soldDate && (<div className="relative pl-8"><div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div><h4 className="text-sm font-bold">Sale</h4><div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100"><div className="flex justify-between text-xs text-slate-500"><span>Customer:</span><span className="font-bold text-slate-900">{customer?.name || 'Guest'}</span></div><div className="flex justify-between text-xs text-slate-500 mt-1"><span>Date:</span><span className="font-bold text-slate-900">{new Date(unit.soldDate).toLocaleDateString()}</span></div></div></div>)}
             {claims.map((claim: any) => (<div key={claim.id} className="relative pl-8"><div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-amber-500 border-4 border-white shadow-sm"></div><h4 className="text-sm font-bold">RMA Claim</h4><div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100"><div className="flex justify-between text-xs text-slate-600"><span>Issue:</span><span className="font-bold text-slate-900 italic">"{claim.issueDescription}"</span></div><div className="flex justify-between text-xs text-slate-600 mt-1"><span>Status:</span><span className="font-bold text-amber-700 uppercase tracking-widest">{claim.status.replace(/_/g, ' ')}</span></div></div></div>))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AddRmaModal: React.FC<{ onClose: () => void; serialUnits: any[]; products: any[]; customers: any[]; vendors: any[] }> = ({ onClose, serialUnits, products, customers, vendors }) => {
  const { shopId } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [issue, setIssue] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [searchSn, setSearchSn] = useState('');

  const foundUnits = useMemo(() => {
    if (!searchSn || searchSn.length < 3) return [];
    return serialUnits.filter((u: any) => u.serialNumber.toLowerCase().includes(searchSn.toLowerCase())).slice(0, 5);
  }, [serialUnits, searchSn]);

  useEffect(() => {
    if (selectedUnit) {
      const v = vendors.find(vend => vend.id === selectedUnit.vendorId);
      setVendorName(v?.name || '');
    }
  }, [selectedUnit, vendors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    try {
      const product = products.find((p: any) => p.id === selectedUnit.productId);
      const customer = customers.find((c: any) => c.id === selectedUnit.soldToCustomerId);
      await db.rmaClaims.add({
        shopId: shopId!,
        serialNumber: selectedUnit.serialNumber,
        productId: selectedUnit.productId,
        productName: product?.name || 'Unknown Product',
        customerId: selectedUnit.soldToCustomerId,
        customerName: customer?.name || 'In-Stock Unit',
        issueDescription: issue,
        status: 'pending',
        vendorName: vendorName,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await db.serialUnits.update(selectedUnit.id, { status: 'warranty_claimed' });
      toast.success('RMA Claim created');
      onClose();
    } catch (error) { toast.error('Creation failed'); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
          <h2 className="text-xl font-bold text-slate-900">New RMA Claim</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Search Serial Number</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" autoFocus placeholder="Enter Serial..." value={searchSn} onChange={(e) => setSearchSn(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 outline-none font-mono text-slate-900" />
                </div>
              </div>
              <div className="space-y-3">
                {foundUnits.map((u: any) => {
                  const p = products.find((prod: any) => prod.id === u.productId);
                  return (
                    <button key={u.id} onClick={() => { setSelectedUnit(u); setStep(2); }} className="w-full p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-amber-300 transition-all group text-left">
                      <div><p className="text-xs font-bold text-amber-600">{u.serialNumber}</p><p className="text-sm font-bold text-slate-900">{p?.name}</p></div>
                      <ArrowRight size={18} className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Serial #</p><p className="text-sm font-bold text-slate-900">{selectedUnit.serialNumber}</p></div>
                <button type="button" onClick={() => setStep(1)} className="text-[10px] font-bold text-amber-600 hover:underline">Change</button>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Technical Issue</label>
                <textarea required rows={4} value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Describe the fault..." className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 outline-none text-sm text-slate-900" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-slate-400">Vendor (Auto-fetched)</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm">
                   <Truck size={18} className="text-slate-400" />
                   {vendorName || 'General Distributor'}
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all">Create Claim</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RMA;
