import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Search, Filter, Download, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, Globe, Shield, CreditCard, Receipt, Calendar, ArrowRightLeft, Square, CheckSquare, Trash2, Eye, ArrowUpDown } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Transactions() {
  const [merchant, setMerchant] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'merchants'), where('ownerId', '==', auth.currentUser.uid));
    return onSnapshot(q, (snap) => {
      if (!snap.empty) setMerchant({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });
  }, []);

  useEffect(() => {
    if (!merchant) return;
    const q = query(
      collection(db, 'transactions'),
      where('merchantId', '==', merchant.id),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [merchant]);

  const currencySymbols: Record<string, string> = {
    'NGN': '₦',
    'USD': '$',
    'EUR': '€',
    'ZAR': 'R'
  };

  const getCurrencySymbol = (code: string) => currencySymbols[code] || code;

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    // Date filter
    let matchesDate = true;
    if (dateStart || dateEnd) {
      const transDate = new Date(t.createdAt);
      const start = dateStart ? startOfDay(new Date(dateStart)) : new Date(0);
      const end = dateEnd ? endOfDay(new Date(dateEnd)) : new Date(8640000000000000);
      matchesDate = isWithinInterval(transDate, { start, end });
    }

    // Amount filter
    const matchesMinAmount = minAmount === '' || t.amount >= parseFloat(minAmount);
    const matchesMaxAmount = maxAmount === '' || t.amount <= parseFloat(maxAmount);

    return matchesSearch && matchesStatus && matchesDate && matchesMinAmount && matchesMaxAmount;
  }).sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateStart('');
    setDateEnd('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedIds([]);
    setSortField('createdAt');
    setSortOrder('desc');
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="ml-1 opacity-20" />;
    return sortOrder === 'asc' ? <ChevronUp size={12} className="ml-1 text-emerald-500" /> : <ChevronDown size={12} className="ml-1 text-emerald-500" />;
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map(t => t.id));
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkReview = () => {
    alert(`Marked ${selectedIds.length} transactions as reviewed.`);
    setSelectedIds([]);
  };

  const handleBulkExport = () => {
    alert(`Exporting ${selectedIds.length} transactions to CSV.`);
  };

  return (
    <div className="space-y-8 relative">
      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-4 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-8 min-w-[500px]"
          >
            <div className="flex items-center gap-3 pr-8 border-r border-slate-700">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-sm">
                {selectedIds.length}
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Selected</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBulkReview}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <CheckCircle2 size={14} /> Mark as Reviewed
              </button>
              <button 
                onClick={handleBulkExport}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <Download size={14} /> Export Selected
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-slate-500 font-medium">History of all payments processed through your account</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm">
          <Download size={18} /> Export CSV
        </button>
      </header>

      <div className="card-minimal flex flex-col p-2">
        <div className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by email, reference, or description..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                className="appearance-none pl-12 pr-10 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-sm cursor-pointer min-w-[140px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                showFilters ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Filter size={16} /> Advanced
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-50 bg-slate-50/20"
            >
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Date Range */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Calendar size={12} /> Date Range
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-slate-300 font-black">/</span>
                    <input 
                      type="date" 
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Amount Range */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <ArrowRightLeft size={12} /> Amount Range (R)
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-slate-300 font-black">-</span>
                    <input 
                      type="number" 
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-end gap-3">
                  <button 
                    onClick={resetFilters}
                    className="flex-1 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 hover:bg-white transition-all"
                  >
                    Reset Filters
                  </button>
                  <div className="flex-1 py-1 text-center">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                      {filteredTransactions.length} results
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-4 w-12">
                  <button 
                    onClick={toggleSelectAll}
                    className="flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    {selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0 
                      ? <CheckSquare size={20} className="text-emerald-500" /> 
                      : <Square size={20} />
                    }
                  </button>
                </th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Transaction ID</th>
                <th 
                  className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Amount <SortIndicator field="amount" />
                  </div>
                </th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th 
                  className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center justify-end">
                    Date <SortIndicator field="createdAt" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium">
                    {transactions.length === 0 ? 'No transactions found' : 'No matches for your filters'}
                  </td>
                </tr>
              ) : filteredTransactions.map((t) => (
                <React.Fragment key={t.id}>
                  <tr 
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    className={`cursor-pointer transition-all ${expandedId === t.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="px-8 py-5">
                       <button 
                        onClick={(e) => toggleSelect(e, t.id)}
                        className={`flex items-center justify-center transition-colors ${
                          selectedIds.includes(t.id) ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-400'
                        }`}
                       >
                         {selectedIds.includes(t.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                       </button>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        {expandedId === t.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        <div>
                          <div className="font-mono text-xs text-slate-500 truncate w-32 uppercase tracking-tighter">#{t.id}</div>
                          <div className="text-xs font-bold text-slate-400 mt-1 uppercase">{t.provider}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-black text-slate-900">{getCurrencySymbol(t.currency || 'ZAR')}{t.amount?.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 font-bold">Fee: {getCurrencySymbol(t.currency || 'ZAR')}{t.fee?.toLocaleString()}</div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-700">{t.customerEmail}</td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                          {t.status === 'success' ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                              <CheckCircle2 size={12} /> Success
                            </div>
                          ) : t.status === 'pending' ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider">
                              <Clock size={12} /> Pending
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                              <AlertCircle size={12} /> Failed
                            </div>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right text-sm font-bold text-slate-500">
                      {format(new Date(t.createdAt), 'MMM d, p')}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="p-0">
                      <AnimatePresence initial={false}>
                        {expandedId === t.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden bg-slate-50/80"
                          >
                            <div className="px-8 py-8 border-t border-slate-100">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <Globe size={12} /> Network & Security
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-[10px] text-slate-400 font-bold">IP Address</p>
                                      <p className="text-xs font-mono text-slate-600">{t.customerIp || '192.168.1.1'}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-slate-400 font-bold">Risk Level</p>
                                      <p className="text-xs font-bold text-emerald-600 uppercase">Low Risk</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest" >
                                    <CreditCard size={12} /> Payment Info
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-[10px] text-slate-400 font-bold" >Provider</p>
                                      <p className="text-xs font-bold text-slate-600 uppercase" >{t.provider || 'Flutterwave'}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-slate-400 font-bold" >Method</p>
                                      <p className="text-xs font-bold text-slate-600" >{t.provider === 'MoMo' ? 'Mobile Money' : 'Card (Mastercard •••• 4242)'}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest" >
                                    <Receipt size={12} /> Financial Details
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-slate-400 font-medium" >Gross Amount</span>
                                      <span className="font-bold text-slate-700" >{getCurrencySymbol(t.currency || 'ZAR')}{t.amount?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-slate-400 font-medium" >Processing Fee</span>
                                      <span className="font-bold text-rose-500" >-{getCurrencySymbol(t.currency || 'ZAR')}{t.fee?.toLocaleString() || '0'}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-black">
                                      <span className="text-slate-900" >Net Settlement</span>
                                      <span className="text-emerald-600" >{getCurrencySymbol(t.currency || 'ZAR')}{(t.amount - (t.fee || 0)).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest" >
                                    <Shield size={12} /> Reference Data
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400 font-bold" >Description</p>
                                    <p className="text-xs font-medium text-slate-600 leading-relaxed" >{t.description || 'Standard transaction processing via PayOneAfrica Checkout API.'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
