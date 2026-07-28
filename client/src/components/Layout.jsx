import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../api/supabase';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  GraduationCap,
  Wallet,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  ChevronDown,
  BookOpen,
  Calendar,
  CheckSquare,
  ClipboardList,
  Video,
  Bus,
  UserCheck,
  Shield,
  CheckCircle,
  Clock,
  ExternalLink,
  X,
  Menu
} from 'lucide-react';
import '../layout.css';

export default function Layout({ children }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  async function fetchNotifications() {
    try {
      const { data: ann } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (ann && ann.length > 0) {
        const mapped = ann.map(a => ({
          id: a.id,
          title: a.title || 'New Institutional Announcement',
          message: a.body || 'Please review updated academic schedules.',
          time: a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Today',
          read: false,
          type: 'announcement'
        }));
        setNotifications(mapped);
        setUnreadCount(mapped.length);
      } else {
        // Fallback production alerts if database table is empty or newly initialized
        setNotifications([
          { id: '1', title: 'College Prayer Schedule', message: 'Prayer period (9:30 – 9:45 AM) is established across all timetables.', time: 'Today', read: false, type: 'schedule' },
          { id: '2', title: 'Academic Marks Protection', message: 'System Update: Mark entry is now strictly locked to authorized teaching faculty.', time: 'Yesterday', read: false, type: 'security' },
          { id: '3', title: 'Free Period Detection Live', message: 'Automated free faculty discovery tool is now active on dashboard.', time: '2 days ago', read: false, type: 'feature' }
        ]);
        setUnreadCount(3);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const name = profile?.name || user?.user_metadata?.full_name || 'Admin User';
  const roleDisplay = profile?.role === 'admin' ? 'Administrator' : 'Teacher';
  const avatarUrl = user?.user_metadata?.avatar_url || null;

  return (
    <div className="app-layout">
      {/* Mobile Menu Button */}
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu">
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Left Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} onClick={() => { if (window.innerWidth <= 768) setSidebarOpen(false); }}>
        <div className="sidebar-header" style={{ position: 'relative' }}>
          {sidebarOpen && (
            <button
              onClick={(e) => { e.stopPropagation(); setSidebarOpen(false); }}
              style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
            >
              <X size={18} />
            </button>
          )}
          <div style={{ width: '68px', height: '68px', margin: '0 auto 12px auto', borderRadius: '50%', overflow: 'hidden', background: '#ffffff', border: '2px solid rgba(255, 255, 255, 0.25)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
            <img src="/Logo-removebg-preview.png" alt="BGS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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

              <NavLink to="/admin/tasks" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <CheckSquare size={20} /> Event Tasks
              </NavLink>

              <div className="sidebar-menu-label" style={{ marginTop: 18 }}>Others</div>
              <NavLink to="/admin-portal" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={20} /> Dashboard
              </NavLink>
            </>
          ) : (
            <>
              <div className="sidebar-menu-label">Teacher Portal</div>
              <NavLink to="/dashboard" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={20} /> Dashboard
              </NavLink>
              <NavLink to="/tasks" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <CheckSquare size={20} /> Event Tasks
              </NavLink>
              <NavLink to="/timetable" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <Calendar size={20} /> Timetable
              </NavLink>
              <NavLink to="/marks" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <ClipboardList size={20} /> Mark Entry
              </NavLink>
              <NavLink to="/free-teachers" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
                <UserCheck size={20} /> Free Teachers
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

          <div className="sidebar-menu-label" style={{ marginTop: 18 }}>System</div>
          <NavLink to="/settings" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Settings size={20} /> Settings
          </NavLink>
          <NavLink to="/privacy" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Shield size={20} /> Privacy Policy
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-item" onClick={() => { window.location.href = 'mailto:support@bgssidlaghatta.edu'; }} style={{ cursor: 'pointer', width: '100%', background: 'transparent', border: 'none', font: 'inherit', color: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
            <HelpCircle size={20} /> Support
          </button>
          <div className="sidebar-item" onClick={handleLogout} style={{ cursor: 'pointer', marginTop: 4 }}>
            <LogOut size={20} /> Logout
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <header className="top-header" style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 28px' }}>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifMenu(!showNotifMenu)} 
                className="btn btn-ghost" 
                style={{ padding: 8, borderRadius: '50%', background: showNotifMenu ? 'var(--bg-surface-hover)' : 'transparent', position: 'relative', border: 'none', cursor: 'pointer' }}
                title="View Notifications & Announcements"
              >
                <Bell size={22} className="header-icon" />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 9, height: 9, borderRadius: '50%', background: '#EF4444', border: '2px solid #fff' }}></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifMenu && (
                <div style={{ position: 'absolute', right: 0, top: '44px', width: 380, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 14, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bell size={16} /> Institutional Notifications
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ background: 'transparent', border: 'none', color: 'var(--maroon-900)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', background: n.read ? '#fff' : '#FFFBFB', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>{n.title}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{n.time}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        No notifications currently active.
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '10px 18px', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <Link to="/meetings" onClick={() => setShowNotifMenu(false)} style={{ color: 'var(--maroon-900)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                      Open All Announcements & SMS Logs →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link to="/settings" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="user-profile">
                <img src={avatarUrl || "https://ui-avatars.com/api/?name=" + name + "&background=1f2937&color=fff"} alt="" className="user-avatar" />
                <div className="user-info">
                  <span className="user-name">{name}</span>
                  <span className="user-role">{roleDisplay}</span>
                </div>
                <ChevronDown size={16} className="header-icon" style={{ marginLeft: 4 }} />
              </div>
            </Link>
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

