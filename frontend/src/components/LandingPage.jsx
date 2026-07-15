import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, FileText, TrendingUp, CheckCircle, Play } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <div className="logo-icon">
            <TrendingUp size={24} color="#FFD700" />
          </div>
          <h2>Finbook</h2>
        </div>
        <div className="nav-actions">
          <button className="btn-secondary" onClick={() => navigate('/login')}>Login</button>
          <button className="btn-primary" onClick={() => navigate('/login')}>Start Free</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge">✨ The #1 Billing App for Indian Businesses</div>
          <h1 className="hero-title">
            Bol kar Sale Likhein.<br />
            <span className="gradient-text">We'll do the rest.</span>
          </h1>
          <p className="hero-subtitle">
            Record sales, generate professional invoices, and track payments instantly. 
            No typing required—just speak naturally in Hindi or Hinglish!
          </p>
          <div className="hero-ctas">
            <button className="btn-primary large-btn" onClick={() => navigate('/login')}>
              Start Free Now
            </button>
            <button className="btn-outline large-btn">
              <Play size={20} /> Watch Demo
            </button>
          </div>
          <div className="trust-indicators">
            <span><CheckCircle size={16} /> Free to start</span>
            <span><CheckCircle size={16} /> No credit card</span>
            <span><CheckCircle size={16} /> Made for India</span>
          </div>
        </div>
        <div className="hero-image-wrapper">
          <div className="glass-panel main-image-panel">
            <img 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" 
              alt="Indian shop owner using a smartphone"
              className="hero-img"
            />
            <div className="floating-card sale-success-card">
              <div className="success-icon-wrapper"><CheckCircle size={24} color="#26C281" /></div>
              <div className="card-text">
                <span className="card-title">Sale Recorded!</span>
                <span className="card-amount">₹450.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Voice Feature Block */}
      <section className="voice-feature-section">
        <div className="section-header">
          <h2>No Typing. <span className="gradient-text">Just Talk.</span></h2>
          <p>Keep your hands free while serving customers. Finbook understands your natural language.</p>
        </div>
        
        <div className="voice-demo-container">
          <div className="demo-step speaker-step">
            <div className="pulsing-mic">
              <Mic size={32} color="#FFFFFF" />
            </div>
            <div className="speech-bubble">
              "Raju ne 2 soap liye aur 100 rs diye..."
            </div>
          </div>
          
          <div className="demo-arrow">
            <div className="animated-line"></div>
          </div>
          
          <div className="demo-step result-step">
            <div className="invoice-mockup">
              <div className="invoice-header">
                <span className="customer-name">Raju</span>
                <span className="invoice-badge paid">PAID</span>
              </div>
              <div className="invoice-items">
                <div className="item-row">
                  <span>Soap (x2)</span>
                  <span>₹100</span>
                </div>
              </div>
              <div className="invoice-total">
                <span>Total</span>
                <span>₹100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="features-section">
        <h2 className="section-title">Everything your business needs</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><Mic size={28} /></div>
            <h3>Voice Entry</h3>
            <p>Log sales in seconds just by speaking. Perfect for busy counters.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FileText size={28} /></div>
            <h3>Instant Invoices</h3>
            <p>Generate and share professional PDF receipts directly on WhatsApp.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><TrendingUp size={28} /></div>
            <h3>Track Payments</h3>
            <p>Never lose track of udhaar. Know exactly who owes you what.</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works-section">
        <h2 className="section-title">How it works</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Tap the Mic</h3>
            <p>Open the app and hit the microphone button.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Speak Naturally</h3>
            <p>Say what you sold, to whom, and how much they paid.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Done!</h3>
            <p>Finbook automatically creates the sale and updates inventory.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta-section">
        <div className="cta-content">
          <h2>Ready to upgrade your shop?</h2>
          <p>Join thousands of smart shopkeepers taking their business digital.</p>
          <button className="btn-primary giant-btn" onClick={() => navigate('/login')}>
            Start Using Finbook Free
          </button>
          <p className="reassurance">Free to get started • No setup hassle</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <TrendingUp size={20} color="#FFD700" />
            <span>Finbook</span>
          </div>
          <div className="footer-links">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
