import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import { cn } from './lib/utils';
// Pages
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import NewSale from './pages/NewSale';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import Credits from './pages/Credits';
import Warranty from './pages/Warranty';
import RMA from './pages/RMA';
import InventoryLog from './pages/InventoryLog';
import Purchases from './pages/Purchases';
import LicenseGate from './components/layout/LicenseGate';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = React.useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  return (
    <div className="flex min-h-screen bg-content-bg">
      <Sidebar collapsed={collapsed} onToggleCollapsed={(val) => {
        setCollapsed(val);
        localStorage.setItem('sidebar_collapsed', String(val));
      }} />
      <main className={cn(
        "flex-1 p-4 lg:p-8 overflow-x-hidden transition-all duration-300 relative",
        collapsed ? "lg:ml-20" : "lg:ml-64",
        (window as any).electronAPI ? "pt-16 lg:pt-16" : ""
      )}>
        {/* Electron Zoom Controls (Topbar Widget) */}
        {(window as any).electronAPI && (
          <div className="absolute top-4 right-8 z-50 flex items-center bg-white border border-slate-200 rounded-xl shadow-lg p-1 gap-1">
            <button onClick={() => (window as any).electronAPI.zoomOut()} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition" title="Zoom Out"><ZoomOut size={16} /></button>
            <button onClick={() => (window as any).electronAPI.resetZoom()} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition" title="Reset Zoom"><Maximize size={16} /></button>
            <button onClick={() => (window as any).electronAPI.zoomIn()} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition" title="Zoom In"><ZoomIn size={16} /></button>
          </div>
        )}
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <LicenseGate>
      <AuthProvider>
        <NotificationProvider>
        <Router>
          <Toaster position="top-right" containerClassName="print:hidden" toastOptions={{
            style: {
              background: '#fff',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
            },
          }} />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* POS (New Sale) is the homepage */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><NewSale /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/stock" element={
              <ProtectedRoute>
                <Layout><Stock /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/sales/new" element={
              <ProtectedRoute>
                <Layout><NewSale /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/sales" element={
              <ProtectedRoute>
                <Layout><Sales /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/customers" element={
              <ProtectedRoute>
                <Layout><Customers /></Layout>
              </ProtectedRoute>
            } />
            

            
            <Route path="/expenses" element={
              <ProtectedRoute>
                <Layout><Expenses /></Layout>
              </ProtectedRoute>
            } />
            

            <Route path="/categories" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Categories /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Settings /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/credits" element={
              <ProtectedRoute>
                <Layout><Credits /></Layout>
              </ProtectedRoute>
            } />
            {/* 
            <Route path="/warranty" element={
              <ProtectedRoute>
                <Layout><Warranty /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/rma" element={
              <ProtectedRoute>
                <Layout><RMA /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/logs" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><InventoryLog /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/purchases" element={
              <ProtectedRoute>
                <Layout><Purchases /></Layout>
              </ProtectedRoute>
            } />
            */}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
    </LicenseGate>
  );
}

export default App;
