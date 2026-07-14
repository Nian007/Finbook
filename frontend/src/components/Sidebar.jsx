import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ClipboardList, Receipt, LogOut } from 'lucide-react';

function Sidebar({ businessName, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Receipt size={20} />
        </div>
        <div>
          <span className="sidebar-logo-text">ShopLedger</span>
          <div className="sidebar-logo-subtitle">{businessName}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="nav-link-icon"><LayoutDashboard size={18} /></span>
          Dashboard
        </NavLink>
        <NavLink
          to="/new-sale"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="nav-link-icon"><PlusCircle size={18} /></span>
          New Sale
        </NavLink>
        <NavLink
          to="/sales"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="nav-link-icon"><ClipboardList size={18} /></span>
          Sales History
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            className="btn btn-ghost btn-full"
            onClick={onLogout}
            style={{ justifyContent: 'center', color: 'var(--accent-crimson)', borderColor: 'rgba(255,0,85,0.2)' }}
          >
            <LogOut size={16} />
            Logout
          </button>
          <span style={{ textAlign: 'center' }}>&copy; 2026 ShopLedger</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
