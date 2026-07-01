import React, { useState, useMemo } from 'react';
import { History, Search, ArrowUpRight, ArrowDownLeft, Package, Clock, User, Filter } from 'lucide-react';
import { useLiveTable } from '../db/hooks';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ReportToolbar from '../components/ui/ReportToolbar';
import ReportHeader from '../components/ui/ReportHeader';

const inventoryLogsSortFn = (a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime();

const InventoryLog: React.FC = () => {
  const { documents: logs, loading } = useLiveTable('inventoryLogs', undefined, inventoryLogsSortFn);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      const logDate = new Date(log.createdAt).toISOString().split('T')[0];
      const matchesSearch = log.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || log.action === typeFilter;
      const matchesDate = logDate >= startDate && logDate <= endDate;
      return matchesSearch && matchesType && matchesDate;
    });
  }, [logs, searchTerm, typeFilter, startDate, endDate]);

  const handlePrint = () => window.print();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Logs</h1>
            <p className="text-slate-500 text-sm">Full audit trail of all stock movements</p>
          </div>
        </div>
      </header>

      <ReportHeader title="Inventory Audit Log" subtitle={`From ${startDate} to ${endDate}`} />

      <ReportToolbar 
        title="Inventory Audit"
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
            placeholder="Search by product or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
          />
        </div>
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm"
        >
          <option value="all">All Actions</option>
          <option value="restock">Restock</option>
          <option value="purchase">Purchases</option>
          <option value="sale">Sales</option>
          <option value="return">Returns</option>
          <option value="manual_adjustment">Adjustments</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Change</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason / Notes</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                      <Clock size={14} className="text-slate-400" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900 font-bold">{log.productName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      log.action === 'restock' ? "bg-emerald-100 text-emerald-700" :
                      log.action === 'purchase' ? "bg-violet-100 text-violet-700" :
                      log.action === 'sale' ? "bg-blue-100 text-blue-700" :
                      log.action === 'return' ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-700"
                    )}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "text-sm font-black flex items-center justify-center gap-1",
                      log.change > 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {log.change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                      {Math.abs(log.change)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-slate-600 font-medium truncate" title={log.reason}>{log.reason}</p>
                      {log.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">{log.notes}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <User size={12} className="text-slate-400" />
                       <span className="text-xs font-bold text-slate-900">{log.actorName}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryLog;
