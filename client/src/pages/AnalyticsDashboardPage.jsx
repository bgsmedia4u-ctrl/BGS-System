import { useState, useEffect } from 'react';
import { getStudentAnalytics } from '../api/analyticsService';
import Layout from '../components/Layout';
import { PieChart, TrendingDown, Users, AlertTriangle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import GaugeCard from '../components/GaugeCard';

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState('Science');
  const [year, setYear] = useState('1st Year');
  const [cls, setCls] = useState('Class A');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchData();
  }, [stream, year, cls]);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getStudentAnalytics(stream, year, cls);
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }

  // Simple pure-SVG Bar Chart component inline
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
          <h1 className="page-title"><PieChart size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 8, color: 'var(--accent)' }}/> Student Analytics</h1>
          <p className="page-subtitle">Performance trends and attendance monitoring</p>
        </div>
      </div>

      <div className="page-body fade-in">
        <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Stream</label>
            <select className="form-input" value={stream} onChange={e => setStream(e.target.value)}>
              <option value="Science">Science</option>
              <option value="Commerce">Commerce</option>
              <option value="Arts">Arts</option>
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
              <option value="Class A">Class A</option>
              <option value="Class B">Class B</option>
              <option value="FTB-1">FTB-1</option>
              <option value="FTB-2">FTB-2</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
        ) : !analytics ? null : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="stat-label">Subject Averages</div>
                <div style={{ flex: 1 }}>
                  <BarChart data={analytics.subjectData} />
                </div>
              </div>
              <GaugeCard title="Overall Attendance" value={analytics.overallAttendance} color="var(--success)" />
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertTriangle color="var(--error)" size={20} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-main)' }}>Students of Concern</h3>
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
                          <td style={{ fontWeight: 600 }}>{s.roll_number}</td>
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
                        <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No students flagged for this class.</td>
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
