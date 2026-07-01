import React, { useState, useMemo } from 'react';
import { Barcode, Search, Shield, Clock, User, Package, Filter, Box } from 'lucide-react';
import { useLiveTable } from '../db/hooks';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const serialUnitsSortFn = (a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime();

const SerialUnits: React.FC = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const { documents: units, loading: unitsLoading } = useLiveTable('serialUnits', undefined, serialUnitsSortFn);
  const { documents: products, loading: productsLoading } = useLiveTable('products');
  const { documents: customers, loading: customersLoading } = useLiveTable('customers');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUnits = useMemo(() => {
    return units.filter((u: any) => {
      const product = products.find((p: any) => p.id === u.productId);
      const searchMatch = u.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'all' || u.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [units, products, searchTerm, statusFilter]);

  // Memoize counts so we don't scan units[] four times on every render
  const unitCounts = useMemo(() => {
    let inStock = 0, sold = 0, rmaCount = 0;
    for (const u of units as any[]) {
      if (u.status === 'in_stock') inStock++;
      else if (u.status === 'sold') sold++;
      else if (u.status === 'rma' || u.status === 'returned') rmaCount++;
    }
    return { inStock, sold, rmaCount };
  }, [units]);

  if (unitsLoading || productsLoading || customersLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
            <Barcode size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Serial Tracking</h1>
            <p className="text-slate-500 text-sm">Track individual hardware serial numbers and warranties</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-violet-500">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Serials</p>
          <p className="text-3xl font-black text-slate-900">{units.length}</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-emerald-500">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">In Stock</p>
          <p className="text-3xl font-black text-emerald-600">{unitCounts.inStock}</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-blue-500">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Sold</p>
          <p className="text-3xl font-black text-blue-600">{unitCounts.sold}</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-l-amber-500">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">RMA / Return</p>
          <p className="text-3xl font-black text-amber-600">{unitCounts.rmaCount}</p>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Serial Number or Product Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
            <Filter size={16} className="text-slate-400 mr-2" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-900 text-sm focus:outline-none appearance-none pr-4"
            >
              <option value="all">All Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="sold">Sold</option>
              <option value="returned">Returned</option>
              <option value="rma">RMA</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Serial Number</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warranty Expiry</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sale Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnits.map((unit: any) => {
                const product = products.find((p: any) => p.id === unit.productId);
                const customer = unit.soldToCustomerId ? customers.find((c: any) => c.id === unit.soldToCustomerId) : null;
                const isWarrantyActive = unit.warrantyExpiryDate ? new Date() <= new Date(unit.warrantyExpiryDate) : false;

                return (
                  <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Barcode size={14} className="text-slate-400" />
                        <span className="font-mono font-bold text-slate-900">{unit.serialNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{product?.name || 'Unknown Product'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit",
                        unit.status === 'in_stock' ? "bg-emerald-100 text-emerald-700" :
                        unit.status === 'sold' ? "bg-blue-100 text-blue-700" :
                        unit.status === 'returned' ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-700"
                      )}>
                        <Box size={12} />
                        {unit.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {unit.warrantyExpiryDate ? (
                        <div className="flex items-center gap-2">
                          <Shield size={14} className={isWarrantyActive ? "text-emerald-500" : "text-rose-500"} />
                          <span className={cn("text-sm font-semibold", isWarrantyActive ? "text-slate-700" : "text-rose-600 line-through")}>
                            {new Date(unit.warrantyExpiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {unit.status === 'sold' && unit.soldDate ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock size={12} /> {new Date(unit.soldDate).toLocaleDateString()}
                          </div>
                          {customer && (
                            <div className="flex items-center gap-1 text-xs text-slate-700 font-semibold">
                              <User size={12} className="text-slate-400" /> {customer.name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUnits.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Barcode className="text-slate-300" size={40} />
            </div>
            <p className="text-slate-400 font-medium">No serial units found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SerialUnits;
