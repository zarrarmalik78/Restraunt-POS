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

const Sales: React.FC = () => {
  const { shopId, userRole } = useAuth();
  const { documents: sales, loading } = useLiveTable('sales', undefined, salesSortFn);
  const { documents: customers } = useLiveTable('customers');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [showInvoiceModal, setShowInvoiceModal] = useState<any | null>(null);

  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredSales = useMemo(() => {
    return sales.filter((s: any) => {
      // Exclude open dine-in orders (they appear in POS open tables panel)
      if (s.status === 'open') return false;

      const customer = customers.find((c: any) => c.id === s.customerId);
      const customerName = customer?.name || 'Walk-in';
      const saleDate = new Date(s.saleDate).toISOString().split('T')[0];
      
      const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (s.id && s.id.toString().includes(searchTerm));
      const matchesPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter;
      const matchesDate = saleDate >= startDate && saleDate <= endDate;

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [sales, customers, searchTerm, paymentFilter, startDate, endDate]);

  const handlePrintReport = () => {
    window.print();
  };

  const handleDelete = async (sale: any) => {
    if (window.confirm('Are you sure you want to return this bill? This will reverse all inventory and credit changes for unreturned items.')) {
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
            reason: `Bill Returned: ${sale.id}`,
            notes: item.serialNumbers?.length ? `Restored Serials: ${item.serialNumbers.join(', ')}` : '',
            actorId: userRole,
            actorName: 'System',
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
                notes: `Bill Returned: ${sale.id}`,
                actorId: userRole,
                actorName: 'System',
                actorRole: userRole || 'admin',
                createdAt: new Date()
              });
            }
          }
        }

        await db.sales.delete(sale.id);
        toast.success('Bill returned and inventory restored');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete sale');
      }
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
            placeholder="Search by customer name or sale ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-3">
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm"
          >
            <option value="all">All Payments</option>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
            <option value="credit">Credit</option>
            <option value="return">Return</option>
          </select>
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
              {filteredSales.map((sale: any) => {
                const customer = customers.find((c: any) => c.id === sale.customerId);
                return (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold font-mono text-slate-400 group-hover:text-violet-600 transition-colors">
                        #{sale.id?.toString().padStart(6, '0')}
                      </span>
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
                        sale.paymentMethod === 'cash' ? "bg-violet-100 text-violet-600" :
                        sale.paymentMethod === 'online' ? "bg-blue-100 text-blue-600" :
                        sale.paymentMethod === 'credit' ? "bg-amber-100 text-amber-600" :
                        "bg-rose-100 text-rose-600"
                      )}>
                        {sale.paymentMethod === 'cash' && <Banknote size={12} />}
                        {sale.paymentMethod === 'online' && <RefreshCw size={12} />}
                        {sale.paymentMethod === 'credit' && <CreditCard size={12} />}
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(sale.saleDate).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          sale.actorRole === 'cashier' ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"
                        )}>
                          {sale.actorRole === 'cashier' ? 'Cashier' : 'Admin'}
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
                        {userRole === 'admin' && (
                          <button 
                            onClick={() => handleDelete(sale)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" 
                            title="Return Bill"
                          >
                            <RotateCcw size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
    </div>
  );
};

export const InvoiceModal: React.FC<{ sale: any, customer: any, onClose: () => void, autoPrint?: boolean, onSaleUpdated?: () => void }> = ({ sale, customer, onClose, autoPrint, onSaleUpdated }) => {
  const { shopId } = useAuth();
  const { document: settings } = useLiveDocument('settings', shopId || 'default_shop');
  
  const handlePrint = () => window.print();
  const currencySymbol = settings?.currency || 'Rs';

  // Reconstruct subtotal since totalAmount might include a card discount
  const subtotal = sale.items.reduce((acc: number, item: any) => acc + (item.totalPrice || 0), 0);
  const discount = subtotal - sale.totalAmount;

  const printWidth = settings?.receiptWidth || 80;
  const printFontSize = settings?.receiptFontSize || 12;
  const printPadding = settings?.receiptPadding || 10;

  React.useEffect(() => {
    if (autoPrint) {
      // Small timeout to ensure rendering is complete before print dialog opens
      const timer = setTimeout(() => {
        window.print();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const dynamicPrintStyle = `
    @media print {
      @page {
        margin: 0;
        size: ${printWidth}mm 210mm;
      }
      body {
        margin: 0;
        padding: 0;
      }
      .thermal-receipt {
        width: ${printWidth}mm !important;
        max-width: ${printWidth}mm !important;
        padding: ${printPadding}px !important;
        font-size: ${printFontSize}px !important;
        margin: 0 !important;
      }
      .page-break {
        page-break-before: always;
        break-before: page;
      }
    }
  `;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:block overflow-y-auto">
      <style dangerouslySetInnerHTML={{ __html: dynamicPrintStyle }} />
      
      {/* Container for centering modal actions but allowing the receipt to be printed properly */}
      <div className="flex flex-col items-center gap-4 py-8 print:py-0 w-full">
        
        {/* Actions (Hidden on Print) */}
        <div className="flex items-center gap-3 print:hidden">
          <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-full font-bold shadow-lg shadow-violet-600/20 active:scale-95 transition-all">
            <Printer size={18} /> Print Receipt
          </button>
          <button onClick={onClose} className="w-12 h-12 bg-white text-slate-600 rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-slate-50 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* 80mm Thermal Receipt Simulation (approx 300px max width) */}
        <div 
          style={{ fontSize: `${printFontSize}px`, padding: `${printPadding}px`, maxWidth: `${printWidth * 4}px` }}
          className="bg-white text-black w-full shadow-2xl font-mono font-bold print:shadow-none print:m-0 mx-auto print:mx-0 thermal-receipt"
        >
          
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
            
            {customer && (
              <div className="mt-2 text-[10px] text-left uppercase border-t border-dashed border-black/20 pt-2">
                <p className="font-bold">MEMBER: {customer.name}</p>
                {customer.cardNumber && <p>CARD NO: {customer.cardNumber}</p>}
                {customer.phone && <p>PHONE: {customer.phone}</p>}
              </div>
            )}
            
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
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, currencySymbol)}</span>
            </div>
            
            {discount > 0.01 && (
              <div className="flex justify-between text-xs uppercase">
                <span>Membership Discount</span>
                <span>-{formatCurrency(discount, currencySymbol)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-base font-black uppercase pt-2 mt-2 border-t border-dashed border-black/30">
              <span>Total</span>
              <span>{formatCurrency(sale.totalAmount, currencySymbol)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-black/30 my-3"></div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="font-bold uppercase text-xs mb-2">Thank you for visiting!</p>
            {settings?.invoiceFooter && (
              <p className="text-[10px] uppercase mb-4 whitespace-pre-wrap">{settings.invoiceFooter}</p>
            )}
            <p className="text-[8px] uppercase mt-4">Powered by Zynta Tech</p>
          </div>

        </div>

        {/* Optional Kitchen Receipt for Takeaway/Delivery - Printed on a new page */}
        {(sale.orderType === 'takeaway' || sale.orderType === 'delivery') && (
          <div 
            style={{ fontSize: `${printFontSize}px`, padding: `${printPadding}px`, maxWidth: `${printWidth * 4}px` }}
            className="bg-white text-black w-full shadow-2xl font-sans print:shadow-none print:m-0 mx-auto print:mx-0 thermal-receipt page-break hidden print:block"
          >
            <div className="border-b-2 border-black pb-3 mb-3 text-center">
              <h2 className="text-xl font-black tracking-wider uppercase mb-1">Kitchen Order</h2>
              <div className="flex justify-between text-xs font-bold mb-0.5"><span>Order:</span> <span>#{sale.id?.toString().padStart(4, '0')}</span></div>
              <div className="flex justify-between text-xs font-bold mb-0.5"><span>Type:</span> <span className="uppercase">{sale.orderType.replace('_', ' ')}</span></div>
              <div className="flex justify-between text-xs font-bold"><span>Time:</span> <span>{new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="border-b border-black pb-1 text-xs uppercase font-bold text-gray-700">Qty</th>
                  <th className="border-b border-black pb-1 text-xs uppercase font-bold text-gray-700">Item</th>
                </tr>
              </thead>
              <tbody>
                {sale.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-dashed border-gray-400">
                    <td className="py-2 text-lg font-black align-top w-10">{item.quantity}x</td>
                    <td className="py-2 text-sm font-bold align-top">
                      {item.productName}
                      {item.kitchenNote && <div className="block mt-1 text-xs font-bold bg-gray-200 px-2 py-1 border-l-2 border-black text-gray-800">{item.kitchenNote}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-center mt-5 pt-3 border-t-2 border-black text-xs font-bold uppercase tracking-widest">
              — Prepare Immediately —
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Sales;
