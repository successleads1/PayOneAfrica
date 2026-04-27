import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';

import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import APIKeys from './pages/APIKeys';
import Reports from './pages/Reports';
import Docs from './pages/Docs';
import Support from './pages/Support';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import PaymentLinks from './pages/PaymentLinks';
import PublicPaymentLink from './pages/PublicPaymentLink';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/pay/:id" element={<PublicPaymentLink />} />
        </Route>

        {/* Protected Merchant Routes */}
        <Route
          path="/dashboard"
          element={user ? <DashboardLayout /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="payment-links" element={<PaymentLinks />} />
          <Route path="reports" element={<Reports />} />
          <Route path="api-keys" element={<APIKeys />} />
          <Route path="support" element={<Support />} />
        </Route>

        {/* Admin Route */}
        <Route
          path="/admin"
          element={(user?.email === 'feelathomeincapetown@gmail.com' || localStorage.getItem('admin_auth') === 'true') ? <Admin /> : <Navigate to="/admin/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}
