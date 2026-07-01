import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, X, Edit3, Star, Utensils, Coffee, Pizza, LayoutGrid, Check, Database, RefreshCw, Eye, Printer, Package, Sparkles } from 'lucide-react';
import { useLiveTable, useLiveDocument } from '../db/hooks';
import { db } from '../db/database';
import { formatCurrency, cn, getItemImage } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { seedSampleData } from '../lib/seedData';
import { InvoiceModal } from './Sales';


interface CartItem {
  id: string; // unique cart item id
  productId: string;
  productName: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  variantName?: string;
  kitchenNote?: string;
  isDeal?: boolean;
  categoryId?: string;
}

const NewSale: React.FC = () => {
  const { currentUser, shopId, userRole } = useAuth();
  const { documents: products, loading: productsLoading } = useLiveTable('products');
  const { documents: deals, loading: dealsLoading } = useLiveTable('deals');
  const { documents: categoriesList, loading: categoriesLoading } = useLiveTable('categories');
  const { documents: customers, loading: customersLoading } = useLiveTable('customers');
  const { document: settings } = useLiveDocument('settings', shopId);

  const [activeTab, setActiveTab] = useState<'menu' | 'deals'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'take_away' | 'delivery'>('take_away');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isMembershipApplied, setIsMembershipApplied] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [showBillPreview, setShowBillPreview] = useState(false);

  // Modals
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any | null>(null);
  const [noteItemIndex, setNoteItemIndex] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  const cardDiscountPercentage = settings?.cardDiscountPercentage || 0;

  const handleMemberChange = (customerId: string) => {
    setSelectedCustomerId(customerId || null);
    if (customerId) {
      const member = customers.find((c: any) => c.id === customerId);
      if (member && member.cardNumber) {
        setIsMembershipApplied(true);
      } else {
        setIsMembershipApplied(false);
      }
    } else {
      setIsMembershipApplied(false);
    }
  };

  const categoryMap = useMemo(() => {
    const map: Record<string, any> = {};
    categoriesList.forEach((c: any) => {
      map[c.id] = c;
    });
    return map;
  }, [categoriesList]);

  const menuCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p: any) => {
      const cat = categoryMap[p.categoryId];
      if (cat) {
        cats.add(cat.name);
      }
    });
    return ['All', ...Array.from(cats)];
  }, [products, categoryMap]);

  const displayProducts = useMemo(() => {
    let filtered = products;
    if (activeCategory !== 'All') {
      filtered = filtered.filter((p: any) => {
        const cat = categoryMap[p.categoryId];
        return cat?.name === activeCategory;
      });
    }
    if (searchTerm) {
      filtered = filtered.filter((p: any) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Sort price-wise: cheapest first
    return [...filtered].sort((a: any, b: any) => (a.sellingPrice || 0) - (b.sellingPrice || 0));
  }, [products, activeCategory, searchTerm, categoryMap]);

  const sortDeals = (a: any, b: any) => {
    const aName = a.name || '';
    const bName = b.name || '';
    
    // Sort Deal 1, Deal 2 ... Deal 12 numerically
    const aMatch = aName.match(/^Deal\s+(\d+)$/i);
    const bMatch = bName.match(/^Deal\s+(\d+)$/i);
    
    if (aMatch && bMatch) {
      return parseInt(aMatch[1], 10) - parseInt(bMatch[1], 10);
    }
    if (aMatch) return -1;
    if (bMatch) return 1;
    
    // Sort other deals (Birthday Deal 1, Family Deal 2) numerically at the end
    const aNumMatch = aName.match(/(\d+)$/);
    const bNumMatch = bName.match(/(\d+)$/);
    
    if (aNumMatch && bNumMatch) {
      const aBase = aName.replace(/\d+$/, '').trim();
      const bBase = bName.replace(/\d+$/, '').trim();
      if (aBase === bBase) {
        return parseInt(aNumMatch[1], 10) - parseInt(bNumMatch[1], 10);
      }
      return aBase.localeCompare(bBase);
    }
    
    return aName.localeCompare(bName);
  };

  const displayDeals = useMemo(() => {
    let filtered = deals;
    if (searchTerm) {
      filtered = filtered.filter((d: any) => {
        const matchesName = d.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesItems = d.items?.some((i: any) => {
          const p = products.find((pr: any) => pr.id === i.productId);
          return p?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        });
        return matchesName || matchesItems;
      });
    }
    return [...filtered].sort(sortDeals);
  }, [deals, searchTerm, products]);

  const addToCart = (item: any, isDeal = false, variant?: any) => {
    const unitPrice = variant ? variant.price : (item.price || item.sellingPrice);
    const costPrice = variant ? variant.cost : (item.cost || item.costPrice || 0);
    const name = variant ? `${item.name} (${variant.name})` : item.name;

    // Look for exact same item in cart (same product, variant, and note)
    const existingIndex = cart.findIndex(c => 
      c.productId === item.id && 
      c.isDeal === isDeal && 
      c.variantName === variant?.name &&
      !c.kitchenNote // Only stack items without notes
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
        unitPrice,
        costPrice,
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
    if (newQty <= 0) {
      newCart.splice(index, 1);
    } else {
      newCart[index].quantity = newQty;
    }
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

  const subtotal = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const cardDiscount = isMembershipApplied ? (subtotal * cardDiscountPercentage / 100) : 0;
  const totalAmount = subtotal - cardDiscount;

  const processSale = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    setIsProcessing(true);
    const toastId = toast.loading('Processing order...');

    try {
      const saleItems = cart.map(item => {
        const cat = item.categoryId ? categoryMap[item.categoryId] : null;
        const categoryName = cat ? cat.name : (item.isDeal ? 'Combo Deals' : 'Other');
        return {
          productId: item.productId,
          productName: item.productName,
          category: categoryName,
          categoryId: item.categoryId || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          totalCost: 0,
          profit: 0,
          kitchenNote: item.kitchenNote,
          variantName: item.variantName,
          isDeal: item.isDeal
        };
      });

      const saleData = {
        shopId: shopId!,
        customerId: selectedCustomerId || undefined,
        items: saleItems,
        totalAmount,
        totalCOGS: 0,
        totalProfit: 0,
        paymentMethod,
        orderType,
        saleDate: new Date(),
        actorId: currentUser?.id,
        actorName: currentUser?.username || 'System',
        actorRole: userRole || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const saleId = (await db.sales.add(saleData)).id;

      // Note: No stock deduction as per requirements for restaurant mode.
      
      setCart([]);
      setSelectedCustomerId(null);
      setIsMembershipApplied(false);
      toast.success('Order completed!', { id: toastId });
      setCompletedSale({ ...saleData, id: saleId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete order', { id: toastId });
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

  return (
    <div className="flex w-full h-[calc(100vh-112px)] min-h-[700px] animate-in fade-in duration-500 pb-2 gap-6">
      
      {/* LEFT PANEL - MENU */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent rounded-[32px] overflow-hidden gap-4">
        
        {/* POS Pill Toggle Header */}
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-sm shrink-0">
          <h2 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
            <LayoutGrid size={18} className="text-violet-600" /> POS Billing Menu
          </h2>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => { setActiveTab('menu'); setActiveCategory('All'); }}
              className={cn(
                "px-5 py-2 rounded-xl font-bold transition-all text-xs shadow-sm flex items-center gap-1",
                activeTab === 'menu' ? "bg-white text-slate-900" : "text-slate-500 shadow-none hover:text-slate-700"
              )}
            >
              <Package size={14} /> Menu Items
            </button>
            <button 
              onClick={() => { setActiveTab('deals'); setActiveCategory('All'); }}
              className={cn(
                "px-5 py-2 rounded-xl font-bold transition-all text-xs shadow-sm flex items-center gap-1",
                activeTab === 'deals' ? "bg-white text-slate-900" : "text-slate-500 shadow-none hover:text-slate-700"
              )}
            >
              <Sparkles size={14} className="text-amber-500" /> Combo Deals
            </button>
          </div>
        </div>

        {/* Categories Tab Bar - Only visible in Menu Items mode */}
        {activeTab === 'menu' && (
          <div className="shrink-0 flex gap-2 overflow-x-auto pb-1 style-scrollbar">
            {menuCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm border",
                  activeCategory === cat 
                    ? "bg-slate-900 text-white border-slate-900" 
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                )}
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

        {/* Products Grid */}
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
                  <p className="text-slate-400 text-sm mt-1 max-w-sm mb-6">
                    Get started by adding items in Menu Management, or seed a complete sample menu for testing.
                  </p>
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
                        <img src={getItemImage(deal.image, deal.name)} className="w-full h-full object-cover" />
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
                          const p = products.find((pr: any) => pr.id === i.productId);
                          return (
                            <li key={idx} className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                              <span className="text-violet-500">{i.quantity}x</span> 
                              <span className="truncate">{p?.name || 'Unknown Item'}</span>
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
                  <p className="text-slate-400 text-sm mt-1 max-w-sm">
                    Try another search keyword, or toggle back to Menu Items to select individual products.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - CART */}
      <div className="w-[380px] shrink-0 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart size={20} className="text-violet-600" />
            Current Order
          </h2>
          <button 
            onClick={() => setCart([])}
            className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-full transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Order Type Toggle */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            <button
              onClick={() => setOrderType('take_away')}
              className={cn(
                "flex-1 py-2 font-bold text-[11px] rounded-xl transition-all shadow-sm",
                orderType === 'take_away' ? "bg-white text-slate-900" : "text-slate-500 shadow-none hover:text-slate-700"
              )}
            >
              🛍️ Take Away
            </button>
            <button
              onClick={() => setOrderType('dine_in')}
              className={cn(
                "flex-1 py-2 font-bold text-[11px] rounded-xl transition-all shadow-sm",
                orderType === 'dine_in' ? "bg-white text-slate-900" : "text-slate-500 shadow-none hover:text-slate-700"
              )}
            >
              🍽️ Dine In
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={cn(
                "flex-1 py-2 font-bold text-[11px] rounded-xl transition-all shadow-sm",
                orderType === 'delivery' ? "bg-white text-slate-900" : "text-slate-500 shadow-none hover:text-slate-700"
              )}
            >
              🛵 Delivery
            </button>
          </div>
        </div>

        {/* Member Selector */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-1.5 shrink-0">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Member</label>
          <select
            value={selectedCustomerId || ''}
            onChange={(e) => handleMemberChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="">Walk-in Guest (No Card)</option>
            {customers
              .filter((c: any) => c.type === 'customer')
              .map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.cardNumber ? `(Card: ${c.cardNumber})` : ''} - {c.phone}
                </option>
              ))}
          </select>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 style-scrollbar bg-slate-50/50">
          {cart.map((item, index) => (
            <div key={item.id} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-1">
                <div className="pr-2">
                  <h4 className="font-bold text-slate-900 text-xs leading-tight">{item.productName}</h4>
                  {item.kitchenNote && (
                    <p className="text-[10px] font-semibold text-amber-600 mt-0.5 bg-amber-50 px-1.5 py-0.5 rounded inline-block">
                      Note: {item.kitchenNote}
                    </p>
                  )}
                </div>
                <p className="font-black text-slate-900 text-xs">{formatCurrency(item.unitPrice * item.quantity)}</p>
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                  <button onClick={() => updateQuantity(index, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-700 active:scale-95"><Minus size={12} /></button>
                  <span className="w-6 text-center font-bold text-xs text-slate-900">{item.quantity}</span>
                  <button onClick={() => updateQuantity(index, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-700 active:scale-95"><Plus size={12} /></button>
                </div>
                <div className="flex items-center gap-0.5">
                  <button 
                    onClick={() => { setNoteItemIndex(index); setNoteText(item.kitchenNote || ''); }}
                    className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors"
                    title="Add Note"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => removeFromCart(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
            
            {/* Compact Membership Toggle */}
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-500">Membership Card ({cardDiscountPercentage}%)</span>
              <div className="flex items-center gap-2">
                {isMembershipApplied && (
                  <span className="text-emerald-600 font-extrabold">-{formatCurrency(cardDiscount)}</span>
                )}
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

          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                "py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all text-xs",
                paymentMethod === 'cash' ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              <Banknote size={14} /> Cash
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={cn(
                "py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all text-xs",
                paymentMethod === 'card' ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              <CreditCard size={14} /> Card
            </button>
          </div>

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
        </div>
      </div>

      {/* MODALS */}
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
                  onClick={() => {
                    addToCart(selectedProductForVariant, false, v);
                    setSelectedProductForVariant(null);
                  }}
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
            ></textarea>
            <div className="flex gap-3">
              <button onClick={() => setNoteItemIndex(null)} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={saveNote} className="flex-1 py-3 font-bold text-white bg-amber-500 rounded-xl">Save Note</button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary basic receipt modal to avoid crashing. Proper receipt comes in Phase 5 */}
      {completedSale && (
        <InvoiceModal 
          sale={completedSale}
          customer={customers.find((c: any) => c.id === completedSale.customerId) || null}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {showBillPreview && (
        <InvoiceModal 
          sale={{
            items: cart.map(item => {
              const cat = item.categoryId ? categoryMap[item.categoryId] : null;
              const categoryName = cat ? cat.name : (item.isDeal ? 'Combo Deals' : 'Other');
              return {
                productId: item.productId,
                productName: item.productName,
                category: categoryName,
                categoryId: item.categoryId || '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.unitPrice * item.quantity,
                totalCost: 0,
                profit: 0,
                kitchenNote: item.kitchenNote,
                variantName: item.variantName,
                isDeal: item.isDeal
              };
            }),
            totalAmount: totalAmount,
            paymentMethod: paymentMethod,
            orderType: orderType,
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
