import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

// Pages
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const AdminLoginPage = React.lazy(() => import('./pages/AdminLoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ReportFormPage = React.lazy(() => import('./pages/ReportFormPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const AdminExportPage = React.lazy(() => import('./pages/AdminExportPage'));
const AdminPortalPage = React.lazy(() => import('./pages/AdminPortalPage'));
const AttendancePage = React.lazy(() => import('./pages/AttendancePage'));
const MarksPage = React.lazy(() => import('./pages/MarksPage'));
const TeacherMeetingsPage = React.lazy(() => import('./pages/TeacherMeetingsPage'));
const AnalyticsDashboardPage = React.lazy(() => import('./pages/AnalyticsDashboardPage'));
const LeaveManagementPage = React.lazy(() => import('./pages/LeaveManagementPage'));
const SyllabusTrackerPage = React.lazy(() => import('./pages/SyllabusTrackerPage'));
const TimetablePage = React.lazy(() => import('./pages/TimetablePage'));
const TasksPage = React.lazy(() => import('./pages/TasksPage'));
const StudentManagementPage = React.lazy(() => import('./pages/StudentManagementPage'));
const StaffManagementPage = React.lazy(() => import('./pages/StaffManagementPage'));
const AcademicManagementPage = React.lazy(() => import('./pages/AcademicManagementPage'));


function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--navy-800)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }
        }}
      />
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>Loading modules...</div>
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Teacher Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/report/:dateParam?" element={<ProtectedRoute><ReportFormPage /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
          <Route path="/marks" element={<ProtectedRoute><MarksPage /></ProtectedRoute>} />
          <Route path="/meetings" element={<ProtectedRoute><TeacherMeetingsPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboardPage /></ProtectedRoute>} />
          <Route path="/leave" element={<ProtectedRoute><LeaveManagementPage /></ProtectedRoute>} />
          <Route path="/syllabus" element={<ProtectedRoute><SyllabusTrackerPage /></ProtectedRoute>} />
          <Route path="/timetable" element={<ProtectedRoute><TimetablePage /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
          
          {/* Protected Admin Routes (sidebar-based) */}
          <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/students" element={<AdminRoute><StudentManagementPage /></AdminRoute>} />
          <Route path="/personnel" element={<AdminRoute><StaffManagementPage /></AdminRoute>} />
          <Route path="/academic" element={<AdminRoute><AcademicManagementPage /></AdminRoute>} />
          <Route path="/admin/export" element={<AdminRoute><AdminExportPage /></AdminRoute>} />
          <Route path="/admin/timetable" element={<AdminRoute><TimetablePage isAdmin={true} /></AdminRoute>} />

          {/* Separate Standalone Admin Portal */}
          <Route path="/admin-portal" element={<AdminRoute><AdminPortalPage /></AdminRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
