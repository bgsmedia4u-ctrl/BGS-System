import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import RoutesPage from './pages/RoutesPage';
import RouteSheet from './pages/RouteSheet';
import RouteList from './pages/RouteList';
import Fee from './pages/Fee';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('bgs_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="routes/:id/sheet" element={<RouteSheet />} />
          <Route path="routes/list" element={<RouteList />} />
          <Route path="fee" element={<Fee />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
