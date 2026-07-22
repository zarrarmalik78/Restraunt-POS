import React, { useState, useMemo } from 'react';
import { History, Search, Trash2, Clock, User, CreditCard, Banknote, RefreshCw, FileText, Printer, TrendingUp, RotateCcw, ShoppingCart } from 'lucide-react';
import { useLiveTable, useLiveDocument } from '../db/hooks';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { db } from '../db/database';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import ReportToolbar from '../components/ui/ReportToolbar';
import ReportHeader from '../components/ui/ReportHeader';
import { X } from 'lucide-react';

// Stable sort fn at module scope — prevents useLiveTable re-subscribing on every render
const salesSortFn = (a: any, b: any) => b.saleDate.getTime() - a.saleDate.getTime();

const ReturnModal: React.FC<{ sale: any; onConfirm: (reason: string, password: string) => void; onClose: () => void }> = ({ sale, onConfirm, onClose }) => {
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-slate-900/20 z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-6 max-w-md w-full animate-in zoom-in duration-300 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <RotateCcw size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Return & Void Bill</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-xs text-slate-500 leading-relaxed">
            You are about to return and void <strong className="text-slate-900">Bill #${sale.id?.toString().padStart(6, '0')}</strong>. This will reverse all daily revenue totals and restore the purchased items back to inventory.
          </p>

          <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Amount to Reverse</span>
            <span className="text-2xl font-black text-rose-700">{formatCurrency(sale.totalAmount)}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Manager Security Password <span className="text-rose-500">*</span></label>
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="Enter manager password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Reason for Return <span className="text-slate-400 font-normal">(Optional)</span></label>
            <textarea
              rows={2}
              placeholder="e.g. Cashier error, customer changed mind..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason, password)}
            disabled={!password.trim()}
            className="w-1/2 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Confirm Return
          </button>
        </div>
      </div>
    </div>
  );
};

const Sales: React.FC = () => {
  const { shopId, userRole, currentUser } = useAuth();
  const { documents: sales, loading } = useLiveTable('sales', undefined, salesSortFn);
  const { documents: customers } = useLiveTable('customers');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [showInvoiceModal, setShowInvoiceModal] = useState<any | null>(null);
  const [showReturnModal, setShowReturnModal] = useState<any | null>(null);

  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredSales = useMemo(() => {
    return sales.filter((s: any) => {
      // Exclude open dine-in orders (they appear in POS open tables panel)
      if (s.status === 'open') return false;

      // Filter by returned status
      const showReturnedOnly = paymentFilter === 'return';
      if (showReturnedOnly && s.status !== 'returned') return false;
      if (!showReturnedOnly && s.status === 'returned') return false;

      const customer = customers.find((c: any) => c.id === s.customerId);
      const customerName = customer?.name || 'Walk-in';
      const saleDate = new Date(s.saleDate).toISOString().split('T')[0];
      
      const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (s.id && s.id.toString().includes(searchTerm));
      const matchesPayment = paymentFilter === 'all' || paymentFilter === 'return' || s.paymentMethod === paymentFilter;
      const matchesDate = saleDate >= startDate && saleDate <= endDate;

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [sales, customers, searchTerm, paymentFilter, startDate, endDate]);

  const handlePrintReport = () => {
    window.print();
  };

  const { document: settings } = useLiveDocument('settings', shopId || 'default_shop');

  const handleReturn = async (sale: any, reason: string, password: string) => {
    const expectedPassword = settings?.managerPassword || 'manager';
    if (password.trim() !== expectedPassword) {
      toast.error('Incorrect Manager Password');
      return false;
    }

    const finalReason = reason.trim() || 'No reason provided';

    try {
      let creditToReverse = 0;

      // Reverse inventory
      for (const item of sale.items) {
        // If item was already individually returned, do not restock it again!
        if (item.isReturned) continue;
        const product = await db.products.get(item.productId);
        if (product) {
          await db.products.update(item.productId, {
            stockQuantity: (product.stockQuantity || 0) + item.quantity,
            updatedAt: new Date()
          });
        }

        if (item.serialNumbers && item.serialNumbers.length > 0) {
          const allSerials = await db.serialUnits.toArray();
          const toUpdate = allSerials.filter((s: any) => item.serialNumbers.includes(s.serialNumber));
          for (const u of toUpdate) {
            if (u.id) {
              await db.serialUnits.update(u.id, {
                status: 'in_stock',
                soldDate: undefined,
                saleId: undefined,
                soldToCustomerId: undefined,
                updatedAt: new Date()
              });
            }
          }
        }

        await db.inventoryLogs.add({
          shopId: shopId!,
          productId: item.productId,
          productName: item.productName,
          action: 'return',
          type: 'return',
          change: item.quantity,
          reason: `Bill Returned: ${sale.id} (${finalReason})`,
          notes: item.serialNumbers?.length ? `Restored Serials: ${item.serialNumbers.join(', ')}` : '',
          actorId: userRole,
          actorName: currentUser?.username || 'System',
          actorRole: userRole || 'admin',
          createdAt: new Date()
        });

        creditToReverse += item.totalPrice; // Track value of unreturned items to reverse credit properly
      }

      // Reverse credit for the remaining unreturned items value
      if (sale.customerId && creditToReverse > 0) {
        let actualCreditReversed = 0;
        if (sale.paymentMethod === 'credit') {
          actualCreditReversed = creditToReverse;
        } else if (sale.paymentMethod === 'split' && sale.paymentSplits) {
           const creditSplit = sale.paymentSplits.find((s: any) => s.method === 'credit');
           if (creditSplit) {
              // If they paid partially in credit, we only reverse up to the credit amount they actually took
              actualCreditReversed = Math.min(creditSplit.amount, creditToReverse);
           }
        }

        if (actualCreditReversed > 0) {
          const customer = await db.customers.get(sale.customerId);
          if (customer) {
            await db.customers.update(sale.customerId, {
              creditBalance: (customer.creditBalance || 0) - actualCreditReversed,
              updatedAt: new Date()
            });
            await db.credits.add({
              shopId: shopId!,
              customerId: sale.customerId,
              amount: actualCreditReversed,
              transactionType: 'taken', // Reducing their credit balance is effectively a payment/clearance
              notes: `Bill Returned: ${sale.id} (${finalReason})`,
              actorId: userRole,
              actorName: currentUser?.username || 'System',
              actorRole: userRole || 'admin',
              createdAt: new Date()
            });
          }
        }
      }

      // Soft delete: mark as returned instead of deleting
      await db.sales.update(sale.id, {
        status: 'returned',
        returnReason: finalReason,
        returnedAt: new Date(),
        returnedBy: currentUser?.username || 'admin',
        updatedAt: new Date()
      });
      toast.success('Bill returned and inventory restored');
    } catch (error) {
      console.error(error);
      toast.error('Failed to return sale');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales History</h1>
            <p className="text-slate-500 text-sm">View and manage all your past sales and transactions</p>
          </div>
        </div>
      </header>

      <ReportHeader title="Sales History Report" subtitle={`From ${startDate} to ${endDate}`} />

      <ReportToolbar 
        title="Sales Transactions"
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPrint={handlePrintReport}
      />

      {/* Filters & Search */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 bg-slate-50/50">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            autoComplete="off"
            placeholder="Search by customer name or sale ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-3">
          <select 
            value={paymentFilter === 'return' ? 'all' : paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            disabled={paymentFilter === 'return'}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm disabled:opacity-50"
          >
            <option value="all">All Active Payments</option>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
            <option value="credit">Credit</option>
          </select>

          <button
            onClick={() => setPaymentFilter(paymentFilter === 'return' ? 'all' : 'return')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border shadow-sm select-none",
              paymentFilter === 'return' 
                ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 ring-2 ring-rose-500/20" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            <RotateCcw size={16} className={cn(paymentFilter === 'return' && "animate-pulse")} />
            Returned Bills
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sale ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">By</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                let lastDateStr = '';
                return filteredSales.map((sale: any) => {
                  const customer = customers.find((c: any) => c.id === sale.customerId);
                  const saleDateObj = new Date(sale.saleDate);
                  const dateStr = saleDateObj.toLocaleDateString([], { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                  
                  const showSeparator = dateStr !== lastDateStr;
                  lastDateStr = dateStr;

                  return (
                    <React.Fragment key={sale.id}>
                      {showSeparator && (
                        <tr className="bg-violet-50/30 border-y border-violet-100/30">
                          <td colSpan={7} className="px-6 py-3.5 text-xs font-bold text-violet-700 tracking-wider flex items-center gap-2">
                            <Clock size={13} className="text-violet-500" />
                            {dateStr}
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold font-mono text-slate-400 group-hover:text-violet-600 transition-colors">
                              #{sale.id?.toString().padStart(6, '0')}
                            </span>
                            {sale.status === 'returned' && sale.returnReason && (
                              <span className="text-[10px] text-rose-600 italic font-semibold mt-0.5 max-w-[200px] truncate" title={sale.returnReason}>
                                Reason: {sale.returnReason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <User size={14} />
                            </div>
                            <span className="text-slate-900 font-bold">{customer?.name || 'Walk-in'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-emerald-600 font-bold">{formatCurrency(sale.totalAmount)}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit",
                            sale.status === 'returned' ? "bg-rose-100 text-rose-600 animate-pulse" :
                            sale.paymentMethod === 'cash' ? "bg-violet-100 text-violet-600" :
                            sale.paymentMethod === 'online' ? "bg-blue-100 text-blue-600" :
                            "bg-amber-100 text-amber-600"
                          )}>
                            {sale.status === 'returned' && <RotateCcw size={12} />}
                            {sale.status !== 'returned' && sale.paymentMethod === 'cash' && <Banknote size={12} />}
                            {sale.status !== 'returned' && sale.paymentMethod === 'online' && <RefreshCw size={12} />}
                            {sale.status !== 'returned' && sale.paymentMethod === 'credit' && <CreditCard size={12} />}
                            {sale.status === 'returned' ? 'Returned' : sale.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5 text-slate-500 font-medium text-sm">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-slate-400" />
                              {new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            {sale.status === 'returned' && sale.returnedAt && (
                              <span className="text-[10px] text-rose-500 font-bold">
                                Returned: {new Date(sale.returnedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                              sale.status === 'returned' ? "bg-rose-50 text-rose-700 border border-rose-100" :
                              sale.actorRole === 'cashier' ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"
                            )}>
                              {sale.status === 'returned' ? `By: ${sale.returnedBy || 'Admin'}` : sale.actorRole === 'cashier' ? 'Cashier' : 'Admin'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setShowInvoiceModal(sale)}
                              className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all" 
                              title="View Invoice"
                            >
                              <FileText size={18} />
                            </button>
                            {userRole === 'admin' && sale.status !== 'returned' && (
                              <button 
                                onClick={() => setShowReturnModal(sale)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" 
                                title="Return Bill"
                              >
                                <RotateCcw size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="text-slate-300" size={40} />
            </div>
            <p className="text-slate-400 font-medium">No sales found matching your search.</p>
          </div>
        )}
      </div>

      {showInvoiceModal && (
        <InvoiceModal 
          sale={showInvoiceModal} 
          customer={customers.find((c: any) => c.id === showInvoiceModal.customerId)}
          onClose={() => setShowInvoiceModal(null)}
          onSaleUpdated={() => setShowInvoiceModal(null)}
        />
      )}

      {showReturnModal && (
        <ReturnModal 
          sale={showReturnModal}
          onConfirm={async (reason, password) => {
            const success = await handleReturn(showReturnModal, reason, password);
            if (success !== false) {
              setShowReturnModal(null);
            }
          }}
          onClose={() => setShowReturnModal(null)}
        />
      )}
    </div>
  );
};

export const InvoiceModal: React.FC<{ sale: any, customer: any, onClose: () => void, onSaleUpdated?: () => void, autoPrint?: boolean }> = ({ sale, customer, onClose, onSaleUpdated, autoPrint }) => {
  const { shopId } = useAuth();
  const { document: settings } = useLiveDocument('settings', shopId || 'default_shop');
  
  const currencySymbol = settings?.currency || 'Rs';
  const subtotal = sale.items.reduce((acc: number, item: any) => acc + (item.totalPrice || 0), 0);
  const discount = subtotal - sale.totalAmount;

  const printWidth = settings?.receiptWidth || 80;
  const printFontSize = settings?.receiptFontSize || 12;
  const printPadding = settings?.receiptPadding || 10;

  // Build plain HTML string for the popup — avoids blank pages from window.print()
  const buildReceiptHTML = () => {
    const itemRows = sale.items?.map((item: any) => `
      <tr style="border-bottom: 1px dashed #ccc;">
        <td style="padding: 6px 4px 6px 0; font-weight:700; vertical-align:top; white-space:nowrap;">${item.quantity}x</td>
        <td style="padding: 6px 4px; vertical-align:top;">
          <div style="font-weight:700; text-transform:uppercase;">${item.productName}</div>
          ${item.isDeal ? '<div style="font-size:0.85em;">** COMBO DEAL **</div>' : ''}
          ${item.kitchenNote ? `<div style="font-size:0.85em;">* Note: ${item.kitchenNote}</div>` : ''}
        </td>
        <td style="padding: 6px 0 6px 4px; text-align:right; font-weight:700; vertical-align:top; white-space:nowrap;">${formatCurrency(item.totalPrice, currencySymbol)}</td>
      </tr>
    `).join('');

    const memberHTML = customer ? `
      <div style="border-top:1px dashed #999; margin:8px 0; padding-top:8px; font-size:0.9em; text-transform:uppercase;">
        <div style="font-weight:700;">MEMBER: ${customer.name}</div>
        ${customer.cardNumber ? `<div>CARD NO: ${customer.cardNumber}</div>` : ''}
        ${customer.phone ? `<div>PHONE: ${customer.phone}</div>` : ''}
      </div>
    ` : (sale.customerName || sale.customerPhone) ? `
      <div style="border-top:1px dashed #999; margin:8px 0; padding-top:8px; font-size:0.9em; text-transform:uppercase;">
        ${sale.customerName ? `<div style="font-weight:700;">CUSTOMER: ${sale.customerName}</div>` : ''}
        ${sale.customerPhone ? `<div>PHONE: ${sale.customerPhone}</div>` : ''}
      </div>
    ` : '';

    const discountHTML = discount > 0.01 ? `
      <div style="display:flex; justify-content:space-between;">
        <span>MEMBERSHIP DISCOUNT</span><span>-${formatCurrency(discount, currencySymbol)}</span>
      </div>
    ` : '';

    const footerHTML = settings?.invoiceFooter ? `<div style="font-size:0.85em; text-transform:uppercase; white-space:pre-wrap; margin-bottom:8px;">${settings.invoiceFooter}</div>` : '';

    const orderType = sale.orderType === 'dine_in' ? 'DINE IN' : sale.orderType === 'delivery' ? 'DELIVERY' : 'TAKE AWAY';
    const saleDate = new Date(sale.saleDate);
    const dateStr = saleDate.toLocaleDateString();
    const timeStr = saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const returnedBannerHTML = sale.status === 'returned' ? `
      <div style="border: 2px solid #ef4444; color: #ef4444; text-align: center; padding: 8px; margin-bottom: 8px; font-weight: 900; font-size: 1.1em; text-transform: uppercase;">
        VOID / RETURNED
        <div style="font-size: 0.7em; font-weight: 700; margin-top: 4px;">Reason: ${sale.returnReason || 'N/A'}</div>
        <div style="font-size: 0.7em; font-weight: 700;">By: ${sale.returnedBy || 'Admin'}</div>
      </div>
    ` : '';

    return `<!DOCTYPE html>
<html>
<head>
  <title>Receipt</title>
  <style>
    @page { margin: 0; size: ${printWidth}mm 210mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: ${printPadding}px;
      width: ${printWidth}mm;
      max-width: ${printWidth}mm;
      font-family: 'Courier New', Courier, monospace;
      font-size: ${printFontSize}px;
      font-weight: 700;
      color: #000;
      background: #fff;
    }
    table { width: 100%; border-collapse: collapse; }
    .divider { border-top: 1px dashed #666; margin: 8px 0; }
    .center { text-align: center; }
    .flex-row { display: flex; justify-content: space-between; }
    .total-row { display: flex; justify-content: space-between; font-size: 1.2em; font-weight: 900; border-top: 1px dashed #666; padding-top: 6px; margin-top: 6px; }
  </style>
</head>
<body onload="window.print()" onafterprint="window.close()">
  ${returnedBannerHTML}
  <div class="center">
    <div style="font-size:1.6em; font-weight:900; text-transform:uppercase; margin-bottom:2px;">${settings?.shopName || 'Restaurant'}</div>
    ${settings?.shopAddress ? `<div style="font-size:0.85em; text-transform:uppercase;">${settings.shopAddress}</div>` : ''}
    ${settings?.shopPhone ? `<div style="font-size:0.85em;">TEL: ${settings.shopPhone}</div>` : ''}
  </div>

  <div class="divider"></div>
  <div class="center" style="text-transform:uppercase; font-weight:900;">${orderType}</div>
  <div class="center" style="text-transform:uppercase;">PAYMENT: ${sale.paymentMethod?.toUpperCase()}</div>
  <div class="divider"></div>

  <div class="flex-row" style="font-size:0.9em; text-transform:uppercase;">
    <div>
      <div>ORDER: #${sale.id?.toString().padStart(4, '0')}</div>
      <div>DATE: ${dateStr}</div>
    </div>
    <div style="text-align:right;">
      <div>TIME: ${timeStr}</div>
      <div>CASHIER: ${sale.actorName?.split(' ')[0] || ''}</div>
    </div>
  </div>

  ${memberHTML}

  <div class="divider"></div>

  <table>
    <thead>
      <tr style="border-bottom:1px dashed #666;">
        <th style="padding-bottom:4px; text-align:left; text-transform:uppercase; width:32px;">Qty</th>
        <th style="padding-bottom:4px; text-align:left; text-transform:uppercase;">Item</th>
        <th style="padding-bottom:4px; text-align:right; text-transform:uppercase;">Amt</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="divider"></div>

  <div style="font-size:0.9em; text-transform:uppercase;">
    <div class="flex-row"><span>SUBTOTAL</span><span>${formatCurrency(subtotal, currencySymbol)}</span></div>
    ${discountHTML}
  </div>
  <div class="total-row"><span>TOTAL</span><span>${formatCurrency(sale.totalAmount, currencySymbol)}</span></div>

  <div class="divider"></div>

  <div class="center" style="margin-top:12px;">
    <div style="font-weight:900; text-transform:uppercase; margin-bottom:4px;">Thank you for visiting!</div>
    ${footerHTML}
    <div style="font-size:0.75em; text-transform:uppercase; margin-top:8px;">Powered by Zyntrum Tech</div>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = buildReceiptHTML();
    // Use a large popup window so it's centered and the browser print dialog fits nicely
    const win = window.open('', '_blank', `width=800,height=800,left=200,top=100`);
    if (!win) { alert('Popup blocked! Please allow popups for this site.'); return; }
    win.document.write(html);
    win.document.close();
  };

  // Auto-trigger print when autoPrint prop is set (e.g. immediately after checkout)
  React.useEffect(() => {
    if (autoPrint && settings !== undefined) {
      // Small delay to let settings load
      const timer = setTimeout(() => {
        handlePrint();
        if (onClose) onClose(); // Auto-close the modal out of the way!
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, settings]);

  // If we are auto-printing, do not show the on-screen preview overlay to keep the UX fast and clean
  if (autoPrint) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="flex flex-col items-center gap-4 py-8 w-full">
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-full font-bold shadow-lg shadow-violet-600/20 active:scale-95 transition-all">
            <Printer size={18} /> Print Receipt
          </button>
          <button onClick={onClose} className="w-12 h-12 bg-white text-slate-600 rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-slate-50 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* On-screen Preview */}
        <div 
          style={{ fontSize: `${printFontSize}px`, padding: `${printPadding}px`, maxWidth: `${printWidth * 4}px` }}
          className="bg-white text-black w-full shadow-2xl font-mono font-bold mx-auto relative overflow-hidden"
        >
          {sale.status === 'returned' && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 mb-4 rounded-2xl text-center">
              <p className="font-black text-xs tracking-wider uppercase">VOID / RETURNED BILL</p>
              {sale.returnReason && <p className="text-[10px] italic mt-1 font-semibold">Reason: {sale.returnReason}</p>}
              {sale.returnedBy && <p className="text-[9px] mt-0.5 font-bold">Returned by: {sale.returnedBy}</p>}
            </div>
          )}
          
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-black uppercase mb-1">{settings?.shopName || 'Restaurant'}</h1>
            {settings?.shopAddress && <p className="text-[10px] uppercase">{settings.shopAddress}</p>}
            {settings?.shopPhone && <p className="text-[10px]">TEL: {settings.shopPhone}</p>}
            <div className="border-t border-dashed border-black/30 my-3"></div>
            <p className="font-bold text-sm uppercase">
              {sale.orderType === 'dine_in' ? '🍽️ Dine In' : sale.orderType === 'delivery' ? '🛵 Delivery' : '🛍️ Take Away'}
            </p>
            <p className="font-bold uppercase mt-1">PAYMENT: {sale.paymentMethod}</p>
            <div className="border-t border-dashed border-black/30 my-3"></div>
            <div className="flex justify-between text-[10px] uppercase text-left">
              <div>
                <p>ORDER: #{sale.id?.toString().padStart(4, '0')}</p>
                <p>DATE: {new Date(sale.saleDate).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p>TIME: {new Date(sale.saleDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <p>CASHIER: {sale.actorName?.split(' ')[0]}</p>
              </div>
            </div>
            {customer ? (
              <div className="mt-2 text-[10px] text-left uppercase border-t border-dashed border-black/20 pt-2">
                <p className="font-bold">MEMBER: {customer.name}</p>
                {customer.cardNumber && <p>CARD NO: {customer.cardNumber}</p>}
                {customer.phone && <p>PHONE: {customer.phone}</p>}
              </div>
            ) : (sale.customerName || sale.customerPhone) ? (
              <div className="mt-2 text-[10px] text-left uppercase border-t border-dashed border-black/20 pt-2">
                {sale.customerName && <p className="font-bold">CUSTOMER: {sale.customerName}</p>}
                {sale.customerPhone && <p>PHONE: {sale.customerPhone}</p>}
              </div>
            ) : null}
            <div className="border-t border-dashed border-black/30 my-3"></div>
          </div>

          {/* Items */}
          <div className="space-y-3 mb-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dashed border-black/30">
                  <th className="pb-1 uppercase w-8">Qty</th>
                  <th className="pb-1 uppercase">Item</th>
                  <th className="pb-1 uppercase text-right">Amt</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {sale.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-dashed border-black/10 last:border-0">
                    <td className="py-2 font-bold">{item.quantity}x</td>
                    <td className="py-2 pr-2">
                      <p className="font-bold uppercase leading-tight">{item.productName}</p>
                      {item.isDeal && <p className="text-[9px] uppercase mt-0.5">** COMBO DEAL **</p>}
                      {item.kitchenNote && <p className="text-[9px] uppercase mt-0.5 whitespace-pre-wrap">* Note: {item.kitchenNote}</p>}
                    </td>
                    <td className="py-2 text-right font-bold">{formatCurrency(item.totalPrice, currencySymbol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-dashed border-black/30 my-3"></div>

          {/* Totals */}
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-xs uppercase">
              <span>Subtotal</span><span>{formatCurrency(subtotal, currencySymbol)}</span>
            </div>
            {discount > 0.01 && (
              <div className="flex justify-between text-xs uppercase">
                <span>Membership Discount</span><span>-{formatCurrency(discount, currencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black uppercase pt-2 mt-2 border-t border-dashed border-black/30">
              <span>Total</span><span>{formatCurrency(sale.totalAmount, currencySymbol)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-black/30 my-3"></div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="font-bold uppercase text-xs mb-2">Thank you for visiting!</p>
            {settings?.invoiceFooter && (
              <p className="text-[10px] uppercase mb-4 whitespace-pre-wrap">{settings.invoiceFooter}</p>
            )}
            <p className="text-[8px] uppercase mt-4">Powered by Zyntrum Tech</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;
