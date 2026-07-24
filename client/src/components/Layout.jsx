import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  Wallet,
  Bus,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Mic,
  Bell,
  ChevronDown
} from 'lucide-react';
import '../layout.css';

export default function Layout({ children }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const name = profile?.name || user?.user_metadata?.full_name || 'Admin User';
  const roleDisplay = profile?.role === 'admin' ? 'Administrator' : 'Teacher';
  const avatarUrl = user?.user_metadata?.avatar_url || null;

  return (
    <div className="app-layout">
      {/* Left Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <GraduationCap size={32} />
          </div>
          <div className="sidebar-title">BGS Institutional</div>
          <div className="sidebar-subtitle">Admin Portal</div>
        </div>

        <nav className="sidebar-menu">
          <div className="sidebar-menu-label">Menu</div>
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/report" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <GraduationCap size={20} /> Academic
          </NavLink>
          <NavLink to="/fees" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Wallet size={20} /> Finance
          </NavLink>
          <NavLink to="/transportation" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Bus size={20} /> Transport
          </NavLink>
          <NavLink to="/personnel" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Users size={20} /> Personnel
          </NavLink>

          <div className="sidebar-menu-label">System</div>
          <NavLink to="/settings" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Settings size={20} /> Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-item" style={{ cursor: 'pointer' }}>
            <HelpCircle size={20} /> Support
          </div>
          <div className="sidebar-item" onClick={handleLogout} style={{ cursor: 'pointer', marginTop: 4 }}>
            <LogOut size={20} /> Logout
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="search-bar">
            <Search size={18} className="header-icon" />
            <input type="text" placeholder="Search anything..." className="search-input" />
            <Mic size={18} className="header-icon" />
          </div>

          <div className="header-actions">
            <Bell size={20} className="header-icon" />
            <div className="user-profile">
              <img src={avatarUrl || "https://ui-avatars.com/api/?name=" + name + "&background=1f2937&color=fff"} alt="" className="user-avatar" />
              <div className="user-info">
                <span className="user-name">{name}</span>
                <span className="user-role">{roleDisplay}</span>
              </div>
              <ChevronDown size={16} className="header-icon" style={{ marginLeft: 4 }} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
