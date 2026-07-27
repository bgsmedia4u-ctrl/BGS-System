import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../api/supabase';
import { Users, UserPlus, Search, Filter, Briefcase, Mail, Phone } from 'lucide-react';
import '../layout.css';

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState('directory');
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*');
      setStaffList(data || []);
    } catch (e) {
      setStaffList([]);
    }
    setLoading(false);
  }

  const filteredStaff = staffList.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderDirectory = () => (
    <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="search-bar" style={{ width: 300 }}>
          <Search size={18} className="header-icon" />
          <input type="text" placeholder="Search staff members..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Filter size={16} /> Filter
          </button>
          <button style={{ background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Briefcase size={16} /> Export
          </button>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Emp ID</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Staff Profile</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Role / Dept</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Contact</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredStaff.length > 0 ? (
            filteredStaff.map((staff, i) => (
              <tr key={staff.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px', fontWeight: 600 }}>{staff.id?.substring(0, 8) || 'EMP-000'}</td>
                <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FCEFEF', color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                    {staff.name ? staff.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span style={{ color: 'var(--maroon-900)', fontWeight: 600 }}>{staff.name || 'Unnamed Staff'}</span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: 500 }}>{staff.role || staff.staff_type || 'Faculty'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{staff.department || staff.subject || 'General'}</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}><Mail size={12} color="var(--text-muted)" /> {staff.email || 'No email registered'}</div>
                  {staff.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', marginTop: 4 }}><Phone size={12} color="var(--text-muted)" /> {staff.phone}</div>}
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    background: staff.status === 'active' || !staff.status ? '#D1FAE5' : '#FEF3C7', 
                    color: staff.status === 'active' || !staff.status ? '#065F46' : '#92400E', 
                    padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 
                  }}>{staff.status || 'Active'}</span>
                </td>
                <td style={{ padding: '16px' }}>
                  <button style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' }}>View Profile</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No staff records found in database.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderOnboarding = () => (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ flex: 2, background: 'var(--bg-surface)', padding: 32, borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--maroon-900)', marginBottom: 24 }}>Register New Staff</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>First Name</label>
            <input type="text" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8 }} placeholder="e.g. Ramesh" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>Last Name</label>
            <input type="text" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8 }} placeholder="e.g. Rao" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>Email Address</label>
            <input type="email" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8 }} placeholder="email@bgs.edu" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>Phone Number</label>
            <input type="text" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8 }} placeholder="+91" />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', margin: '32px 0' }}></div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--maroon-900)', marginBottom: 20 }}>Role & Assignment</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>Primary Role</label>
            <select style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8, background: '#fff' }}>
              <option>Teacher</option>
              <option>Driver</option>
              <option>Institution Admin</option>
              <option>Office Staff</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500 }}>Department / Specialization</label>
            <input type="text" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 8 }} placeholder="e.g. Mathematics" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button style={{ background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>Create Employee</button>
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: 20, borderRadius: 12 }}>
          <h4 style={{ color: '#92400E', fontWeight: 600, marginBottom: 8 }}>Onboarding Process</h4>
          <p style={{ fontSize: '0.85rem', color: '#92400E', opacity: 0.8, lineHeight: 1.5 }}>
            Creating a staff record here generates an Employee ID and links it to the Central Person identity. The staff member will receive an email to set up their password.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="dashboard-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--maroon-900)', marginBottom: 16 }}>Personnel Management</h1>
        
        <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-color)' }}>
          <div 
            onClick={() => setActiveTab('directory')}
            style={{ padding: '0 4px 12px', cursor: 'pointer', color: activeTab === 'directory' ? 'var(--maroon-900)' : 'var(--text-muted)', fontWeight: activeTab === 'directory' ? 600 : 500, borderBottom: activeTab === 'directory' ? '2px solid var(--maroon-900)' : '2px solid transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} /> Staff Directory</div>
          </div>
          <div 
            onClick={() => setActiveTab('onboarding')}
            style={{ padding: '0 4px 12px', cursor: 'pointer', color: activeTab === 'onboarding' ? 'var(--maroon-900)' : 'var(--text-muted)', fontWeight: activeTab === 'onboarding' ? 600 : 500, borderBottom: activeTab === 'onboarding' ? '2px solid var(--maroon-900)' : '2px solid transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UserPlus size={18} /> Onboarding</div>
          </div>
        </div>
      </div>

      <div className="tab-content fade-in">
        {activeTab === 'directory' && renderDirectory()}
        {activeTab === 'onboarding' && renderOnboarding()}
      </div>
    </Layout>
  );
}
