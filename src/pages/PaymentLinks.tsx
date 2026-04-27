import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CreditCard, Plus, Link as LinkIcon, Copy, Check, ExternalLink, Calendar, Filter, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function PaymentLinks() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<any>(null);

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    currency: 'ZAR',
    expiresAt: ''
  });

  const currencies = [
    { code: 'NGN', symbol: '₦' },
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'ZAR', symbol: 'R' }
  ];

  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };

  useEffect(() => {
    const unsubMerc = onSnapshot(
      query(collection(db, 'merchants'), where('ownerId', '==', auth.currentUser?.uid)),
      (snap) => {
        if (!snap.empty) {
          const merc = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setMerchant(merc);
          
          // Now fetch links for this merchant
          const unsubLinks = onSnapshot(
            query(
              collection(db, 'paymentLinks'), 
              where('merchantId', '==', snap.docs[0].id),
              orderBy('createdAt', 'desc')
            ),
            (linksSnap) => {
              setLinks(linksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
              setLoading(false);
            }
          );
          return () => unsubLinks();
        }
      }
    );

    return () => unsubMerc();
  }, []);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;

    try {
      await addDoc(collection(db, 'paymentLinks'), {
        merchantId: merchant.id,
        amount: parseFloat(formData.amount),
        description: formData.description,
        currency: formData.currency,
        status: 'active',
        createdAt: serverTimestamp(),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        merchantName: merchant.businessName
      });
      setShowModal(false);
      setFormData({ amount: '', description: '', currency: 'ZAR', expiresAt: '' });
    } catch (err) {
      console.error('Error creating link:', err);
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/pay/${id}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-slate-200 rounded-xl" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payment Links</h2>
          <p className="text-sm text-slate-500">Create shareable links to collect payments</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700 transition-all"
        >
          <Plus size={18} />
          Create Link
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {links.length === 0 ? (
          <div className="card-minimal p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <LinkIcon size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No payment links yet</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">Start collecting payments by sharing a simple URL with your customers.</p>
            <button 
              onClick={() => setShowModal(true)}
              className="text-emerald-600 font-bold hover:underline"
            >
              Create your first link
            </button>
          </div>
        ) : (
          links.map((link) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={link.id} 
              className="card-minimal p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  link.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  <LinkIcon size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-slate-900 border-b-2 border-emerald-50/50 inline-block">{link.description || 'Untitled Link'}</h4>
                    {link.status === 'active' ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-wider">
                        <CheckCircle2 size={10} /> Active
                      </div>
                    ) : link.status === 'paid' ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[8px] font-black uppercase tracking-wider">
                        <CheckCircle2 size={10} /> Paid
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[8px] font-black uppercase tracking-wider">
                        <AlertCircle size={10} /> Expired
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-black text-slate-900 leading-tight">
                    <span className="text-sm font-medium mr-1">{getCurrencySymbol(link.currency)}</span>
                    {link.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">
                    Created {link.createdAt ? format(link.createdAt.toDate ? link.createdAt.toDate() : new Date(link.createdAt), 'PPP') : 'Just now'}
                    {link.expiresAt && (
                      <span className="ml-3 text-amber-500">
                        • Expires {format(new Date(link.expiresAt), 'PPP')}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => copyToClipboard(link.id)}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  {copySuccess === link.id ? (
                    <>
                      <Check size={14} className="text-emerald-600" />
                      COPIED
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      COPY LINK
                    </>
                  )}
                </button>
                <a 
                  href={`/pay/${link.id}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 transition-all"
                >
                  <ExternalLink size={14} />
                  PREVIEW
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Create Payment Link</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              <form onSubmit={handleCreateLink} className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Currency</label>
                    <select 
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-bold text-sm"
                    >
                      {currencies.map(c => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Payment Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{getCurrencySymbol(formData.currency)}</span>
                      <input 
                        type="number"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                  <input 
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="e.g. Graphic Design Invoice #123"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-sm placeholder:text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Expiration Date (Optional)</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="date"
                      value={formData.expiresAt}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98]"
                  >
                    Generate Link
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
