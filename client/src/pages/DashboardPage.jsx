import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecentReports } from '../api/reportService';
import { getRecentAnnouncements } from '../api/announcementService';
import Layout from '../components/Layout';
import {
  FileText,
  Clock,
  CheckCircle,
  ChevronRight,
  Phone,
  Calendar,
  Plus,
  Megaphone
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, profile, updatePhone } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    // Prompt for phone if profile loaded but no phone exists
    if (profile && !profile.phone && !loading) {
      setShowPhoneModal(true);
    }
  }, [profile, loading]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch all reports for the user (limited to recent 10 for performance)
      const reportsData = await getRecentReports(user.id, 10);
      setReports(reportsData);

      // Fetch announcements
      const annData = await getRecentAnnouncements(5);
      setAnnouncements(annData);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      toast.error('Failed to load dashboard: ' + (err.message || 'unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneSubmit(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    try {
      await updatePhone(phone.trim());
      setShowPhoneModal(false);
      toast.success('Phone number saved!');
    } catch (err) {
      toast.error('Failed to save phone number');
    }
  }

  // Get total rows across all sections to show activity level
  function getEntryCount(report) {
    let count = 0;
    if (report.cet_questions) count += report.cet_questions.length;
    if (report.cet_tests) count += report.cet_tests.length;
    if (report.cet_doubt) count += report.cet_doubt.length;
    if (report.neet_questions) count += report.neet_questions.length;
    if (report.neet_tests) count += report.neet_tests.length;
    if (report.neet_doubt) count += report.neet_doubt.length;
    if (report.jee_questions) count += report.jee_questions.length;
    if (report.jee_tests) count += report.jee_tests.length;
    if (report.jee_doubt) count += report.jee_doubt.length;
    return count;
  }

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayReport = reports.find(r => r.report_date === todayStr);

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {profile?.name?.split(' ')[0] || 'Teacher'} - BGS Sidlaghatta</p>
      </div>

      <div className="page-body fade-in">
        {/* Announcements Banner */}
        {announcements.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {announcements.map(a => (
              <div key={a.id} className="card" style={{ marginBottom: 10, borderLeft: '4px solid var(--navy-500)', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Megaphone size={18} style={{ color: 'var(--navy-400)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3 }}>{a.title}</div>
                    {a.body && <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{a.body}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, opacity: 0.7 }}>
                      {a.posted_by} · {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current Week Card */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <div className="stat-card" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="stat-label">Create New Report</div>
                <div className="stat-value" style={{ fontSize: 22, marginTop: 4 }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </div>
                <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                  Select any date in the form.
                </div>
              </div>
              
              <Link to="/report" className="btn btn-primary">
                <Plus size={16} /> New Report
              </Link>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon gold">
              <FileText size={20} />
            </div>
            <div className="stat-value">{reports.length}</div>
            <div className="stat-label">Total Reports</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <CheckCircle size={20} />
            </div>
            <div className="stat-value">
              {reports.filter((r) => r.status === 'submitted').length}
            </div>
            <div className="stat-label">Submitted</div>
          </div>
        </div>

        {/* Report History */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Report History</div>
          {reports.length > 0 ? (
            <div className="report-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reports.map((report) => {
                const count = getEntryCount(report);
                return (
                  <Link
                    key={report.id}
                    to={`/report/${report.report_date}`}
                    className="report-item"
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '16px', borderRadius: '8px', border: '1px solid var(--border)',
                      textDecoration: 'none', background: 'var(--bg-secondary)'
                    }}
                  >
                    <div className="report-item-info">
                      <div className="report-item-week" style={{ color: 'var(--gold-500)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={14}/> {report.report_date}
                      </div>
                      <div className="report-item-date" style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                        {count} classes recorded
                      </div>
                    </div>
                    <div className="report-item-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {report.status === 'submitted' ? (
                        <span className="badge badge-submitted">
                          <CheckCircle size={12} /> Submitted
                        </span>
                      ) : (
                        <span className="badge badge-draft">
                          <Clock size={12} /> Draft
                        </span>
                      )}
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
              <FileText className="empty-state-icon" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--text-muted)' }} size={32} />
              <p className="empty-state-title" style={{ fontWeight: 600, fontSize: 16 }}>No reports yet</p>
              <p className="empty-state-text" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Start by creating your first daily or weekly report.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content card" style={{ maxWidth: 400, width: '90%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Phone size={24} style={{ color: 'var(--gold-500)' }} />
              <h2 className="modal-title" style={{ marginBottom: 0, fontSize: 18 }}>Add Your Phone Number</h2>
            </div>
            <p className="modal-text" style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              Please add your WhatsApp number so the admin can contact you for report reminders.
            </p>
            <form onSubmit={handlePhoneSubmit}>
              <div className="form-group">
                <label className="form-label">WhatsApp Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowPhoneModal(false)}
                >
                  Skip
                </button>
                <button type="submit" className="btn btn-primary" disabled={!phone.trim()}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

