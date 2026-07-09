import React from 'react';
import { ShieldCheck, Info, User, Phone, Globe, Building, Sparkles } from 'lucide-react';

const Credits: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-slate-900">
      {/* Header */}
      <header className="flex items-center gap-4 glass-card p-6">
        <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            System Information & Support <Sparkles className="text-amber-500 fill-amber-500" size={18} />
          </h1>
          <p className="text-slate-500 text-sm">Software details, licensing agreements, and developer support channels</p>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Support & Developer Details */}
        <div className="glass-card p-8 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <User size={20} className="text-violet-600" /> Developer Support
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            This POS system is custom-built and optimized for fast-paced retail and restaurant environments. For technical support, custom feature requests, or queries, please feel free to reach out.
          </p>

          <div className="h-px bg-slate-100 w-full my-2"></div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                <Building size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company</p>
                <p className="text-sm font-bold text-slate-800">Zyntrum Tech</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <User size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Developer</p>
                <p className="text-sm font-bold text-slate-800">Zarar Malik</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Number</p>
                <a href="tel:03259914121" className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">03259914121</a>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Website</p>
                <a href="https://zararmalik.online" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-violet-600 hover:underline">
                  zararmalik.online
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Software & Environment Details */}
        <div className="glass-card p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <Info size={20} className="text-violet-600" /> Application Details
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">Software Name</span>
                <span className="text-sm font-black text-slate-800">Pizza Hut POS</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">Build Version</span>
                <span className="text-sm font-bold text-slate-700">v1.0.0 (Stable)</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">Database Engine</span>
                <span className="text-sm font-bold text-slate-700">SQLite3 (Encrypted Local Storage)</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500">Platform</span>
                <span className="text-sm font-bold text-slate-700">Electron Native Desktop Wrapper</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-xs font-bold text-slate-500">License Type</span>
                <span className="text-xs font-black px-2.5 py-1 bg-violet-100 text-violet-700 rounded-lg">Single-Device OEM</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 text-white rounded-2xl border border-white/5 relative overflow-hidden mt-6">
            <p className="text-xs font-semibold text-slate-400 mb-1 leading-relaxed">
              &copy; {new Date().getFullYear()} Zyntrum Tech. All rights reserved. Registered trademark of Zyntrum Tech. Unauthorized reproduction or distribution is strictly prohibited under local copyright laws.
            </p>
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Credits;
