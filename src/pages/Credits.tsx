import React, { useState, useMemo } from 'react';
import { CreditCard, Search, Plus, Calendar, User, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useLiveTable } from '../db/hooks';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ReportToolbar from '../components/ui/ReportToolbar';
import ReportHeader from '../components/ui/ReportHeader';

const creditsSortFn = (a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime();

const Credits: React.FC = () => {
  const { documents: credits, loading: creditsLoading } = useLiveTable('credits', undefined, creditsSortFn);
  const { documents: customers, loading: customersLoading } = useLiveTable('customers');
  const { documents: vendors, loading: vendorsLoading } = useLiveTable('vendors');
  
  const allContacts = useMemo(() => {
    const custs = customers.map(c => ({ ...c, type: 'customer' }));
    const vends = vendors.map(v => ({ ...v, type: 'vendor' }));
    return [...custs, ...vends];
  }, [customers, vendors]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredCredits = useMemo(() => {
    return credits.filter((c: any) => {
      const contact = allContacts.find((cust: any) => cust.id === c.customerId);
      const creditDate = new Date(c.createdAt).toISOString().split('T')[0];
      
      const matchesSearch = contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = creditDate >= startDate && creditDate <= endDate;
      
      return matchesSearch && matchesDate;
    });
  }, [credits, allContacts, searchTerm, startDate, endDate]);

  const handlePrint = () => window.print();

  if (creditsLoading || customersLoading || vendorsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
            <CreditCard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Credit History</h1>
            <p className="text-slate-500 text-sm">View all customer credit and payment transactions</p>
          </div>
        </div>
      </header>
      <ReportHeader title="Credit & Payments Report" subtitle={`From ${startDate} to ${endDate}`} />

      <ReportToolbar 
        title="Credit Logs"
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPrint={handlePrint}
      />

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by customer name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCredits.map((credit: any) => {
                const contact = allContacts.find((c: any) => c.id === credit.customerId);
                return (
                  <tr key={credit.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(credit.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                          contact?.type === 'vendor' ? "bg-emerald-100 text-emerald-600" : "bg-violet-100 text-violet-600"
                        )}>
                          {contact?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <span className={cn(
                          "font-bold",
                          contact?.type === 'vendor' ? "text-emerald-700" : "text-slate-900"
                        )}>
                          {contact?.name || 'Unknown'}
                        </span>
                          {contact?.type === 'vendor' && <span className="ml-2 text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-1 rounded">Vendor</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const isVendor = contact?.type === 'vendor';
                        const isTaken = credit.transactionType === 'taken';
                        
                        let badgeClass = "";
                        let icon = null;
                        let typeLabel = "";
                        
                        if (isVendor) {
                          if (isTaken) {
                            badgeClass = "bg-rose-100 text-rose-600";
                            icon = <ArrowDownRight size={12} />;
                            typeLabel = "Taken";
                          } else {
                            badgeClass = "bg-emerald-100 text-emerald-600";
                            icon = <ArrowUpRight size={12} />;
                            typeLabel = "Payment";
                          }
                        } else {
                          if (!isTaken) { // given
                            badgeClass = "bg-amber-100 text-amber-600";
                            icon = <ArrowUpRight size={12} />;
                            typeLabel = "Given";
                          } else { // taken
                            badgeClass = "bg-emerald-100 text-emerald-600";
                            icon = <ArrowDownRight size={12} />;
                            typeLabel = "Payment";
                          }
                        }
                        return (
                          <span className={cn(
                            "font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 w-fit",
                            badgeClass
                          )}>
                            {icon}
                            {typeLabel}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const isVendor = contact?.type === 'vendor';
                        const isTaken = credit.transactionType === 'taken';
                        
                        let sign = "";
                        let amountClass = "";
                        
                        if (isVendor) {
                          if (isTaken) {
                            sign = "-";
                            amountClass = "text-rose-600";
                          } else {
                            sign = "+";
                            amountClass = "text-emerald-600";
                          }
                        } else {
                          if (!isTaken) {
                            sign = "+";
                            amountClass = "text-amber-600";
                          } else {
                            sign = "-";
                            amountClass = "text-emerald-600";
                          }
                        }
                        return (
                          <span className={cn(
                            "font-bold text-sm",
                            amountClass
                          )}>
                            {sign}{formatCurrency(credit.amount)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{credit.notes || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredCredits.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-medium">No credit history found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Credits;
