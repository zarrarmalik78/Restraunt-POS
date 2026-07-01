import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, Circle } from 'lucide-react';
import { useLiveTable } from '../../db/hooks';
import LoadingSpinner from './LoadingSpinner';

interface SerialPickerModalProps {
  product: any;
  quantityNeeded: number;
  onClose: () => void;
  onConfirm: (selectedSerials: string[]) => void;
}

const SerialPickerModal: React.FC<SerialPickerModalProps> = ({ product, quantityNeeded, onClose, onConfirm }) => {
  const { documents: units, loading } = useLiveTable('serialUnits', (u: any) => u.productId === product.id && u.status === 'in_stock');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (serial: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(serial)) {
      newSelected.delete(serial);
    } else {
      if (newSelected.size < quantityNeeded) {
        newSelected.add(serial);
      }
    }
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Select Serial Numbers</h2>
            <p className="text-sm text-slate-500">{product.name} (Need {quantityNeeded})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 style-scrollbar">
          {loading ? (
            <LoadingSpinner />
          ) : units.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No available serial numbers in stock.</div>
          ) : (
            <div className="space-y-2">
              {units.map((unit: any) => (
                <div 
                  key={unit.id}
                  onClick={() => toggleSelect(unit.serialNumber)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                    selected.has(unit.serialNumber) 
                      ? 'border-violet-500 bg-violet-50' 
                      : 'border-slate-200 hover:border-violet-300 bg-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 font-mono">{unit.serialNumber}</span>
                    {unit.warrantyExpiryDate && (
                      <span className="text-xs text-slate-500">Warranty until: {new Date(unit.warrantyExpiryDate).toLocaleDateString()}</span>
                    )}
                  </div>
                  {selected.has(unit.serialNumber) ? (
                    <CheckCircle2 className="text-violet-600" size={24} />
                  ) : (
                    <Circle className="text-slate-300" size={24} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-600">
            Selected: <span className="text-violet-600">{selected.size}</span> / {quantityNeeded}
          </span>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              disabled={selected.size !== quantityNeeded}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SerialPickerModal;
