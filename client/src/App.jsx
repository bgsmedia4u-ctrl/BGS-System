import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, OfficeRoute } from './components/ProtectedRoute';

// Pages - Imported statically to eliminate Vite dynamic module loading failures in production
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ReportFormPage from './pages/ReportFormPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminExportPage from './pages/AdminExportPage';
import AdminPortalPage from './pages/AdminPortalPage';
import AttendancePage from './pages/AttendancePage';
import MarksPage from './pages/MarksPage';
import TeacherMeetingsPage from './pages/TeacherMeetingsPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import LeaveManagementPage from './pages/LeaveManagementPage';
import SyllabusTrackerPage from './pages/SyllabusTrackerPage';
import TimetablePage from './pages/TimetablePage';
import TasksPage from './pages/TasksPage';
import StudentManagementPage from './pages/StudentManagementPage';
import StudentProfilePage from './pages/StudentProfilePage';
import StaffManagementPage from './pages/StaffManagementPage';
import AcademicManagementPage from './pages/AcademicManagementPage';
import SettingsPage from './pages/SettingsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import FreeTeachersPage from './pages/FreeTeachersPage';
import TransportationPage from './pages/TransportationPage';
import AlumniPage from './pages/AlumniPage';
import OfficeDashboardPage from './pages/OfficeDashboardPage';
import AdminAttendanceDashboard from './pages/AdminAttendanceDashboard';


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
          <Route path="/student/:id" element={<ProtectedRoute allowAdmin={true}><StudentProfilePage /></ProtectedRoute>} />
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
          <Route path="/admin/attendance" element={<AdminRoute><AdminAttendanceDashboard /></AdminRoute>} />
          <Route path="/students" element={<AdminRoute><StudentManagementPage /></AdminRoute>} />
          <Route path="/personnel" element={<AdminRoute><StaffManagementPage /></AdminRoute>} />
          <Route path="/academic" element={<AdminRoute><AcademicManagementPage /></AdminRoute>} />
          <Route path="/admin/export" element={<AdminRoute><AdminExportPage /></AdminRoute>} />
          <Route path="/admin/timetable" element={<AdminRoute><TimetablePage isAdmin={true} /></AdminRoute>} />
          <Route path="/admin/tasks" element={<AdminRoute><TasksPage isAdmin={true} /></AdminRoute>} />
          {/* Separate Standalone Admin Portal */}
          <Route path="/admin-portal" element={<AdminRoute><AdminPortalPage /></AdminRoute>} />
          
          {/* Institutional & Legal Pages */}
          <Route path="/settings" element={<ProtectedRoute allowAdmin={true}><SettingsPage /></ProtectedRoute>} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          
          {/* Admin "Others" Modules */}
          <Route path="/transportation" element={<AdminRoute><TransportationPage /></AdminRoute>} />
          <Route path="/alumni" element={<AdminRoute><AlumniPage /></AdminRoute>} />
          <Route path="/free-teachers" element={<ProtectedRoute allowAdmin={true}><FreeTeachersPage /></ProtectedRoute>} />
          
          {/* Office Dashboard Route */}
          <Route path="/office" element={<OfficeRoute><OfficeDashboardPage /></OfficeRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
