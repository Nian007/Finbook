import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SalesList from './components/SalesList';
import SaleForm from './components/SaleForm';
import Invoice from './components/Invoice';
import BusinessLogin from './components/BusinessLogin';
import LandingPage from './components/LandingPage';
import SubscribePage from './components/SubscribePage';
import AdminPanel from './components/AdminPanel';
import InventoryPage from './components/InventoryPage';
import Itr4FilingTool from './components/Itr4FilingTool';
import MobileScanner from './components/MobileScanner';
import { getCurrentUser } from './api/authApi';
import { subscriptionApi } from './api/featureApi';

// Routes that are accessible even without an active subscription
const OPEN_ROUTES = ['/subscribe', '/admin'];

function ProtectedLayout({ currentUser, handleLogout, subStatus }) {
  const location = useLocation();

  if (!currentUser) return <Navigate to="/login" replace />;

  // Lockout: if subscription is not ACTIVE or TRIAL, redirect to subscribe
  // (unless user is on an open route or is super_admin)
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isOnOpenRoute = OPEN_ROUTES.some(r => location.pathname.startsWith(r));
  const isBlocked = subStatus && !subStatus.isAllowed && !isSuperAdmin && !isOnOpenRoute;

  if (isBlocked) return <Navigate to="/subscribe" replace />;

  return (
    <div className="app-layout">
      <Sidebar businessName={currentUser.businessName} onLogout={handleLogout}
        role={currentUser.role} subStatus={subStatus} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [subStatus, setSubStatus] = useState(null);
  const navigate = useNavigate();

  // Fetch subscription status whenever user changes
  useEffect(() => {
    if (currentUser) {
      subscriptionApi.getStatus()
        .then(r => setSubStatus(r.data))
        .catch(() => setSubStatus(null));
    } else {
      setSubStatus(null);
    }
  }, [currentUser]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSubStatus(null);
    navigate('/login');
  };

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <BusinessLogin onLogin={handleLogin} />} />
        <Route path="/mobile-scan" element={<MobileScanner />} />

        {/* Protected Routes */}
        <Route element={<ProtectedLayout currentUser={currentUser} handleLogout={handleLogout} subStatus={subStatus} />}>
          <Route path="/dashboard" element={<Dashboard businessName={currentUser?.businessName} subStatus={subStatus} />} />
          <Route path="/new-sale" element={<SaleForm />} />
          <Route path="/sales" element={<SalesList />} />
          <Route path="/sales/:id" element={<Invoice currentUser={currentUser} />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/itr4" element={<Itr4FilingTool />} />
        </Route>
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1E1E1E',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '14px 20px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#26C281', secondary: '#1E1E1E' } },
          error: { iconTheme: { primary: '#FF5A5F', secondary: '#1E1E1E' } },
        }}
      />
    </>
  );
}

export default App;
