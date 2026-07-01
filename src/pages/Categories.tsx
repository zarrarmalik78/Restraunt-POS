import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Search, X, Sparkles, RefreshCcw } from 'lucide-react';
import { useLiveTable } from '../db/hooks';
import { db } from '../db/database';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const Categories: React.FC = () => {
  const { shopId, userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const { documents: categories, loading } = useLiveTable('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const filteredCategories = categories.filter((c: any) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDelete = async (id: string) => {
    if (!isAdmin) return toast.error('Only admins can delete categories');
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await db.categories.delete(id);
        toast.success('Category deleted');
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const seedDefaultCategories = async () => {
    if (!isAdmin) return;
    if (categories.length > 0 && !window.confirm('You already have some categories. This will add the standard tech shop categories to your existing list. Continue?')) {
      return;
    }

    const defaultCategories = [
      { name: 'Graphics Cards (GPU)', color: '#6366f1' },
      { name: 'Processors (CPU)', color: '#f472b6' },
      { name: 'Motherboards', color: '#38bdf8' },
      { name: 'RAM / Memory', color: '#22c55e' },
      { name: 'Storage (SSD/HDD)', color: '#eab308' },
      { name: 'Power Supplies (PSU)', color: '#f97316' },
      { name: 'PC Cases / Chasis', color: '#64748b' },
      { name: 'Monitors', color: '#14b8a6' },
      { name: 'Keyboards', color: '#a855f7' },
      { name: 'Mice & Pointers', color: '#ec4899' },
      { name: 'Audio & Headsets', color: '#06b6d4' },
      { name: 'Networking Devices', color: '#8b5cf6' },
      { name: 'Laptops', color: '#0ea5e9' },
      { name: 'Pre-built Systems', color: '#334155' },
      { name: 'Cables & Adapters', color: '#94a3b8' },
      { name: 'Cooling Solutions', color: '#2dd4bf' },
      { name: 'Other Accessories', color: '#475569' }
    ];

    try {
      const existingNames = new Set(categories.map((c: any) => c.name.toLowerCase()));
      const toAdd = defaultCategories.filter(cat => !existingNames.has(cat.name.toLowerCase()));

      if (toAdd.length === 0) {
        toast.error('All default categories already exist');
        return;
      }

      for (const cat of toAdd) {
        await db.categories.add({
          shopId: shopId!,
          ...cat,
          createdAt: new Date()
        });
      }
      toast.success(`Added ${toAdd.length} default categories`);
    } catch (error) {
      toast.error('Failed to seed categories');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
            <Tag size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Categories</h1>
            <p className="text-slate-500 text-sm">Manage dynamic product categories</p>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { setEditingCategory(null); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-600/20 text-sm"
          >
            <Plus size={20} /> Add Category
          </button>
        )}
      </header>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category: any) => (
          <div key={category.id} className="glass-card p-6 flex flex-col gap-4 group hover:border-violet-300 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color || '#8b5cf6' }}></div>
                <h3 className="font-bold text-lg text-slate-900">{category.name}</h3>
              </div>
              {isAdmin && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingCategory(category); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-violet-600 bg-slate-50 hover:bg-violet-50 rounded-md">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(category.id!)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-md">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            {category.description && <p className="text-sm text-slate-500">{category.description}</p>}
          </div>
        ))}
      </div>

      {showModal && (
        <CategoryModal 
          category={editingCategory} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
};

const CategoryModal: React.FC<{ category?: any, onClose: () => void }> = ({ category, onClose }) => {
  const { shopId } = useAuth();
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || '#8b5cf6'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;
    setSaving(true);
    try {
      if (category) {
        await db.categories.update(category.id, { ...formData, updatedAt: new Date() });
        toast.success('Category updated');
      } else {
        await db.categories.add({
          shopId,
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast.success('Category created');
      }
      onClose();
    } catch (error) {
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold">{category ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Name</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-xl px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Color Code</label>
            <input required type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-16 h-10 p-1 border rounded-lg cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded-xl px-4 py-2 h-24" />
          </div>
          <button disabled={saving} type="submit" className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold">{saving ? 'Saving...' : 'Save Category'}</button>
        </form>
      </div>
    </div>
  );
};

export default Categories;
