import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { salesApi } from '../api/salesApi';
import { formatCurrency, formatDate } from '../utils/formatters';

function OutstandingSales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOutstanding();
  }, []);

  const fetchOutstanding = async () => {
    try {
      const response = await salesApi.getOutstanding();
      setSales(response.data);
    } catch (err) {
      toast.error('Failed to load outstanding sales');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedSale || !paymentAmount) return;
    
    setIsSubmitting(true);
    try {
      await salesApi.recordPayment(selectedSale.id, Number(paymentAmount));
      toast.success('Payment recorded successfully');
      setSelectedSale(null);
      setPaymentAmount('');
      fetchOutstanding();
    } catch (err) {
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="page-container animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title">Khata Book (Outstanding)</h1>
      </div>

      <div className="card">
        {sales.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CheckCircle size={48} style={{ margin: '0 auto 16px auto', color: '#10b981' }} />
            <h3>All clear!</h3>
            <p>You have no outstanding payments to collect.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Amount Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const total = sale.totalAmount;
                  const paid = sale.amountPaid || 0;
                  const balance = total - paid;
                  
                  return (
                    <tr key={sale.id}>
                      <td>{formatDate(sale.createdAt)}</td>
                      <td>{sale.customerName}</td>
                      <td>{formatCurrency(total)}</td>
                      <td style={{ color: '#10b981' }}>{formatCurrency(paid)}</td>
                      <td style={{ color: '#ef4444', fontWeight: '600' }}>{formatCurrency(balance)}</td>
                      <td>
                        <span className={`status-badge ${sale.paymentStatus ? sale.paymentStatus.toLowerCase() : 'paid'}`}>
                          {sale.paymentStatus || 'PAID'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-outline" 
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => {
                            setSelectedSale(sale);
                            setPaymentAmount(balance);
                          }}
                        >
                          Collect Payment
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedSale && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '20px' }}>
            <h3 style={{ marginTop: 0 }}>Record Payment</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Customer: <strong>{selectedSale.customerName}</strong><br />
              Balance Due: <strong>{formatCurrency(selectedSale.totalAmount - (selectedSale.amountPaid || 0))}</strong>
            </p>
            
            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label className="form-label">Payment Amount (₹)</label>
                <input 
                  type="number" 
                  min="1" 
                  step="0.01"
                  max={selectedSale.totalAmount - (selectedSale.amountPaid || 0)}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  required 
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setSelectedSale(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OutstandingSales;
