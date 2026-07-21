import { useState, useEffect } from 'react';
import { subscriptionApi } from '../api/featureApi';
import toast from 'react-hot-toast';

const UPI_ID = 'angralnikhil99@okhdfcbank';

export default function SubscribePage() {
  const [plans, setPlans] = useState([]);
  const [step, setStep] = useState('plans'); // plans → payment → utr → pending
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pendingSub, setPendingSub] = useState(null);
  const [utrInput, setUtrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    subscriptionApi.getPlans().then(r => setPlans(r.data)).catch(() => {});
    subscriptionApi.getStatus().then(r => setStatus(r.data)).catch(() => {});
  }, []);

  const formatPrice = (paise) => '₹' + (paise / 100).toLocaleString('en-IN');

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handleInitiate = async () => {
    setLoading(true);
    try {
      const r = await subscriptionApi.initiate(selectedPlan.id);
      setPendingSub(r.data);
      setStep('utr');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to initiate. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUtr = async () => {
    if (!utrInput.trim()) { toast.error('Please enter your UTR number'); return; }
    setLoading(true);
    try {
      await subscriptionApi.submitUtr(pendingSub.subscriptionId, utrInput.trim());
      setStep('pending');
      toast.success('UTR submitted! Awaiting admin verification.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit UTR.');
    } finally {
      setLoading(false);
    }
  };

  const upiUrl = selectedPlan
    ? `upi://pay?pa=${UPI_ID}&pn=Finbook&am=${selectedPlan.priceInPaise / 100}&cu=INR&tn=Finbook+${selectedPlan.name}+Plan`
    : '';

  return (
    <div className="subscribe-page">
      <div className="subscribe-header">
        <h1>Choose Your Plan</h1>
        <p>All prices inclusive of GST · Cancel anytime</p>
      </div>

      {/* Current status banner */}
      {status && (
        <>
          {/* Active/Trial banner */}
          {status.isAllowed && (
            <div className="sub-status-banner success" style={{ background: 'rgba(38, 194, 129, 0.1)', border: '1px solid #26C281', color: '#26C281', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <h3>✅ Active Subscription</h3>
              <p>You are currently on the <strong>{status.planName}</strong> plan.</p>
              <p>Your access is valid until: <strong>{new Date(status.endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
              <p style={{ marginTop: '8px', fontSize: '0.9rem', opacity: 0.8 }}>You can choose a plan below to extend your subscription.</p>
            </div>
          )}

          {/* Blocked/Pending banner */}
          {!status.isAllowed && status.status !== 'NONE' && (
            <div className="sub-status-banner warning">
              Your subscription is <strong>{status.status.replace('_', ' ')}</strong>.
              {status.status === 'PENDING_VERIFICATION' && status.utrNumber &&
                ' UTR submitted, waiting for admin approval.'}
            </div>
          )}
        </>
      )}

      {/* Step: Plan Selection */}
      {step === 'plans' && (
        <div className="plan-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${plan.name === 'Yearly' ? 'plan-card--featured' : ''}`}
              onClick={() => handleSelectPlan(plan)}
            >
              {plan.name === 'Yearly' && <div className="plan-badge">Best Value</div>}
              <h2 className="plan-name">{plan.name}</h2>
              <div className="plan-price">
                <span className="plan-amount">{formatPrice(plan.priceInPaise)}</span>
                <span className="plan-gst">Incl. GST</span>
              </div>
              <p className="plan-desc">{plan.description}</p>
              <p className="plan-duration">{plan.durationDays} days access</p>
              <button className="btn btn-primary plan-btn">Select</button>
            </div>
          ))}
        </div>
      )}

      {/* Step: Payment Instructions */}
      {step === 'payment' && selectedPlan && (
        <div className="payment-card">
          <button className="btn-back" onClick={() => setStep('plans')}>← Back</button>
          <h2>Pay for <span className="accent">{selectedPlan.name}</span> Plan</h2>
          <p className="payment-amount">{formatPrice(selectedPlan.priceInPaise)} <span className="gst-label">Incl. GST</span></p>

          <div className="upi-box">
            <p className="upi-label">Pay via UPI</p>
            <div className="upi-id-display">
              <span>{UPI_ID}</span>
              <button className="btn-copy" onClick={() => { navigator.clipboard.writeText(UPI_ID); toast.success('UPI ID copied!'); }}>Copy</button>
            </div>
            <a href={upiUrl} className="btn btn-primary upi-app-btn">Open UPI App →</a>
            <p className="upi-hint">Works with Google Pay, PhonePe, Paytm, BHIM</p>
          </div>

          <div className="payment-steps">
            <div className="payment-step"><span>1</span>Pay <strong>{formatPrice(selectedPlan.priceInPaise)}</strong> to the UPI ID above</div>
            <div className="payment-step"><span>2</span>Note your <strong>UTR / Transaction ID</strong> from payment app</div>
            <div className="payment-step"><span>3</span>Click below and enter your UTR</div>
          </div>

          <button className="btn btn-primary" onClick={handleInitiate} disabled={loading}>
            {loading ? 'Processing…' : "I've Paid — Enter UTR →"}
          </button>
        </div>
      )}

      {/* Step: UTR Entry */}
      {step === 'utr' && (
        <div className="payment-card">
          <h2>Enter Payment Reference</h2>
          <p>Your UTR / transaction ID proves payment. We will verify and activate within a few hours.</p>
          <div className="utr-form">
            <input
              id="utr-input"
              className="input-field"
              placeholder="e.g. 407812345678 or T2407..."
              value={utrInput}
              onChange={e => setUtrInput(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSubmitUtr} disabled={loading || !utrInput.trim()}>
              {loading ? 'Submitting…' : 'Submit UTR'}
            </button>
          </div>
          <p className="utr-note">⚠️ Do not close this page before submitting. You won't get access until UTR is verified.</p>
        </div>
      )}

      {/* Step: Pending */}
      {step === 'pending' && (
        <div className="payment-card pending-card">
          <div className="pending-icon">🕐</div>
          <h2>Verification Pending</h2>
          <p>Your payment reference has been received. Once verified by admin, your subscription will activate automatically.</p>
          <p className="pending-note">Typically takes a few hours during business hours.</p>
        </div>
      )}
    </div>
  );
}
