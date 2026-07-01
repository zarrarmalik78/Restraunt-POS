import React from 'react';
import { Printer, Calendar, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ReportToolbarProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onPrint: () => void;
  title: string;
}

const ReportToolbar: React.FC<ReportToolbarProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onPrint,
  title
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 glass-card bg-slate-900 text-white mb-6 print:hidden">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="font-bold text-sm tracking-tight">{title}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Reporting Module</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
          <Calendar size={14} className="text-violet-400" />
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => onStartDateChange(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 outline-none"
          />
          <span className="text-slate-500 text-xs">to</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => onEndDateChange(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 outline-none"
          />
        </div>
        
        <button 
          onClick={onPrint}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg shadow-violet-600/20 active:scale-95"
        >
          <Printer size={16} /> Print / Export PDF
        </button>
      </div>
    </div>
  );
};

export default ReportToolbar;
