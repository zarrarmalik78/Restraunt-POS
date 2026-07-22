import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Activity, Database, RefreshCw, Banknote, TrendingDown, Calendar, Eye, EyeOff, CreditCard, Globe, Utensils, ShoppingBag, ShoppingCart, Truck, Sparkles } from 'lucide-react';
import { useLiveTable } from '../db/hooks';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { documents: sales, loading: salesLoading } = useLiveTable('sales');
  const { documents: expenses, loading: expensesLoading } = useLiveTable('expenses');
  const { documents: categories } = useLiveTable('categories');
  const { documents: products } = useLiveTable('products');

  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [isPrivate, setIsPrivate] = useState(() => localStorage.getItem('dashboard_privacy') === 'true');

  const togglePrivacy = () => {
    setIsPrivate(prev => {
      const next = !prev;
      localStorage.setItem('dashboard_privacy', String(next));
      return next;
    });
  };

  if (salesLoading || expensesLoading) return <LoadingSpinner />;

  return (
    <>
      <DashboardContent 
        sales={sales} expenses={expenses} categories={categories} products={products}
        startDateStr={startDateStr} endDateStr={endDateStr}
        setStartDateStr={setStartDateStr} setEndDateStr={setEndDateStr}
        isPrivate={isPrivate} togglePrivacy={togglePrivacy}
      />
    </>
  );
};

const DashboardContent: React.FC<any> = ({
  sales, expenses, categories, products,
  startDateStr, endDateStr, setStartDateStr, setEndDateStr,
  isPrivate, togglePrivacy
}) => {
  const { 
    periodRevenue, periodExpense, periodCash, periodOnline, periodCredit, 
    periodSales, dineInOrders, takeAwayOrders, deliveryOrders, dineInRevenue, takeAwayRevenue, deliveryRevenue 
  } = useMemo(() => {
    const currentBusinessDay = new Date();
    currentBusinessDay.setHours(0, 0, 0, 0);
    const targetStartDate = startDateStr ? new Date(startDateStr) : new Date(currentBusinessDay);
    const targetEndDate = endDateStr ? new Date(endDateStr) : new Date();
    targetStartDate.setHours(0, 0, 0, 0);
    targetEndDate.setHours(23, 59, 59, 999);
    const start = targetStartDate.getTime();
    const end = targetEndDate.getTime();
 
    const filteredSales = (sales as any[]).filter((s) => {
      const d = s.saleDate instanceof Date ? s.saleDate.getTime() : new Date(s.saleDate).getTime();
      return d >= start && d <= end && s.status !== 'returned';
    });

    let periodRevenue = 0, periodCash = 0, periodOnline = 0, periodCredit = 0;
    let dineInOrders = 0, takeAwayOrders = 0, deliveryOrders = 0;
    let dineInRevenue = 0, takeAwayRevenue = 0, deliveryRevenue = 0;

    for (const s of filteredSales) {
      periodRevenue += s.totalAmount || 0;
      
      if (s.orderType === 'dine_in') {
        dineInOrders++;
        dineInRevenue += s.totalAmount || 0;
      } else if (s.orderType === 'delivery') {
        deliveryOrders++;
        deliveryRevenue += s.totalAmount || 0;
      } else {
        takeAwayOrders++;
        takeAwayRevenue += s.totalAmount || 0;
      }

      if (s.paymentMethod === 'cash') periodCash += s.totalAmount || 0;
      else if (s.paymentMethod === 'card') periodOnline += s.totalAmount || 0;
      else if (s.paymentMethod === 'credit') periodCredit += s.totalAmount || 0;
    }

    const periodExpense = (expenses as any[])
      .filter((e) => {
        const d = e.expenseDate instanceof Date ? e.expenseDate.getTime() : new Date(e.expenseDate).getTime();
        return d >= start && d <= end;
      })
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    return { 
      periodRevenue, periodExpense, periodCash, periodOnline, periodCredit, 
      periodSales: filteredSales, dineInOrders, takeAwayOrders, deliveryOrders, dineInRevenue, takeAwayRevenue, deliveryRevenue 
    };
  }, [sales, expenses, startDateStr, endDateStr]);

  const { todayRevenue, todaySalesCount } = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const start = todayStart.getTime();

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const end = todayEnd.getTime();

    let revenue = 0;
    let count = 0;

    for (const s of (sales as any[] || [])) {
      const d = s.saleDate instanceof Date ? s.saleDate.getTime() : new Date(s.saleDate).getTime();
      if (d >= start && d <= end && s.status !== 'returned') {
        count++;
        revenue += s.totalAmount || 0;
      }
    }

    return { todayRevenue: revenue, todaySalesCount: count };
  }, [sales]);

  // Average Order Value (AOV)
  const aov = useMemo(() => {
    return periodSales.length > 0 ? periodRevenue / periodSales.length : 0;
  }, [periodRevenue, periodSales]);

  // 1. Sales Trend over Time (Daily)
  const salesTrendData = useMemo(() => {
    const trendMap: Record<string, number> = {};
    periodSales.forEach((s: any) => {
      const dateStr = new Date(s.saleDate).toLocaleDateString([], { month: 'short', day: 'numeric' });
      trendMap[dateStr] = (trendMap[dateStr] || 0) + (s.totalAmount || 0);
    });
    return Object.entries(trendMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [periodSales]);

  // 2. Top Selling Products / Deals
  const topSellingData = useMemo(() => {
    const itemMap: Record<string, { name: string, quantity: number, revenue: number }> = {};
    periodSales.forEach((sale: any) => {
      (sale.items || []).forEach((item: any) => {
        const key = item.productId || item.productName;
        if (!itemMap[key]) {
          itemMap[key] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        itemMap[key].quantity += item.quantity || 0;
        itemMap[key].revenue += item.totalPrice || 0;
      });
    });
    return Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [periodSales]);

  // 3. Hourly Peaks Sales (Lunch and Dinner Peaks)
  const hourlySalesData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i;
      const ampm = i >= 12 ? 'PM' : 'AM';
      return {
        hour: `${displayHour} ${ampm}`,
        rawHour: i,
        orders: 0,
        revenue: 0
      };
    });

    periodSales.forEach((s: any) => {
      const date = new Date(s.saleDate);
      const h = date.getHours();
      hours[h].orders++;
      hours[h].revenue += s.totalAmount || 0;
    });

    // Filter standard restaurant operating hours (11 AM to 11 PM) for peak presentation
    return hours.filter(h => h.rawHour >= 11 && h.rawHour <= 23);
  }, [periodSales]);

  const categoryData = useMemo(() => {
    const categoryColors = ['#6366f1', '#f472b6', '#38bdf8', '#22c55e', '#f97316', '#a855f7'];
    const categoryMap: Record<string, number> = {};
    
    for (const sale of periodSales) {
      for (const item of sale.items || []) {
        let catName = 'Other';
        if (item.categoryId) {
          const cat = categories.find((c: any) => c.id === item.categoryId);
          if (cat) catName = cat.name;
        } else {
          const prod = products.find((p: any) => p.id === item.productId);
          if (prod) {
            const cat = categories.find((c: any) => c.id === prod.categoryId);
            if (cat) catName = cat.name;
          }
        }
        categoryMap[catName] = (categoryMap[catName] || 0) + item.totalPrice;
      }
    }

    return Object.entries(categoryMap)
      .map(([name, value], idx) => ({ name, value, color: categoryColors[idx % categoryColors.length] }))
      .sort((a, b) => b.value - a.value);
  }, [periodSales, categories, products]);

  const orderTypeData = [
    { name: 'Dine In', value: dineInOrders, color: '#8b5cf6' },
    { name: 'Take Away', value: takeAwayOrders, color: '#f43f5e' },
    { name: 'Delivery', value: deliveryOrders, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-slate-900">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/20">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Restaurant Analytics Hub <Sparkles className="text-amber-500 fill-amber-500" size={18} />
            </h1>
            <p className="text-slate-500 text-sm">Real-time restaurant sales performance and customer insights</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1 shadow-sm">
            <Calendar size={14} className="text-slate-400" />
            <input type="date" value={startDateStr} onChange={(e) => setStartDateStr(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none" />
            <span className="text-slate-300">-</span>
            <input type="date" value={endDateStr} onChange={(e) => setEndDateStr(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none" />
          </div>
        </div>
      </header>

      {/* KPI METRICS CARD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard title="PERIOD REVENUE" value={periodRevenue} icon={<DollarSign size={22} className="text-white" />} colorClass="bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/20" isPrivate={isPrivate} />
        <MetricCard title="PERIOD EXPENSES" value={periodExpense} icon={<TrendingDown size={22} className="text-white" />} colorClass="bg-gradient-to-br from-rose-500 to-pink-500 shadow-rose-500/20" isPrivate={isPrivate} />
        <MetricCard title="AVG ORDER VALUE" value={aov} icon={<TrendingUp size={22} className="text-white" />} colorClass="bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20" isPrivate={isPrivate} />
        <MetricCard title="PERIOD ORDERS" value={periodSales.length} icon={<ShoppingCart size={22} className="text-white" />} colorClass="bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-500/20" isPrivate={false} />
        <MetricCard title="TODAY'S REVENUE" value={todayRevenue} icon={<Banknote size={22} className="text-white" />} colorClass="bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/20" isPrivate={isPrivate} />
        <MetricCard title="TODAY'S ORDERS" value={todaySalesCount} icon={<Activity size={22} className="text-white" />} colorClass="bg-gradient-to-br from-indigo-500 to-violet-500 shadow-indigo-500/20" isPrivate={false} />
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Banknote size={20} className="text-violet-600" /> Payment & Source Breakdown
          </h2>
          <button 
            onClick={togglePrivacy}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all"
          >
            {isPrivate ? <><Eye size={14} /> Show Data</> : <><EyeOff size={14} /> Hide Data</>}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Cash Revenue</p>
              <p className="text-xl font-black text-slate-900">{isPrivate ? '••••••' : formatCurrency(periodCash)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Banknote size={20} />
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Card / Online Payments</p>
              <p className="text-xl font-black text-slate-900">{isPrivate ? '••••••' : formatCurrency(periodOnline)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Globe size={20} />
            </div>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Membership Card Discounts</p>
              <p className="text-xl font-black text-slate-900">
                {isPrivate ? '••••••' : formatCurrency(periodSales.reduce((acc: number, s: any) => {
                  const sub = (s.items || []).reduce((sum: number, i: any) => sum + (i.totalPrice || 0), 0);
                  return acc + Math.max(0, sub - (s.totalAmount || 0));
                }, 0))}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <CreditCard size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED GRAPHS SECTION 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Graph 1: Revenue Trend Over Time */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-violet-600" /> Revenue Trend
          </h3>
          <div className="h-[320px] w-full">
            {salesTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData} margin={{ right: 20 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs.${v}`} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-bold text-sm">No sales data in this period</div>
            )}
          </div>
        </div>

        {/* Graph 2: Top Selling Products/Deals */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Utensils size={20} className="text-rose-500" /> Top Selling Items
          </h3>
          <div className="h-[320px] w-full">
            {topSellingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSellingData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} width={100} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="quantity" fill="#f43f5e" radius={[0, 8, 8, 0]} barSize={16} name="Qty Sold" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-bold text-sm">No items sold in this period</div>
            )}
          </div>
        </div>
      </div>

      {/* DETAILED GRAPHS SECTION 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Graph 3: Hourly Sales Peaks (Lunch & Dinner Heatmap) */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity size={20} className="text-amber-500" /> Peak Hour Order Volumes
          </h3>
          <div className="h-[300px] w-full">
            {hourlySalesData.some(h => h.orders > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="orders" fill="#eab308" radius={[8, 8, 0, 0]} barSize={24} name="Order Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-bold text-sm">No hourly order data available</div>
            )}
          </div>
        </div>

        {/* Donut Chart: Order Type Distribution */}
        <div className="glass-card p-6 flex flex-col justify-between">
           <div>
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><ShoppingBag size={20} className="text-blue-500" /> Order Channels</h3>
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-3.5 bg-violet-50 rounded-2xl border border-violet-100">
                    <div className="flex items-center gap-3">
                       <Utensils className="text-violet-600" size={20} />
                       <span className="text-sm font-bold text-slate-700">Dine In</span>
                    </div>
                    <span className="text-xl font-black text-violet-600">{dineInOrders}</span>
                 </div>
                 <div className="flex items-center justify-between p-3.5 bg-rose-50 rounded-2xl border border-rose-100">
                    <div className="flex items-center gap-3">
                       <ShoppingBag className="text-rose-600" size={20} />
                       <span className="text-sm font-bold text-slate-700">Take Away</span>
                    </div>
                    <span className="text-xl font-black text-rose-600">{takeAwayOrders}</span>
                 </div>
                 <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-3">
                       <Truck className="text-amber-600" size={20} />
                       <span className="text-sm font-bold text-slate-700">Delivery</span>
                    </div>
                    <span className="text-xl font-black text-amber-600">{deliveryOrders}</span>
                 </div>
              </div>
           </div>
           
           {orderTypeData.length > 0 && (
             <div className="mt-8">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Order Distribution</p>
               <div className="h-[120px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={orderTypeData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                       {orderTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                     </Pie>
                     <Tooltip contentStyle={{borderRadius: '12px', border: 'none'}} />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders log */}
          <div className="glass-card p-6">
             <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><RefreshCw size={20} className="text-emerald-500" /> Recent Sales Activity</h3>
             <div className="space-y-3">
                {periodSales.sort((a: any, b: any) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()).slice(0, 5).map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white border border-white/10", 
                           sale.orderType === 'dine_in' ? 'bg-violet-500' : sale.orderType === 'delivery' ? 'bg-amber-500' : 'bg-rose-500'
                        )}>
                           {sale.orderType === 'dine_in' ? <Utensils size={14} /> : sale.orderType === 'delivery' ? <Truck size={14} /> : <ShoppingBag size={14} />}
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-900">Order #{sale.id?.toString().substring(0, 8).toUpperCase()}</p>
                           <p className="text-[10px] text-slate-500 font-medium">
                             {new Date(sale.saleDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {sale.items?.length || 0} items
                           </p>
                        </div>
                     </div>
                     <span className="text-sm font-bold text-slate-900">{formatCurrency(sale.totalAmount)}</span>
                  </div>
                ))}
                {periodSales.length === 0 && <p className="text-xs text-slate-400 font-bold text-center py-4">No recent orders</p>}
             </div>
          </div>

          {/* Revenue Breakdown Overview */}
          <div className="glass-card p-6 bg-slate-900 text-white relative overflow-hidden flex flex-col justify-center">
             <div className="relative z-10">
                <h3 className="text-lg font-bold mb-6">Revenue Channels</h3>
                <div className="grid grid-cols-3 gap-3">
                   <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-bold text-violet-300 uppercase tracking-widest mb-1">Dine In</p>
                      <p className="text-base font-bold text-white">{isPrivate ? '••••••' : formatCurrency(dineInRevenue)}</p>
                   </div>
                   <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-bold text-rose-300 uppercase tracking-widest mb-1">Take Away</p>
                      <p className="text-base font-bold text-white">{isPrivate ? '••••••' : formatCurrency(takeAwayRevenue)}</p>
                   </div>
                   <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-1">Delivery</p>
                      <p className="text-base font-bold text-white">{isPrivate ? '••••••' : formatCurrency(deliveryRevenue)}</p>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl"></div>
             <div className="absolute -top-12 -left-12 w-32 h-32 bg-rose-600/20 rounded-full blur-3xl"></div>
          </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, colorClass: string, isPrivate?: boolean }> = ({ title, value, icon, colorClass, isPrivate }) => (
  <div className={cn(colorClass, "rounded-[24px] p-6 shadow-lg relative overflow-hidden group border border-white/10")}>
    <div className="absolute top-4 right-4 p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <div className="relative z-10">
      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-white tracking-tight">
        {isPrivate && typeof value === 'number' ? '••••••' : (typeof value === 'number' ? formatCurrency(value) : value)}
      </p>
    </div>
  </div>
);

export default Dashboard;
