import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../api/supabase';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    subject: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    staffType: 'teaching'
  });
  const [registering, setRegistering] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { fullName, subject, email, phone, password, confirmPassword, staffType } = formData;

    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (staffType === 'teaching' && !subject) {
      toast.error('Subject is required for teaching staff');
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
            subject: staffType === 'teaching' ? subject : null,
            phone: phone || null,
            staff_type: staffType
          }
        }
      });

      if (error) throw error;

      toast.success('Registration successful! Redirecting to dashboard...');
      // Since it's a new account and approval is no longer required, redirect directly to dashboard.
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ width: '76px', height: '76px', margin: '0 auto 16px auto', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 4px 16px rgba(115,19,19,0.25)', border: '2px solid rgba(115,19,19,0.15)' }}>
          <img src="/logo.jpg" alt="BGS School Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
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
          
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-main)', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="staffType" 
                value="teaching"
                checked={formData.staffType === 'teaching'} 
                onChange={handleChange} 
                disabled={registering}
              />
              Teaching Staff
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-main)', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="staffType" 
                value="non_teaching"
                checked={formData.staffType === 'non_teaching'} 
                onChange={handleChange} 
                disabled={registering}
              />
              Non-Teaching Staff
            </label>
          </div>

          {formData.staffType === 'teaching' && (
            <input
              type="text"
              name="subject"
              className="form-input"
              placeholder="Subject Taught (e.g., Physics, Maths)"
              value={formData.subject}
              onChange={handleChange}
              disabled={registering}
              required
            />
          )}
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
