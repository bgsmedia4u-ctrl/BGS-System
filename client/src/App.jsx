import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import DashboardPage from './pages/DashboardPage';
import ReportFormPage from './pages/ReportFormPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminExportPage from './pages/AdminExportPage';
import AdminPortalPage from './pages/AdminPortalPage';
import AdminTeacherApprovals from './pages/AdminTeacherApprovals';
import AttendancePage from './pages/AttendancePage';
import MarksPage from './pages/MarksPage';
import TeacherMeetingsPage from './pages/TeacherMeetingsPage';

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
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
        
        {/* Protected Teacher Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/report/:dateParam?" element={<ProtectedRoute><ReportFormPage /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
        <Route path="/marks" element={<ProtectedRoute><MarksPage /></ProtectedRoute>} />
        <Route path="/meetings" element={<ProtectedRoute><TeacherMeetingsPage /></ProtectedRoute>} />
        
        {/* Protected Admin Routes (sidebar-based) */}
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/export" element={<AdminRoute><AdminExportPage /></AdminRoute>} />
        <Route path="/admin/approvals" element={<AdminRoute><AdminTeacherApprovals /></AdminRoute>} />

        {/* Separate Standalone Admin Portal */}
        <Route path="/admin-portal" element={<AdminRoute><AdminPortalPage /></AdminRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
