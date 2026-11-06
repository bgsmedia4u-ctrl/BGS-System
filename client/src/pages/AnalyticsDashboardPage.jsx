import { useState, useEffect } from 'react';
import { getStudentAnalytics, getStreamToppers, getIrregularStudents } from '../api/analyticsService';
import Layout from '../components/Layout';
import { PieChart, TrendingDown, Users, AlertTriangle, Calendar, Award, Trophy, Send, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import GaugeCard from '../components/GaugeCard';
import { triggerAbsentStudentSms } from '../data/notifications';

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState('Science');
  const [year, setYear] = useState('1st Year');
  const [cls, setCls] = useState('1st FTB');
  
  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [toppers, setToppers] = useState([]);
  const [topperStream, setTopperStream] = useState('Science');
  const [irregularStudents, setIrregularStudents] = useState([]);

  useEffect(() => {
    fetchBatchAnalytics();
  }, [stream, year, cls]);

  useEffect(() => {
    fetchToppers();
  }, [topperStream]);

  useEffect(() => {
    fetchIrregular();
  }, []);

  async function fetchBatchAnalytics() {
    setLoading(true);
    try {
      const data = await getStudentAnalytics(stream, year, cls);
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load batch analytics.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchToppers() {
    try {
      const data = await getStreamToppers(topperStream);
      setToppers(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load stream toppers.');
    }
  }

  async function fetchIrregular() {
    try {
      const data = await getIrregularStudents(75);
      setIrregularStudents(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load irregular students list.');
    }
  }

  async function handleSendAbsenceSms(student) {
    try {
      toast.loading(`Sending SMS to ${student.name}'s parent...`, { id: 'sms' });
      await triggerAbsentStudentSms(new Date().toISOString().split('T')[0]);
      toast.success(`Absence alert sent to parent of ${student.name}!`, { id: 'sms' });
    } catch (err) {
      toast.error(err.message || 'Failed to send SMS', { id: 'sms' });
    }
  }

  // Pure-SVG Bar Chart component
  const BarChart = ({ data }) => {
    if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)' }}>No data available</div>;
    const maxVal = Math.max(...data.map(d => d.average), 100);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 16, marginTop: 20 }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>{item.average}%</div>
            <div style={{ 
              width: '100%', 
              background: 'linear-gradient(180deg, var(--accent-light), var(--accent-dark))', 
              height: `${(item.average / maxVal) * 100}%`,
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              transition: 'height var(--transition)'
            }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', wordBreak: 'break-word' }}>
              {item.subject.substring(0, 8)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title"><PieChart size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 8, color: 'var(--accent)' }}/> Student Analytics & Performance</h1>
          <p className="page-subtitle">Stream toppers, irregular student tracking (&lt;75% attendance), and batch metrics</p>
        </div>
      </div>

      <div className="page-body fade-in">
        {/* SECTION 1: TOPPERS LEADERBOARD */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trophy color="var(--color-gold-500, #c9a227)" size={22} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Stream Toppers Leaderboard</h3>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => setTopperStream('Science')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid var(--border)',
                  background: topperStream === 'Science' ? 'var(--accent)' : 'transparent',
                  color: topperStream === 'Science' ? '#fff' : 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Science Toppers
              </button>
              <button 
                onClick={() => setTopperStream('Commerce')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: '1px solid var(--border)',
                  background: topperStream === 'Commerce' ? 'var(--accent)' : 'transparent',
                  color: topperStream === 'Commerce' ? '#fff' : 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Commerce Toppers
              </button>
            </div>
          </div>

          {toppers.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              No test data recorded for {topperStream} stream yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Roll #</th>
                    <th>Student Name</th>
                    <th>Class / Year</th>
                    <th>Average Score %</th>
                  </tr>
                </thead>
                <tbody>
                  {toppers.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 700, fontSize: 15 }}>
                        {t.rank === 1 ? '🥇 1st' : t.rank === 2 ? '🥈 2nd' : t.rank === 3 ? '🥉 3rd' : `#${t.rank}`}
                      </td>
                      <td style={{ fontWeight: 600 }}>{t.roll_number || 'N/A'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.name}</td>
                      <td>{t.year} - {t.class}</td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(201, 162, 39, 0.15)', color: '#c9a227', fontWeight: 700 }}>
                          {t.averageScore}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 2: IRREGULAR STUDENTS (<75% Attendance) */}
        <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(229, 62, 62, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle color="var(--error)" size={22} />
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--error)' }}>
                  Irregular Students List (&lt; 75% Attendance)
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {irregularStudents.length} student(s) flagged for critical low attendance
                </span>
              </div>
            </div>
            <button onClick={fetchIrregular} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <RefreshCw size={16} />
            </button>
          </div>

          {irregularStudents.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              Excellent! No students are below the 75% attendance threshold.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Stream & Batch</th>
                    <th>Roll #</th>
                    <th>Attendance %</th>
                    <th>Absent / Total Classes</th>
                    <th>Parent Contact</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {irregularStudents.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.stream} ({s.year} - {s.class})</td>
                      <td>{s.roll_number || 'N/A'}</td>
                      <td>
                        <span className="badge" style={{ background: 'var(--error-bg)', color: 'var(--error)', fontWeight: 700 }}>
                          {s.attendancePercent}%
                        </span>
                      </td>
                      <td>{s.absentClasses} / {s.totalClasses}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.parent_phone || 'Not Registered'}</td>
                      <td>
                        <button
                          onClick={() => handleSendAbsenceSms(s)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'var(--accent)',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Send size={12} /> Send Parent SMS
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 3: BATCH ANALYTICS FILTER & DETAILS */}
        <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Stream</label>
            <select className="form-input" value={stream} onChange={e => setStream(e.target.value)}>
              <option value="Science">Science</option>
              <option value="Commerce">Commerce</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Year</label>
            <select className="form-input" value={year} onChange={e => setYear(e.target.value)}>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Class</label>
            <select className="form-input" value={cls} onChange={e => setCls(e.target.value)}>
              <option value="1st FTB - 1">1st FTB - 1</option>
              <option value="2nd FTB - 1">2nd FTB - 1</option>
              <option value="1st FTB - 2">1st FTB - 2</option>
              <option value="2nd FTB - 2">2nd FTB - 2</option>
              <option value="1st CS">1st CS</option>
              <option value="2nd CS">2nd CS</option>
              <option value="1st Class A">1st Class A</option>
              <option value="2nd Class A">2nd Class A</option>
              <option value="1st Class B">1st Class B</option>
              <option value="2nd Class B">2nd Class B</option>
              <option value="1st Inspire">1st Inspire</option>
              <option value="2nd Inspire">2nd Inspire</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
        ) : !analytics ? null : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="stat-label">Subject Performance Averages</div>
                <div style={{ flex: 1 }}>
                  <BarChart data={analytics.subjectData} />
                </div>
              </div>
              <GaugeCard title="Batch Attendance Average" value={analytics.overallAttendance} color="var(--success)" />
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertTriangle color="var(--error)" size={20} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-main)' }}>Batch Students of Concern</h3>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Roll #</th>
                      <th>Name</th>
                      <th>Risk Factors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.studentsOfConcern.length > 0 ? (
                      analytics.studentsOfConcern.map(s => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600 }}>{s.roll_number || 'N/A'}</td>
                          <td>{s.name}</td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {s.reasons.map((r, i) => (
                                <span key={i} className="badge" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
                                  {r.includes('Attendance') ? <Calendar size={12}/> : <TrendingDown size={12}/>}
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No students flagged for this batch.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
