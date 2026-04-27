import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ShieldCheck, Users, Activity, CheckCircle2, XCircle, Clock, ExternalLink, MessageCircle, Send, User, Eye, Info, FileText, ArrowUpDown, ChevronUp, ChevronDown, Search, LogOut, Home } from 'lucide-react';
import { format } from 'date-fns';
import { signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalVolume: 0, pendingApprovals: 0, openTickets: 0, queuedSettlements: 0 });
  const [view, setView] = useState<'overview' | 'support' | 'settlements'>('overview');
  const [supportThreads, setSupportThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [settlements, setSettlements] = useState<any[]>([]);
  const [supportSearch, setSupportSearch] = useState('');

  // Sorting state
  const [mSort, setMSort] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'businessName', order: 'asc' });
  const [tSort, setTSort] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'createdAt', order: 'desc' });
  const [sSort, setSSort] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'scheduledDate', order: 'desc' });

  useEffect(() => {
    if (!selectedMerchant) {
      setStatusHistory([]);
      return;
    }

    const unsubHistory = onSnapshot(
      query(collection(db, 'merchants', selectedMerchant.id, 'statusHistory'), orderBy('createdAt', 'desc')),
      (snap) => {
        setStatusHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    return () => unsubHistory();
  }, [selectedMerchant]);

  useEffect(() => {
    const unsubMerchants = onSnapshot(collection(db, 'merchants'), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setMerchants(docs);
      setStats(prev => ({
        ...prev,
        totalUsers: docs.length,
        pendingApprovals: docs.filter(m => m.status === 'pending').length
      }));
    });

    const unsubTrans = onSnapshot(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setTransactions(docs);
      setStats(prev => ({
        ...prev,
        totalVolume: docs.reduce((acc, t) => acc + (t.status === 'success' ? t.amount : 0), 0)
      }));
    });

    const unsubThreads = onSnapshot(query(collection(db, 'supportThreads'), orderBy('lastMessageAt', 'desc')), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setSupportThreads(docs);
      setStats(prev => ({
        ...prev,
        openTickets: docs.filter(t => t.status === 'open').length
      }));
    });

    const unsubSettlements = onSnapshot(query(collection(db, 'settlements'), orderBy('scheduledDate', 'desc')), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setSettlements(docs);
      setStats(prev => ({
        ...prev,
        queuedSettlements: docs.filter(s => s.status === 'queued').length
      }));
    });

    return () => {
      unsubMerchants();
      unsubTrans();
      unsubThreads();
      unsubSettlements();
    };
  }, []);

  useEffect(() => {
    if (!selectedThread) {
      setMessages([]);
      return;
    }

    const unsubMessages = onSnapshot(
      query(collection(db, 'supportMessages'), where('threadId', '==', selectedThread.id), orderBy('createdAt', 'asc')),
      (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Mark as read
        if (selectedThread.unreadCountByAdmin > 0) {
          updateDoc(doc(db, 'supportThreads', selectedThread.id), { unreadCountByAdmin: 0 });
        }
      }
    );

    return () => unsubMessages();
  }, [selectedThread]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedThread) return;

    const content = reply;
    setReply('');

    try {
      await fetch('/api/admin/support/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          threadId: selectedThread.id,
          content,
          adminId: auth.currentUser?.uid
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const cancelSettlement = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this queued settlement? The amount will remain in the merchant\'s balance.')) return;
    try {
      await updateDoc(doc(db, 'settlements', id), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
      alert('Settlement cancelled successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to cancel settlement');
    }
  };

  const approveMerchant = async (id: string) => {
    try {
      await fetch(`/api/admin/merchants/${id}/approve`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: auth.currentUser?.uid,
          adminEmail: auth.currentUser?.email
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const rejectMerchant = async (id: string) => {
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    
    try {
      await fetch(`/api/admin/merchants/${id}/reject`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason,
          adminId: auth.currentUser?.uid,
          adminEmail: auth.currentUser?.email
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const suspendMerchant = async (id: string) => {
    const reason = window.prompt('Reason for suspension:');
    if (reason === null) return;
    
    try {
      await fetch(`/api/admin/merchants/${id}/suspend`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason,
          adminId: auth.currentUser?.uid,
          adminEmail: auth.currentUser?.email
        })
      });
      alert('Merchant suspended');
    } catch (err) {
      console.error(err);
      alert('Failed to suspend merchant');
    }
  };

  const reactivateMerchant = async (id: string) => {
    if (!window.confirm('Are you sure you want to reactivate this merchant?')) return;
    
    try {
      await fetch(`/api/admin/merchants/${id}/approve`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminId: auth.currentUser?.uid,
          adminEmail: auth.currentUser?.email
        })
      });
      alert('Merchant reactivated');
    } catch (err) {
      console.error(err);
      alert('Failed to reactivate merchant');
    }
  };

  const processSettlements = async () => {
    try {
      await fetch('/api/admin/process-settlements', { method: 'POST' });
      alert('Settlement engine triggered successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (viewName: string) => view === viewName ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300';

  const sortData = (data: any[], field: string, order: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];

      // Handle nested or date objects if necessary
      if (field.includes('.')) {
        const parts = field.split('.');
        valA = parts.reduce((obj, key) => obj?.[key], a);
        valB = parts.reduce((obj, key) => obj?.[key], b);
      }

      // Handle Timestamp or ISO string dates
      if (valA?.toDate) valA = valA.toDate().getTime();
      if (valB?.toDate) valB = valB.toDate().getTime();
      if (typeof valA === 'string' && !isNaN(Date.parse(valA))) valA = new Date(valA).getTime();
      if (typeof valB === 'string' && !isNaN(Date.parse(valB))) valB = new Date(valB).getTime();

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (type: 'm' | 't' | 's', field: string) => {
    if (type === 'm') {
      setMSort(prev => ({ field, order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc' }));
    } else if (type === 't') {
      setTSort(prev => ({ field, order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc' }));
    } else {
      setSSort(prev => ({ field, order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc' }));
    }
  };

  const SortIndicator = ({ activeField, field, order }: { activeField: string; field: string; order: 'asc' | 'desc' }) => {
    if (activeField !== field) return <ArrowUpDown size={12} className="ml-1 opacity-20" />;
    return order === 'asc' ? <ChevronUp size={12} className="ml-1 text-emerald-500" /> : <ChevronDown size={12} className="ml-1 text-emerald-500" />;
  };

  const sortedMerchants = sortData(merchants, mSort.field, mSort.order);
  const sortedTransactions = sortData(transactions, tSort.field, tSort.order);
  const sortedSettlements = sortData(settlements, sSort.field, sSort.order);

  const filteredSupportThreads = supportThreads.filter(t => 
    t.merchantName?.toLowerCase().includes(supportSearch.toLowerCase()) || 
    t.merchantId?.toLowerCase().includes(supportSearch.toLowerCase()) ||
    t.merchantEmail?.toLowerCase().includes(supportSearch.toLowerCase()) ||
    t.id?.toLowerCase().includes(supportSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      {/* Merchant Details Modal */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl shadow-emerald-950/10">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">{selectedMerchant.businessName}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Merchant KYC & Bank Profile</p>
              </div>
              <button 
                onClick={() => setSelectedMerchant(null)}
                className="p-2 hover:bg-slate-800 rounded-full transition-all"
              >
                <XCircle size={24} className="text-slate-500" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Reg. Number</label>
                  <div className="text-sm font-bold bg-slate-800/50 p-3 rounded-xl border border-slate-800">{selectedMerchant.registrationNumber || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tax Number</label>
                  <div className="text-sm font-bold bg-slate-800/50 p-3 rounded-xl border border-slate-800">{selectedMerchant.taxNumber || 'N/A'}</div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Bank Information</label>
                <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-emerald-500/60 font-black uppercase">Bank Name</span>
                    <span className="font-bold">{selectedMerchant.bankName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-emerald-500/60 font-black uppercase">Account Number</span>
                    <span className="font-mono text-emerald-400 font-bold">{selectedMerchant.accountNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-emerald-500/10 pt-3">
                    <span className="text-[10px] text-emerald-500/60 font-black uppercase">Branch Code</span>
                    <span className="font-bold">{selectedMerchant.branchCode || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Verification Document</label>
                {selectedMerchant.idDocumentUrl ? (
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-slate-300">
                        <FileText size={20} />
                      </div>
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">KYC Document</div>
                    </div>
                    <a 
                      href={selectedMerchant.idDocumentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Eye size={14} /> View Document
                    </a>
                  </div>
                ) : (
                  <div className="text-sm font-bold bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-slate-500 italic">No document uploaded</div>
                )}
              </div>

              {/* Status History Section */}
              {selectedMerchant.status === 'suspended' && selectedMerchant.suspensionReason && (
                <div className="bg-rose-950/20 border border-rose-500/20 p-4 rounded-2xl mb-4">
                  <div className="text-[10px] text-rose-500/60 font-black uppercase mb-1">Current Suspension Reason</div>
                  <div className="text-sm font-bold text-rose-400">{selectedMerchant.suspensionReason}</div>
                </div>
              )}
              <div className="pt-4 border-t border-slate-800">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Status Change History</label>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {statusHistory.length === 0 ? (
                    <p className="text-[10px] text-slate-600 italic">No status changes recorded.</p>
                  ) : statusHistory.map((h: any) => (
                    <div key={h.id} className="p-3 bg-slate-800/30 rounded-xl border border-slate-800/50 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase text-slate-500 italic">{h.oldStatus}</span>
                          <Send size={8} className="text-slate-600" />
                          <span className={`text-[9px] font-black uppercase ${
                            h.newStatus === 'approved' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>{h.newStatus}</span>
                        </div>
                        <span className="text-[8px] text-slate-500 font-bold">{format(h.createdAt instanceof Date ? h.createdAt : new Date(h.createdAt), 'MMM d, HH:mm')}</span>
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Changed by <span className="text-slate-300 font-bold">{h.adminEmail}</span>
                      </div>
                      {h.reason && <div className="text-[9px] text-rose-400/80 italic mt-1 leading-tight">Reason: {h.reason}</div>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                {selectedMerchant.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => {
                        approveMerchant(selectedMerchant.id);
                        setSelectedMerchant(null);
                      }}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-900/20"
                    >
                      Approve Merchant
                    </button>
                    <button 
                      onClick={() => {
                        rejectMerchant(selectedMerchant.id);
                        setSelectedMerchant(null);
                      }}
                      className="flex-1 py-4 bg-rose-900/50 hover:bg-rose-900 text-rose-400 rounded-xl font-black uppercase tracking-widest text-xs transition-all border border-rose-500/20"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedMerchant.status === 'approved' && (
                  <button 
                    onClick={() => {
                      suspendMerchant(selectedMerchant.id);
                      setSelectedMerchant(null);
                    }}
                    className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-rose-900/20"
                  >
                    Suspend Merchant
                  </button>
                )}
                {selectedMerchant.status === 'suspended' && (
                  <button 
                    onClick={() => {
                      reactivateMerchant(selectedMerchant.id);
                      setSelectedMerchant(null);
                    }}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-900/20"
                  >
                    Reactivate Merchant
                  </button>
                )}
                <button 
                  onClick={() => setSelectedMerchant(null)}
                  className={`${selectedMerchant.status === 'pending' || selectedMerchant.status === 'approved' || selectedMerchant.status === 'suspended' ? 'px-6' : 'w-full'} py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 text-emerald-500 font-bold mb-2">
            <ShieldCheck size={20} /> ADMIN COMMAND CENTER
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            {view === 'overview' ? 'System Global State' : view === 'support' ? 'Merchant Support Center' : 'Settlement Management'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-1 rounded-xl flex gap-1 border border-slate-800">
            <button 
              onClick={() => setView('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${getStatusColor('overview')}`}
            >
              System
            </button>
            <button 
              onClick={() => setView('support')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all relative ${getStatusColor('support')}`}
            >
              Support
              {stats.openTickets > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] flex items-center justify-center rounded-full text-white border-2 border-slate-950">
                  {stats.openTickets}
                </span>
              )}
            </button>
            <button 
              onClick={() => setView('settlements')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all relative ${getStatusColor('settlements')}`}
            >
              Payouts
              {stats.queuedSettlements > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-[10px] flex items-center justify-center rounded-full text-white border-2 border-slate-950">
                  {stats.queuedSettlements}
                </span>
              )}
            </button>
          </div>
          <button 
            onClick={processSettlements}
            className="px-6 py-2 bg-emerald-600 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20 text-sm"
          >
            Run Settlements
          </button>
          <div className="flex gap-2">
            <Link 
              to="/"
              className="p-2 bg-slate-900 border border-slate-800 text-slate-500 rounded-xl hover:text-white transition-all"
              title="Return to Home"
            >
              <Home size={20} />
            </Link>
            <button 
              onClick={() => signOut(auth)}
              className="p-2 bg-slate-900 border border-slate-800 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {view === 'overview' ? (
        <>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl">
              <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <Users size={14} /> Total Registered Merchants
              </div>
              <div className="text-4xl font-black">{stats.totalUsers}</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl">
              <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Activity size={14} /> Total Processing Volume
              </div>
              <div className="text-4xl font-black">₦{stats.totalVolume.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl">
              <div className="text-amber-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Clock size={14} /> Pending Approvals
              </div>
              <div className="text-4xl font-black text-amber-500">{stats.pendingApprovals}</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl">
              <div className="text-emerald-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                 <MessageCircle size={14} /> Active Tickets
              </div>
              <div className="text-4xl font-black text-emerald-500">{stats.openTickets}</div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
            {/* Merchant Management */}
            <section className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-black">Merchant Verification</h2>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-black uppercase">Live Queue</span>
              </div>
              
              <div className="bg-slate-950/40 border-b border-slate-800/50 px-8 py-3 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <button onClick={() => handleSort('m', 'businessName')} className="flex-1 flex items-center hover:text-white transition-colors">
                  Business Name <SortIndicator activeField={mSort.field} field="businessName" order={mSort.order} />
                </button>
                <button onClick={() => handleSort('m', 'status')} className="w-24 flex items-center justify-end hover:text-white transition-colors">
                  Status <SortIndicator activeField={mSort.field} field="status" order={mSort.order} />
                </button>
                <div className="w-28 text-right pr-2">Actions</div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[500px]">
                 {sortedMerchants.map(m => (
                   <div key={m.id} className="p-8 border-b border-slate-800 hover:bg-white/5 transition-colors flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-lg mb-1">{m.businessName}</div>
                          <button 
                            onClick={() => setSelectedMerchant(m)}
                            className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-1 transition-all border border-slate-700"
                          >
                            <Info size={10} /> Details
                          </button>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">Tax ID: {m.taxNumber} • Owner: {m.ownerId.slice(0, 8)}...</div>
                        <div className="mt-2 flex gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                            m.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/10' : 
                            m.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 ring-1 ring-amber-500/10' :
                            m.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 ring-1 ring-rose-500/10' :
                            'bg-slate-500/20 text-slate-400 border-slate-500/30 ring-1 ring-slate-500/10'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      </div>
                      {m.status === 'pending' && (
                        <div className="flex gap-2">
                           <button 
                            onClick={() => approveMerchant(m.id)}
                            className="p-3 bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-950"
                           >
                             <CheckCircle2 size={20} />
                           </button>
                           <button 
                            onClick={() => rejectMerchant(m.id)}
                            className="p-3 bg-rose-900/50 rounded-xl hover:bg-rose-900 transition-all border border-rose-500/20"
                           >
                             <XCircle size={20} />
                           </button>
                        </div>
                      )}
                   </div>
                 ))}
              </div>
            </section>

            {/* Global Monitor */}
            <section className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-black">Global Transaction Monitor</h2>
                <Activity className="text-emerald-500 animate-pulse" size={20} />
              </div>
              <div className="flex-1 overflow-y-auto max-h-[500px] font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/80 sticky top-0">
                      <tr>
                        <th className="p-6 text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('t', 'id')}>
                          <div className="flex items-center">
                            Hash <SortIndicator activeField={tSort.field} field="id" order={tSort.order} />
                          </div>
                        </th>
                        <th className="p-6 text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('t', 'amount')}>
                          <div className="flex items-center">
                            Amount <SortIndicator activeField={tSort.field} field="amount" order={tSort.order} />
                          </div>
                        </th>
                        <th className="p-6 text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('t', 'provider')}>
                          <div className="flex items-center">
                            Provider <SortIndicator activeField={tSort.field} field="provider" order={tSort.order} />
                          </div>
                        </th>
                        <th className="p-6 text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('t', 'status')}>
                          <div className="flex items-center justify-end">
                            Status <SortIndicator activeField={tSort.field} field="status" order={tSort.order} />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {sortedTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-6 text-slate-400">#{t.id.slice(0, 12)}</td>
                          <td className="p-6 font-bold text-white">₦{t.amount?.toLocaleString()}</td>
                          <td className="p-6 text-slate-500 uppercase">{t.provider}</td>
                          <td className="p-6 text-right">
                            <span className={t.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}>
                              {t.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            </section>
          </div>
        </>
      ) : view === 'support' ? (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 h-[70vh]">
          {/* Threads Sidebar */}
          <section className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 space-y-4">
              <h2 className="text-lg font-bold">Support Conversations</h2>
              <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text"
                  value={supportSearch}
                  onChange={(e) => setSupportSearch(e.target.value)}
                  placeholder="Search merchant or ID..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {supportSearch && (
                  <button 
                    onClick={() => setSupportSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    <XCircle size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredSupportThreads.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedThread(t)}
                  className={`w-full p-6 text-left border-b border-slate-800/50 transition-all ${selectedThread?.id === t.id ? 'bg-emerald-500/10 border-r-4 border-r-emerald-500' : 'hover:bg-white/5'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold">{t.merchantName}</span>
                    {t.unreadCountByAdmin > 0 && <span className="p-1.5 bg-rose-500 rounded-full text-[8px] font-black leading-none">NEW</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{t.lastMessageAt?.toDate() ? format(t.lastMessageAt.toDate(), 'MMM d, HH:mm') : '...'}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Chat Window */}
          <section className="md:col-span-2 bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
            {selectedThread ? (
              <>
                <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="font-bold">{selectedThread.merchantName}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Merchant ID: {selectedThread.merchantId.slice(0, 12)}...</div>
                      </div>
                   </div>
                   <button 
                    onClick={async () => {
                      const newStatus = selectedThread.status === 'open' ? 'closed' : 'open';
                      await updateDoc(doc(db, 'supportThreads', selectedThread.id), { status: newStatus });
                      setSelectedThread(prev => ({ ...prev, status: newStatus }));
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                      selectedThread.status === 'open' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/10' : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                   >
                     {selectedThread.status}
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] flex flex-col ${msg.senderType === 'admin' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-4 rounded-2xl text-sm ${
                          msg.senderType === 'admin' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 uppercase font-black tracking-widest px-1">
                          {msg.createdAt?.toDate() ? format(msg.createdAt.toDate(), 'HH:mm') : '...'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t border-slate-800">
                  <form onSubmit={handleSendReply} className="flex gap-4">
                    <input 
                      type="text"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type a response to the merchant..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-6 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button 
                      type="submit"
                      disabled={!reply.trim()}
                      className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                <MessageCircle size={64} className="opacity-10 mb-4" />
                <p className="font-bold text-sm uppercase tracking-widest opacity-50">Select a conversation to start chat</p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-black">Settlement History & Queue</h2>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Queued</span>
              <span className="w-3 h-3 bg-emerald-500 rounded-full ml-4" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paid</span>
              <span className="w-3 h-3 bg-rose-500 rounded-full ml-4" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Failed</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/80 sticky top-0">
                <tr>
                  <th className="p-6 text-slate-500 uppercase tracking-widest text-xs font-black cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('s', 'merchantId')}>
                    <div className="flex items-center">
                      Merchant ID <SortIndicator activeField={sSort.field} field="merchantId" order={sSort.order} />
                    </div>
                  </th>
                  <th className="p-6 text-slate-500 uppercase tracking-widest text-xs font-black cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('s', 'amount')}>
                    <div className="flex items-center">
                      Amount <SortIndicator activeField={sSort.field} field="amount" order={sSort.order} />
                    </div>
                  </th>
                  <th className="p-6 text-slate-500 uppercase tracking-widest text-xs font-black cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('s', 'scheduledDate')}>
                    <div className="flex items-center">
                      Scheduled <SortIndicator activeField={sSort.field} field="scheduledDate" order={sSort.order} />
                    </div>
                  </th>
                  <th className="p-6 text-slate-500 uppercase tracking-widest text-xs font-black">
                    Processing Details
                  </th>
                  <th className="p-6 text-slate-500 uppercase tracking-widest text-xs font-black cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleSort('s', 'status')}>
                    <div className="flex items-center">
                      Status <SortIndicator activeField={sSort.field} field="status" order={sSort.order} />
                    </div>
                  </th>
                  <th className="p-6 text-slate-500 uppercase tracking-widest text-xs font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedSettlements.map(s => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-6 text-slate-400 font-mono text-xs">{s.merchantId.slice(0, 16)}...</td>
                    <td className="p-6 font-bold text-lg">₦{s.amount.toLocaleString()}</td>
                    <td className="p-6 text-slate-400 text-sm">
                      {s.scheduledDate?.toDate ? format(s.scheduledDate.toDate(), 'MMM d, yyyy HH:mm') : 'Pending'}
                    </td>
                    <td className="p-6">
                      {s.status === 'paid' && s.paidAt && (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest leading-none mb-1">Paid On</span>
                          <span className="text-xs text-slate-300 font-bold">
                            {s.paidAt?.toDate ? format(s.paidAt.toDate(), 'MMM d, HH:mm') : s.paidAt}
                          </span>
                        </div>
                      )}
                      {s.status === 'failed' && (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-rose-500 font-black uppercase tracking-widest leading-none mb-1">Failure Reason</span>
                          <span className="text-xs text-slate-300 font-bold max-w-[200px] truncate" title={s.failureReason}>
                            {s.failureReason || 'Unknown Engine Error'}
                          </span>
                        </div>
                      )}
                      {s.status === 'queued' && (
                        <span className="text-[10px] text-slate-500 italic">Awaiting Next Batch</span>
                      )}
                    </td>
                    <td className="p-6">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        s.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/10' : 
                        s.status === 'queued' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 ring-1 ring-amber-500/10' : 
                        s.status === 'failed' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 ring-1 ring-rose-500/10' :
                        'bg-slate-500/20 text-slate-400 border-slate-500/30 ring-1 ring-slate-500/10'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      {s.status === 'queued' && (
                        <button 
                          onClick={() => cancelSettlement(s.id)}
                          className="px-3 py-1 bg-rose-900/30 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-black uppercase hover:bg-rose-900/50 transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {settlements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest text-sm italic">
                      No settlements found in the system
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
