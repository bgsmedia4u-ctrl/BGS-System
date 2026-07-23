import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecentReports } from '../api/reportService';
import { getRecentAnnouncements } from '../api/announcementService';
import Layout from '../components/Layout';
import GaugeCard from '../components/GaugeCard';
import TrendLine from '../components/TrendLine';
import {
  FileText,
  Clock,
  CheckCircle,
  ChevronRight,
  Phone,
  Calendar,
  Plus,
  Megaphone,
  BookOpen,
  Users,
  Target,
  ArrowRight
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
    if (profile && !profile.phone && !loading) {
      setShowPhoneModal(true);
    }
  }, [profile, loading]);

  async function fetchData() {
    setLoading(true);
    try {
      const reportsData = await getRecentReports(user.id, 10);
      setReports(reportsData);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = profile?.name?.split(' ')[0] || 'Teacher';

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title" style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
          {getGreeting()}, {firstName}
        </h1>
        <p className="page-subtitle" style={{ fontSize: 16, color: 'var(--text-muted)' }}>Here's your workspace overview for today.</p>
      </div>

      <div className="page-body fade-in">
        {/* Announcements Banner */}
        {announcements.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            {announcements.map(a => (
              <div key={a.id} className="card-glass" style={{ marginBottom: 16, borderLeft: '4px solid var(--accent)', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Megaphone size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-main)', marginBottom: 4 }}>{a.title}</div>
                    {a.body && <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{a.body}</div>}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="user-avatar-placeholder" style={{ width: 20, height: 20, fontSize: 10 }}>{a.posted_by.substring(0, 2).toUpperCase()}</div>
                      {a.posted_by} · {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top Widgets Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 32 }}>
          
          {/* Class/Attendance Overview Card */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label" style={{ marginBottom: 8, fontSize: 14 }}>Class Overview</div>
              <div className="stat-value" style={{ fontSize: 28, marginBottom: 12 }}>3/5 Sessions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)' }}>
                <CheckCircle size={16} /> <span style={{ fontSize: 14, fontWeight: 500 }}>On Track Today</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)' }}><Users size={24} /></div>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}><BookOpen size={24} /></div>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}><Target size={24} /></div>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}><Calendar size={24} /></div>
            </div>
          </div>

          {/* Teacher Tasks completion widget */}
          <Link to="/report" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.9, marginBottom: 8 }}>Task Management</div>
                    <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, marginBottom: 4 }}>82%</div>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>Completion Rate</div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRight size={20} />
                  </div>
                </div>
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>+12% this week</div>
                  <TrendLine color="#fff" width={100} height={40} data={[60, 65, 62, 70, 75, 72, 82]} />
                </div>
              </div>
              {/* Decorative circles */}
              <div style={{ position: 'absolute', right: -20, top: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'absolute', right: 40, bottom: -40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            </div>
          </Link>

          {/* Gauge Stat Tiles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <GaugeCard title="Syllabus Completion" value={68} color="var(--accent)" />
            <div className="stat-card" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-label">Pending Leave</div>
                <div className="stat-value">2</div>
              </div>
              <div className="stat-icon" style={{ background: 'var(--navy-900)', color: '#fff', marginBottom: 0 }}>
                <Clock size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Report History */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Report History</div>
            <Link to="/report" className="btn" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-main)', fontSize: 13, padding: '6px 12px', minHeight: 'auto', borderRadius: 'var(--radius-full)' }}>
              View All
            </Link>
          </div>
          
          {reports.length > 0 ? (
            <div className="report-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reports.map((report) => {
                const count = getEntryCount(report);
                const isSubmitted = report.status === 'submitted';
                
                return (
                  <Link
                    key={report.id}
                    to={`/report/${report.report_date}`}
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                      padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                      textDecoration: 'none', background: 'var(--bg-surface)', transition: 'all var(--transition)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-active)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <FileText size={20} />
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                          {report.report_date}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                          {count} classes recorded
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {/* Inline Dot Status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
                        <span style={{ 
                          width: 8, height: 8, borderRadius: '50%', 
                          background: isSubmitted ? 'var(--success)' : 'var(--warning)',
                          boxShadow: `0 0 0 2px ${isSubmitted ? 'var(--success-bg)' : 'var(--warning-bg)'}`
                        }} />
                        {isSubmitted ? 'Submitted' : 'Draft'}
                      </div>
                      <ChevronRight size={18} style={{ color: 'var(--navy-300)' }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
              <FileText className="empty-state-icon" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--navy-300)' }} size={32} />
              <p className="empty-state-title" style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-main)' }}>No reports yet</p>
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

