import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PendingApprovalPage() {
  const { logout } = useAuth();

  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="login-logo" style={{ margin: '0 auto 16px auto', background: 'var(--navy-400)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <h1 className="login-title">Registration Pending</h1>
        <p className="login-desc" style={{ marginTop: 16, marginBottom: 24 }}>
          Your registration has been received and is currently awaiting admin approval. 
          You will be able to access the portal once your account is verified.
        </p>
        
        <button 
          className="save-btn" 
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
          style={{ width: '100%', padding: '12px' }}
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}
