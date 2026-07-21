import { useState, useEffect } from 'react';
import { adminApi } from '../api/featureApi';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [pending, setPending] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [grantForm, setGrantForm] = useState({ businessId: '', durationDays: 30, note: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [p, a] = await Promise.all([adminApi.getPending(), adminApi.getAuditLog()]);
      setPending(p.data);
      setAuditLog(a.data);
    } catch {
      toast.error('Failed to load admin data. Check your role.');
    }
  };

  const handleActivate = async (id, businessName) => {
    if (!confirm(`Activate subscription for ${businessName}?`)) return;
    setLoading(true);
    try {
      await adminApi.activate(id);
      toast.success(`✅ Subscription activated for ${businessName}`);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Activation failed');
    } finally { setLoading(false); }
  };

  const handleGrantTrial = async () => {
    if (!grantForm.businessId) { toast.error('Enter a Business ID'); return; }
    setLoading(true);
    try {
      const r = await adminApi.grantTrial(
        parseInt(grantForm.businessId),
        parseInt(grantForm.durationDays),
        grantForm.note
      );
      toast.success(r.data.message + ' Expires: ' + new Date(r.data.endDate).toLocaleDateString('en-IN'));
      setGrantForm({ businessId: '', durationDays: 30, note: '' });
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Grant failed');
    } finally { setLoading(false); }
  };

  const formatDate = (dt) => dt ? new Date(dt).toLocaleString('en-IN') : '—';
  const formatAmount = (a) => a ? '₹' + a.toLocaleString('en-IN') : '—';

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🛡️ Admin Panel</h1>
        <p>Subscription management · Audit trail</p>
      </div>

      <div className="admin-tabs">
        {['pending', 'grant', 'audit'].map(tab => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'pending' ? `Pending (${pending.length})` : tab === 'grant' ? 'Grant Access' : 'Audit Log'}
          </button>
        ))}
      </div>

      {/* Pending Verifications */}
      {activeTab === 'pending' && (
        <div className="admin-section">
          {pending.length === 0
            ? <p className="empty-state">No pending verifications 🎉</p>
            : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Phone</th>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>UTR Number</th>
                      <th>Submitted</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(sub => (
                      <tr key={sub.id}>
                        <td>{sub.businessName}</td>
                        <td>{sub.businessPhone}</td>
                        <td>{sub.planName}</td>
                        <td>{formatAmount(sub.amount)}</td>
                        <td className="utr-cell">
                          {sub.utrNumber
                            ? <span className="utr-value">{sub.utrNumber}</span>
                            : <span className="utr-missing">Not submitted yet</span>}
                        </td>
                        <td>{formatDate(sub.createdAt)}</td>
                        <td>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleActivate(sub.id, sub.businessName)}
                            disabled={loading || !sub.utrNumber}
                          >
                            Activate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* Grant Free Access */}
      {activeTab === 'grant' && (
        <div className="admin-section">
          <div className="grant-card">
            <h2>Grant Free Access</h2>
            <p>Give a business access without payment. This is logged and auditable.</p>
            <div className="grant-form">
              <div className="form-row">
                <label>Business ID</label>
                <input
                  id="grant-business-id"
                  className="input-field"
                  placeholder="e.g. 12"
                  value={grantForm.businessId}
                  onChange={e => setGrantForm(f => ({ ...f, businessId: e.target.value }))}
                />
                <small>You can find the Business ID from the audit log or DB</small>
              </div>
              <div className="form-row">
                <label>Duration (days)</label>
                <select
                  id="grant-duration"
                  className="input-field"
                  value={grantForm.durationDays}
                  onChange={e => setGrantForm(f => ({ ...f, durationDays: e.target.value }))}
                >
                  <option value={7}>7 days (1 week)</option>
                  <option value={14}>14 days (2 weeks)</option>
                  <option value={30}>30 days (1 month)</option>
                  <option value={90}>90 days (3 months)</option>
                  <option value={180}>180 days (6 months)</option>
                  <option value={365}>365 days (1 year)</option>
                </select>
              </div>
              <div className="form-row">
                <label>Note (internal)</label>
                <input
                  id="grant-note"
                  className="input-field"
                  placeholder="e.g. Beta tester, Family friend, Pilot business"
                  value={grantForm.note}
                  onChange={e => setGrantForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>
              <button className="btn btn-primary" onClick={handleGrantTrial} disabled={loading}>
                {loading ? 'Granting…' : '✨ Grant Free Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {activeTab === 'audit' && (
        <div className="admin-section">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Subscription ID</th>
                  <th>Change</th>
                  <th>By</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map(log => (
                  <tr key={log.id}>
                    <td>{formatDate(log.timestamp)}</td>
                    <td>#{log.subscription?.id || '—'}</td>
                    <td>
                      <span className="status-chip">{log.previousStatus || 'NEW'}</span>
                      {' → '}
                      <span className={`status-chip status-chip--${log.newStatus?.toLowerCase()}`}>{log.newStatus}</span>
                    </td>
                    <td>{log.performedByPhone || 'System'}</td>
                    <td className="audit-note">{log.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
