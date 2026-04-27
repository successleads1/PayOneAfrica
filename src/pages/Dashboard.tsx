import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet, Receipt, Calendar, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [merchant, setMerchant] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<number>(0);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [mtdVolume, setMtdVolume] = useState<number>(0);
  const [thirtyDayVolume, setThirtyDayVolume] = useState<number>(0);
  const [avgTransactionValue, setAvgTransactionValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);

  const currencySymbols: Record<string, string> = {
    'NGN': '₦',
    'USD': '$',
    'EUR': '€',
    'ZAR': 'R'
  };

  const getCurrencySymbol = (code: string) => currencySymbols[code] || code;

  const handleRequestPayout = async () => {
    if (!merchant || merchant.balance < 1000) {
      alert("Minimum payout amount is R1,000");
      return;
    }

    if (!confirm(`Are you sure you want to request a payout of R${merchant.balance.toLocaleString()}?`)) {
      return;
    }

    setRequestingPayout(true);
    try {
      await addDoc(collection(db, 'settlements'), {
        merchantId: merchant.id,
        amount: merchant.balance,
        status: 'queued',
        scheduledDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        reference: `PAYOUT-${Math.random().toString(36).substring(7).toUpperCase()}`
      });
      alert("Payout request submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit payout request. Please try again.");
    } finally {
      setRequestingPayout(false);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch Merchant Info
    const mercQuery = query(collection(db, 'merchants'), where('ownerId', '==', auth.currentUser.uid));
    const unsubMerc = onSnapshot(mercQuery, (snap) => {
      if (!snap.empty) {
        setMerchant({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    });

    return () => unsubMerc();
  }, []);

  useEffect(() => {
    if (!merchant) return;

    // Fetch Recent Transactions
    const transQuery = query(
      collection(db, 'transactions'),
      where('merchantId', '==', merchant.id),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubTrans = onSnapshot(transQuery, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch All Success Transactions for deep analysis
    const volumeQuery = query(
      collection(db, 'transactions'),
      where('merchantId', '==', merchant.id),
      where('status', '==', 'success')
    );
    const unsubVolume = onSnapshot(volumeQuery, (snap) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      let total = 0;
      let mtd = 0;
      let thirtyDay = 0;
      let count = 0;

      snap.docs.forEach(doc => {
        const data = doc.data();
        const amount = data.amount || 0;
        const date = new Date(data.createdAt);

        total += amount;
        count++;

        if (date >= startOfMonth) mtd += amount;
        if (date >= thirtyDaysAgo) thirtyDay += amount;
      });

      setTotalVolume(total);
      setMtdVolume(mtd);
      setThirtyDayVolume(thirtyDay);
      setAvgTransactionValue(count > 0 ? total / count : 0);
    });

    // Fetch Pending Settlements
    const settlementQuery = query(
      collection(db, 'settlements'),
      where('merchantId', '==', merchant.id),
      where('status', '==', 'queued')
    );
    const unsubSettlements = onSnapshot(settlementQuery, (snap) => {
      const pending = snap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
      setPendingSettlements(pending);
      setLoading(false);
    });

    return () => {
      unsubTrans();
      unsubVolume();
      unsubSettlements();
    };
  }, [merchant]);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white border border-slate-200 rounded-xl" />)}
      </div>
      <div className="h-96 bg-white border border-slate-200 rounded-xl" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-minimal p-6 overflow-hidden relative col-span-1 md:col-span-2 lg:col-span-1">
          <div className="relative z-10">
            <p className="text-sm text-slate-500 font-medium mb-1">Available Balance</p>
            <p className="text-4xl font-black text-slate-900 tracking-tight mb-4">
              {getCurrencySymbol('ZAR')}{merchant?.balance?.toLocaleString() || '0.00'}
            </p>
            
            <button 
              onClick={handleRequestPayout}
              disabled={requestingPayout || !merchant || merchant.balance < 1000}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} /> {requestingPayout ? 'Processing...' : 'Request Payout'}
            </button>
            
            <div className="space-y-3 pt-6 border-t border-slate-50 mt-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock size={12} className="text-amber-500" />
                  Pending Settlement
                </span>
                <span className="font-bold text-slate-700">{getCurrencySymbol('ZAR')}{pendingSettlements.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  Total Processed
                </span>
                <span className="font-bold text-slate-700">{getCurrencySymbol('ZAR')}{totalVolume.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <Wallet className="absolute -right-4 -bottom-4 text-slate-50 opacity-50" size={120} strokeWidth={1} />
        </div>

        <div className="card-minimal p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 font-medium">30-Day Volume</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calendar size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{getCurrencySymbol('ZAR')}{thirtyDayVolume.toLocaleString()}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs text-emerald-600 font-bold">
            <TrendingUp size={14} className="mr-1" />
            +8.2% <span className="text-slate-400 font-medium ml-1">vs prev 30d</span>
          </div>
        </div>

        <div className="card-minimal p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 font-medium">Avg Transaction Value</p>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{getCurrencySymbol('ZAR')}{Math.round(avgTransactionValue).toLocaleString()}</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-400 font-medium">
            Based on all successful payments
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-minimal p-6 flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
             <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1 italic">Month-to-Date (MTD)</p>
            <p className="text-2xl font-black text-slate-900">{getCurrencySymbol('ZAR')}{mtdVolume.toLocaleString()}</p>
          </div>
        </div>

        <div className="card-minimal p-6 flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
             <CheckCircle2 size={24} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1 italic">Payment Success Rate</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-black text-slate-900">98.2%</p>
              <div className="flex-1 mb-2 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: '98.2%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card-minimal flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Recent Transactions</h2>
          <Link to="/dashboard/transactions" className="text-sm text-emerald-600 font-medium hover:underline">View all</Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-semibold">Customer / Reference</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Method</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">No transactions found</td>
                </tr>
              ) : transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-700">{t.customerEmail}</p>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{t.id.substring(0, 12)}...</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      t.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className="w-6 h-4 bg-slate-800 rounded-sm text-[8px] text-white flex items-center justify-center font-bold uppercase">
                         {t.provider.substring(0,1)}
                       </span>
                       <span className="text-slate-600 capitalize text-xs font-medium">{t.provider}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {getCurrencySymbol(t.currency || 'ZAR')}{t.amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-medium">
                    {format(new Date(t.createdAt), 'MMM d, HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Quick Info */}
      <div className="bg-slate-900 rounded-xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-lg gap-6">
        <div>
          <h3 className="text-lg font-bold mb-1">Collect payments without code</h3>
          <p className="text-slate-400 text-sm font-medium">Create a payment link and share it with your customers in seconds.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Link to="/dashboard/payment-links" className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold hover:bg-emerald-700 transition-colors">Create Link</Link>
          <Link to="/docs" className="px-4 py-2 bg-white text-slate-900 rounded text-sm font-bold hover:bg-slate-100 transition-colors">API Docs</Link>
        </div>
      </div>
    </div>
  );
}
