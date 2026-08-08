import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, ShieldCheck, Zap, BarChart3, TrendingUp } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-container revolut-style">
      {/* Navbar */}
      <nav className="landing-nav-modern">
        <div className="nav-logo">
          <div className="logo-icon-minimal">
            <TrendingUp size={24} color="#FFF" />
          </div>
          <h2>Finbook</h2>
        </div>
        <div className="nav-actions">
          <button className="btn-minimal" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn-pill" onClick={() => navigate('/login')}>Sign up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section-modern">
        <div className="hero-content-modern">
          <h1 className="hero-title-massive">
            One app, all things <br/><span className="text-highlight">business.</span>
          </h1>
          <p className="hero-subtitle-minimal">
            Join thousands of smart shopkeepers taking their business digital. 
            Track sales, manage outstanding khata, and watch your profits grow.
          </p>
          <div className="hero-ctas-modern">
            <button className="btn-pill large" onClick={() => navigate('/login')}>
              Get Started
            </button>
          </div>
        </div>
        
        {/* Abstract 3D / Graphic Representation */}
        <div className="hero-graphic">
          <div className="abstract-shape shape-1"></div>
          <div className="abstract-shape shape-2"></div>
          
          <div className="floating-ui-card">
            <div className="card-header">
              <span className="dot"></span>
              <span>Total Revenue</span>
            </div>
            <div className="card-amount">₹42,500</div>
            <div className="card-chart">
              <div className="bar b1"></div>
              <div className="bar b2"></div>
              <div className="bar b3"></div>
              <div className="bar b4"></div>
              <div className="bar b5"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Minimal */}
      <section className="features-minimal">
        <div className="features-grid-modern">
          <div className="feature-cell">
            <div className="icon-wrapper"><BarChart3 size={24} /></div>
            <h3>Smart Analytics</h3>
            <p>Know exactly what's selling and your profit margins at a glance.</p>
          </div>
          <div className="feature-cell">
            <div className="icon-wrapper"><IndianRupee size={24} /></div>
            <h3>Khata Book</h3>
            <p>Track outstanding payments and collect dues with ease.</p>
          </div>
          <div className="feature-cell">
            <div className="icon-wrapper"><Zap size={24} /></div>
            <h3>Instant Invoicing</h3>
            <p>Generate clean, professional receipts instantly for your customers.</p>
          </div>
          <div className="feature-cell">
            <div className="icon-wrapper"><ShieldCheck size={24} /></div>
            <h3>Bank-grade Security</h3>
            <p>Your business data is encrypted and backed up securely in the cloud.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-minimal">
        <h2>Ready to go digital?</h2>
        <button className="btn-pill large dark-btn" onClick={() => navigate('/login')}>
          Create free account
        </button>
      </section>

      {/* Footer */}
      <footer className="footer-minimal">
        <div className="footer-content">
          <div className="footer-brand">Finbook &copy; {new Date().getFullYear()}</div>
          <div className="footer-links">
            <span>Terms</span>
            <span>Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
