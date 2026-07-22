import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, X, Edit3, Star, LayoutGrid, Check, Database, RefreshCw, Eye, Package, Sparkles, ChefHat, ClipboardList, Lock } from 'lucide-react';
import { useLiveTable, useLiveDocument } from '../db/hooks';
import { db, CashSession } from '../db/database';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, cn, getItemImage } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { seedSampleData } from '../lib/seedData';
import { InvoiceModal } from './Sales';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  variantName?: string;
  kitchenNote?: string;
  isDeal?: boolean;
  categoryId?: string;
  customDiscountedPrice?: number;
}

const KitchenReceiptModal: React.FC<{
  items: any[];
  tableNumber: string;
  orderId: string;
  onClose: () => void;
  settings?: any;
}> = ({ items, tableNumber, orderId, onClose, settings }) => {
  const handlePrint = () => {
    const printContent = document.getElementById('kitchen-receipt-print')?.innerHTML || '';
    const width = settings?.receiptWidth || 80;
    const fontSize = settings?.receiptFontSize || 12;
    const padding = settings?.receiptPadding || 10;

    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) { window.print(); return; }
    win.document.write(`
      <html><head><title>Kitchen Receipt</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        @page { margin: 0; size: ${width}mm 210mm; }
        body { font-family: 'Inter', sans-serif; padding: ${padding}px; width: ${width}mm; max-width: ${width}mm; margin: 0; color: #000; background: #fff; font-size: ${fontSize}px; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        h2 { font-size: 1.8em; font-weight: 900; margin: 0 0 5px; text-transform: uppercase; letter-spacing: 1px; }
        .meta { font-size: 1.1em; font-weight: 700; display: flex; justify-content: space-between; margin-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { border-bottom: 1px solid #000; padding-bottom: 5px; text-align: left; font-size: 0.9em; text-transform: uppercase; color: #555; }
        td { padding: 8px 0; border-bottom: 1px dashed #ccc; }
        .qty { font-weight: 900; font-size: 1.5em; width: 40px; vertical-align: top; }
        .item { font-weight: 700; font-size: 1.25em; line-height: 1.2; }
        .note { font-size: 1em; font-weight: 700; color: #444; margin-top: 4px; background: #f0f0f0; padding: 4px 6px; border-left: 3px solid #000; display: inline-block; }
        .footer { text-align: center; margin-top: 20px; font-size: 0.9em; font-weight: 700; border-top: 2px solid #000; padding-top: 10px; }
      </style></head>
      <body onload="window.print()" onafterprint="window.close()">${printContent}</body></html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] p-6 max-w-sm w-full animate-in zoom-in duration-300 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ChefHat size={20} className="text-orange-500" /> Kitchen Receipt
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={18} /></button>
        </div>

        {/* Printable area */}
        <div 
          id="kitchen-receipt-print" 
          style={{ 
            fontSize: `${settings?.receiptFontSize || 12}px`, 
            padding: `${settings?.receiptPadding || 10}px`, 
            maxWidth: `${(settings?.receiptWidth || 80) * 4}px` 
          }}
          className="bg-slate-50 border border-slate-200 rounded-2xl mb-4 text-slate-900 font-sans max-h-96 overflow-y-auto mx-auto w-full"
        >
          <div className="header border-b-2 border-slate-900 pb-3 mb-3 text-center">
            <h2 className="text-xl font-black tracking-wider uppercase mb-1">Kitchen Order</h2>
            <div className="meta flex justify-between text-xs font-bold mb-0.5"><span>Table:</span> <span>{tableNumber || 'N/A'}</span></div>
            <div className="meta flex justify-between text-xs font-bold mb-0.5"><span>Order:</span> <span>#{orderId?.toString().slice(-6).toUpperCase()}</span></div>
            <div className="meta flex justify-between text-xs font-bold"><span>Time:</span> <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="border-b border-slate-900 pb-1 text-[10px] uppercase font-bold text-slate-500">Qty</th>
                <th className="border-b border-slate-900 pb-1 text-[10px] uppercase font-bold text-slate-500">Item</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-dashed border-slate-300">
                  <td className="qty py-2 text-lg font-black align-top w-10">{item.quantity}x</td>
                  <td className="item py-2 text-sm font-bold align-top">
                    {item.productName}
                    {item.kitchenNote && <div className="note block mt-1 text-xs font-bold bg-slate-200 px-2 py-1 border-l-2 border-slate-800 text-slate-700">{item.kitchenNote}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="footer text-center mt-5 pt-3 border-t-2 border-slate-900 text-xs font-bold uppercase tracking-widest">
            — Prepare Immediately —
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors">
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-colors"
          >
            🖨️ Print to Kitchen
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Final Checkout Modal (Dine-In) ──────────────────────────────────────────
const CheckoutModal: React.FC<{
  order: any;
  cart: CartItem[];
  subtotal: number;
  cardDiscount: number;
  totalAmount: number;
  cardDiscountPercentage: number;
  isMembershipApplied: boolean;
  onToggleMembership: () => void;
  onConfirm: (paymentMethod: 'cash' | 'card') => void;
  onClose: () => void;
}> = ({ order, cart, subtotal, cardDiscount, totalAmount, cardDiscountPercentage, isMembershipApplied, onToggleMembership, onConfirm, onClose }) => {
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card'>('cash');

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] p-6 max-w-md w-full animate-in zoom-in duration-300 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-2xl font-black text-slate-900">Final Checkout</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
        </div>

        {/* Table / Order info */}
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 mb-4 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Table</p>
            <p className="text-3xl font-black text-violet-700">{order?.tableNumber || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order</p>
            <p className="text-sm font-bold text-slate-600">#{order?.id?.toString().slice(-6).toUpperCase()}</p>
          </div>
        </div>

        {/* Items summary */}
        <div className="bg-slate-50 rounded-2xl p-3 mb-4 max-h-44 overflow-y-auto space-y-1.5">
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">{item.quantity}× {item.productName}</span>
              <span className="text-xs font-black text-slate-900">{formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-500">Membership Card ({cardDiscountPercentage}%)</span>
            <div className="flex items-center gap-2">
              {isMembershipApplied && <span className="text-emerald-600">-{formatCurrency(cardDiscount)}</span>}
              <button
                onClick={onToggleMembership}
                className={`w-9 h-5 rounded-full transition-colors relative ${isMembershipApplied ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isMembershipApplied ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="font-black text-slate-900 text-sm">Total Due</span>
            <span className="text-3xl font-black text-violet-600">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Payment selection */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setSelectedPayment('cash')}
            className={cn('py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-sm',
              selectedPayment === 'cash' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300')}
          >
            <Banknote size={16} /> Cash
          </button>
          <button
            onClick={() => setSelectedPayment('card')}
            className={cn('py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-sm',
              selectedPayment === 'card' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300')}
          >
            <CreditCard size={16} /> Online
          </button>
        </div>

        <button
          onClick={() => onConfirm(selectedPayment)}
          className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-violet-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Check size={20} /> Confirm & Complete Order
        </button>
      </div>
    </div>
  );
};

const MemberSearchSelect: React.FC<{
  customers: any[];
  value: string | null;
  onChange: (customerId: string | null) => void;
}> = ({ customers, value, onChange }) => {
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCustomer = customers.find((c: any) => c.id === value);
  const displayValue = selectedCustomer 
    ? `${selectedCustomer.name} ${selectedCustomer.cardNumber ? `(Card: ${selectedCustomer.cardNumber})` : ''}`
    : 'Walk-in Guest (No Card)';

  const members = customers.filter(c => c.type === 'customer');
  const filtered = members.filter(c => 
    !search || (c.cardNumber && c.cardNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => setOpen(!open)}
        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none hover:border-violet-300 cursor-pointer flex justify-between items-center"
      >
        <span className="truncate">{displayValue}</span>
        <span className="text-slate-400 text-[10px]">▼</span>
      </div>
      {open && (
        <div className="absolute z-10 bottom-full mb-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 bg-slate-50 shrink-0">
            <input 
              autoFocus
              placeholder="Search by card number..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-medium focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div className="overflow-y-auto style-scrollbar p-1 max-h-48">
            <div 
              onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
              className="px-3 py-2 hover:bg-violet-50 cursor-pointer rounded-lg transition-colors text-xs font-bold text-slate-700"
            >
              Walk-in Guest (No Card)
            </div>
            {filtered.map(c => (
              <div 
                key={c.id}
                onClick={() => { onChange(c.id); setOpen(false); setSearch(''); }}
                className="px-3 py-2 hover:bg-violet-50 cursor-pointer rounded-lg transition-colors text-xs"
              >
                <span className="font-bold text-slate-800">{c.name}</span>
                {c.cardNumber && <span className="font-bold text-violet-600 ml-1">Card: {c.cardNumber}</span>}
                {c.phone && <span className="text-slate-400 ml-1">- {c.phone}</span>}
              </div>
            ))}
            {filtered.length === 0 && search && (
              <div className="px-3 py-2 text-center text-xs text-slate-400">No members found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main NewSale Component ───────────────────────────────────────────────────
const NewSale: React.FC = () => {
  const { currentUser, shopId, userRole } = useAuth();
  const { documents: products, loading: productsLoading } = useLiveTable('products');
  const { documents: deals, loading: dealsLoading } = useLiveTable('deals');
  const { documents: categoriesList, loading: categoriesLoading } = useLiveTable('categories');
  const { documents: customers, loading: customersLoading } = useLiveTable('customers');
  const { documents: allSales } = useLiveTable('sales');
  const { document: settings } = useLiveDocument('settings', shopId);
  const { documents: sessions, loading: sessionsLoading } = useLiveTable<CashSession>('cashSessions');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'menu' | 'deals'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'take_away' | 'delivery'>('take_away');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isMembershipApplied, setIsMembershipApplied] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Dine-In open order state
  const [activeOpenOrder, setActiveOpenOrder] = useState<any | null>(null);
  const [showKitchenReceipt, setShowKitchenReceipt] = useState<{ items: any[]; tableNumber: string; orderId: string } | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showOpenOrders, setShowOpenOrders] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);

  // Modals
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any | null>(null);
  const [noteItemIndex, setNoteItemIndex] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  
  // Price Edit Modal
  const [priceEditIndex, setPriceEditIndex] = useState<number | null>(null);
  const [priceEditText, setPriceEditText] = useState('');

  const cardDiscountPercentage = settings?.cardDiscountPercentage || 0;

  // ─── Live open dine-in orders ─────────────────────────────────────────────
  const openDineInOrders = useMemo(() => {
    return (allSales as any[])
      .filter(s => s.status === 'open' && s.orderType === 'dine_in')
      .sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
  }, [allSales]);

  // ─── Load an open order into the cart ────────────────────────────────────
  const loadOpenOrder = (order: any) => {
    const cartItems: CartItem[] = (order.items || []).map((item: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      costPrice: 0,
      quantity: item.quantity,
      variantName: item.variantName,
      kitchenNote: item.kitchenNote,
      isDeal: item.isDeal,
      categoryId: item.categoryId || '',
    }));
    setCart(cartItems);
    setActiveOpenOrder(order);
    setOrderType('dine_in');
    setTableNumber(order.tableNumber || '');
    setSelectedCustomerId(order.customerId || null);
    setShowOpenOrders(false);
    toast.success(`Loaded Table ${order.tableNumber || 'N/A'}`);
  };

  // ─── Clear cart and reset to fresh state ─────────────────────────────────
  const clearOrder = () => {
    setCart([]);
    setActiveOpenOrder(null);
    setTableNumber('');
    setSelectedCustomerId(null);
    setIsMembershipApplied(false);
  };

  const handleMemberChange = (customerId: string) => {
    setSelectedCustomerId(customerId || null);
    if (customerId) {
      const member = customers.find((c: any) => c.id === customerId);
      setIsMembershipApplied(!!(member && member.cardNumber));
    } else {
      setIsMembershipApplied(false);
    }
  };

  const categoryMap = useMemo(() => {
    const map: Record<string, any> = {};
    categoriesList.forEach((c: any) => { map[c.id] = c; });
    return map;
  }, [categoriesList]);

  const menuCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p: any) => {
      const cat = categoryMap[p.categoryId];
      if (cat) cats.add(cat.name);
    });
    return ['All', ...Array.from(cats)];
  }, [products, categoryMap]);

  const displayProducts = useMemo(() => {
    let filtered = products;
    if (activeCategory !== 'All') {
      filtered = filtered.filter((p: any) => categoryMap[p.categoryId]?.name === activeCategory);
    }
    if (searchTerm) {
      filtered = filtered.filter((p: any) => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return [...filtered].sort((a: any, b: any) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
  }, [products, activeCategory, searchTerm, categoryMap]);

  const sortDeals = (a: any, b: any) => {
    const aName = a.name || '', bName = b.name || '';
    const aM = aName.match(/^Deal\s+(\d+)$/i), bM = bName.match(/^Deal\s+(\d+)$/i);
    if (aM && bM) return parseInt(aM[1], 10) - parseInt(bM[1], 10);
    if (aM) return -1; if (bM) return 1;
    const aN = aName.match(/(\d+)$/), bN = bName.match(/(\d+)$/);
    if (aN && bN) {
      const aBase = aName.replace(/\d+$/, '').trim(), bBase = bName.replace(/\d+$/, '').trim();
      if (aBase === bBase) return parseInt(aN[1], 10) - parseInt(bN[1], 10);
      return aBase.localeCompare(bBase);
    }
    return aName.localeCompare(bName);
  };

  const displayDeals = useMemo(() => {
    let filtered = deals;
    if (searchTerm) {
      filtered = filtered.filter((d: any) => {
        const matchesName = d.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesItems = d.items?.some((i: any) => products.find((pr: any) => pr.id === i.productId)?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesName || matchesItems;
      });
    }
    return [...filtered].sort(sortDeals);
  }, [deals, searchTerm, products]);

  const addToCart = (item: any, isDeal = false, variant?: any) => {
    const unitPrice = variant ? variant.price : (item.price || item.sellingPrice);
    const costPrice = variant ? variant.cost : (item.cost || item.costPrice || 0);
    const customDiscountedPrice = variant ? variant.customDiscountedPrice : item.customDiscountedPrice;
    const name = variant ? `${item.name} (${variant.name})` : item.name;
    const existingIndex = cart.findIndex(c =>
      c.productId === item.id && c.isDeal === isDeal && c.variantName === variant?.name && !c.kitchenNote
    );
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        id: Math.random().toString(36).substr(2, 9),
        productId: item.id,
        productName: name,
        unitPrice, costPrice, customDiscountedPrice,
        quantity: 1,
        variantName: variant?.name,
        isDeal,
        categoryId: item.categoryId
      }]);
    }
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleProductClick = (product: any) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProductForVariant(product);
    } else {
      addToCart(product, false);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const newQty = newCart[index].quantity + delta;
    if (newQty <= 0) newCart.splice(index, 1);
    else newCart[index].quantity = newQty;
    setCart(newCart);
  };

  const saveNote = () => {
    if (noteItemIndex === null) return;
    const newCart = [...cart];
    newCart[noteItemIndex].kitchenNote = noteText;
    setCart(newCart);
    setNoteItemIndex(null);
    setNoteText('');
  };

  const handlePriceSave = () => {
    if (priceEditIndex === null) return;
    const parsed = parseFloat(priceEditText);
    if (!isNaN(parsed) && parsed >= 0) {
      const newCart = [...cart];
      newCart[priceEditIndex].unitPrice = parsed;
      newCart[priceEditIndex].customDiscountedPrice = parsed; // Override discount logic if manually edited
      setCart(newCart);
    }
    setPriceEditIndex(null);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  
  // Calculate membership discount per item
  const cardDiscount = isMembershipApplied ? cart.reduce((acc, item) => {
    // If a custom discounted price is set, use the difference
    if (item.customDiscountedPrice !== undefined && item.customDiscountedPrice !== null) {
      const itemDiscount = Math.max(0, item.unitPrice - item.customDiscountedPrice);
      return acc + (itemDiscount * item.quantity);
    }
    return acc + ((item.unitPrice * cardDiscountPercentage / 100) * item.quantity);
  }, 0) : 0;
  
  const totalAmount = subtotal - cardDiscount;

  const buildSaleItems = () => cart.map(item => {
    const cat = item.categoryId ? categoryMap[item.categoryId] : null;
    return {
      productId: item.productId,
      productName: item.productName,
      category: cat ? cat.name : (item.isDeal ? 'Combo Deals' : 'Other'),
      categoryId: item.categoryId || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
      totalCost: item.costPrice * item.quantity,
      profit: (item.unitPrice - item.costPrice) * item.quantity,
      kitchenNote: item.kitchenNote,
      variantName: item.variantName,
      isDeal: item.isDeal,
      customDiscountedPrice: item.customDiscountedPrice
    };
  });

  // ─── Dine-In: Save open order & print kitchen receipt ────────────────────
  const handleDineInSave = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    setIsProcessing(true);
    const toastId = toast.loading('Saving order...');
    try {
      const saleItems = buildSaleItems();

      if (activeOpenOrder) {
        const previousCount = activeOpenOrder.kitchenPrintedCount || 0;
        const newItems = saleItems.slice(previousCount);

        await db.sales.update(activeOpenOrder.id, {
          ...activeOpenOrder,
          items: saleItems,
          totalAmount: subtotal,
          customerId: selectedCustomerId || undefined,
          kitchenPrintedCount: saleItems.length,
          updatedAt: new Date(),
        } as any);

        const updatedOrder = { ...activeOpenOrder, items: saleItems, kitchenPrintedCount: saleItems.length };
        setActiveOpenOrder(updatedOrder);
        toast.success('Order updated!', { id: toastId });

        if (newItems.length > 0) {
          setShowKitchenReceipt({ items: newItems, tableNumber, orderId: activeOpenOrder.id });
        } else {
          toast('No new items to send to kitchen.', { icon: 'ℹ️' });
        }
      } else {
        const saleData: any = {
          shopId: shopId!,
          customerId: selectedCustomerId || undefined,
          items: saleItems,
          totalAmount: subtotal,
          totalCOGS: 0,
          totalProfit: 0,
          paymentMethod: 'cash',
          orderType: 'dine_in',
          tableNumber,
          status: 'open',
          kitchenPrintedCount: saleItems.length,
          saleDate: new Date(),
          actorId: currentUser?.id,
          actorName: currentUser?.username || 'System',
          actorRole: userRole || 'system',
          sessionId: activeSession?.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const savedSale = await db.sales.add(saleData);
        const newOrder = { ...saleData, id: savedSale.id };
        setActiveOpenOrder(newOrder);
        toast.success('Order saved!', { id: toastId });
        setShowKitchenReceipt({ items: saleItems, tableNumber, orderId: savedSale.id });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save order', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Dine-In: Final checkout — collect payment & complete ─────────────────
  const handleFinalCheckout = async (selectedPaymentMethod: 'cash' | 'card') => {
    if (!activeOpenOrder) return;
    setIsProcessing(true);
    try {
      const saleItems = buildSaleItems();
      await db.sales.update(activeOpenOrder.id, {
        ...activeOpenOrder,
        items: saleItems,
        totalAmount,
        paymentMethod: selectedPaymentMethod,
        status: 'completed',
        customerId: selectedCustomerId || undefined,
        updatedAt: new Date(),
      } as any);

      const completedSaleData = {
        ...activeOpenOrder,
        items: saleItems,
        totalAmount,
        paymentMethod: selectedPaymentMethod,
        status: 'completed',
        tableNumber,
        customerId: selectedCustomerId || undefined,
      };

      setShowCheckoutModal(false);
      setCompletedSale(completedSaleData);
      clearOrder();
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete order');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Takeaway / Delivery: Immediate completion (unchanged) ────────────────
  const processSale = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    setIsProcessing(true);
    try {
      const saleItems = buildSaleItems();
      const saleData: any = {
        shopId: shopId!,
        customerId: selectedCustomerId || undefined,
        items: saleItems,
        totalAmount,
        totalCOGS: 0,
        totalProfit: 0,
        paymentMethod,
        orderType,
        status: 'completed',
        saleDate: new Date(),
        actorId: currentUser?.id,
        actorName: currentUser?.username || 'System',
        actorRole: userRole || 'system',
        sessionId: activeSession?.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const saleId = (await db.sales.add(saleData)).id;
      setCart([]);
      setSelectedCustomerId(null);
      setIsMembershipApplied(false);
      setCompletedSale({ ...saleData, id: saleId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeedMenu = async () => {
    if (seeding) return;
    setSeeding(true);
    const toastId = toast.loading('Seeding sample restaurant data...');
    try {
      await seedSampleData();
      toast.success('Database seeded successfully!', { id: toastId });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to seed data', { id: toastId });
    } finally {
      setSeeding(false);
    }
  };

  if (productsLoading || dealsLoading || categoriesLoading || customersLoading) return <LoadingSpinner />;

  const isDineIn = orderType === 'dine_in';
  const previouslySentCount = activeOpenOrder?.kitchenPrintedCount || 0;
  const newItemsCount = isDineIn && activeOpenOrder ? Math.max(0, cart.length - previouslySentCount) : 0;

  const activeSession = sessions.find(s => s.status === 'open');

  if (!sessionsLoading && !activeSession) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-112px)]">
        <div className="glass-card p-12 max-w-md w-full text-center space-y-6 bg-slate-50/80 shadow-2xl rounded-[32px] animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock size={40} className="text-rose-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">POS Locked</h2>
            <p className="text-slate-500 mt-2 font-medium text-sm leading-relaxed">
              You must open a Cash Session before processing orders. This ensures all sales are properly tracked to your shift.
            </p>
          </div>
          <button 
            onClick={() => navigate('/sessions')}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/30 transition-all text-lg flex items-center justify-center gap-2"
          >
            Open Cash Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-[calc(100vh-112px)] min-h-[700px] animate-in fade-in duration-500 pb-2 gap-6">

      {/* ─── LEFT PANEL: MENU ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent rounded-[32px] overflow-hidden gap-4">

        {/* Header */}
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-sm shrink-0">
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
            <LayoutGrid size={18} className="text-violet-600" /> POS Billing Menu
          </h2>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => { setActiveTab('menu'); setActiveCategory('All'); }}
              className={cn("px-5 py-2 rounded-xl font-bold transition-all text-xs shadow-sm flex items-center gap-1",
                activeTab === 'menu' ? "bg-white text-slate-900" : "text-slate-500 shadow-none hover:text-slate-700")}
            >
              <Package size={14} /> Menu Items
            </button>
            <button
              onClick={() => { setActiveTab('deals'); setActiveCategory('All'); }}
              className={cn("px-5 py-2 rounded-xl font-bold transition-all text-xs shadow-sm flex items-center gap-1",
                activeTab === 'deals' ? "bg-white text-slate-900" : "text-slate-500 shadow-none hover:text-slate-700")}
            >
              <Sparkles size={14} className="text-amber-500" /> Combo Deals
            </button>
          </div>
        </div>

        {/* Category Pills */}
        {activeTab === 'menu' && (
          <div className="shrink-0 flex gap-2 overflow-x-auto pb-1 style-scrollbar">
            {menuCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn("px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm border",
                  activeCategory === cat ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder={activeTab === 'menu' ? "Search menu items by name..." : "Search deals by name or ingredients..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all shadow-sm"
          />
        </div>

        {/* Products / Deals Grid */}
        <div className="flex-1 overflow-y-auto style-scrollbar">
          {activeTab === 'menu' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
              {displayProducts.map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="bg-white border border-slate-200 rounded-3xl p-4 text-left transition-all hover:shadow-lg hover:border-violet-300 active:scale-95 flex flex-col items-center text-center gap-3 relative overflow-hidden group"
                >
                  <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden mb-2 group-hover:scale-105 transition-transform border border-slate-100 shadow-inner">
                    <img src={getItemImage(product.image, product.name)} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full">
                    <h3 className="font-bold text-slate-800 text-base leading-tight mb-1 line-clamp-2">{product.name}</h3>
                    <p className="font-black text-violet-600 text-lg">{formatCurrency(product.sellingPrice)}</p>
                  </div>
                </button>
              ))}
              {displayProducts.length === 0 && (
                <div className="col-span-full py-16 px-6 text-center flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl shadow-sm">
                  <LayoutGrid size={48} className="text-slate-300 mb-4 animate-pulse" />
                  <p className="font-bold text-slate-600 text-lg">No menu items found</p>
                  <p className="text-slate-400 text-sm mt-1 max-w-sm mb-6">Get started by adding items in Menu Management, or seed a complete sample menu.</p>
                  <button
                    onClick={handleSeedMenu}
                    disabled={seeding}
                    className="flex items-center gap-2 px-6 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/20 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-70"
                  >
                    {seeding ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />}
                    Seed Sample Menu
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
              {displayDeals.map((deal: any) => (
                <button
                  key={deal.id}
                  onClick={() => addToCart(deal, true)}
                  className="bg-white border border-slate-200 rounded-3xl p-5 text-left transition-all hover:shadow-lg hover:border-violet-300 active:scale-95 flex flex-col justify-between h-full min-h-[200px] relative overflow-hidden group shadow-sm"
                >
                  <div className="w-full">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center overflow-hidden border border-slate-100 relative shrink-0">
                        <img src={getItemImage(deal.image, deal.name)} className="w-full h-full object-cover" alt={deal.name} />
                        {deal.isFeatured && (
                          <div className="absolute -top-1 -right-1 bg-amber-400 text-white rounded-full p-0.5 shadow-sm">
                            <Star size={8} className="fill-white text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight mb-2 line-clamp-1">{deal.name}</h3>
                    <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Includes</p>
                      <ul className="space-y-0.5">
                        {deal.items?.map((i: any, idx: number) => {
                          const isCat = i.productId.startsWith('category:');
                          let displayName = 'Unknown Item';
                          if (isCat) {
                            const catId = i.productId.split(':')[1];
                            const cat = categoriesList.find((c: any) => c.id === catId);
                            displayName = `Any ${cat?.name || 'Item'}`;
                          } else {
                            const p = products.find((pr: any) => pr.id === i.productId);
                            displayName = p?.name || 'Unknown Item';
                          }
                          return (
                            <li key={idx} className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                              <span className="text-violet-500">{i.quantity}x</span>
                              <span className="truncate">{displayName}</span>
                              {i.variantName && (
                                <span className="text-[10px] font-black text-violet-500 px-1 py-0.5 bg-violet-50 rounded shrink-0">
                                  ({i.variantName})
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                  <div className="w-full pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Deal Price</p>
                      <p className="font-black text-violet-600 text-lg leading-none">{formatCurrency(deal.price)}</p>
                    </div>
                    <span className="text-[9px] font-bold uppercase px-2.5 py-1 bg-violet-50 text-violet-600 rounded-lg">Combo Deal</span>
                  </div>
                </button>
              ))}
              {displayDeals.length === 0 && (
                <div className="col-span-full py-16 px-6 text-center flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl shadow-sm">
                  <Star size={48} className="text-slate-300 mb-4 animate-pulse" />
                  <p className="font-bold text-slate-600 text-lg">No combo deals found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL: CART ────────────────────────────────────────────── */}
      <div className="w-[380px] shrink-0 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">

        {/* Cart Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart size={20} className="text-violet-600" />
            {activeOpenOrder ? `Table ${tableNumber || '?'}` : 'Current Order'}
          </h2>
          <div className="flex items-center gap-2">
            {/* Open Tables Button */}
            <button
              onClick={() => setShowOpenOrders(!showOpenOrders)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border",
                showOpenOrders
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
              )}
              title="View open dine-in tables"
            >
              <ClipboardList size={14} /> Tables
              {openDineInOrders.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {openDineInOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={clearOrder}
              className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-full transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Open Orders Dropdown Panel */}
        {showOpenOrders && (
          <div className="border-b border-slate-100 bg-slate-50 animate-in slide-in-from-top-2 duration-200">
            <div className="p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Open Dine-In Tables</p>
              {openDineInOrders.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium text-center py-4">No open tables right now</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {openDineInOrders.map((order: any) => {
                    const elapsed = Math.round((Date.now() - new Date(order.saleDate).getTime()) / 60000);
                    const isLoaded = activeOpenOrder?.id === order.id;
                    return (
                      <button
                        key={order.id}
                        onClick={() => loadOpenOrder(order)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                          isLoaded
                            ? "bg-violet-50 border-violet-300 shadow-sm"
                            : "bg-white border-slate-200 hover:border-violet-200 hover:shadow-sm"
                        )}
                      >
                        <div>
                          <p className="font-black text-slate-900 text-sm">Table {order.tableNumber || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-slate-400">{order.items?.length || 0} items • {elapsed}m ago</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-violet-600 text-sm">{formatCurrency(order.totalAmount)}</p>
                          {isLoaded && <p className="text-[9px] font-bold text-violet-500 uppercase">Active</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Type Toggle */}
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            <button
              onClick={() => { setOrderType('take_away'); setActiveOpenOrder(null); }}
              className={cn("flex-1 py-2 font-bold text-[11px] rounded-xl transition-all shadow-sm",
                orderType === 'take_away' ? "bg-white text-slate-900" : "text-slate-500 shadow-none hover:text-slate-700")}
            >
              🛍️ Take Away
            </button>
            <button
              onClick={() => setOrderType('dine_in')}
              className={cn("flex-1 py-2 font-bold text-[11px] rounded-xl transition-all shadow-sm",
                orderType === 'dine_in' ? "bg-white text-slate-900" : "text-slate-500 shadow-none hover:text-slate-700")}
            >
              🍽️ Dine In
            </button>
            <button
              onClick={() => { setOrderType('delivery'); setActiveOpenOrder(null); }}
              className={cn("flex-1 py-2 font-bold text-[11px] rounded-xl transition-all shadow-sm",
                orderType === 'delivery' ? "bg-white text-slate-900" : "text-slate-500 shadow-none hover:text-slate-700")}
            >
              🛵 Delivery
            </button>
          </div>
          {isDineIn && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">Table No.</label>
              <input
                type="text"
                placeholder="e.g. 12"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full bg-slate-100/50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          )}
        </div>

        {/* Active Order Banner */}
        {activeOpenOrder && (
          <div className="px-4 py-2 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-bold text-orange-700">Editing Open Order</span>
            </div>
            {newItemsCount > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 bg-orange-500 text-white rounded-lg">
                {newItemsCount} new item{newItemsCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Member Selector */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-1.5 shrink-0">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Member</label>
          <MemberSearchSelect 
            customers={customers} 
            value={selectedCustomerId} 
            onChange={handleMemberChange} 
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 style-scrollbar bg-slate-50/50">
          {cart.map((item, index) => {
            const isNew = isDineIn && activeOpenOrder && index >= previouslySentCount;
            return (
              <div
                key={item.id}
                className={cn(
                  "bg-white p-2.5 rounded-xl border shadow-sm",
                  isNew ? "border-orange-200 bg-orange-50/30" : "border-slate-200"
                )}
              >
                {isNew && (
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">✦ New</span>
                )}
                <div className="flex justify-between items-start mb-1">
                  <div className="pr-2">
                    <h4 className="font-bold text-slate-900 text-xs leading-tight">{item.productName}</h4>
                    {item.kitchenNote && (
                      <p className="text-[10px] font-semibold text-amber-600 mt-0.5 bg-amber-50 px-1.5 py-0.5 rounded inline-block">
                        Note: {item.kitchenNote}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => { setPriceEditIndex(index); setPriceEditText(item.unitPrice.toString()); }}
                    className="font-black text-slate-900 text-xs shrink-0 hover:text-violet-600 hover:underline transition-colors cursor-pointer text-right group flex flex-col items-end"
                    title="Edit Price"
                  >
                    {formatCurrency(item.unitPrice * item.quantity)}
                    <span className="text-[8px] font-bold text-slate-400 group-hover:text-violet-500 uppercase tracking-widest mt-0.5">Edit</span>
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                    <button onClick={() => updateQuantity(index, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-700 active:scale-95"><Minus size={12} /></button>
                    <span className="w-6 text-center font-bold text-xs text-slate-900">{item.quantity}</span>
                    <button onClick={() => updateQuantity(index, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-700 active:scale-95"><Plus size={12} /></button>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => { setNoteItemIndex(index); setNoteText(item.kitchenNote || ''); }} className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors" title="Add Note">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => removeFromCart(index)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors" title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 pb-10">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p className="font-bold">No items in order</p>
            </div>
          )}
        </div>

        {/* Checkout Footer */}
        <div className="shrink-0 bg-white p-4 border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-500">Membership Card ({cardDiscountPercentage}%)</span>
              <div className="flex items-center gap-2">
                {isMembershipApplied && <span className="text-emerald-600 font-extrabold">-{formatCurrency(cardDiscount)}</span>}
                <button
                  onClick={() => setIsMembershipApplied(!isMembershipApplied)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${isMembershipApplied ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isMembershipApplied ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-end pt-1.5 border-t border-slate-100">
              <span className="text-sm font-black text-slate-900">Total</span>
              <span className="text-2xl font-black text-violet-600 leading-none">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Payment method (only for non-dine-in) */}
          {!isDineIn && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={cn("py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all text-xs",
                  paymentMethod === 'cash' ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:border-slate-300")}
              >
                <Banknote size={14} /> Cash
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={cn("py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all text-xs",
                  paymentMethod === 'card' ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-slate-300")}
              >
                <CreditCard size={14} /> Online
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {isDineIn ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBillPreview(true)}
                  disabled={cart.length === 0}
                  className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all flex items-center justify-center border border-slate-200 active:scale-[0.98]"
                  title="Preview Bill"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={handleDineInSave}
                  disabled={cart.length === 0 || isProcessing}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChefHat size={15} />
                  {activeOpenOrder
                    ? (newItemsCount > 0 ? `Send ${newItemsCount} New to Kitchen` : 'Update Order')
                    : 'Save & Print Kitchen'}
                </button>
              </div>
              {activeOpenOrder && (
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  disabled={cart.length === 0 || isProcessing}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-violet-600/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check size={16} /> Checkout & Print Bill
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowBillPreview(true)}
                disabled={cart.length === 0}
                className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all flex items-center justify-center border border-slate-200 active:scale-[0.98]"
                title="Preview Bill"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={processSale}
                disabled={cart.length === 0 || isProcessing}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-violet-600/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Check size={16} /> CONFIRM ORDER
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODALS ───────────────────────────────────────────────────────── */}

      {/* Variant Picker */}
      {selectedProductForVariant && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-6 max-w-sm w-full animate-in zoom-in duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900">{selectedProductForVariant.name}</h3>
              <button onClick={() => setSelectedProductForVariant(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {selectedProductForVariant.variants.map((v: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => { addToCart(selectedProductForVariant, false, v); setSelectedProductForVariant(null); }}
                  className="w-full flex justify-between items-center p-4 rounded-2xl border-2 border-slate-100 hover:border-violet-500 hover:bg-violet-50 transition-all text-left"
                >
                  <span className="font-bold text-lg text-slate-800">{v.name}</span>
                  <span className="font-black text-violet-600 text-lg">{formatCurrency(v.price)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Kitchen Note */}
      {noteItemIndex !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-6 max-w-sm w-full animate-in zoom-in duration-300 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-4">Kitchen Note</h3>
            <textarea
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 outline-none font-medium resize-none mb-4"
              placeholder="e.g. No onions, extra spicy..."
            />
            <div className="flex gap-3">
              <button onClick={() => setNoteItemIndex(null)} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={saveNote} className="flex-1 py-3 font-bold text-white bg-amber-500 rounded-xl">Save Note</button>
            </div>
          </div>
        </div>
      )}

      {/* Price Edit Modal */}
      {priceEditIndex !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-6 max-w-sm w-full animate-in zoom-in duration-300 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-1">Edit Item Price</h3>
            <p className="text-xs font-bold text-slate-500 mb-4">Update the unit price for this item.</p>
            <input
              autoFocus
              type="number"
              value={priceEditText}
              onChange={e => setPriceEditText(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-violet-500/20 mb-4 font-black text-xl text-violet-600"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handlePriceSave(); } }}
            />
            <div className="flex gap-2">
              <button onClick={() => setPriceEditIndex(null)} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handlePriceSave} className="flex-1 py-3 font-bold text-white bg-violet-600 rounded-xl shadow-md shadow-violet-600/20">Save Price</button>
            </div>
          </div>
        </div>
      )}

      {/* Kitchen Receipt */}
      {showKitchenReceipt && (
        <KitchenReceiptModal
          items={showKitchenReceipt.items}
          tableNumber={showKitchenReceipt.tableNumber}
          orderId={showKitchenReceipt.orderId}
          onClose={() => setShowKitchenReceipt(null)}
          settings={settings}
        />
      )}

      {/* Dine-In Final Checkout */}
      {showCheckoutModal && activeOpenOrder && (
        <CheckoutModal
          order={activeOpenOrder}
          cart={cart}
          subtotal={subtotal}
          cardDiscount={cardDiscount}
          totalAmount={totalAmount}
          cardDiscountPercentage={cardDiscountPercentage}
          isMembershipApplied={isMembershipApplied}
          onToggleMembership={() => setIsMembershipApplied(p => !p)}
          onConfirm={handleFinalCheckout}
          onClose={() => setShowCheckoutModal(false)}
        />
      )}

      {/* Customer Receipt (post-completion) */}
      {completedSale && (
        <InvoiceModal
          sale={completedSale}
          customer={customers.find((c: any) => c.id === completedSale.customerId) || null}
          onClose={() => setCompletedSale(null)}
          autoPrint={true}
        />
      )}

      {/* Bill Preview */}
      {showBillPreview && (
        <InvoiceModal
          sale={{
            items: cart.map(item => {
              const cat = item.categoryId ? categoryMap[item.categoryId] : null;
              return {
                productId: item.productId,
                productName: item.productName,
                category: cat ? cat.name : (item.isDeal ? 'Combo Deals' : 'Other'),
                categoryId: item.categoryId || '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.unitPrice * item.quantity,
                totalCost: 0, profit: 0,
                kitchenNote: item.kitchenNote,
                variantName: item.variantName,
                isDeal: item.isDeal
              };
            }),
            totalAmount,
            paymentMethod,
            orderType,
            tableNumber: isDineIn ? tableNumber : undefined,
            saleDate: new Date(),
            actorName: currentUser?.username || 'System',
            customerId: selectedCustomerId || undefined
          }}
          customer={customers.find((c: any) => c.id === selectedCustomerId) || null}
          onClose={() => setShowBillPreview(false)}
        />
      )}
    </div>
  );
};

export default NewSale;
