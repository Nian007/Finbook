import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ClipboardList, Receipt, LogOut, Package, CreditCard, ShieldCheck } from 'lucide-react';

function Sidebar({ businessName, onLogout, role, subStatus }) {
  const isSuperAdmin = role === 'super_admin';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Receipt size={20} />
        </div>
        <div>
          <span className="sidebar-logo-text">Finbook</span>
          <div className="sidebar-logo-subtitle">{businessName}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-link-icon"><LayoutDashboard size={18} /></span>
          Dashboard
        </NavLink>
        <NavLink to="/new-sale" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-link-icon"><PlusCircle size={18} /></span>
          New Sale
        </NavLink>
        <NavLink to="/sales" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-link-icon"><ClipboardList size={18} /></span>
          Sales History
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-link-icon"><Package size={18} /></span>
          Inventory
        </NavLink>
        <NavLink to="/subscribe" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-link-icon"><CreditCard size={18} /></span>
          Subscription
          {subStatus?.expiresWithin24h && <span className="nav-badge nav-badge--warn">!</span>}
        </NavLink>
        {isSuperAdmin && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-link-icon"><ShieldCheck size={18} /></span>
            Admin Panel
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Subscription status chip */}
          {subStatus && (
            <div className={`sub-chip sub-chip--${subStatus.status?.toLowerCase()}`}>
              {subStatus.status === 'ACTIVE' || subStatus.status === 'TRIAL'
                ? `✓ ${subStatus.planName || 'Trial'} · ${subStatus.endDate ? new Date(subStatus.endDate).toLocaleDateString('en-IN') : ''}`
                : subStatus.status === 'PENDING_VERIFICATION' ? '⏳ Awaiting verification'
                : '⚠ No active plan'}
            </div>
          )}
          <button
            className="btn btn-ghost btn-full"
            onClick={onLogout}
            style={{ justifyContent: 'center', color: 'var(--accent-crimson)', borderColor: 'rgba(255,0,85,0.2)' }}
          >
            <LogOut size={16} />
            Logout
          </button>
          <span style={{ textAlign: 'center' }}>&copy; 2026 Finbook</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
