import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ConfirmSeedModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  busy?: boolean;
}

const ConfirmSeedModal: React.FC<ConfirmSeedModalProps> = ({ open, onClose, onConfirm, busy = false }) => {
  const [typedConfirm, setTypedConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { verifyPassword } = useAuth();

  if (!open) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typedConfirm !== 'SEED') {
      toast.error('Please type "SEED" to confirm.');
      return;
    }
    
    setVerifying(true);
    const toastId = toast.loading('Verifying administrator credentials...');
    try {
      const isCorrect = await verifyPassword(password);
      if (!isCorrect) {
        toast.error('Invalid administrator password.', { id: toastId });
        setVerifying(false);
        return;
      }
      
      toast.success('Credentials verified. Initiating database seed...', { id: toastId });
      await onConfirm();
      // Reset fields
      setPassword('');
      setTypedConfirm('');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Verification failed.', { id: toastId });
    } finally {
      setVerifying(false);
    }
  };

  const isFormValid = typedConfirm === 'SEED' && password.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-rose-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/20">
            <ShieldAlert size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Seed Database Warning</h3>
              <button 
                onClick={onClose} 
                type="button"
                disabled={busy || verifying}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Seeding sample data will <strong className="text-rose-700">WIPE OUT</strong> all existing products, categories, deals, sales transactions, expenses, and system settings!
            </p>
            <p className="text-xs font-semibold text-rose-800 mt-2">
              This action is permanent and completely irreversible.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Confirm Intent
            </label>
            <p className="text-xs text-slate-500 mb-1">
              Type <span className="font-mono font-bold bg-slate-100 px-1 py-0.5 rounded text-rose-700">SEED</span> in the box below:
            </p>
            <input
              type="text"
              autoComplete="off"
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              placeholder="SEED"
              disabled={busy || verifying}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Admin Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password to authorize"
              disabled={busy || verifying}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={busy || verifying}
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || busy || verifying}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-rose-600/10 disabled:shadow-none"
            >
              {busy || verifying ? 'Processing...' : 'Wipe & Seed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmSeedModal;
