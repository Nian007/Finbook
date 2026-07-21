import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IndianRupee, TrendingUp, Wallet, ShoppingCart, ArrowUpRight, Plus } from 'lucide-react';
import { salesApi } from '../api/salesApi';
import { formatCurrency, formatDate, getPaymentMethodLabel, getPaymentMethodColor } from '../utils/formatters';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function Dashboard({ businessName, subStatus }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, salesRes] = await Promise.all([
          salesApi.getStats(),
          salesApi.getAll(),
        ]);
        setStats(statsRes.data);
        setRecentSales(salesRes.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const totalRevenue = stats?.totalRevenue ?? 0;
  const todayRevenue = stats?.todayRevenue ?? 0;
  const todaySalesCount = stats?.todaySalesCount ?? 0;
  const totalSalesCount = stats?.totalSalesCount ?? 0;

  return (
    <div className="page-container">
      {/* 24h Expiry Warning Banner */}
      {subStatus?.expiresWithin24h && (
        <div className="expiry-banner">
          ⚠️ Your subscription expires tomorrow!{' '}
          <Link to="/subscribe" className="expiry-banner-link">Renew now →</Link>
        </div>
      )}

      <div className="page-header animate-fade-in-up">
        <p className="page-greeting">{getGreeting()}{businessName ? `, ${businessName}` : ''}</p>
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="hero-card animate-fade-in-up delay-1">
        <span className="hero-label">Total Revenue</span>
        <div className="hero-amount">{formatCurrency(totalRevenue)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          <ArrowUpRight size={14} style={{ color: '#26C281' }} />
          <span style={{ color: '#26C281', fontWeight: 600 }}>{formatCurrency(todayRevenue)}</span>
          <span>today</span>
        </div>
      </div>

      <div className="stats-grid animate-fade-in-up delay-2">
        <div className="stat-card blue">
          <div className="stat-icon blue"><ShoppingCart size={20} /></div>
          <div className="stat-value">{todaySalesCount}</div>
          <div className="stat-label">Today's Sales</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon gold"><IndianRupee size={20} /></div>
          <div className="stat-value">{formatCurrency(todayRevenue)}</div>
          <div className="stat-label">Today's Revenue</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon emerald"><Wallet size={20} /></div>
          <div className="stat-value">{formatCurrency(totalRevenue)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><TrendingUp size={20} /></div>
          <div className="stat-value">{totalSalesCount}</div>
          <div className="stat-label">Total Sales</div>
        </div>
      </div>

      <div className="card animate-fade-in-up delay-3">
        <div className="card-header">
          <h2 className="card-title">Recent Sales</h2>
          <Link to="/sales" className="btn btn-ghost btn-sm">
            View All <ArrowUpRight size={14} />
          </Link>
        </div>

        {recentSales.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr
                  key={sale.id}
                  onClick={() => navigate(`/sales/${sale.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600 }}>{sale.invoiceNumber}</td>
                  <td>{sale.customerName}</td>
                  <td>{formatCurrency(sale.totalAmount)}</td>
                  <td>
                    <span className={`badge ${getPaymentMethodColor(sale.paymentMethod)}`}>
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </span>
                  </td>
                  <td>{formatDate(sale.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><Plus size={32} /></div>
            <h3 className="empty-title">No sales yet</h3>
            <p className="empty-message">Start by recording your first sale.</p>
            <Link to="/new-sale" className="btn btn-primary" style={{ marginTop: '16px' }}>
              <Plus size={16} /> New Sale
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
