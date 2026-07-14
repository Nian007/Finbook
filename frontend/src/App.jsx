import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SalesList from './components/SalesList';
import SaleForm from './components/SaleForm';
import Invoice from './components/Invoice';
import BusinessLogin from './components/BusinessLogin';
import { getCurrentUser } from './api/authApi';

function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <>
        <BusinessLogin onLogin={handleLogin} />
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
          }}
        />
      </>
    );
  }

  const businessName = currentUser.businessName;

  return (
    <div className="app-layout">
      <Sidebar businessName={businessName} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard businessName={businessName} />} />
          <Route path="/new-sale" element={<SaleForm />} />
          <Route path="/sales" element={<SalesList />} />
          <Route path="/sales/:id" element={<Invoice businessName={businessName} />} />
        </Routes>
      </main>
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
    </div>
  );
}

export default App;
