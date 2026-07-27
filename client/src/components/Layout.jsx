import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  Wallet,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Mic,
  Bell,
  ChevronDown,
  BookOpen,
  Calendar,
  CheckSquare,
  ClipboardList,
  Video
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
          <div className="sidebar-subtitle">{profile?.role === 'admin' ? 'Admin Portal' : 'Teachers Portal'}</div>
        </div>

        <nav className="sidebar-menu">
          {profile?.role === 'admin' ? (
            <>
              <div className="sidebar-menu-label">Admin Menu</div>
              <NavLink to="/dashboard" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={20} /> Dashboard
              </NavLink>
              <NavLink to="/students" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <Users size={20} /> Students
              </NavLink>
              <NavLink to="/academic" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <BookOpen size={20} /> Academic
              </NavLink>
              <NavLink to="/admin/timetable" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <Calendar size={20} /> Timetable
              </NavLink>
              <NavLink to="/fees" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <Wallet size={20} /> Finance
              </NavLink>
              <NavLink to="/personnel" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <Users size={20} /> Personnel
              </NavLink>
            </>
          ) : (
            <>
              <div className="sidebar-menu-label">Teacher Portal</div>
              <NavLink to="/dashboard" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={20} /> Dashboard
              </NavLink>
              <NavLink to="/tasks" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <CheckSquare size={20} /> Tasks
              </NavLink>
              <NavLink to="/timetable" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <Calendar size={20} /> Timetable
              </NavLink>
              <NavLink to="/marks" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <ClipboardList size={20} /> Mark Entry
              </NavLink>
              <NavLink to="/syllabus" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <BookOpen size={20} /> Syllabus Tracker
              </NavLink>
              <NavLink to="/meetings" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <Video size={20} /> Meetings
              </NavLink>
              <NavLink to="/attendance" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <Users size={20} /> Attendance
              </NavLink>
              <NavLink to="/report" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <GraduationCap size={20} /> Reports
              </NavLink>
            </>
          )}

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
