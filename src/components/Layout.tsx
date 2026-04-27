import { Link, Outlet } from 'react-router-dom';
import { CreditCard, Menu, X, ShieldCheck, Globe, Zap } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                <CreditCard size={24} />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                PayOne<span className="text-emerald-600">Africa</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link to="/" className="text-slate-600 hover:text-emerald-600 transition-colors">Home</Link>
              <Link to="/docs" className="text-slate-600 hover:text-emerald-600 transition-colors">Developers</Link>
              <Link to="/pricing" className="text-slate-600 hover:text-emerald-600 transition-colors">Pricing</Link>
              <Link to="/login" className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors">Log in</Link>
              <Link to="/register" className="px-5 py-2.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md active:scale-95">Get Started</Link>
            </div>

            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100 px-4 py-6 flex flex-col gap-4"
            >
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Home</Link>
              <Link to="/docs" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Developers</Link>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Log in</Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)} className="px-6 py-3 rounded-xl bg-emerald-600 text-white text-center font-bold">Sign up</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6 text-white font-bold text-xl">
              <CreditCard className="text-emerald-500" /> PayOneAfrica
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Empowering African commerce with world-class payment infrastructure. Built for merchants, designed for scale.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/docs" className="hover:text-emerald-500">Payments</Link></li>
              <li><Link to="/docs" className="hover:text-emerald-500">Checkout</Link></li>
              <li><Link to="/docs" className="hover:text-emerald-500">Subscriptions</Link></li>
              <li><Link to="/docs" className="hover:text-emerald-500">Fraud Protection</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/docs" className="hover:text-emerald-500">API Reference</Link></li>
              <li><Link to="/docs" className="hover:text-emerald-500">Developer Portal</Link></li>
              <li><Link to="/docs" className="hover:text-emerald-500">Support</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-emerald-500">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-500">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-emerald-500">Compliance</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 mt-12 border-t border-slate-900 text-xs text-center">
          &copy; {new Date().getFullYear()} PayOneAfrica. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
