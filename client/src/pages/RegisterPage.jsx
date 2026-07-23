import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../api/supabase';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [registering, setRegistering] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { fullName, email, phone, password, confirmPassword } = formData;

    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setRegistering(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
          }
        }
      });

      if (error) throw error;

      toast.success('Registration successful! Please wait for admin approval.');
      // Since it's a new account, the user is automatically logged in but their profile is pending.
      // They will be redirected to /pending-approval by ProtectedRoute or LoginPage, 
      // but let's manually send them there.
      navigate('/pending-approval', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">B</div>
        <h1 className="login-title">Teacher Registration</h1>
        <p className="login-school">BGS Public School & PU College</p>
        <p className="login-desc" style={{ marginBottom: 20 }}>
          Create an account to access the portal
        </p>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            name="fullName"
            className="form-input"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            disabled={registering}
            required
          />
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            disabled={registering}
            required
          />
          <input
            type="tel"
            name="phone"
            className="form-input"
            placeholder="Phone Number (Optional)"
            value={formData.phone}
            onChange={handleChange}
            disabled={registering}
          />
          <input
            type="password"
            name="password"
            className="form-input"
            placeholder="Password (min 8 chars)"
            value={formData.password}
            onChange={handleChange}
            disabled={registering}
            required
            minLength={8}
          />
          <input
            type="password"
            name="confirmPassword"
            className="form-input"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={registering}
            required
            minLength={8}
          />
          
          <button type="submit" className="save-btn" disabled={registering} style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
            {registering ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14 }}>
          <Link to="/login" style={{ color: 'var(--navy-600)', textDecoration: 'none', fontWeight: 500 }}>
            Already have an account? Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
