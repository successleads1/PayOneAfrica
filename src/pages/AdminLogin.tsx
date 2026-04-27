import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ShieldCheck, Lock, Mail, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Hardcoded check for the admin email as per App.tsx logic
      if (userCredential.user.email === 'feelathomeincapetown@gmail.com') {
        navigate('/admin');
      } else {
        setError('Access denied. Administrator privileges required.');
        await auth.signOut();
      }
    } catch (err: any) {
      setError('Invalid system credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10"
      >
        <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
          <div className="w-12 h-12 bg-slate-900 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-500 shadow-2xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <ShieldCheck size={28} />
          </div>
          <div className="text-left">
            <span className="block text-2xl font-black tracking-tight text-white uppercase italic leading-none">Internal</span>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Command Center</span>
          </div>
        </Link>
        <h2 className="text-xl font-bold text-slate-400 tracking-widest uppercase">System Authentication</h2>
        <p className="mt-2 text-slate-600 text-xs font-medium uppercase tracking-[0.2em]">Authorized Personnel Only</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl py-10 px-8 rounded-[2rem] border border-slate-800 shadow-2xl shadow-black/50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                {error}
              </motion.div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Access Token (Email)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder:text-slate-700 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none text-sm transition-all font-mono"
                    placeholder="ADMIN_ID@CORE"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Security Key (Password)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder:text-slate-700 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none text-sm transition-all font-mono"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-emerald-500 shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.97] disabled:opacity-50 group"
            >
              {loading ? (
                <Activity size={18} className="animate-spin" />
              ) : (
                <>
                  Establish Connection <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800/50 flex items-center justify-between">
            <Link to="/login" className="text-[10px] font-black text-slate-500 hover:text-emerald-500 uppercase tracking-widest transition-colors">
              Merchant Login
            </Link>
            <div className="flex gap-2">
              <div className="w-1 h-1 rounded-full bg-slate-800" />
              <div className="w-1 h-1 rounded-full bg-slate-800" />
              <div className="w-1 h-1 rounded-full bg-slate-800" />
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-slate-700 text-[10px] font-bold uppercase tracking-widest">
          IP Logs are being recorded for security audits
        </p>
      </motion.div>
    </div>
  );
}
