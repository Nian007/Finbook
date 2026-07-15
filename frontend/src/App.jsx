import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SalesList from './components/SalesList';
import SaleForm from './components/SaleForm';
import Invoice from './components/Invoice';
import BusinessLogin from './components/BusinessLogin';
import LandingPage from './components/LandingPage';
import { getCurrentUser } from './api/authApi';

function ProtectedLayout({ currentUser, handleLogout }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="app-layout">
      <Sidebar businessName={currentUser.businessName} onLogout={handleLogout} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const navigate = useNavigate();

  const handleLogin = (user) => {
    setCurrentUser(user);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <BusinessLogin onLogin={handleLogin} />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedLayout currentUser={currentUser} handleLogout={handleLogout} />}>
          <Route path="/dashboard" element={<Dashboard businessName={currentUser?.businessName} />} />
          <Route path="/new-sale" element={<SaleForm />} />
          <Route path="/sales" element={<SalesList />} />
          <Route path="/sales/:id" element={<Invoice currentUser={currentUser} />} />
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
          success: {
            iconTheme: {
              primary: '#26C281',
              secondary: '#1E1E1E',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF5A5F',
              secondary: '#1E1E1E',
            },
          },
        }}
      />
    </>
  );
}

export default App;
