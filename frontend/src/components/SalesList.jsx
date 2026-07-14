import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Trash2, ClipboardList, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { salesApi } from '../api/salesApi';
import { formatCurrency, formatDate, getPaymentMethodLabel, getPaymentMethodColor } from '../utils/formatters';

function SalesList() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchSales() {
      try {
        const res = await salesApi.getAll();
        setSales(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error('Failed to fetch sales:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchTerm.trim()) {
        setFiltered(sales);
        return;
      }
      const term = searchTerm.toLowerCase();
      setFiltered(
        sales.filter(
          (sale) =>
            (sale.invoiceNumber || '').toLowerCase().includes(term) ||
            (sale.customerName || '').toLowerCase().includes(term)
        )
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, sales]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this sale?')) return;
    try {
      await salesApi.delete(id);
      setSales((prev) => prev.filter((s) => s.id !== id));
      toast.success('Sale deleted');
    } catch (err) {
      toast.error('Failed to delete sale');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Sales History</h1>
        </div>
        <div className="card">
          {[1, 2, 3].map((i) => (
            <div className="skeleton skeleton-card" key={i}>
              <div className="skeleton-text" />
              <div className="skeleton-text" />
              <div className="skeleton-text" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Sales History</h1>
        <p className="page-subtitle">{sales.length} total records</p>
      </div>

      <div className="search-container animate-fade-in-up delay-1">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          className="search-input"
          placeholder="Search by invoice or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filtered.length > 0 ? (
        <div className="card animate-fade-in-up delay-2">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale, index) => (
                <tr
                  key={sale.id}
                  onClick={() => navigate(`/sales/${sale.id}`)}
                  style={{ cursor: 'pointer' }}
                  className={`animate-fade-in-up delay-${Math.min(index + 1, 6)}`}
                >
                  <td style={{ fontWeight: 600 }}>{sale.invoiceNumber}</td>
                  <td>{sale.customerName}</td>
                  <td>{sale.items?.length ?? 0}</td>
                  <td>{formatCurrency(sale.totalAmount)}</td>
                  <td>
                    <span className={`badge ${getPaymentMethodColor(sale.paymentMethod)}`}>
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </span>
                  </td>
                  <td>{formatDate(sale.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/sales/${sale.id}`);
                        }}
                        title="View invoice"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/sales/${sale.id}?autoPrint=true`);
                        }}
                        title="Print invoice"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={(e) => handleDelete(e, sale.id)}
                        title="Delete sale"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card animate-fade-in-up delay-2">
          <div className="empty-state">
            <div className="empty-icon"><ClipboardList size={40} /></div>
            <h3 className="empty-title">
              {searchTerm ? 'No matching sales' : 'No sales recorded'}
            </h3>
            <p className="empty-message">
              {searchTerm
                ? 'Try a different search term.'
                : 'Start by recording your first sale.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesList;
