import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Key, Settings, LogOut, CreditCard, Bell, Search, User, BarChart2, MessageSquare } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { label: 'Payment Links', icon: <CreditCard size={18} />, path: '/dashboard/payment-links' },
    { label: 'Reports', icon: <BarChart2 size={18} />, path: '/dashboard/reports' },
    { label: 'Transactions', icon: <Receipt size={18} />, path: '/dashboard/transactions' },
    { label: 'Merchant Support', icon: <MessageSquare size={18} />, path: '/dashboard/support' },
    { label: 'API Keys', icon: <Key size={18} />, path: '/dashboard/api-keys' },
    { label: 'Settings', icon: <Settings size={18} />, path: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">P</div>
            <span className="text-xl font-bold tracking-tight text-slate-800">PayOneAfrica</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item-minimal ${location.pathname === item.path ? 'nav-item-active' : ''}`}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
          
          <div className="pt-4 pb-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Support</div>
          <Link to="/docs" className="nav-item-minimal">
            <Bell size={18} />
            <span className="text-sm">Documentation</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">
              {auth.currentUser?.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-slate-700">{auth.currentUser?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase">Live Mode</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors w-full px-2"
          >
            <LogOut size={14} />
            LOG OUT
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold capitalize">
              {location.pathname.split('/').pop() === 'dashboard' ? 'Overview' : location.pathname.split('/').pop()?.replace('-', ' ')}
            </h1>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
              KYC Verified
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Search size={16} className="text-slate-400" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-xs w-48" />
            </div>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium shadow-sm hover:bg-emerald-700 transition-all">
              Create Payment
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
