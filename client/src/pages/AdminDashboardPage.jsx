import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import Layout from '../components/Layout';
import { Users, CheckCircle, Clock, Calendar, Download, XCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { getAllPendingLeaves } from '../api/leaveService';
import { getOrgWideSyllabusStats } from '../api/syllabusService';

export default function AdminDashboardPage() {
  const [teachers, setTeachers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Default to today
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // New modules stats
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [syllabusStats, setSyllabusStats] = useState({ total: 0, completed: 0, percentage: 0 });

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

      // Fetch new module stats
      try {
        const leaves = await getAllPendingLeaves();
        setPendingLeavesCount(leaves.length);
        
        const stats = await getOrgWideSyllabusStats();
        setSyllabusStats(stats);
      } catch (err) {
        console.error('Failed to load new module stats', err);
      }
      
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

        {/* New Modules Admin Widgets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 32 }}>
          <Link to="/admin/approvals" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'all var(--transition)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="stat-label">Leave Approvals</div>
                  <div className="stat-value" style={{ fontSize: 28, color: pendingLeavesCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
                    {pendingLeavesCount} Pending
                  </div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <Calendar size={20} />
                </div>
              </div>
            </div>
          </Link>

          <Link to="/syllabus" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'all var(--transition)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="stat-label">Org-Wide Syllabus</div>
                  <div className="stat-value" style={{ fontSize: 28 }}>{syllabusStats.percentage}%</div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <CheckCircle size={20} />
                </div>
              </div>
            </div>
          </Link>

          <Link to="/admin/timetable" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'all var(--transition)', background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: '#fff', border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Timetable</div>
                  <div className="stat-value" style={{ fontSize: 24, color: '#fff' }}>Manage Schedules</div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Clock size={20} />
                </div>
              </div>
            </div>
          </Link>
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
