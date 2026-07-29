import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../api/supabase';
import { Users, BookOpen, FileText, CheckCircle, Search, UserPlus, Filter } from 'lucide-react';
import '../layout.css';

export default function StudentManagementPage() {
  const [activeTab, setActiveTab] = useState('directory');
  const [students, setStudents] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: stuData } = await supabase.from('students').select('*');
      setStudents(stuData || []);
    } catch (e) {
      setStudents([]);
    }
    setLoading(false);
  }

  const filteredStudents = students.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.roll_number?.toString().toLowerCase().includes(searchTerm.toLowerCase()));

  const renderDirectory = () => (
    <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="search-bar" style={{ width: 300 }}>
          <Search size={18} className="header-icon" />
          <input type="text" placeholder="Search students..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Filter size={16} /> Filter
          </button>
          <button style={{ background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <UserPlus size={16} /> Add Student
          </button>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Roll No / ID</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Year & Stream</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Class / Section</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length > 0 ? (
            filteredStudents.map((stu, i) => (
              <tr key={stu.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px', fontWeight: 600 }}>{stu.roll_number || stu.id?.substring(0, 8)}</td>
                <td style={{ padding: '16px', color: 'var(--maroon-900)', fontWeight: 500 }}>{stu.name}</td>
                <td style={{ padding: '16px' }}>{stu.year} {stu.stream}</td>
                <td style={{ padding: '16px' }}>{stu.class}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>Active</span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No student records found in database. Use "Add Student" to register students.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderAdmissions = () => (
    <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--maroon-900)' }}>Pending Applications</h2>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>App ID</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Applicant Name</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Applied For</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {admissions.length > 0 ? (
            admissions.map((app, i) => (
              <tr key={app.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '16px', fontWeight: 600 }}>{app.id}</td>
                <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: 500 }}>{app.name}</td>
                <td style={{ padding: '16px' }}>{app.appliedClass}</td>
                <td style={{ padding: '16px' }}>{app.date}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>{app.status}</span>
                </td>
                <td style={{ padding: '16px' }}>
                  <button style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Review</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No pending student admission applications at this time.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderClasses = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
      {classes.length > 0 ? (
        classes.map((cls, i) => (
          <div key={cls.id || i} style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--maroon-900)' }}>{cls.name}</h3>
              <span style={{ background: '#F5F5F5', padding: '4px 8px', borderRadius: 6, fontSize: '0.8rem' }}>{cls.stream}</span>
            </div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sections</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{cls.sections || 1}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Students</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{cls.students || 0}</div>
              </div>
            </div>
            <button style={{ width: '100%', background: 'transparent', border: '1px solid var(--maroon-900)', color: 'var(--maroon-900)', padding: '8px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
              Manage Class
            </button>
          </div>
        ))
      ) : null}
      
      <div style={{ background: 'rgba(255,255,255,0.5)', border: '2px dashed var(--border-color)', padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 180 }}>
        <div style={{ width: 48, height: 48, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--maroon-900)', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          +
        </div>
        <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Add New Class / Batch</div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="dashboard-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--maroon-900)', marginBottom: 16 }}>Student Management</h1>
        
        <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid var(--border-color)' }}>
          <div 
            onClick={() => setActiveTab('directory')}
            style={{ padding: '0 4px 12px', cursor: 'pointer', color: activeTab === 'directory' ? 'var(--maroon-900)' : 'var(--text-muted)', fontWeight: activeTab === 'directory' ? 600 : 500, borderBottom: activeTab === 'directory' ? '2px solid var(--maroon-900)' : '2px solid transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} /> Directory</div>
          </div>
          <div 
            onClick={() => setActiveTab('admissions')}
            style={{ padding: '0 4px 12px', cursor: 'pointer', color: activeTab === 'admissions' ? 'var(--maroon-900)' : 'var(--text-muted)', fontWeight: activeTab === 'admissions' ? 600 : 500, borderBottom: activeTab === 'admissions' ? '2px solid var(--maroon-900)' : '2px solid transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} /> Admissions</div>
          </div>
          <div 
            onClick={() => setActiveTab('classes')}
            style={{ padding: '0 4px 12px', cursor: 'pointer', color: activeTab === 'classes' ? 'var(--maroon-900)' : 'var(--text-muted)', fontWeight: activeTab === 'classes' ? 600 : 500, borderBottom: activeTab === 'classes' ? '2px solid var(--maroon-900)' : '2px solid transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={18} /> Classes & Sections</div>
          </div>
        </div>
      </div>

      <div className="tab-content fade-in">
        {activeTab === 'directory' && renderDirectory()}
        {activeTab === 'admissions' && renderAdmissions()}
        {activeTab === 'classes' && renderClasses()}
      </div>
    </Layout>
  );
}
