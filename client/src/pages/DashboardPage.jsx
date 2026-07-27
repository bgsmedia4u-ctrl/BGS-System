import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecentReports } from '../api/reportService';
import { getRecentAnnouncements } from '../api/announcementService';
import { getTasks } from '../api/taskService';
import { getTeacherTimetable } from '../api/timetableService';
import { getTeacherLeaves, getAllPendingLeaves } from '../api/leaveService';
import { getOrgWideSyllabusStats } from '../api/syllabusService';
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
  ArrowRight,
  PieChart,
  ClipboardList,
  Video,
  CheckSquare,
  GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, profile, updatePhone } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [syllabusPercent, setSyllabusPercent] = useState(0);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (profile && !profile.phone && !loading && user?.id) {
      const dismissed = localStorage.getItem('phone_modal_dismissed');
      if (!dismissed) {
        setShowPhoneModal(true);
      }
    }
  }, [profile, loading]);

  async function fetchData() {
    setLoading(true);
    try {
      if (user?.id) {
        try {
          const reportsData = await getRecentReports(user.id, 10);
          setReports(reportsData || []);
        } catch (e) {
          console.warn('Could not fetch user reports:', e);
          setReports([]);
        }

        try {
          const tasksData = await getTasks(user.id);
          setTasks(tasksData || []);
        } catch (e) {
          console.warn('Could not fetch tasks:', e);
          setTasks([]);
        }

        try {
          const timetableData = await getTeacherTimetable(user.id);
          const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
          const filtered = (timetableData || []).filter(t => t.day_of_week === currentDay);
          setTodaySchedule(filtered);
        } catch (e) {
          console.warn('Could not fetch timetable:', e);
          setTodaySchedule([]);
        }

        try {
          const leavesData = profile?.role === 'admin' ? await getAllPendingLeaves() : await getTeacherLeaves(user.id);
          const pendingCount = (leavesData || []).filter(l => l.status === 'pending').length;
          setPendingLeavesCount(pendingCount);
        } catch (e) {
          console.warn('Could not fetch leaves:', e);
          setPendingLeavesCount(0);
        }
      } else {
        setReports([]);
        setTasks([]);
        setTodaySchedule([]);
        setPendingLeavesCount(0);
      }

      try {
        const annData = await getRecentAnnouncements(5);
        setAnnouncements(annData || []);
      } catch (e) {
        console.warn('Could not fetch announcements:', e);
        setAnnouncements([]);
      }

      try {
        const sylStats = await getOrgWideSyllabusStats();
        setSyllabusPercent(sylStats?.percentage || 0);
      } catch (e) {
        console.warn('Could not fetch syllabus stats:', e);
        setSyllabusPercent(0);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
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

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
  const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
              <div className="stat-value" style={{ fontSize: 28, marginBottom: 12 }}>{todaySchedule.length} Session{todaySchedule.length !== 1 ? 's' : ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: todaySchedule.length > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                {todaySchedule.length > 0 ? (
                  <>
                    <CheckCircle size={16} /> <span style={{ fontSize: 14, fontWeight: 500 }}>Scheduled for Today</span>
                  </>
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 500 }}>No classes today</span>
                )}
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
          <Link to="/tasks" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent-dark))', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.9, marginBottom: 8 }}>Task Management</div>
                    <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, marginBottom: 4 }}>{taskRate}%</div>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>Completion Rate</div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRight size={20} />
                  </div>
                </div>
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>{completedTasks} of {totalTasks} tasks finished</div>
                  {totalTasks > 0 ? (
                    <TrendLine color="#fff" width={100} height={40} data={[0, Math.round(taskRate/2), taskRate]} />
                  ) : (
                    <span style={{ fontSize: 12, opacity: 0.8 }}>No tasks yet</span>
                  )}
                </div>
              </div>
              {/* Decorative circles */}
              <div style={{ position: 'absolute', right: -20, top: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'absolute', right: 40, bottom: -40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            </div>
          </Link>

          {/* Gauge Stat Tiles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Link to="/analytics" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all var(--transition)' }}>
                <div>
                  <div className="stat-label" style={{ marginBottom: 4 }}>Student Analytics</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>View full performance & trends</div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <PieChart size={20} />
                </div>
              </div>
            </Link>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link to="/syllabus" style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                <GaugeCard title="Syllabus" value={syllabusPercent} color="var(--accent)" />
              </Link>
              <Link to="/leave" style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                <div className="stat-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="stat-label">Pending Leave</div>
                  <div className="stat-value" style={{ fontSize: 24 }}>{pendingLeavesCount}</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Teacher Actions Grid */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-main)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GraduationCap size={22} style={{ color: 'var(--accent)' }} /> Teacher Portal Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <Link to="/attendance" className="card" style={{ textDecoration: 'none', padding: 20, display: 'flex', alignItems: 'center', gap: 16, transition: 'all var(--transition)', border: '1px solid var(--border-color)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 15 }}>Mark Attendance</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Daily class records</div>
              </div>
            </Link>
            
            <Link to="/marks" className="card" style={{ textDecoration: 'none', padding: 20, display: 'flex', alignItems: 'center', gap: 16, transition: 'all var(--transition)', border: '1px solid var(--border-color)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(249, 115, 22, 0.15)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClipboardList size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 15 }}>Enter Mark Scores</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>CET, NEET, JEE & Exams</div>
              </div>
            </Link>

            <Link to="/syllabus" className="card" style={{ textDecoration: 'none', padding: 20, display: 'flex', alignItems: 'center', gap: 16, transition: 'all var(--transition)', border: '1px solid var(--border-color)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 15 }}>Syllabus Tracker</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chapter progress update</div>
              </div>
            </Link>

            <Link to="/meetings" className="card" style={{ textDecoration: 'none', padding: 20, display: 'flex', alignItems: 'center', gap: 16, transition: 'all var(--transition)', border: '1px solid var(--border-color)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(147, 0, 26, 0.15)', color: 'var(--navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Video size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 15 }}>Meetings & SMS</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Student counseling setup</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Today's Teaching Schedule */}
        <div className="card" style={{ marginBottom: 32, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>Today's Teaching Schedule</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Scheduled lectures and class sessions for today</p>
            </div>
            <Link to="/timetable" className="btn" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-main)', fontSize: 13, padding: '8px 16px', borderRadius: 'var(--radius-full)', textDecoration: 'none', border: '1px solid var(--border-color)' }}>
              View Timetable
            </Link>
          </div>
          {todaySchedule.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {todaySchedule.map((entry, index) => (
                <div key={entry.id || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--bg-surface)', borderRadius: 12, borderLeft: '4px solid var(--accent)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-main)', width: 150 }}>{entry.period || 'Scheduled Period'}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-main)' }}>{entry.subject || 'Assigned Subject'}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{entry.year} {entry.stream} ({entry.class})</div>
                    </div>
                  </div>
                  <span style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--accent-hover)', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>Scheduled</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--bg-surface-hover)', borderRadius: 12, border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
              <Calendar size={36} style={{ opacity: 0.4, margin: '0 auto 8px auto', color: 'var(--text-muted)' }} />
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-main)', marginBottom: 4 }}>No classes scheduled for today ({new Date().toLocaleDateString('en-US', { weekday: 'long' })})</div>
              <div style={{ fontSize: 13 }}>Your teaching sessions will appear here automatically when configured in your timetable.</div>
            </div>
          )}
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
                  onClick={() => { setShowPhoneModal(false); localStorage.setItem('phone_modal_dismissed', 'true'); }}
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

