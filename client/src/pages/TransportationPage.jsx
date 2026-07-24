import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/transportation', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', end: true },
  { to: '/transportation/students', label: 'Students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { to: '/transportation/routes', label: 'Routes', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { to: '/transportation/fee', label: 'Fee', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/transportation/routes/list', label: 'Route Sheets', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

export default function TransportationPage() {
  const { user, profile } = useAuth();
  
  return (
    <MainLayout>
      <div className="flex bg-gray-50" style={{ minHeight: 'calc(100vh - 80px)' }}>
        {/* Inner Sidebar */}
        <aside className="sidebar lg:static w-64 bg-navy-900 text-white flex flex-col" style={{ background: '#0f172a', color: 'white' }}>
          <div className="px-5 py-6 border-b" style={{ borderColor: '#334155' }}>
            <h1 className="text-lg font-bold leading-tight">BGS Public School</h1>
            <p className="text-xs mt-0.5 text-gray-400">&amp; PU College</p>
            <p className="text-[10px] mt-1 tracking-wide uppercase text-gray-500">Transport Management</p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gold-500/20 text-yellow-500 border-l-2 border-yellow-500'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          <main className="main-content flex-1 p-4 lg:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
