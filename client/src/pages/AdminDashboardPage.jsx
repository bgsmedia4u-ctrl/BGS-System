import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import Layout from '../components/Layout';
import { Users, CheckCircle, Clock, Calendar, Download, XCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function AdminDashboardPage() {
  const [teachers, setTeachers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Default to today
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate]);

  async function fetchDashboardData(date) {
    setLoading(true);
    try {
      // 1. Fetch all teachers
      const { data: teachersData, error: teachersErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .order('name');
        
      if (teachersErr) throw teachersErr;
      
      // 2. Fetch reports for the selected date
      const { data: reportsData, error: reportsErr } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('report_date', date);
        
      if (reportsErr) throw reportsErr;
      
      setTeachers(teachersData || []);
      setReports(reportsData || []);
      
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  // Combine teachers with their report status
  const teacherStatuses = teachers.map((teacher) => {
    const report = reports.find(r => r.user_id === teacher.id);
    return {
      ...teacher,
      reportStatus: report ? report.status : 'not_started',
      reportId: report ? report.id : null,
      subject: report ? report.subject : null
    };
  });

  // Filter
  const filteredTeachers = teacherStatuses.filter((t) => {
    const search = searchTerm.toLowerCase();
    return (t.name || '').toLowerCase().includes(search) || (t.email || '').toLowerCase().includes(search);
  });

  // Stats
  const totalTeachers = teachers.length;
  const submittedCount = teacherStatuses.filter(t => t.reportStatus === 'submitted').length;
  const draftCount = teacherStatuses.filter(t => t.reportStatus === 'draft').length;
  const missingCount = teacherStatuses.filter(t => t.reportStatus === 'not_started').length;

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Teacher Monitor</h1>
          <p className="page-subtitle">Track submission status across all staff</p>
        </div>
        
        <Link to="/admin/export" className="btn btn-primary">
          <Download size={16} /> Export Reports
        </Link>
      </div>

      <div className="page-body fade-in">
        
        {/* Monitoring Controls */}
        <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
            <label className="form-label">
              <Calendar size={14} style={{ display: 'inline', marginRight: 6 }}/>
              Monitoring Date
            </label>
            <input 
              type="date" 
              className="form-input" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 2, minWidth: 250 }}>
            <label className="form-label">Search Teachers</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ padding: 16 }}>
            <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', width: 32, height: 32, marginBottom: 8 }}><Users size={16} /></div>
            <div className="stat-value" style={{ fontSize: 24 }}>{totalTeachers}</div>
            <div className="stat-label">Total Teachers</div>
          </div>
          <div className="stat-card" style={{ padding: 16 }}>
            <div className="stat-icon green" style={{ width: 32, height: 32, marginBottom: 8 }}><CheckCircle size={16} /></div>
            <div className="stat-value" style={{ fontSize: 24 }}>{submittedCount}</div>
            <div className="stat-label">Submitted</div>
          </div>
          <div className="stat-card" style={{ padding: 16 }}>
            <div className="stat-icon amber" style={{ width: 32, height: 32, marginBottom: 8 }}><Clock size={16} /></div>
            <div className="stat-value" style={{ fontSize: 24 }}>{draftCount}</div>
            <div className="stat-label">Draft / In Progress</div>
          </div>
          <div className="stat-card" style={{ padding: 16 }}>
            <div className="stat-icon" style={{ background: 'var(--error-bg)', color: 'var(--error)', width: 32, height: 32, marginBottom: 8 }}><XCircle size={16} /></div>
            <div className="stat-value" style={{ fontSize: 24 }}>{missingCount}</div>
            <div className="stat-label">Missing / Not Started</div>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="card">
          {loading ? (
             <div style={{ padding: 40, textAlign: 'center' }}>
               <div className="spinner" style={{ margin: '0 auto' }} />
             </div>
          ) : (
            <div className="table-container table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Teacher Name</th>
                    <th>Contact Info</th>
                    <th>Subject Taught</th>
                    <th>Status on {selectedDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher) => {
                    return (
                      <tr key={teacher.id}>
                        <td style={{ fontWeight: 600 }}>{teacher.name || 'Unknown'}</td>
                        <td>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{teacher.email}</div>
                          {teacher.phone && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <Phone size={12} /> {teacher.phone}
                            </div>
                          )}
                        </td>
                        <td style={{ color: 'var(--gold-500)', fontWeight: 500 }}>
                          {teacher.subject || '-'}
                        </td>
                        <td>
                          {teacher.reportStatus === 'submitted' && (
                            <span className="badge badge-submitted"><CheckCircle size={12}/> Submitted</span>
                          )}
                          {teacher.reportStatus === 'draft' && (
                            <span className="badge badge-draft"><Clock size={12}/> Draft</span>
                          )}
                          {teacher.reportStatus === 'not_started' && (
                            <span className="badge" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                              <XCircle size={12}/> Not Started
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTeachers.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                        No teachers found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
