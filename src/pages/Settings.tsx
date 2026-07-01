import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Store, Palette, FileText, Shield, Save, Smartphone, CheckCircle2, Info, Download, HardDrive, Upload, User, Key, Mail, Lock, Users, UserPlus, Trash2, Database, RefreshCw } from 'lucide-react';
import { useLiveDocument, useLiveTable } from '../db/hooks';
import { db } from '../db/database';
import { useAuth } from '../contexts/AuthContext';
import { usePWA } from '../hooks/usePWA';
import toast from 'react-hot-toast';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import 'dexie-export-import';

const Settings: React.FC = () => {
  const { shopId, userRole } = useAuth();
  const { document: settings, loading } = useLiveDocument('settings', shopId);
  const { canInstall, isStandalone, promptInstall } = usePWA();
  const { documents: products } = useLiveTable('products');

  const [activeTab, setActiveTab] = useState('shop');
  const [formData, setFormData] = useState<any>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    } else {
      setFormData({
        shopName: 'Pizza Hut POS',
        shopLogo: '',
        shopAddress: '',
        shopPhone: '',
        shopEmail: '',
        shopWebsite: '',
        currency: 'Rs',
        invoicePrefix: 'INV-',
        invoiceFooter: 'Thank you for your business!',
        cardDiscountPercentage: 0,
        themeColor: '#8b5cf6',
        accentColor: '#d946ef'
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!shopId) return toast.error('Shop not loaded');
    try {
      if (settings) {
        await db.settings.update(settings.id, { ...formData, updatedAt: new Date() });
      } else {
        await db.settings.add({ id: shopId, ...formData, createdAt: new Date(), updatedAt: new Date() });
      }
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const blob = await db.export();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PizzaHutPOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch (error) {
      toast.error('Backup failed');
      console.error(error);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (window.confirm('WARNING: This will overwrite ALL existing data! Are you sure?')) {
      setRestoring(true);
      try {
        await db.delete();
        await db.open();
        await db.import(file);
        toast.success('Restore complete! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        toast.error('Restore failed');
        console.error(error);
      } finally {
        setRestoring(false);
      }
    }
    event.target.value = '';
  };

  if (loading || !formData) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
            <p className="text-slate-500 text-sm">Configure your shop details, branding, and system preferences</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-violet-600/20 transition-all active:scale-[0.98]"
        >
          <Save size={20} /> Save Changes
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-72 space-y-2">
          <SettingsNavButton active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} icon={<Store size={18} />} label="Shop Profile" />
          <SettingsNavButton active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} icon={<Palette size={18} />} label="Branding" />
          <SettingsNavButton active={activeTab === 'invoice'} onClick={() => setActiveTab('invoice')} icon={<FileText size={18} />} label="Invoice Template" />
          <SettingsNavButton active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={<SettingsIcon size={18} />} label="System Config" />
          <SettingsNavButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<HardDrive size={18} />} label="Backup & Restore" />
          <SettingsNavButton active={activeTab === 'mobile'} onClick={() => setActiveTab('mobile')} icon={<Smartphone size={18} />} label="Mobile App" />
          <SettingsNavButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={<User size={18} />} label="User Account" />
        </div>

        <div className="flex-1 glass-card p-8 min-h-[600px]">
          {activeTab === 'shop' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                  <Store size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Shop Profile</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shop Name</label>
                  <input type="text" value={formData.shopName} onChange={(e) => setFormData({ ...formData, shopName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</label>
                  <input type="text" value={formData.shopPhone} onChange={(e) => setFormData({ ...formData, shopPhone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shop Email</label>
                  <input type="email" value={formData.shopEmail || ''} onChange={(e) => setFormData({ ...formData, shopEmail: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shop Website</label>
                  <input type="text" value={formData.shopWebsite || ''} onChange={(e) => setFormData({ ...formData, shopWebsite: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20" />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</label>
                  <textarea value={formData.shopAddress} onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium h-32 resize-none focus:ring-2 focus:ring-violet-500/20" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-600"><Palette size={20} /></div>
                <h3 className="text-xl font-bold text-slate-900">Branding</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shop Logo</label>
                  <div className="flex flex-col gap-4">
                    <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                      {formData.shopLogo ? (
                        <img src={formData.shopLogo} alt="Shop Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Store size={32} className="text-slate-400" />
                      )}
                    </div>
                    <label className="cursor-pointer px-4 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl text-xs font-bold text-center border border-violet-100 transition duration-150 inline-block w-fit">
                      Upload Logo Image
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, shopLogo: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                    {formData.shopLogo && (
                      <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, shopLogo: '' })} 
                        className="text-xs text-rose-600 font-bold hover:underline text-left"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logo URL (Fallback / Alternative)</label>
                  <input type="text" value={formData.shopLogo || ''} onChange={(e) => setFormData({ ...formData, shopLogo: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-violet-500/20" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><FileText size={20} /></div>
                <h3 className="text-xl font-bold text-slate-900">Invoice Template</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prefix</label>
                  <input type="text" value={formData.invoicePrefix} onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Currency</label>
                  <input type="text" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Footer Note</label>
                <textarea value={formData.invoiceFooter} onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border rounded-xl h-24" />
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600"><SettingsIcon size={20} /></div>
                <h3 className="text-xl font-bold text-slate-900">System Config</h3>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Membership Discount Percentage (%)</label>
                <input type="number" value={formData.cardDiscountPercentage || 0} onChange={(e) => setFormData({ ...formData, cardDiscountPercentage: parseFloat(e.target.value) || 0 })} className="w-full max-w-xs px-4 py-3 bg-slate-50 border rounded-xl" />
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600"><HardDrive size={20} /></div>
                <h3 className="text-xl font-bold text-slate-900">Backup & Restore</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Download className="text-violet-600" size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Download Backup</h4>
                    <p className="text-xs text-slate-500 mt-1">Export all your data locally.</p>
                  </div>
                  <button onClick={handleBackup} disabled={backingUp} className="px-6 py-2 bg-violet-600 text-white rounded-xl font-bold w-full">
                    {backingUp ? 'Creating...' : 'Export Database'}
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Upload className="text-rose-600" size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Restore Backup</h4>
                    <p className="text-xs text-slate-500 mt-1">Import a previous backup file.</p>
                  </div>
                  <label className="cursor-pointer px-6 py-2 bg-rose-600 text-white rounded-xl font-bold w-full hover:bg-rose-700 transition block text-center">
                    {restoring ? 'Restoring...' : 'Import Database'}
                    <input type="file" className="hidden" accept=".json" onChange={handleRestore} disabled={restoring} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mobile' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Smartphone size={20} /></div>
                <h3 className="text-xl font-bold text-slate-900">Mobile Application</h3>
              </div>
              <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <h4 className="text-2xl font-bold">Install Offline App</h4>
                  <p className="text-sm">Install the application on your device to use it fully offline.</p>
                  {isStandalone ? (
                    <div className="flex items-center gap-2 py-2 px-4 bg-white/20 rounded-xl w-fit"><CheckCircle2 size={20} /><span className="font-bold">Installed</span></div>
                  ) : canInstall ? (
                    <button onClick={promptInstall} className="flex items-center gap-2 px-6 py-3 bg-white text-violet-600 font-bold rounded-xl"><Download size={20} /> Install Now</button>
                  ) : (
                    <div className="flex items-center gap-2 py-2 px-4 bg-white/10 rounded-xl text-xs"><Info size={16} /><span>Use browser menu to 'Add to Home Screen'</span></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && <UserManagementSection />}
        </div>
      </div>
    </div>
  );
};

const UserManagementSection: React.FC = () => {
  const { currentUser, updateUserPassword, updateUsername } = useAuth();
  const [username, setUsername] = useState(currentUser?.username || 'admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    if (currentUser?.username) {
      setUsername(currentUser.username);
    }
  }, [currentUser]);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error('Please enter a username');
    setSavingUsername(true);
    try {
      await updateUsername(username.trim());
      toast.success('Username updated successfully');
    } catch (error) {
      toast.error('Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return toast.error('Please enter a new password');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');

    setSaving(true);
    try {
      await updateUserPassword(newPassword);
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600"><User size={20} /></div>
        <h3 className="text-xl font-bold text-slate-900">User Account</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <form onSubmit={handleUpdateUsername} className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Username</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 focus:ring-2 focus:ring-violet-500/20 outline-none rounded-xl text-sm font-semibold text-slate-700"
              />
              <button
                type="submit"
                disabled={savingUsername}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition active:scale-95 disabled:opacity-75"
              >
                {savingUsername ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Account Role</label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold">
              <Shield size={16} className="text-slate-400" />
              <span className="capitalize">Admin</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Key size={16} className="text-violet-600" />
            <h4 className="font-bold text-slate-900">Change Password</h4>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            disabled={saving}
            type="submit"
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            {saving ? 'Updating...' : 'Update Account Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

const SettingsNavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all",
      active ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    {icon} {label}
  </button>
);

export default Settings;
