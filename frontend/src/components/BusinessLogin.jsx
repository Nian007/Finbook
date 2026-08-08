import React, { useState } from 'react';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import { login, signup, forgotPassword, resetPassword } from '../api/authApi';
import toast from 'react-hot-toast';

const BusinessLogin = ({ onLogin }) => {
  const [viewMode, setViewMode] = useState('login');
  const [formData, setFormData] = useState({
    businessName: '', ownerName: '', phone: '', password: '', email: '',
    otp: '', newPassword: '', gstin: '', natureOfBusiness: '',
    address: '', pan: '', aadhaar: '', dob: '', businessStatus: 'Individual',
    pinCode: '', bankAccountNumber: '', bankIfsc: '', bankName: ''
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

  const update = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  const titles = {
    login: 'Welcome back',
    signup: 'Create account',
    forgot: 'Reset password',
    reset: 'Enter code'
  };
  const subtitles = {
    login: 'Sign in to manage your business',
    signup: 'Register your business to get started',
    forgot: 'We\'ll send a code to your email',
    reset: 'Enter the code we sent to your email'
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-brand" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
          <TrendingUp size={28} />
          <span>Finbook</span>
        </div>

        <div className="auth-content">
          {viewMode !== 'login' && (
            <button className="auth-back" type="button" onClick={() => setViewMode('login')}>
              <ArrowLeft size={20} /> Back
            </button>
          )}

          <h1 className="auth-title">{titles[viewMode]}</h1>
          <p className="auth-subtitle">{subtitles[viewMode]}</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {viewMode === 'signup' && (
              <>
                <div className="auth-field">
                  <label>Business name</label>
                  <input type="text" required value={formData.businessName}
                    onChange={e => update('businessName', e.target.value)} />
                </div>
                <div className="auth-field">
                  <label>Owner name</label>
                  <input type="text" required value={formData.ownerName}
                    onChange={e => update('ownerName', e.target.value)} />
                </div>
                <div className="auth-field">
                  <label>Email</label>
                  <input type="email" required value={formData.email}
                    onChange={e => update('email', e.target.value)} />
                </div>
                <div className="auth-field">
                  <label>GSTIN (optional)</label>
                  <input type="text" value={formData.gstin}
                    onChange={e => update('gstin', e.target.value.toUpperCase())} />
                </div>
                <div className="auth-field">
                  <label>Nature of business</label>
                  <input type="text" required placeholder="e.g. Kirana, Electronics"
                    value={formData.natureOfBusiness}
                    onChange={e => update('natureOfBusiness', e.target.value)} />
                </div>
              </>
            )}

            {(viewMode === 'login' || viewMode === 'signup' || viewMode === 'forgot') && (
              <div className="auth-field">
                <label>Phone number</label>
                <input type="tel" required pattern="[0-9]{10}" placeholder="10-digit number"
                  value={formData.phone} onChange={e => update('phone', e.target.value)} />
              </div>
            )}

            {(viewMode === 'login' || viewMode === 'signup') && (
              <div className="auth-field">
                <label>Password</label>
                <input type="password" required minLength={8}
                  value={formData.password} onChange={e => update('password', e.target.value)} />
              </div>
            )}

            {viewMode === 'reset' && (
              <>
                <div className="auth-field">
                  <label>4-digit code</label>
                  <input type="text" required pattern="[0-9]{4}"
                    value={formData.otp} onChange={e => update('otp', e.target.value)} />
                </div>
                <div className="auth-field">
                  <label>New password</label>
                  <input type="password" required minLength={8}
                    value={formData.newPassword} onChange={e => update('newPassword', e.target.value)} />
                </div>
              </>
            )}

            {viewMode === 'login' && (
              <div className="auth-forgot-link">
                <button type="button" onClick={() => setViewMode('forgot')}>Forgot password?</button>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? 'Please wait...' : (
                viewMode === 'login' ? 'Sign in' :
                viewMode === 'signup' ? 'Create account' :
                viewMode === 'forgot' ? 'Send code' : 'Reset password'
              )}
            </button>
          </form>

          <div className="auth-switch">
            <button type="button" onClick={() => setViewMode(viewMode === 'login' ? 'signup' : 'login')}>
              {viewMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessLogin;
