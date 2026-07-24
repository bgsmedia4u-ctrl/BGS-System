import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  BarChart3, 
  Calendar, 
  MessageSquare, 
  History, 
  FileEdit
} from 'lucide-react';

import Dashboard from './AobViews/Dashboard';
import AlumniList from './AobViews/AlumniList';
import Meetings from './AobViews/Meetings';
import Communications from './AobViews/Communications';
import AuditLogs from './AobViews/AuditLogs';
import Templates from './AobViews/Templates';
import toast from 'react-hot-toast';

import './AobViews/index.css'; // Assuming we need to import AOB's CSS

export default function AobPage() {
  const { user, profile } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Create a normalized user object for AOB components
  const aobUser = {
    id: user?.id,
    username: profile?.name || user?.user_metadata?.full_name || 'Teacher',
    role: profile?.role === 'admin' ? 'Super Admin' : 'Viewer'
  };

  const triggerToast = (message, type = 'success') => {
    if (type === 'error') toast.error(message);
    else toast.success(message);
  };

  return (
    <Layout>
      <div className="app-container" style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', background: '#f8fafc' }}>
        {/* Inner Sidebar for AOB */}
        <aside className="sidebar" style={{ width: 250, background: '#1e293b', color: 'white', display: 'flex', flexDirection: 'column' }}>
          <div className="sidebar-header" style={{ padding: 20, borderBottom: '1px solid #334155' }}>
            <div className="sidebar-logo" style={{ fontWeight: 'bold', fontSize: 18 }}>BGS PU COLLEGE</div>
            <div className="sidebar-sublogo" style={{ fontSize: 12, color: '#94a3b8' }}>Alumni Registry System</div>
          </div>

          <nav className="sidebar-menu" style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, width: '100%', textAlign: 'left', background: currentView === 'dashboard' ? '#334155' : 'transparent', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              <BarChart3 size={16} /> Analytics Dashboard
            </button>
            <button className={`sidebar-item ${currentView === 'directory' ? 'active' : ''}`} onClick={() => setCurrentView('directory')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, width: '100%', textAlign: 'left', background: currentView === 'directory' ? '#334155' : 'transparent', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              <Users size={16} /> Alumni Directory
            </button>
            <button className={`sidebar-item ${currentView === 'meetings' ? 'active' : ''}`} onClick={() => setCurrentView('meetings')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, width: '100%', textAlign: 'left', background: currentView === 'meetings' ? '#334155' : 'transparent', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              <Calendar size={16} /> Meetings Scheduler
            </button>
            <button className={`sidebar-item ${currentView === 'communications' ? 'active' : ''}`} onClick={() => setCurrentView('communications')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, width: '100%', textAlign: 'left', background: currentView === 'communications' ? '#334155' : 'transparent', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              <MessageSquare size={16} /> Communication Log
            </button>
            <button className={`sidebar-item ${currentView === 'templates' ? 'active' : ''}`} onClick={() => setCurrentView('templates')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, width: '100%', textAlign: 'left', background: currentView === 'templates' ? '#334155' : 'transparent', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              <FileEdit size={16} /> Email Templates
            </button>
            {aobUser.role === 'Super Admin' && (
              <button className={`sidebar-item ${currentView === 'audit' ? 'active' : ''}`} onClick={() => setCurrentView('audit')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, width: '100%', textAlign: 'left', background: currentView === 'audit' ? '#334155' : 'transparent', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                <History size={16} /> Audit Logs
              </button>
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="main-workspace" style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {currentView === 'dashboard' && <Dashboard user={aobUser} triggerToast={triggerToast} />}
          {currentView === 'directory' && <AlumniList user={aobUser} triggerToast={triggerToast} />}
          {currentView === 'meetings' && <Meetings user={aobUser} triggerToast={triggerToast} />}
          {currentView === 'communications' && <Communications user={aobUser} triggerToast={triggerToast} />}
          {currentView === 'templates' && <Templates user={aobUser} triggerToast={triggerToast} />}
          {currentView === 'audit' && aobUser.role === 'Super Admin' && <AuditLogs user={aobUser} />}
        </main>
      </div>
    </Layout>
  );
}
