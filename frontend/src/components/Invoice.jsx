import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Printer, ArrowLeft, FileText } from 'lucide-react';
import { salesApi } from '../api/salesApi';
import { formatCurrency, formatDate, getPaymentMethodLabel, getPaymentMethodColor } from '../utils/formatters';

function Invoice({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function fetchSale() {
      try {
        const res = await salesApi.getById(id);
        setSale(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invoice not found');
      } finally {
        setLoading(false);
      }
    }
    fetchSale();
  }, [id]);

  useEffect(() => {
    if (!loading && sale && searchParams.get('autoPrint') === 'true') {
      // Small timeout to ensure rendering is complete before printing
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, sale, searchParams]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon"><FileText size={40} /></div>
          <h3 className="empty-title">Invoice Not Found</h3>
          <p className="empty-message">{error || 'The requested invoice does not exist.'}</p>
          <button className="btn btn-ghost" onClick={() => navigate('/sales')} style={{ marginTop: '16px' }}>
            <ArrowLeft size={16} /> Back to Sales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in-up">
      <div className="invoice-actions">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> Print Invoice
        </button>
      </div>

      <div className="invoice-container">
        <div className="invoice-card">
          <div className="invoice-header">
            <div>
              <h1 className="invoice-title">INVOICE</h1>
            </div>
            <div className="invoice-meta">
              <div>
                <span className="invoice-meta-label">Invoice No.</span>
                <span className="invoice-meta-value">{sale.invoiceNumber}</span>
              </div>
              <div>
                <span className="invoice-meta-label">Date</span>
                <span className="invoice-meta-value">{formatDate(sale.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="invoice-parties">
            <div>
              <h4 className="invoice-party-title">From</h4>
              <p className="invoice-party-name">{currentUser?.businessName || 'Your Shop'}</p>
              <p className="invoice-party-detail">Phone: {currentUser?.phone || 'N/A'}</p>
            </div>
            <div>
              <h4 className="invoice-party-title">To</h4>
              <p className="invoice-party-name">{sale.customerName}</p>
              {sale.customerPhone && (
                <p className="invoice-party-detail">Phone: {sale.customerPhone}</p>
              )}
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-total-row">
            <span className="invoice-total-label">Grand Total</span>
            <span className="invoice-total-value">{formatCurrency(sale.totalAmount)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Payment:</span>
            <span className={`badge ${getPaymentMethodColor(sale.paymentMethod)}`}>
              {getPaymentMethodLabel(sale.paymentMethod)}
            </span>
          </div>

          {sale.notes && (
            <div style={{ padding: '12px 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Notes:</strong> {sale.notes}
            </div>
          )}

          <div className="invoice-footer">
            Thank you for your business!
          </div>
        </div>
      </div>
    </div>
  );
}

export default Invoice;
