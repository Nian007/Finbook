import React, { useState } from 'react';
import { Store, User, Phone, Lock, ChevronRight, Mail } from 'lucide-react';
import { login, signup } from '../api/authApi';
import toast from 'react-hot-toast';

const BusinessLogin = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    password: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const data = await login(formData.phone, formData.password);
        toast.success(`Welcome back, ${data.name}!`);
        onLogin(data);
      } else {
        await signup(formData);
        toast.success('Registration successful! Please login.');
        setIsLogin(true); // Switch to login view
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-bg-orb login-bg-orb-1"></div>
      <div className="login-bg-orb login-bg-orb-2"></div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="sidebar-logo-icon">
              <Store />
            </div>
          </div>
          <h1 className="login-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="login-subtitle">{isLogin ? 'Sign in to access your dashboard' : 'Register your business to get started'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <>
              <div className="login-input-group">
                <input
                  type="text"
                  placeholder="Business Name"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                />
              </div>
              <div className="login-input-group">
                <input
                  type="text"
                  placeholder="Owner Name"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                />
              </div>
              <div className="login-input-group">
                <input
                  type="email"
                  placeholder="Email (Optional)"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </>
          )}
          
          <div className="login-input-group">
            <input
              type="tel"
              placeholder="Phone Number (10 digits)"
              required
              pattern="[0-9]{10}"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="login-input-group">
            <input
              type="password"
              placeholder="Password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full mt-4" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
            <ChevronRight className="h-5 w-5 ml-2" />
          </button>
        </form>

        <div className="login-footer-text">
          <button 
            type="button" 
            className="btn-link"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessLogin;
