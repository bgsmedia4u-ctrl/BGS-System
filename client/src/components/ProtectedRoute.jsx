import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admins should not access the teacher portal
  if (profile && isAdmin) {
    return <Navigate to="/admin-portal" replace />;
  }

  // Teachers must be approved
  if (profile && profile.role === 'teacher' && profile.status !== 'approved') {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
