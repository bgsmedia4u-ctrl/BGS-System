import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  PenLine,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const name = profile?.name || user?.user_metadata?.full_name || 'Teacher';
  const email = profile?.email || user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url || null;

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="app-layout">
      {/* Mobile menu button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">B</div>
          <div>
            <div className="sidebar-title">BGS Portal</div>
            <div className="sidebar-subtitle">Teachers Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Main</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard className="nav-icon" />
            Dashboard
          </NavLink>
          <NavLink
            to="/report"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <FileText className="nav-icon" />
            Weekly Report
          </NavLink>

          <div className="nav-section-title" style={{ marginTop: 16 }}>Academics</div>
          <NavLink
            to="/attendance"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <ClipboardCheck className="nav-icon" />
            Mark Attendance
            <span style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 700,
              background: 'rgba(251,191,36,0.15)', color: 'var(--warning)',
              padding: '2px 7px', borderRadius: 6,
            }}>SOON</span>
          </NavLink>
          <NavLink
            to="/marks"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <PenLine className="nav-icon" />
            Enter Marks
            <span style={{
              marginLeft: 'auto', fontSize: 10, fontWeight: 700,
              background: 'rgba(251,191,36,0.15)', color: 'var(--warning)',
              padding: '2px 7px', borderRadius: 6,
            }}>SOON</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="user-avatar" referrerPolicy="no-referrer" />
            ) : (
              <div className="user-avatar-placeholder">{initials}</div>
            )}
            <div className="user-info">
              <div className="user-name">{name}</div>
              <div className="user-role">
                {profile?.role || 'teacher'}
              </div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ marginTop: 8, color: 'var(--error)' }}>
            <LogOut className="nav-icon" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
