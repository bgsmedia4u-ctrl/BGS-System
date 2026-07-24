import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

// Pages
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
import TransportationPage from './pages/TransportationPage';
import AobPage from './pages/AobPage';

import TransportationDashboard from './pages/TransportationViews/Dashboard';
import TransportationStudents from './pages/TransportationViews/Students';
import TransportationRoutesPage from './pages/TransportationViews/RoutesPage';
import TransportationRouteSheet from './pages/TransportationViews/RouteSheet';
import TransportationRouteList from './pages/TransportationViews/RouteList';
import TransportationFee from './pages/TransportationViews/Fee';

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
        <Route path="/transportation" element={<AdminRoute><TransportationPage /></AdminRoute>}>
          <Route index element={<TransportationDashboard />} />
          <Route path="students" element={<TransportationStudents />} />
          <Route path="routes" element={<TransportationRoutesPage />} />
          <Route path="routes/:id/sheet" element={<TransportationRouteSheet />} />
          <Route path="routes/list" element={<TransportationRouteList />} />
          <Route path="fee" element={<TransportationFee />} />
        </Route>
        <Route path="/aob" element={<ProtectedRoute><AobPage /></ProtectedRoute>} />
        
        {/* Protected Admin Routes (sidebar-based) */}
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/export" element={<AdminRoute><AdminExportPage /></AdminRoute>} />
        <Route path="/admin/timetable" element={<AdminRoute><TimetablePage isAdmin={true} /></AdminRoute>} />

        {/* Separate Standalone Admin Portal */}
        <Route path="/admin-portal" element={<AdminRoute><AdminPortalPage /></AdminRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
