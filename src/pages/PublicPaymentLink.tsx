import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, CreditCard, ChevronRight, CheckCircle2, AlertCircle, Building2, Smartphone } from 'lucide-react';

export default function PublicPaymentLink() {
  const { id } = useParams();
  const [link, setLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'momo'>('card');
  const currencySymbols: Record<string, string> = {
    'NGN': '₦',
    'USD': '$',
    'EUR': '€',
    'ZAR': 'R'
  };

  const getCurrencySymbol = (code: string) => currencySymbols[code] || code;

  useEffect(() => {
    const fetchLink = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'paymentLinks', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Check for expiration
          if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
            setError('This payment link has expired and is no longer valid.');
            return;
          }

          setLink({ id: docSnap.id, ...data });
        } else {
          setError('This payment link does not exist or has expired.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    };
    fetchLink();
  }, [id]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Simulate real processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get customer IP (simulated since we're in the browser)
      let customerIp = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        customerIp = ipData.ip;
      } catch (e) {
        console.warn('Could not fetch IP, using unknown');
      }

      // 1. Create transaction record
      await addDoc(collection(db, 'transactions'), {
        amount: link.amount,
        currency: link.currency,
        merchantId: link.merchantId,
        status: 'success',
        customerEmail: 'customer@example.com', // In a real app, field for this
        provider: paymentMethod === 'card' ? 'Card' : 'MoMo',
        createdAt: new Date().toISOString(),
        paymentLinkId: link.id,
        customerIp,
        fee: Math.round(link.amount * 0.015) // Simulate 1.5% fee
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (error || !link) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <Link to="/" className="inline-block px-8 py-3 bg-slate-900 text-white rounded-lg font-bold">Back to safety</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Background decoration */}
      <div className="h-64 bg-slate-900 w-full absolute top-0 left-0" />
      
      <div className="flex-1 relative z-10 p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-2xl shadow-xl overflow-hidden min-h-[500px]">
          
          {/* Summary Column */}
          <div className="md:w-5/12 bg-slate-50 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">P</div>
              <span className="text-xl font-bold tracking-tight text-slate-800">PayOneAfrica</span>
            </div>

            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pay to</span>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-8">
                <Building2 size={20} className="text-slate-400" />
                {link.merchantName || 'Merchant'}
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-slate-500">Order Description</span>
                  <span className="text-sm font-semibold text-slate-700 text-right max-w-[150px]">{link.description || 'Payment'}</span>
                </div>
                <div className="border-t border-slate-200 pt-4 mt-6">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 uppercase text-xs tracking-widest">Total due</span>
                    <div className="text-right">
                      <p className="text-4xl font-black text-slate-900 tracking-tight">
                        <span className="text-base font-medium mr-1">{getCurrencySymbol(link.currency)}</span>
                        {link.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
               <ShieldCheck size={14} className="text-emerald-500" />
               Secure SSL Encrypted Checkout
            </div>
          </div>

          {/* Action Column */}
          <div className="md:w-7/12 p-8 md:p-12 flex flex-col">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful</h2>
                  <p className="text-slate-500 mb-8">You have successfully paid {getCurrencySymbol(link.currency)} {link.amount} to {link.merchantName}.</p>
                  <button onClick={() => window.close()} className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all">Close Tab</button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col"
                >
                  <h2 className="text-xl font-bold text-slate-900 mb-8">Payment Method</h2>

                  <form onSubmit={handlePayment} className="space-y-6 flex-1">
                    <div className="space-y-3">
                       <label 
                         className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                           paymentMethod === 'card' ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100 bg-white hover:border-slate-200'
                         }`}
                         onClick={() => setPaymentMethod('card')}
                       >
                         <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                             paymentMethod === 'card' ? 'bg-white border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                           }`}>
                             <CreditCard size={20} />
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 text-sm">Credit or Debit Card</p>
                              <p className="text-[10px] text-slate-500 font-medium tracking-wide">Visa, Mastercard, Verve</p>
                           </div>
                         </div>
                         <div className={`w-5 h-5 rounded-full border-4 transition-all ${
                           paymentMethod === 'card' ? 'border-emerald-600 bg-white' : 'border-slate-200 bg-slate-50'
                         }`} />
                       </label>

                       <label 
                         className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                           paymentMethod === 'momo' ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100 bg-white hover:border-slate-200'
                         }`}
                         onClick={() => setPaymentMethod('momo')}
                       >
                         <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
                             paymentMethod === 'momo' ? 'bg-white border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                           }`}>
                             <Smartphone size={20} />
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 text-sm">Mobile Money (MoMo)</p>
                              <p className="text-[10px] text-slate-500 font-medium tracking-wide">MTN MoMo, Airtel Money</p>
                           </div>
                         </div>
                         <div className={`w-5 h-5 rounded-full border-4 transition-all ${
                           paymentMethod === 'momo' ? 'border-emerald-600 bg-white' : 'border-slate-200 bg-slate-50'
                         }`} />
                       </label>
                    </div>

                    <div className="space-y-4 pt-4">
                       {paymentMethod === 'card' ? (
                         <input 
                           type="email" 
                           required 
                           placeholder="Email Address for Receipt" 
                           className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
                         />
                       ) : (
                         <div className="space-y-4">
                           <input 
                             type="tel" 
                             required 
                             placeholder="Mobile Money Number" 
                             className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
                           />
                           <input 
                             type="email" 
                             required 
                             placeholder="Email Address for Receipt" 
                             className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
                           />
                         </div>
                       )}
                       
                       <p className="text-[10px] text-slate-400 font-medium">
                         {paymentMethod === 'card' 
                           ? "Your card details are handled securely. We do not store your full card number or CVV."
                           : "A prompt will be sent to your phone to authorize the transaction."}
                       </p>
                    </div>

                    <div className="pt-8 mt-auto">
                       <button 
                         type="submit"
                         disabled={processing}
                         className="w-full h-14 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                       >
                         {processing ? (
                           <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Processing...
                           </>
                         ) : (
                           <>
                             Pay {getCurrencySymbol(link.currency)} {link.amount.toLocaleString()} <ChevronRight size={20} />
                           </>
                         )}
                       </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="mt-8 text-center">
           <p className="text-slate-400 text-xs font-medium uppercase tracking-widest flex items-center justify-center gap-2">
             <Lock size={12} />
             Powered by PayOneAfrica Payments
           </p>
        </div>
      </div>
    </div>
  );
}
