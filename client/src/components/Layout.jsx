import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  PenLine,
  CalendarDays,
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
      {/* Top Nav Pill */}
      <header className="top-nav">
        <div className="nav-links">
          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-main)', marginRight: 24, paddingLeft: 8 }}>
            BGS
          </div>
          
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard className="nav-icon" /> Dashboard
          </NavLink>
          <NavLink to="/report" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText className="nav-icon" /> Report
          </NavLink>
          <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardCheck className="nav-icon" /> Attendance
          </NavLink>
          <NavLink to="/marks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <PenLine className="nav-icon" /> Marks
          </NavLink>
          <NavLink to="/meetings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CalendarDays className="nav-icon" /> Meetings
          </NavLink>
        </div>

        <div className="top-nav-right">
          <div className="user-profile-pill" onClick={handleLogout} title="Sign Out">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="user-avatar" referrerPolicy="no-referrer" />
            ) : (
              <div className="user-avatar-placeholder">{initials}</div>
            )}
            <div className="user-name" style={{ marginRight: 4 }}>{name}</div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
