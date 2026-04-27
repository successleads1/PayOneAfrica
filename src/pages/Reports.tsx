import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, differenceInDays, eachDayOfInterval } from 'date-fns';
import { Calendar as CalendarIcon, Download, TrendingUp, TrendingDown, ArrowUpRight, FileText, ChevronDown, X } from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function Reports() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [merchant, setMerchant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const currencySymbols: Record<string, string> = {
    'NGN': '₦',
    'USD': '$',
    'EUR': '€',
    'ZAR': 'R'
  };

  const getCurrencySymbol = (code: string) => currencySymbols[code] || code;

  // Date Range State
  const [range, setRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const unsubMerc = onSnapshot(
      query(collection(db, 'merchants'), where('ownerId', '==', auth.currentUser?.uid)),
      (snap) => {
        if (!snap.empty) {
          const merc = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setMerchant(merc);
          
          const unsubTx = onSnapshot(
            query(
              collection(db, 'transactions'), 
              where('merchantId', '==', snap.docs[0].id),
              orderBy('createdAt', 'desc')
            ),
            (txSnap) => {
              setTransactions(txSnap.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                date: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date()
              })));
              setLoading(false);
            }
          );
          return () => unsubTx();
        }
      }
    );

    return () => unsubMerc();
  }, []);

  const getFilteredData = () => {
    if (!range?.from || !range?.to) return transactions;
    
    const start = startOfDay(range.from);
    const end = endOfDay(range.to);

    return transactions.filter(t => 
      t.date >= start && t.date <= end
    );
  };

  const filteredTransactions = getFilteredData();

  // Metrics
  const totalVolume = filteredTransactions
    .filter(t => t.status === 'success')
    .reduce((acc, t) => acc + (t.amount || 0), 0);
  
  const successCount = filteredTransactions.filter(t => t.status === 'success').length;
  const failureCount = filteredTransactions.filter(t => t.status === 'failed').length;
  const pendingCount = filteredTransactions.filter(t => t.status === 'pending').length;
  const totalCount = filteredTransactions.length;
  const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

  // Chart Data
  const getChartData = () => {
    if (!range?.from || !range?.to) return [];
    
    const interval = { start: range.from, end: range.to };
    const dateRange = eachDayOfInterval(interval);
    const dataMap = new Map();

    dateRange.forEach(date => {
      const d = format(date, 'MMM d');
      dataMap.set(d, { name: d, volume: 0, count: 0 });
    });

    filteredTransactions.forEach(t => {
      const d = format(t.date, 'MMM d');
      if (dataMap.has(d)) {
        const val = dataMap.get(d);
        if (t.status === 'success') {
          val.volume += t.amount || 0;
        }
        val.count += 1;
      }
    });

    return Array.from(dataMap.values());
  };

  const statusData = [
    { name: 'Successful', value: successCount },
    { name: 'Pending', value: pendingCount },
    { name: 'Failed', value: failureCount },
  ].filter(d => d.value > 0);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl" />)}
      </div>
      <div className="h-96 bg-white border border-slate-200 rounded-xl" />
    </div>;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Reports</h2>
          <p className="text-sm text-slate-500 font-medium">Analyze your business performance and growth metrics</p>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 shadow-sm hover:border-emerald-500 transition-all"
          >
            <CalendarIcon size={16} className="text-slate-400" />
            {range?.from ? (
              range.to ? (
                <>
                  {format(range.from, 'LLL dd, y')} - {format(range.to, 'LLL dd, y')}
                </>
              ) : (
                format(range.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
            <ChevronDown size={14} className={`ml-2 text-slate-400 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
          </button>

          {showCalendar && (
            <div className="absolute top-full right-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-slate-100 p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right flex flex-col md:flex-row">
              <div className="bg-slate-50 border-r border-slate-100 p-4 space-y-1 shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
                {[
                  { label: 'Today', days: 0 },
                  { label: 'Last 7 Days', days: 7 },
                  { label: 'Last 30 Days', days: 30 },
                  { label: 'Last 90 Days', days: 90 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setRange({ from: startOfDay(subDays(new Date(), preset.days)), to: endOfDay(new Date()) });
                    }}
                    className="whitespace-nowrap px-3 py-2 text-[11px] font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md text-left transition-colors uppercase tracking-wider"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Custom Range</span>
                  <button onClick={() => setShowCalendar(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>
                <DayPicker
                  mode="range"
                  defaultMonth={range?.from}
                  selected={range}
                  onSelect={setRange}
                  className="border-none m-0"
                />
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                   <button 
                    onClick={() => {
                      setRange({ from: subDays(new Date(), 7), to: new Date() });
                      setShowCalendar(false);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded"
                   >
                     Reset
                   </button>
                   <button 
                    onClick={() => setShowCalendar(false)}
                    className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded shadow-sm hover:bg-slate-800"
                   >
                     Apply Range
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-minimal p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Volume</p>
          <p className="text-2xl font-black text-slate-900">{getCurrencySymbol('ZAR')}{totalVolume.toLocaleString()}</p>
          <div className="mt-2 flex items-center text-[10px] text-emerald-600 font-black">
            <TrendingUp size={12} className="mr-1" />
            Activity Period
          </div>
        </div>

        <div className="card-minimal p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
          <p className="text-2xl font-black text-slate-900">{successRate.toFixed(1)}%</p>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            Based on {totalCount} transactions
          </div>
        </div>

        <div className="card-minimal p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ave. Trans. Value</p>
          <p className="text-2xl font-black text-slate-900">
            {getCurrencySymbol('ZAR')}{totalCount > 0 ? (totalVolume / totalCount).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
          </p>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            Per successful payment
          </div>
        </div>

        <div className="card-minimal p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attempts</p>
          <p className="text-2xl font-black text-slate-900">{totalCount}</p>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            Total transactions in range
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-minimal p-6 flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" />
              Volume Over Time
            </h3>
            <button className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-colors uppercase tracking-widest">
              <Download size={14} />
              Export CSV
            </button>
          </div>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => `${getCurrencySymbol('ZAR')}${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [`${getCurrencySymbol('ZAR')}${val.toLocaleString()}`, 'Volume']}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVolume)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-minimal p-6 flex flex-col h-[450px]">
          <h3 className="font-bold text-slate-800 mb-8">Status Distribution</h3>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-2xl font-black text-slate-900 leading-none">{totalCount}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Tx</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-minimal p-6">
        <div className="flex items-center justify-between mb-6">
           <h3 className="font-bold text-slate-800">Transaction Pulse</h3>
           <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               Successful
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-slate-200"></div>
               Total Attempts
             </div>
           </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getChartData()}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none' }}
              />
              <Bar dataKey="count" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-emerald-600 rounded-xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-lg gap-6">
        <div>
          <h3 className="text-lg font-bold mb-1">Need detailed reports?</h3>
          <p className="text-emerald-100 text-sm font-medium opacity-90">Schedule weekly automated reports to your email or export your entire history in Excel/PDF format.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button className="px-5 py-2.5 bg-white text-emerald-600 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 hover:bg-emerald-50 transition-colors">
            <Download size={18} />
            Download Excel
          </button>
          <button className="px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-800 transition-colors">
            <FileText size={18} />
            View Tax Audit
          </button>
        </div>
      </div>
    </div>
  );
}
