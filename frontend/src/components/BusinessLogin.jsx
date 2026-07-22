import React, { useState } from 'react';
import { Store, User, Phone, Lock, ChevronRight, Mail } from 'lucide-react';
import { login, signup, forgotPassword, resetPassword } from '../api/authApi';
import toast from 'react-hot-toast';

const BusinessLogin = ({ onLogin }) => {
  const [viewMode, setViewMode] = useState('login'); // 'login', 'signup', 'forgot', 'reset'
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    password: '',
    email: '',
    otp: '',
    newPassword: '',
    address: '',
    pan: '',
    aadhaar: '',
    dob: '',
    businessStatus: 'Individual',
    pinCode: '',
    gstin: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
    natureOfBusiness: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (viewMode === 'login') {
        const data = await login(formData.phone, formData.password);
        toast.success(`Welcome back, ${data.name}!`);
        onLogin(data);
      } else if (viewMode === 'signup') {
        await signup(formData);
        toast.success('Registration successful! Please login.');
        setViewMode('login');
      } else if (viewMode === 'forgot') {
        await forgotPassword(formData.phone);
        toast.success('OTP sent to your email!');
        setViewMode('reset');
      } else if (viewMode === 'reset') {
        await resetPassword(formData.phone, formData.otp, formData.newPassword);
        toast.success('Password reset successfully! Please login.');
        setViewMode('login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
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
          <h1 className="login-title">
            {viewMode === 'login' ? 'Welcome Back' : 
             viewMode === 'signup' ? 'Create Account' : 
             viewMode === 'forgot' ? 'Reset Password' : 'Enter OTP'}
          </h1>
          <p className="login-subtitle">
            {viewMode === 'login' ? 'Sign in to access your dashboard' : 
             viewMode === 'signup' ? 'Register your business to get started' : 
             viewMode === 'forgot' ? 'Enter your phone number to receive an OTP' : 'Enter the OTP sent to your email'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {viewMode === 'signup' && (
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
                  placeholder="Email (Required for password reset)"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <hr style={{ margin: '20px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
              <h4 style={{ color: 'white', marginBottom: '10px' }}>Tax & ITR-4 Details</h4>
              <div className="login-input-group">
                <textarea
                  placeholder="Full Address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="2"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="login-input-group" style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="PIN Code"
                  required
                  pattern="[0-9]{6}"
                  value={formData.pinCode}
                  onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                  style={{ flex: 1 }}
                />
                <select
                  value={formData.businessStatus}
                  onChange={(e) => setFormData({...formData, businessStatus: e.target.value})}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                >
                  <option value="Individual">Individual</option>
                  <option value="HUF">HUF</option>
                  <option value="Firm">Firm</option>
                </select>
              </div>
              <div className="login-input-group" style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="PAN (e.g. ABCDE1234F)"
                  required
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                  title="5 letters, 4 digits, 1 letter"
                  value={formData.pan}
                  onChange={(e) => setFormData({...formData, pan: e.target.value.toUpperCase()})}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="Aadhaar (12 digits)"
                  required
                  pattern="[0-9]{12}"
                  title="12 digit Aadhaar number"
                  value={formData.aadhaar}
                  onChange={(e) => setFormData({...formData, aadhaar: e.target.value})}
                  style={{ flex: 1 }}
                />
              </div>
              <div className="login-input-group">
                <input
                  type="date"
                  placeholder="Date of Birth"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                />
                <span style={{ fontSize: '0.8rem', color: 'gray' }}>Date of Birth / Incorporation</span>
              </div>
              <div className="login-input-group">
                <input
                  type="text"
                  placeholder="GSTIN (Optional)"
                  pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                  title="Valid 15-digit GSTIN"
                  value={formData.gstin}
                  onChange={(e) => setFormData({...formData, gstin: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="login-input-group">
                <input
                  type="text"
                  placeholder="Nature of Business (e.g. Kirana Trade, Dhaba)"
                  required
                  value={formData.natureOfBusiness}
                  onChange={(e) => setFormData({...formData, natureOfBusiness: e.target.value})}
                />
              </div>
              <hr style={{ margin: '20px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
              <h4 style={{ color: 'white', marginBottom: '10px' }}>Bank Details (For Refund)</h4>
              <div className="login-input-group">
                <input
                  type="text"
                  placeholder="Bank Name"
                  required
                  value={formData.bankName}
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                />
              </div>
              <div className="login-input-group" style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Account Number"
                  required
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value})}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="IFSC Code"
                  required
                  pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
                  value={formData.bankIfsc}
                  onChange={(e) => setFormData({...formData, bankIfsc: e.target.value.toUpperCase()})}
                  style={{ flex: 1 }}
                />
              </div>
            </>
          )}
          
          {(viewMode === 'login' || viewMode === 'signup' || viewMode === 'forgot') && (
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
          )}

          {(viewMode === 'login' || viewMode === 'signup') && (
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
          )}

          {viewMode === 'reset' && (
            <>
              <div className="login-input-group">
                <input
                  type="text"
                  placeholder="Enter 4-digit OTP"
                  required
                  pattern="[0-9]{4}"
                  value={formData.otp}
                  onChange={(e) => setFormData({...formData, otp: e.target.value})}
                />
              </div>
              <div className="login-input-group">
                <input
                  type="password"
                  placeholder="New Password (min 8 chars)"
                  required
                  minLength={8}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                />
              </div>
            </>
          )}

          {viewMode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '10px' }}>
              <button 
                type="button" 
                className="btn-link" 
                style={{ fontSize: '0.85rem' }}
                onClick={() => setViewMode('forgot')}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full mt-4" disabled={isLoading}>
            {isLoading ? 'Processing...' : (
              viewMode === 'login' ? 'Sign In' : 
              viewMode === 'signup' ? 'Register' : 
              viewMode === 'forgot' ? 'Send OTP' : 'Reset Password'
            )}
            <ChevronRight className="h-5 w-5 ml-2" />
          </button>
        </form>

        <div className="login-footer-text">
          <button 
            type="button" 
            className="btn-link"
            onClick={() => setViewMode(viewMode === 'login' ? 'signup' : 'login')}
          >
            {viewMode === 'login' ? "Don't have an account? Register" : "Back to Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessLogin;
