import React, { useState, useMemo } from 'react';
import { useLiveTable } from '../db/hooks';
import { db, CashSession } from '../db/database';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { 
  Briefcase, 
  Clock, 
  PlayCircle, 
  StopCircle, 
  Banknote, 
  CreditCard, 
  TrendingDown, 
  TrendingUp, 
  X,
  RotateCcw,
  CheckCircle2,
  ShoppingCart,
  FileText,
  DollarSign,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CashSessions() {
  const { user, shopId } = useAuth();
  const { documents: sessions, loading } = useLiveTable<CashSession>('cashSessions');
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [closingSession, setClosingSession] = useState<CashSession | null>(null);
  const [viewingSession, setViewingSession] = useState<CashSession | null>(null);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
  }, [sessions]);

  const activeSession = sortedSessions.find(s => s.status === 'open');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600 shadow-inner">
              <Briefcase size={24} />
            </div>
            Cash Sessions
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage your business operation periods and reconcile cash.</p>
        </div>
        <div>
          {activeSession ? (
            <button
              onClick={() => setClosingSession(activeSession)}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 transition-all flex items-center gap-2"
            >
              <StopCircle size={20} />
              Close Active Session
            </button>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
            >
              <PlayCircle size={20} />
              Open Cash Session
            </button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Session</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Opened</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Closed</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSessions.map((session, index) => (
                <tr 
                  key={session.id} 
                  onClick={() => setViewingSession(session)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                      Session #{sortedSessions.length - index}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      session.status === 'open' ? "bg-emerald-100 text-emerald-700 animate-pulse" : "bg-slate-100 text-slate-600"
                    )}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Clock size={14} className="text-slate-400" />
                      {new Date(session.openedAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {session.closedAt ? (
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(session.closedAt).toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm italic">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-emerald-600">
                      {session.status === 'closed' && session.totalSales !== undefined
                        ? formatCurrency(session.totalSales)
                        : <span className="text-slate-400 italic font-normal text-sm">Active...</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {sortedSessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="text-slate-300" size={40} />
                    </div>
                    <p className="text-slate-400 font-medium">No cash sessions found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showOpenModal && (
        <OpenSessionModal 
          onClose={() => setShowOpenModal(false)} 
          shopId={shopId || 'default_shop'} 
          user={user} 
        />
      )}

      {closingSession && (
        <CloseSessionModal 
          session={closingSession} 
          onClose={() => setClosingSession(null)} 
          user={user} 
        />
      )}

      {viewingSession && viewingSession.status === 'closed' && (
        <ViewSessionModal 
          session={viewingSession} 
          onClose={() => setViewingSession(null)} 
        />
      )}
    </div>
  );
}

// ==========================================
// OPEN SESSION MODAL
// ==========================================
function OpenSessionModal({ onClose, shopId, user }: { onClose: () => void, shopId: string, user: any }) {
  const [openingCash, setOpeningCash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newSession: CashSession = {
        shopId,
        status: 'open',
        openedAt: new Date(),
        openedBy: 'User',
        openingCash: openingCash ? parseFloat(openingCash) : 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.cashSessions.add(newSession);
      toast.success('Cash Session Opened!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to open session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <PlayCircle className="text-emerald-500" /> Open Cash Session
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleOpen} className="p-6 space-y-6">
          <p className="text-sm text-slate-500">
            Start a new shift or business period. All orders processed will be attached to this session until you close it.
          </p>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Opening Cash in Drawer (Optional)</label>
            <div className="relative">
              <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
              {isSubmitting ? 'Opening...' : 'Start Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// CLOSE SESSION MODAL
// ==========================================
function CloseSessionModal({ session, onClose, user }: { session: CashSession, onClose: () => void, user: any }) {
  const { documents: allSales } = useLiveTable('sales');
  const { documents: allExpenses } = useLiveTable('expenses');
  const [activeTab, setActiveTab] = useState<'summary' | 'orders' | 'returns' | 'expenses'>('summary');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter items belonging to this session
  const sessionSales = useMemo(() => {
    return allSales.filter((s: any) => {
      if (s.sessionId && s.sessionId === session.id) return true;
      const sTime = new Date(s.saleDate).getTime();
      const openTime = new Date(session.openedAt).getTime();
      return sTime >= openTime;
    });
  }, [allSales, session]);

  const sessionExpenses = useMemo(() => {
    return allExpenses.filter((e: any) => {
      if (e.sessionId && e.sessionId === session.id) return true;
      const eTime = new Date(e.expenseDate).getTime();
      const openTime = new Date(session.openedAt).getTime();
      return eTime >= openTime;
    });
  }, [allExpenses, session]);

  const completedOrders = useMemo(() => {
    return sessionSales.filter((s: any) => s.status !== 'returned');
  }, [sessionSales]);

  const returnedOrders = useMemo(() => {
    return sessionSales.filter((s: any) => s.status === 'returned');
  }, [sessionSales]);

  const summary = useMemo(() => {
    let totalSales = 0;
    let totalCashPayments = 0;
    let totalOnlinePayments = 0;
    let totalExpenses = 0;

    for (const sale of completedOrders as any[]) {
      totalSales += sale.totalAmount || 0;
      if (sale.paymentMethod === 'cash') {
        totalCashPayments += sale.totalAmount || 0;
      } else {
        totalOnlinePayments += sale.totalAmount || 0;
      }
    }

    for (const expense of sessionExpenses as any[]) {
      totalExpenses += expense.amount || 0;
    }

    const openingCash = session.openingCash || 0;
    const expectedCash = openingCash + totalCashPayments - totalExpenses;

    return {
      totalOrders: completedOrders.length,
      totalSales,
      totalCashPayments,
      totalOnlinePayments,
      totalReversedOrders: returnedOrders.length,
      totalExpenses,
      expectedCash
    };
  }, [completedOrders, returnedOrders, sessionExpenses, session]);

  const handleClose = async () => {
    setIsSubmitting(true);
    try {
      await db.cashSessions.update(session.id!, {
        status: 'closed',
        closedAt: new Date(),
        closedBy: 'User',
        ...summary,
        updatedAt: new Date()
      });
      toast.success('Cash Session Closed!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to close session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <StopCircle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Close Cash Session</h2>
              <p className="text-xs text-slate-500 font-medium">Opened at {new Date(session.openedAt).toLocaleString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/30 px-6 gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={cn(
              "py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'summary' ? "border-violet-600 text-violet-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            📊 Summary
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              "py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'orders' ? "border-violet-600 text-violet-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            🛍️ Orders ({completedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={cn(
              "py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'returns' ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            🔄 Returned ({returnedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={cn(
              "py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'expenses' ? "border-violet-600 text-violet-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            💸 Expenses ({sessionExpenses.length})
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <SummaryCard title="Opening Cash" value={formatCurrency(session.openingCash || 0)} icon={<Banknote className="text-slate-400" size={16} />} />
                <SummaryCard title="Total Sales" value={formatCurrency(summary.totalSales)} icon={<TrendingUp className="text-emerald-500" size={16} />} />
                <SummaryCard title="Cash Payments" value={formatCurrency(summary.totalCashPayments)} icon={<Banknote className="text-emerald-500" size={16} />} />
                <SummaryCard title="Online/Card" value={formatCurrency(summary.totalOnlinePayments)} icon={<CreditCard className="text-blue-500" size={16} />} />
                <SummaryCard title="Expenses" value={formatCurrency(summary.totalExpenses)} icon={<TrendingDown className="text-rose-500" size={16} />} isNegative />
                <SummaryCard title="Reversed Orders" value={summary.totalReversedOrders.toString()} icon={<RotateCcw className="text-amber-500" size={16} />} />
              </div>

              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-black text-emerald-900 text-lg">Expected Cash in Drawer</h3>
                  <p className="text-emerald-600/80 text-xs font-bold uppercase mt-0.5">Opening Cash + Cash Sales - Expenses</p>
                </div>
                <div className="text-3xl font-black text-emerald-600">
                  {formatCurrency(summary.expectedCash)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <OrdersDetailList orders={completedOrders} emptyText="No orders completed in this session." />
          )}

          {activeTab === 'returns' && (
            <ReturnsDetailList orders={returnedOrders} emptyText="No returned orders in this session." />
          )}

          {activeTab === 'expenses' && (
            <ExpensesDetailList expenses={sessionExpenses} emptyText="No expenses recorded in this session." />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
            Review Later
          </button>
          <button onClick={handleClose} disabled={isSubmitting} className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
            {isSubmitting ? 'Closing...' : 'Confirm & Close Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VIEW SESSION MODAL (History)
// ==========================================
function ViewSessionModal({ session, onClose }: { session: CashSession, onClose: () => void }) {
  const { documents: allSales } = useLiveTable('sales');
  const { documents: allExpenses } = useLiveTable('expenses');
  const [activeTab, setActiveTab] = useState<'summary' | 'orders' | 'returns' | 'expenses'>('summary');

  const sessionSales = useMemo(() => {
    return allSales.filter((s: any) => {
      if (s.sessionId && s.sessionId === session.id) return true;
      const sTime = new Date(s.saleDate).getTime();
      const openTime = new Date(session.openedAt).getTime();
      const closeTime = session.closedAt ? new Date(session.closedAt).getTime() : Date.now();
      return sTime >= openTime && sTime <= closeTime;
    });
  }, [allSales, session]);

  const sessionExpenses = useMemo(() => {
    return allExpenses.filter((e: any) => {
      if (e.sessionId && e.sessionId === session.id) return true;
      const eTime = new Date(e.expenseDate).getTime();
      const openTime = new Date(session.openedAt).getTime();
      const closeTime = session.closedAt ? new Date(session.closedAt).getTime() : Date.now();
      return eTime >= openTime && eTime <= closeTime;
    });
  }, [allExpenses, session]);

  const completedOrders = useMemo(() => {
    return sessionSales.filter((s: any) => s.status !== 'returned');
  }, [sessionSales]);

  const returnedOrders = useMemo(() => {
    return sessionSales.filter((s: any) => s.status === 'returned');
  }, [sessionSales]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Session Details</h2>
              <p className="text-xs text-slate-500 font-medium">
                {new Date(session.openedAt).toLocaleString()} — {session.closedAt ? new Date(session.closedAt).toLocaleString() : 'Active'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/30 px-6 gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={cn(
              "py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'summary' ? "border-violet-600 text-violet-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            📊 Summary
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              "py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'orders' ? "border-violet-600 text-violet-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            🛍️ Orders ({completedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={cn(
              "py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'returns' ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            🔄 Returned ({returnedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={cn(
              "py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'expenses' ? "border-violet-600 text-violet-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            💸 Expenses ({sessionExpenses.length})
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <SummaryCard title="Opening Cash" value={formatCurrency(session.openingCash || 0)} icon={<Banknote className="text-slate-400" size={16} />} />
                <SummaryCard title="Total Sales" value={formatCurrency(session.totalSales || 0)} icon={<TrendingUp className="text-emerald-500" size={16} />} />
                <SummaryCard title="Cash Payments" value={formatCurrency(session.totalCashPayments || 0)} icon={<Banknote className="text-emerald-500" size={16} />} />
                <SummaryCard title="Online/Card" value={formatCurrency(session.totalOnlinePayments || 0)} icon={<CreditCard className="text-blue-500" size={16} />} />
                <SummaryCard title="Expenses" value={formatCurrency(session.totalExpenses || 0)} icon={<TrendingDown className="text-rose-500" size={16} />} isNegative />
                <SummaryCard title="Reversed Orders" value={(session.totalReversedOrders || 0).toString()} icon={<RotateCcw className="text-amber-500" size={16} />} />
              </div>

              <div className="bg-violet-50 rounded-2xl p-5 border border-violet-100 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-black text-violet-900 text-lg">Expected Cash</h3>
                  <p className="text-violet-600/80 text-xs font-bold uppercase mt-0.5">Opening Cash + Cash Sales - Expenses</p>
                </div>
                <div className="text-3xl font-black text-violet-600">
                  {formatCurrency(session.expectedCash || 0)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <OrdersDetailList orders={completedOrders} emptyText="No orders found for this session." />
          )}

          {activeTab === 'returns' && (
            <ReturnsDetailList orders={returnedOrders} emptyText="No returned orders in this session." />
          )}

          {activeTab === 'expenses' && (
            <ExpensesDetailList expenses={sessionExpenses} emptyText="No expenses recorded in this session." />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button onClick={onClose} className="w-full px-4 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// DETAILED LIST COMPONENTS
// ==========================================
function OrdersDetailList({ orders, emptyText }: { orders: any[], emptyText: string }) {
  if (orders.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 font-medium">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900">
                Bill #{order.id?.toString().slice(-6).toUpperCase()}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                order.paymentMethod === 'cash' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              )}>
                {order.paymentMethod}
              </span>
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                {order.orderType?.replace('_', ' ')}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              {new Date(order.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.items?.length || 0} item(s): {order.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}
            </div>
          </div>
          <div className="font-black text-slate-900 text-base sm:text-right shrink-0">
            {formatCurrency(order.totalAmount)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReturnsDetailList({ orders, emptyText }: { orders: any[], emptyText: string }) {
  if (orders.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 font-medium">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="bg-rose-50/40 border border-rose-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-rose-900">
                Returned Bill #{order.id?.toString().slice(-6).toUpperCase()}
              </span>
              <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                VOIDED
              </span>
            </div>
            <div className="text-xs text-rose-700/70 font-medium mt-1">
              Reason: {order.returnReason || 'No reason provided'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              Returned at: {order.returnedAt ? new Date(order.returnedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
          <div className="font-black text-rose-700 text-base sm:text-right shrink-0">
            {formatCurrency(order.totalAmount)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpensesDetailList({ expenses, emptyText }: { expenses: any[], emptyText: string }) {
  if (expenses.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 font-medium">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div key={expense.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900">{expense.category}</span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date(expense.expenseDate).toLocaleDateString()}
              </span>
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">
              {expense.description || 'No description'}
            </div>
          </div>
          <div className="font-black text-rose-600 text-base sm:text-right shrink-0">
            -{formatCurrency(expense.amount)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryCard({ title, value, icon, isNegative }: { title: string, value: string, icon: React.ReactNode, isNegative?: boolean }) {
  return (
    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
      </div>
      <div className={cn("text-lg font-black", isNegative ? "text-rose-600" : "text-slate-800")}>
        {value}
      </div>
    </div>
  );
}
