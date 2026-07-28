import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const { user, profile, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  // If already logged in as admin, redirect directly
  if (!loading && user && profile?.role === 'admin') {
    return <Navigate to="/admin-portal" replace />;
  }

  async function handleAdminLogin() {
    setChecking(true);
    try {
      await loginWithGoogle();
      // After login, AuthContext will update profile.role
      // Navigation handled by the check above on re-render
    } catch (err) {
      toast.error('Login failed. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFFDF5 0%, #F5EFE0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: 20,
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(122,26,26,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,36,36,0.03) 0%, transparent 50%)',
      }} />

      <div style={{
        background: 'rgba(255,255,255,0.8)',
        border: '1px solid rgba(122,26,26,0.1)',
        borderRadius: 20,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 420,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.05)',
        position: 'relative',
      }}>
        {/* BGS Logo */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 24px rgba(168,36,36,0.2)',
          border: '2px solid rgba(122,26,26,0.15)',
          padding: 6,
          overflow: 'hidden',
        }}>
          <img src="/Logo-removebg-preview.png" alt="BGS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <h1 style={{ color: '#1A1515', fontSize: 26, fontWeight: 700, textAlign: 'center', margin: '0 0 6px' }}>
          Admin Portal
        </h1>
        <p style={{ color: '#665858', fontSize: 14, textAlign: 'center', margin: '0 0 8px' }}>
          BGS Public School & PU College
        </p>
        <p style={{ color: '#998C8C', fontSize: 13, textAlign: 'center', margin: '0 0 36px' }}>
          Restricted access — administrators only
        </p>

        {/* Warning bar */}
        <div style={{
          background: 'rgba(168,36,36,0.05)',
          border: '1px solid rgba(168,36,36,0.2)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <AlertTriangle size={20} color="#DC2626" />
          <span style={{ color: '#7A1A1A', fontSize: 13, fontWeight: 500 }}>
            Only authorised admin accounts can access this portal.
          </span>
        </div>

        <button
          onClick={handleAdminLogin}
          disabled={checking || loading}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: checking ? 'rgba(0,0,0,0.05)' : '#1A1515',
            border: 'none',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            cursor: checking ? 'not-allowed' : 'pointer',
            fontSize: 15,
            fontWeight: 600,
            color: checking ? '#665858' : '#fff',
            transition: 'all 0.2s',
            boxShadow: checking ? 'none' : '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          {checking ? (
            <>
              <div style={{ width: 20, height: 20, border: '2px solid #ccc', borderTopColor: '#666', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Verifying...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <p style={{ color: '#998C8C', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
          BGS Sidlaghatta · Admin Access Only
        </p>

        {/* Link back to teacher portal */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/login" style={{ color: '#7A1A1A', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>
            ← Back to Teacher Portal
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
