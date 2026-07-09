import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // ─── Wait for the Express backend to be ready before allowing login ───────
  // Critical in Electron: the backend process starts concurrently with the
  // window, so the window can fully render before the server is listening.
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkBackend = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/settings');
        if (res.ok && !cancelled) {
          setBackendReady(true);
          return;
        }
      } catch {
        // server not ready yet
      }
      if (!cancelled) {
        timeoutId = setTimeout(checkBackend, 400);
      }
    };

    checkBackend();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) { toast.error('Please enter your username'); return; }
    if (!password) { toast.error('Please enter your password'); return; }

    setIsBusy(true);
    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans overflow-hidden">
      {/* Left Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white relative">
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-left duration-700">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-10">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg" />
              <span className="text-2xl font-bold tracking-tighter text-slate-900">Pizza Hut POS</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Welcome Back!</h1>
            <p className="text-slate-500 font-medium">Please enter your details</p>
          </div>

          {!backendReady && (
            <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Loader2 size={18} className="animate-spin text-amber-500 shrink-0" />
              <p className="text-sm font-medium text-amber-700">Starting up, please wait...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-slate-300 disabled:opacity-50"
                placeholder="Enter your username"
                disabled={!backendReady || isBusy}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="••••••••"
                  disabled={!backendReady || isBusy}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!backendReady || isBusy}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-70 group"
            >
              {!backendReady ? (
                <><Loader2 size={20} className="animate-spin" /> Starting up...</>
              ) : isBusy ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Login <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" /></>
              )}
            </button>

            <div className="space-y-4 pt-4">
              <p className="text-xs text-slate-400 leading-relaxed text-center">
                By logging in, you agree to our{' '}
                <a href="#" className="text-blue-600 font-bold hover:underline">Terms of Service</a>{' '}
                and <a href="#" className="text-blue-600 font-bold hover:underline">Privacy Policy</a>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#7065f0] p-12 items-center justify-center relative">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 w-full max-w-[620px] h-[760px] bg-white/10 backdrop-blur-md border border-white/20 rounded-[48px] p-12 flex flex-col shadow-2xl animate-in zoom-in duration-1000">
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="w-[180px] h-[180px] bg-black rounded-full absolute top-[5%] left-[50%] translate-x-[-50%] opacity-20 blur-xl"></div>
            <img
              src="/auth_illustration.png"
              alt="Premium 3D Illustration"
              className="w-full h-auto object-contain drop-shadow-[0_35px_35px_rgba(0,0,0,0.4)] transform hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="mt-12 text-center lg:text-left">
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Seamless work experience</h2>
            <p className="text-violet-100/80 text-xl font-medium leading-relaxed">
              Everything you need in an easily customizable dashboard
            </p>
            <div className="flex gap-2.5 mt-10 justify-center lg:justify-start">
              <div className="w-10 h-2.5 bg-white rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-white/30 rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
