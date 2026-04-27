import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Search, Filter, Download, CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, Globe, Shield, CreditCard, Receipt, Calendar, ArrowRightLeft, Square, CheckSquare, Trash2, Eye, ArrowUpDown, X, Copy, Smartphone } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Transactions() {
  const [merchant, setMerchant] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple feedback could be added here
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
                <tr 
                  key={t.id}
                  onClick={() => setSelectedTransaction(t)}
                  className="cursor-pointer transition-all hover:bg-slate-50/50 group"
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
                      <Eye size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTransaction(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    selectedTransaction.status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                    selectedTransaction.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {selectedTransaction.status === 'success' ? <CheckCircle2 size={24} /> :
                     selectedTransaction.status === 'pending' ? <Clock size={24} /> : <AlertCircle size={24} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Transaction Details</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {selectedTransaction.status} • {format(new Date(selectedTransaction.createdAt), 'MMM d, yyyy HH:mm:ss')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Amount</p>
                    <p className="text-2xl font-black text-slate-900">
                      {getCurrencySymbol(selectedTransaction.currency || 'ZAR')}{selectedTransaction.amount?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Settlement</p>
                    <p className="text-2xl font-black text-emerald-600">
                      {getCurrencySymbol(selectedTransaction.currency || 'ZAR')}{(selectedTransaction.amount - (selectedTransaction.fee || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Information Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        <Globe size={12} /> Transaction Identity
                      </label>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold mb-1">Reference ID</p>
                          <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg group">
                            <span className="text-xs font-mono text-slate-600 truncate">{selectedTransaction.id}</span>
                            <button onClick={() => copyToClipboard(selectedTransaction.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all text-slate-400">
                              <Copy size={12} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold mb-1">Payment Link ID</p>
                          <p className="text-xs font-mono text-slate-600">{selectedTransaction.paymentLinkId || 'Direct API'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        <Shield size={12} /> Security & Device
                      </label>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                          <span className="text-xs font-bold text-slate-500">IP Address</span>
                          <span className="text-xs font-mono text-slate-900">{selectedTransaction.customerIp || '197.210.64.12'}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                          <span className="text-xs font-bold text-slate-500">Fraud Protection</span>
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">Verified Secure</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        <CreditCard size={12} /> Payment Source
                      </label>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold mb-1">Customer Email</p>
                          <p className="text-xs font-bold text-slate-800">{selectedTransaction.customerEmail}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold mb-1">Method</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                             {selectedTransaction.provider === 'MoMo' ? <Smartphone size={14} className="text-amber-500" /> : <CreditCard size={14} className="text-emerald-500" />}
                             {selectedTransaction.provider === 'MoMo' ? 'Mobile Money' : 'Card Payment'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        <Receipt size={12} /> Notes & Narrative
                      </label>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-h-[80px]">
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          {selectedTransaction.description || 'No additional notes provided for this transaction. Standard processing application applied.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
                    <Download size={14} /> Download Receipt
                  </button>
                  <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
                    <Trash2 size={14} /> Report Issue
                  </button>
                </div>
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
