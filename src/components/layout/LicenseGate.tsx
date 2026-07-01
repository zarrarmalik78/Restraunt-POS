import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface LicenseGateProps {
  children: React.ReactNode;
}

const LicenseGate: React.FC<LicenseGateProps> = ({ children }) => {
  const [isLicensed, setIsLicensed] = useState<boolean | null>(null);

  // Check if we are running in Electron
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

  useEffect(() => {
    if (!isElectron) {
      // Bypass license check in development web browser
      setIsLicensed(true);
      return;
    }

    const verifyLicense = async () => {
      try {
        const ok = await (window as any).electronAPI.checkLicense();
        setIsLicensed(ok);
      } catch (err) {
        console.error("License check failed:", err);
        setIsLicensed(false);
      }
    };

    verifyLicense();
  }, [isElectron]);

  if (isLicensed === null) {
    // Loading state
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 mt-4 font-medium text-sm">Verifying system authorization...</p>
      </div>
    );
  }

  if (!isLicensed) {
    // License blocked screen
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Modern blur effects */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-3xl"></div>

        <div className="w-full max-w-[500px] bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-8 rounded-[32px] shadow-2xl relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-red-500 w-8 h-8 animate-pulse" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Unauthorized Device</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            This copy of Pizza Hut POS is bound to a single authorized device. Access is denied on this machine. Please contact your vendor if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LicenseGate;
