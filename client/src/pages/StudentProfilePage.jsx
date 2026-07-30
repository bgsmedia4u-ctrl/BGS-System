import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getStudentById, getStudentMarks, getStudentAttendance, getStudentCompliances } from '../api/studentProfileService';
import { User, BookOpen, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../layout.css';

export default function StudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [compliances, setCompliances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [studentData, marksData, attData, compData] = await Promise.all([
          getStudentById(id),
          getStudentMarks(id),
          getStudentAttendance(id),
          getStudentCompliances(id)
        ]);
        
        setStudent(studentData);
        setMarks(marksData || []);
        setAttendance(attData || []);
        setCompliances(compData || []);
      } catch (err) {
        console.error('Error fetching student profile:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) fetchData();
  }, [id]);

  const attendanceStats = useMemo(() => {
    if (!attendance.length) return { present: 0, absent: 0, percentage: 0 };
    const absent = attendance.filter(a => a.is_absent).length;
    const present = attendance.length - absent;
    const percentage = Math.round((present / attendance.length) * 100);
    return { present, absent, percentage };
  }, [attendance]);

  const marksData = useMemo(() => {
    // Process marks for the chart
    // A student might have multiple tests, each with a JSON 'marks' object: { "Math": 85, "Science": 90 }
    // We will calculate a total percentage per test
    return marks.map(entry => {
      const marksObj = entry.marks || {};
      const subjects = Object.keys(marksObj);
      let total = 0;
      subjects.forEach(sub => total += Number(marksObj[sub]) || 0);
      const maxPossible = subjects.length * 100; // assuming each subject is out of 100 for a simple chart
      const percentage = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;
      
      return {
        name: entry.tests?.name || 'Unknown Test',
        score: percentage,
        date: new Date(entry.tests?.created_at).toLocaleDateString()
      };
    }).reverse(); // chronological for chart
  }, [marks]);

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner" style={{ minHeight: '60vh' }}>
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout>
        <div style={{ padding: 24 }}>
          <h2>Student not found</h2>
          <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Go Back</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '0 0 24px 0' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 24, fontSize: '0.9rem', fontWeight: 500 }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        
        {/* Header Profile Card */}
        <div style={{ background: 'var(--bg-surface)', padding: 32, borderRadius: 16, border: '1px solid var(--border-color)', display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--maroon-900)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600 }}>
            {student.name.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>{student.name}</h1>
            <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              <span><strong style={{ color: 'var(--text-main)' }}>Roll No:</strong> {student.roll_number || 'N/A'}</span>
              <span><strong style={{ color: 'var(--text-main)' }}>Class:</strong> {student.class}</span>
              <span><strong style={{ color: 'var(--text-main)' }}>Stream:</strong> {student.stream}</span>
              <span><strong style={{ color: 'var(--text-main)' }}>Year:</strong> {student.year}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
          {/* Attendance Summary */}
          <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--maroon-900)' }}>
              <Clock size={20} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Attendance Overview</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1, color: attendanceStats.percentage >= 75 ? '#059669' : '#DC2626' }}>
                {attendanceStats.percentage}%
              </div>
              <div style={{ paddingBottom: 6, color: 'var(--text-muted)' }}>present</div>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: '0.9rem' }}>
              <div><strong style={{ color: 'var(--text-main)' }}>Total Sessions:</strong> {attendance.length}</div>
              <div><strong style={{ color: 'var(--text-main)' }}>Classes Attended:</strong> {attendanceStats.present}</div>
              <div><strong style={{ color: 'var(--text-main)' }}>Classes Missed:</strong> {attendanceStats.absent}</div>
            </div>
          </div>

          {/* Compliances Summary */}
          <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--maroon-900)' }}>
              <AlertTriangle size={20} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Remarks & Compliances</h2>
            </div>
            {compliances.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No remarks or compliance issues recorded.</div>
            ) : (
              <ul style={{ paddingLeft: 20, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {compliances.slice(0, 4).map((c, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginRight: 8 }}>{new Date(c.date).toLocaleDateString()}</span>
                    {c.remark}
                  </li>
                ))}
                {compliances.length > 4 && <li style={{ color: 'var(--maroon-900)', cursor: 'pointer', listStyle: 'none', marginLeft: -20, marginTop: 8 }}>View all {compliances.length} remarks...</li>}
              </ul>
            )}
          </div>
        </div>

        {/* Academic Performance Chart */}
        <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, color: 'var(--maroon-900)' }}>
            <BookOpen size={20} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Academic Performance</h2>
          </div>
          {marksData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No marks data available for this student.</div>
          ) : (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marksData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="score" fill="var(--maroon-900)" radius={[4, 4, 0, 0]} barSize={40} name="Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
