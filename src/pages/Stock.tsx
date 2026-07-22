import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Package, Plus, Search, Trash2, X, Edit3, Image as ImageIcon, Star, Layers, PlusCircle, MinusCircle } from 'lucide-react';
import { useLiveTable } from '../db/hooks';
import { db } from '../db/database';
import { formatCurrency, cn, getItemImage } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const Stock: React.FC = () => {
  const { userRole, verifyPassword } = useAuth();
  const isAdmin = userRole === 'admin';
  
  const { documents: products, loading: pLoading } = useLiveTable('products');
  const { documents: deals, loading: dLoading } = useLiveTable('deals');
  const { documents: categories } = useLiveTable('categories');

  const [activeTab, setActiveTab] = useState<'menu' | 'deals'>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [showProductModal, setShowProductModal] = useState<{isOpen: boolean, data: any | null}>({isOpen: false, data: null});
  const [showDealModal, setShowDealModal] = useState<{isOpen: boolean, data: any | null}>({isOpen: false, data: null});
  const [showDeleteModal, setShowDeleteModal] = useState<{id: string, type: 'product'|'deal'} | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === 'all' || p.categoryId === categoryFilter)
    );
  }, [products, searchTerm, categoryFilter]);

  const filteredDeals = useMemo(() => {
    return deals.filter((d: any) => 
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === 'all' || d.categoryId === categoryFilter)
    );
  }, [deals, searchTerm, categoryFilter]);

  const handleDelete = async (id: string, type: 'product'|'deal', password: string) => {
    const isValid = await verifyPassword(password);
    if (!isValid) return toast.error('Incorrect password');

    try {
      if (type === 'product') {
        await db.products.delete(id);
      } else {
        await db.deals.delete(id);
      }
      toast.success('Deleted successfully');
      setShowDeleteModal(null);
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  if (pLoading || dLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-slate-900 h-full flex flex-col">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 glass-card p-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Menu & Deals</h1>
            <p className="text-slate-500 text-sm">Manage restaurant items, variants, and combo deals</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('menu')}
              className={cn("px-6 py-2.5 rounded-xl font-bold transition-all text-sm shadow-sm", activeTab === 'menu' ? "bg-white text-slate-900" : "text-slate-500 shadow-none hover:text-slate-700")}
            >
              Menu Items
            </button>
            <button 
              onClick={() => setActiveTab('deals')}
              className={cn("px-6 py-2.5 rounded-xl font-bold transition-all text-sm shadow-sm", activeTab === 'deals' ? "bg-white text-slate-900" : "text-slate-500 shadow-none hover:text-slate-700")}
            >
              Combo Deals
            </button>
          </div>
        )}
      </div>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-bold"
          />
        </div>
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
        >
          <option value="all">All Categories</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {isAdmin && (
          <button 
            onClick={() => activeTab === 'menu' ? setShowProductModal({isOpen: true, data: null}) : setShowDealModal({isOpen: true, data: null})}
            className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-600/20 uppercase tracking-wider"
          >
            <Plus size={18} /> Add {activeTab === 'menu' ? 'Item' : 'Deal'}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto style-scrollbar">
        {activeTab === 'menu' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {filteredProducts.map((product: any) => {
              const category = categories.find((c: any) => c.id === product.categoryId);
              return (
                <div key={product.id} className="bg-white rounded-[24px] border border-slate-200 p-5 flex flex-col hover:border-violet-300 hover:shadow-lg transition-all group">
                  <div className="flex justify-between items-start mb-4">
                     <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                        <img src={getItemImage(product.image, product.name)} className="w-full h-full object-cover" />
                     </div>
                     {isAdmin && (
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setShowProductModal({isOpen: true, data: product})} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg"><Edit3 size={16} /></button>
                          <button onClick={() => setShowDeleteModal({id: product.id, type: 'product'})} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"><Trash2 size={16} /></button>
                       </div>
                     )}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1">{product.name}</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3" style={{color: category?.color}}>{category?.name || 'Uncategorized'}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                      <p className="font-black text-violet-600 text-lg leading-none">{formatCurrency(product.sellingPrice)}</p>
                    </div>
                    {product.variants?.length > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">
                        <Layers size={12} /> {product.variants.length} Variants
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {filteredDeals.map((deal: any) => {
              const category = categories.find((c: any) => c.id === deal.categoryId);
              return (
                <div key={deal.id} className="bg-white rounded-[24px] border border-slate-200 p-5 flex flex-col hover:border-violet-300 hover:shadow-lg transition-all group">
                  <div className="flex justify-between items-start mb-4">
                     <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center overflow-hidden border border-slate-100 relative">
                        <img src={getItemImage(deal.image, deal.name)} className="w-full h-full object-cover" />
                        {deal.isFeatured && <div className="absolute top-1 right-1"><Star size={12} className="text-amber-500 fill-amber-500" /></div>}
                     </div>
                     {isAdmin && (
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setShowDealModal({isOpen: true, data: deal})} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg"><Edit3 size={16} /></button>
                          <button onClick={() => setShowDeleteModal({id: deal.id, type: 'deal'})} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"><Trash2 size={16} /></button>
                       </div>
                     )}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1">{deal.name}</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3" style={{color: category?.color}}>{category?.name || 'Uncategorized'}</p>
                  
                  <div className="mb-4 bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Includes</p>
                    <ul className="space-y-1">
                      {deal.items.map((i: any, idx: number) => {
                        const p = products.find((pr: any) => pr.id === i.productId);
                        return <li key={idx} className="text-xs font-bold text-slate-700 flex items-center gap-2"><span className="text-violet-500">{i.quantity}x</span> {p?.name || 'Unknown Item'}</li>
                      })}
                    </ul>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Deal Price</p>
                    <p className="font-black text-violet-600 text-xl leading-none">{formatCurrency(deal.price)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showProductModal.isOpen && <ProductModal product={showProductModal.data} categories={categories} onClose={() => setShowProductModal({isOpen: false, data: null})} />}
      {showDealModal.isOpen && <DealModal deal={showDealModal.data} categories={categories} products={products} onClose={() => setShowDealModal({isOpen: false, data: null})} />}
      {showDeleteModal && <SecureDeleteModal type={showDeleteModal.type} onClose={() => setShowDeleteModal(null)} onConfirm={(pwd) => handleDelete(showDeleteModal.id, showDeleteModal.type, pwd)} />}
    </div>
  );
};

// --- MODALS ---

const ProductModal: React.FC<{ product: any; categories: any[]; onClose: () => void }> = ({ product, categories, onClose }) => {
  const { shopId } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    categoryId: product?.categoryId || (categories[0]?.id || ''),
    costPrice: product?.costPrice?.toString() || '0',
    sellingPrice: product?.sellingPrice?.toString() || '0',
    customDiscountedPrice: product?.customDiscountedPrice?.toString() || '',
    image: product?.image || '',
    variants: product?.variants || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        shopId: shopId!,
        name: formData.name,
        categoryId: formData.categoryId,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        customDiscountedPrice: formData.customDiscountedPrice ? Number(formData.customDiscountedPrice) : undefined,
        image: formData.image,
        variants: formData.variants.map((v: any) => ({ 
          ...v, 
          price: Number(v.price), 
          cost: Number(v.cost),
          customDiscountedPrice: v.customDiscountedPrice ? Number(v.customDiscountedPrice) : undefined
        })),
        updatedAt: new Date(),
        ...(product ? {} : { createdAt: new Date() })
      };
      
      if (product) await db.products.update(product.id, data);
      else await db.products.add(data as any);

      toast.success('Product saved');
      onClose();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const addVariant = () => {
    setFormData({...formData, variants: [...formData.variants, { name: '', price: 0, cost: 0, customDiscountedPrice: '' }]});
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const newVars = [...formData.variants];
    newVars[index][field] = value;
    setFormData({...formData, variants: newVars});
  };

  const removeVariant = (index: number) => {
    const newVars = [...formData.variants];
    newVars.splice(index, 1);
    setFormData({...formData, variants: newVars});
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-t-[32px]">
          <h2 className="text-xl font-bold text-slate-900">{product ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 style-scrollbar">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/20 font-bold" placeholder="e.g. Zinger Burger" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</label>
                <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/20 font-bold">
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Base Selling Price</label>
                <input required type="number" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/20 font-bold text-emerald-600" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Custom Discounted Price (Optional)</label>
                <input type="number" value={formData.customDiscountedPrice} onChange={e => setFormData({...formData, customDiscountedPrice: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500/20 font-bold text-rose-600" placeholder="e.g. overrides 30% off" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product Image</label>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="w-20 h-20 rounded-xl border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer px-4 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl text-xs font-bold text-center border border-violet-100 transition duration-150 inline-block w-fit">
                      Upload Local Image
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, image: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                    {formData.image && (
                      <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, image: '' })} 
                        className="text-xs text-rose-600 font-bold hover:underline text-left"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Variants (Optional)</h3>
                <button type="button" onClick={addVariant} className="flex items-center gap-1 text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg hover:bg-violet-100 transition-colors">
                  <Plus size={14} /> Add Variant
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.variants.map((v: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <input required placeholder="Variant Name (e.g. Large)" value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg outline-none font-bold text-sm" />
                      <input required type="number" placeholder="Price" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)} className="w-24 px-3 py-2 border border-slate-200 rounded-lg outline-none font-bold text-sm text-emerald-600" />
                      <button type="button" onClick={() => removeVariant(idx)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">Discounted</span>
                      <input type="number" placeholder="Custom discounted price (Optional)" value={v.customDiscountedPrice || ''} onChange={e => updateVariant(idx, 'customDiscountedPrice', e.target.value)} className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg outline-none font-bold text-xs text-rose-600 focus:ring-2 focus:ring-rose-500/20" />
                    </div>
                  </div>
                ))}
                {formData.variants.length === 0 && <p className="text-xs text-slate-400 font-bold">No variants added. Product will use base price.</p>}
              </div>
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-slate-100 shrink-0 bg-white rounded-b-[32px]">
          <button form="product-form" type="submit" disabled={saving} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold active:scale-[0.98] transition-transform">
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ItemSelectorModal: React.FC<{
  products: any[];
  categories: any[];
  onSelect: (productId: string, variantName?: string) => void;
  onClose: () => void;
}> = ({ products, categories, onSelect, onClose }) => {
  const [search, setSearch] = useState('');

  const options = useMemo(() => {
    const list: any[] = [];
    
    // Add Category Placeholders (e.g. Any Pizza (Small))
    categories.forEach(cat => {
      // Find all unique variants for products in this category
      const catProducts = products.filter(p => p.categoryId === cat.id);
      const uniqueVariants = new Set<string>();
      catProducts.forEach(p => {
        if (p.variants) {
          p.variants.forEach((v: any) => uniqueVariants.add(v.name));
        }
      });

      if (uniqueVariants.size > 0) {
        uniqueVariants.forEach(vName => {
          list.push({
            productId: `category:${cat.id}`,
            productName: `Any ${cat.name}`,
            variantName: vName,
            price: 0,
            isCategoryPlaceholder: true,
            searchStr: `any ${cat.name} ${vName}`.toLowerCase()
          });
        });
      } else {
        list.push({
          productId: `category:${cat.id}`,
          productName: `Any ${cat.name}`,
          variantName: undefined,
          price: 0,
          isCategoryPlaceholder: true,
          searchStr: `any ${cat.name}`.toLowerCase()
        });
      }
    });

    // Add specific products
    products.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v: any) => {
          list.push({ 
            productId: p.id, 
            productName: p.name, 
            variantName: v.name, 
            price: v.price, 
            searchStr: `${p.name} ${v.name}`.toLowerCase() 
          });
        });
      } else {
        list.push({ 
          productId: p.id, 
          productName: p.name, 
          variantName: undefined, 
          price: p.sellingPrice, 
          searchStr: p.name.toLowerCase() 
        });
      }
    });
    return list.filter(o => !search || o.searchStr.includes(search.toLowerCase()));
  }, [products, categories, search]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-lg max-h-[80vh] shadow-2xl flex flex-col p-6 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-black text-slate-900">Select Items to Add</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="py-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
            <input 
              autoFocus
              placeholder="Search items, categories or variants..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto style-scrollbar space-y-2 pr-1">
          {options.length === 0 ? (
            <p className="text-center py-8 text-sm font-bold text-slate-400">No items found</p>
          ) : (
            options.map((opt, i) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-sm">{opt.productName}</span>
                  {opt.variantName && (
                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md mt-1 w-fit">
                      {opt.variantName}
                    </span>
                  )}
                  {opt.isCategoryPlaceholder && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 w-fit uppercase tracking-wider">
                      Category Choice
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-500">
                    {opt.isCategoryPlaceholder ? 'Flexible Choice' : formatCurrency(opt.price)}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      onSelect(opt.productId, opt.variantName);
                    }}
                    className="flex items-center justify-center p-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl active:scale-[0.9] transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 shrink-0 flex justify-end">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
          >
            Done Selecting
          </button>
        </div>
      </div>
    </div>
  );
};

const DealModal: React.FC<{ deal: any; categories: any[]; products: any[]; onClose: () => void }> = ({ deal, categories, products, onClose }) => {
  const { shopId } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [formData, setFormData] = useState({
    name: deal?.name || '',
    categoryId: deal?.categoryId || (categories[0]?.id || ''),
    price: deal?.price?.toString() || '0',
    customDiscountedPrice: deal?.customDiscountedPrice?.toString() || '',
    image: deal?.image || '',
    isFeatured: deal?.isFeatured || false,
    items: deal?.items || []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) return toast.error('Add at least one item to the deal');
    
    setSaving(true);
    try {
      const data = {
        shopId: shopId!,
        name: formData.name,
        categoryId: formData.categoryId,
        price: Number(formData.price),
        customDiscountedPrice: formData.customDiscountedPrice ? Number(formData.customDiscountedPrice) : undefined,
        image: formData.image,
        isFeatured: formData.isFeatured,
        items: formData.items,
        updatedAt: new Date(),
        ...(deal ? {} : { createdAt: new Date() })
      };
      
      if (deal) await db.deals.update(deal.id, data);
      else await db.deals.add(data as any);

      toast.success('Deal saved');
      onClose();
    } catch {
      toast.error('Failed to save deal');
    } finally {
      setSaving(false);
    }
  };

  const addItemFromSelector = (productId: string, variantName?: string) => {
    // Check if item already exists in deal, if so just increment quantity
    const existingIndex = formData.items.findIndex(
      (item: any) => item.productId === productId && item.variantName === variantName
    );

    if (existingIndex > -1) {
      const newItems = [...formData.items];
      newItems[existingIndex].quantity += 1;
      setFormData({ ...formData, items: newItems });
      toast.success('Incremented item quantity');
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, { productId, quantity: 1, variantName }]
      });
      toast.success('Item added to deal');
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({...formData, items: newItems});
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({...formData, items: newItems});
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-violet-50/50 rounded-t-[32px]">
          <h2 className="text-xl font-bold text-slate-900">{deal ? 'Edit Deal' : 'New Deal'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 style-scrollbar">
          <form id="deal-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deal Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/20 font-bold" placeholder="e.g. Mighty Burger Combo" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</label>
                <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/20 font-bold">
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Combo Price</label>
                <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/20 font-bold text-violet-600" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Custom Discounted Price (Optional)</label>
                <input type="number" value={formData.customDiscountedPrice} onChange={e => setFormData({...formData, customDiscountedPrice: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500/20 font-bold text-rose-600" placeholder="e.g. overrides 30% off" />
              </div>
            </div>

            {/* Included Items */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Included Items</h3>
                <button type="button" onClick={() => setShowItemSelector(true)} className="flex items-center gap-1 text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg hover:bg-violet-100 transition-colors">
                  <Plus size={14} /> Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.items.map((item: any, idx: number) => {
                  const isCat = item.productId.startsWith('category:');
                  let displayName = 'Unknown Item';
                  if (isCat) {
                    const catId = item.productId.split(':')[1];
                    const cat = categories.find(c => c.id === catId);
                    displayName = `Any ${cat?.name || 'Item'}`;
                  } else {
                    const product = products.find(p => p.id === item.productId);
                    displayName = product?.name || 'Unknown Item';
                  }
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-bold text-sm text-slate-800 truncate">{displayName}</span>
                        {item.variantName && (
                          <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md mt-1 w-fit">
                            Variant: {item.variantName}
                          </span>
                        )}
                        {isCat && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 w-fit uppercase tracking-wider">
                            Category Choice
                          </span>
                        )}
                      </div>
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0">
                         <button type="button" onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))} className="p-2 hover:bg-slate-100"><MinusCircle size={16} /></button>
                         <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                         <button type="button" onClick={() => updateItem(idx, 'quantity', item.quantity + 1)} className="p-2 hover:bg-slate-100"><PlusCircle size={16} /></button>
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors shrink-0"><Trash2 size={16} /></button>
                    </div>
                  );
                })}
                {formData.items.length === 0 && <p className="text-xs text-slate-400 font-bold">No items added to this deal yet.</p>}
              </div>
            </div>

            {/* Deal Image & Settings (Moved below items) */}
            <div className="pt-6 border-t border-slate-100 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deal Image</label>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="w-20 h-20 rounded-xl border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Star size={24} className="text-violet-400" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer px-4 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl text-xs font-bold text-center border border-violet-100 transition duration-150 inline-block w-fit">
                      Upload Local Image
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, image: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                    {formData.image && (
                      <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, image: '' })} 
                        className="text-xs text-rose-600 font-bold hover:underline text-left"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <input type="checkbox" id="featured" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} className="w-5 h-5 accent-violet-600 rounded" />
                 <label htmlFor="featured" className="font-bold text-sm text-slate-800">Featured Deal (Shows in POS Quick Access)</label>
              </div>
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-slate-100 shrink-0 bg-white rounded-b-[32px]">
          <button form="deal-form" type="submit" disabled={saving} className="w-full py-4 bg-violet-600 text-white rounded-2xl font-bold active:scale-[0.98] transition-transform shadow-lg shadow-violet-600/20">
            {saving ? 'Saving...' : 'Save Deal'}
          </button>
        </div>
      </div>

      {showItemSelector && (
        <ItemSelectorModal 
          products={products}
          categories={categories}
          onSelect={addItemFromSelector}
          onClose={() => setShowItemSelector(false)}
        />
      )}
    </div>
  );
};

const SecureDeleteModal: React.FC<{ type: 'product'|'deal'; onClose: () => void; onConfirm: (password: string) => void }> = ({ type, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Delete {type === 'product' ? 'Product' : 'Deal'}</h2>
          <p className="text-slate-500 text-sm mb-8">This action is irreversible.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
             <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Admin Password</label>
                <input required type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 focus:border-rose-500 outline-none transition-all font-bold tracking-widest" placeholder="••••••••" />
             </div>
             <div className="flex gap-3 mt-8">
                <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold hover:bg-slate-100 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all">
                  Delete
                </button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Stock;
