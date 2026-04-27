import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Key, Copy, CheckCircle, Eye, EyeOff, ShieldAlert, RefreshCw } from 'lucide-react';

export default function APIKeys() {
  const [merchant, setMerchant] = useState<any>(null);
  const [showKey, setShowKey] = useState(false);
  const [showTestKey, setShowTestKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testCopied, setTestCopied] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'merchants'), where('ownerId', '==', auth.currentUser.uid));
    return onSnapshot(q, (snap) => {
      if (!snap.empty) setMerchant({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });
  }, []);

  const copyToClipboard = (type: 'live' | 'test') => {
    const key = type === 'live' ? merchant?.apiKey : merchant?.testApiKey;
    if (key) {
      navigator.clipboard.writeText(key);
      if (type === 'live') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setTestCopied(true);
        setTimeout(() => setTestCopied(false), 2000);
      }
    }
  };

  const regenerateKey = async (type: 'live' | 'test') => {
    if (!merchant) return;
    const label = type === 'live' ? 'Live' : 'Test';
    if (!window.confirm(`Are you sure you want to regenerate your ${label} API key? The current key will be invalidated immediately.`)) return;

    try {
      const prefix = type === 'live' ? 'poa_live_' : 'poa_test_';
      const newKey = `${prefix}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      await updateDoc(doc(db, 'merchants', merchant.id), {
        [type === 'live' ? 'apiKey' : 'testApiKey']: newKey
      });
      alert(`New ${label} API key generated successfully.`);
    } catch (err) {
      console.error(`Error regenerating ${label} API key:`, err);
      alert(`Failed to regenerate ${label} API key. Please try again.`);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">API Keys</h1>
        <p className="text-slate-500 font-medium">Manage your developer credentials to authenticate API requests.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Live Key Section */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Key size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Live API Key</h3>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 font-mono text-sm relative group overflow-hidden">
               <div className="flex items-center justify-between">
                  <span className="text-slate-500 truncate mr-4">
                    {showKey ? merchant?.apiKey || 'Not generated' : 'poa_live_••••••••••••••••••••••••••••••••'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowKey(!showKey)}
                      className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      title={showKey ? "Hide Key" : "Show Key"}
                    >
                      {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard('live')}
                      className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                      title="Copy to Clipboard"
                    >
                      {copied ? <CheckCircle size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  </div>
               </div>
            </div>

            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
              Use this key to authenticate server-side requests. Keep it secret and never expose it in client-side code.
            </p>

            <button 
              onClick={() => regenerateKey('live')}
              className="w-full py-4 bg-slate-900 text-white rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
            >
              <RefreshCw size={18} className="text-emerald-500" />
              Regenerate Live Key
            </button>
          </div>

          {/* Test Key Section */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Key size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Test API Key</h3>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 font-mono text-sm relative group overflow-hidden">
               <div className="flex items-center justify-between">
                  <span className="text-slate-400 truncate mr-4">
                    {showTestKey ? merchant?.testApiKey || 'Not generated' : 'poa_test_••••••••••••••••••••••••••••••••'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowTestKey(!showTestKey)}
                      className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      title={showTestKey ? "Hide Key" : "Show Key"}
                    >
                      {showTestKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard('test')}
                      className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                      title="Copy to Clipboard"
                    >
                      {testCopied ? <CheckCircle size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  </div>
               </div>
            </div>

            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
              Use this key for sandbox testing. Transactions made with this key will not process real funds.
            </p>

            <button 
              onClick={() => regenerateKey('test')}
              className="w-full py-4 bg-slate-100 text-slate-900 rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 transition-all active:scale-[0.98]"
            >
              <RefreshCw size={18} className="text-amber-500" />
              {merchant?.testApiKey ? 'Regenerate Test Key' : 'Generate Test Key'}
            </button>
          </div>

          <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100">
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 bg-white rounded-xl text-rose-500 flex items-center justify-center shadow-sm">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h4 className="font-black text-rose-900 mb-1">Security Warning</h4>
                  <p className="text-sm text-rose-700 opacity-80 leading-relaxed">
                    Account-wide API keys have full access to your merchant account. If your key is compromised, roll it immediately in the settings tab.
                  </p>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-6">
           <h3 className="text-xl font-black">Quick Start Integration</h3>
           <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">cURL Request</span>
                <pre className="bg-black/30 p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto text-emerald-400">
{`curl -X POST https://payoneafrica.com/api/payments/create \\
  -H "X-API-Key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "NGN",
    "customerEmail": "customer@example.com",
    "description": "Order #45"
  }'`}
                </pre>
              </div>
              <p className="text-sm text-slate-400 font-medium">
                Our RESTful API endpoints allow you to create payments, manage subscriptions, and listen for events via webhooks.
              </p>
              <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all">
                View API Documentation
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
