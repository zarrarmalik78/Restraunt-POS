import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveDocument } from '../../db/hooks';
import { Package } from 'lucide-react';

const ReportHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const { shopId } = useAuth();
  const { document: settings } = useLiveDocument('settings', shopId);

  return (
    <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
            <Package size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">{settings?.shopName || 'Pizza Hut POS'}</h1>
            <p className="text-sm font-bold text-slate-500">{settings?.shopAddress || 'Business Management System'}</p>
            <p className="text-sm font-medium text-slate-500">{settings?.shopPhone}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-black text-violet-600 uppercase tracking-tighter">{title}</h2>
          <p className="text-xs font-bold text-slate-400 mt-1">{subtitle}</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Generated on: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default ReportHeader;
