import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../api/supabase';
import Layout from '../components/Layout';
import { 
  Users, 
  Bus, 
  CheckCircle,
  MoreHorizontal,
  FileText,
  CalendarDays,
  Wrench,
  UserCheck,
  Clock,
  Calendar,
  Filter,
  Mail,
  Phone,
  AlertCircle,
  Shield,
  CheckSquare,
  Target
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import '../layout.css';

const attendanceData = [
  { name: '23 Sep', value: 86 },
  { name: '24 Sep', value: 92 },
  { name: '25 Sep', value: 96.5 },
  { name: '26 Sep', value: 90 },
  { name: '27 Sep', value: 89 },
  { name: '28 Sep', value: 93 },
  { name: '29 Sep', value: 98 },
];

const absentees = [
  { id: 'M-62358', name: 'Sarah Jenkins', grade: '10-A', parent: '555-0192', status: 'Unexcused', initials: 'SJ' },
  { id: 'M-62359', name: 'Marcus Chen', grade: '8-C', parent: '555-0844', status: 'Sick Leave', initials: 'MC' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TEACHING_PERIODS = [
  '1st Period (9:45 - 10:45 AM)',
  '2nd Period (10:45 - 11:45 AM)',
  '3rd Period (11:45 AM - 12:45 PM)',
  '4th Period (1:30 - 2:30 PM)',
  '5th Period (2:30 - 3:30 PM)'
];

export default function AdminDashboardPage() {
  const [selectedDate] = useState('October 24, 2024');

  // Free Teachers State
  const [selectedDay, setSelectedDay] = useState(() => {
    const dayIndex = new Date().getDay();
    if (dayIndex >= 1 && dayIndex <= 6) return DAYS[dayIndex - 1];
    return 'Monday';
  });
  const [freeTeachers, setFreeTeachers] = useState([]);
  const [freeTimetable, setFreeTimetable] = useState([]);
  const [freeLoading, setFreeLoading] = useState(true);
  const [freeError, setFreeError] = useState(null);
  const [filterSubject, setFilterSubject] = useState('All');

  useEffect(() => {
    fetchFreeTeacherData();
  }, []);

  async function fetchFreeTeacherData() {
    setFreeLoading(true);
    setFreeError(null);
    try {
      const [profilesRes, timetableRes] = await Promise.all([
        supabase.from('profiles').select('*').in('role', ['teacher', 'admin']),
        supabase.from('timetable').select('*')
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (timetableRes.error) throw timetableRes.error;
      const teacherList = (profilesRes.data || []).filter(t => t.role === 'teacher' || t.subject);
      setFreeTeachers(teacherList);
      setFreeTimetable(timetableRes.data || []);
    } catch (e) {
      console.error('Error fetching free teacher data:', e);
      setFreeError(e.message || 'Failed to analyze timetable data');
    } finally {
      setFreeLoading(false);
    }
  }

  const getFreeTeachersForPeriod = (periodStr) => {
    const basePeriod = periodStr.split(' ')[0] + ' ' + periodStr.split(' ')[1];
    const busyTeacherIds = new Set(
      freeTimetable
        .filter(t => t.day_of_week === selectedDay && 
          (t.period === periodStr || t.period?.startsWith(basePeriod)) && 
          t.subject !== 'Free Hour' && 
          t.subject !== 'Preparation Time')
        .map(t => t.teacher_id)
    );
    return freeTeachers.filter(t => {
      const isFree = !busyTeacherIds.has(t.id);
      const matchesSubj = filterSubject === 'All' || (t.subject && t.subject.toLowerCase() === filterSubject.toLowerCase());
      return isFree && matchesSubj;
    });
  };

  const subjectsList = ['All', ...new Set(freeTeachers.map(t => t.subject).filter(Boolean))];

  return (
    <Layout>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--maroon-900)' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>{selectedDate}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link
            to="/admin/tasks"
            style={{
              background: 'var(--maroon-900, #7A1A1A)',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.92rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(122,26,26,0.25)',
              transition: 'all 0.2s'
            }}
          >
            <CheckSquare size={18} />
            Assign Event Tasks to Teachers
          </Link>
          <Link
            to="/admin/attendance"
            style={{
              background: '#E0F2FE',
              color: '#0369A1',
              padding: '10px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.92rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(3,105,161,0.15)',
              transition: 'all 0.2s'
            }}
          >
            <UserCheck size={18} />
            Biometric Attendance
          </Link>
        </div>
      </div>

      <div className="admin-dashboard-grid" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        
        {/* Main Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
          
          {/* Top Metrics Cards */}
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {/* Total Students */}
            <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', position: 'relative' }}>
              <div style={{ background: '#FCEFEF', color: 'var(--maroon-900)', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Users size={20} />
              </div>
              <div style={{ position: 'absolute', top: 20, right: 20, background: '#D1FAE5', color: '#065F46', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                ↑ 12
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 4 }}>Total Students</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--maroon-900)' }}>1,248</div>
            </div>

            {/* Total Staff */}
            <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--border-color)' }}>
              <div style={{ background: '#FCEFEF', color: 'var(--maroon-900)', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Users size={20} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 4 }}>Total Staff</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--maroon-900)' }}>86</div>
            </div>

            {/* Active Buses */}
            <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', position: 'relative' }}>
              <div style={{ background: 'var(--accent)', color: '#fff', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Bus size={20} />
              </div>
              <div style={{ position: 'absolute', top: 20, right: 20, background: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                1 Maint.
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 4 }}>Active Buses</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--maroon-900)' }}>14<span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/15</span></div>
            </div>

            {/* Today's Attendance */}
            <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--border-color)' }}>
              <div style={{ background: '#E0F2FE', color: '#0369A1', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <CheckCircle size={20} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 4 }}>Today's Attendance</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--maroon-900)' }}>94%</div>
            </div>
          </div>

          {/* Attendance Trends */}
          <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--maroon-900)', marginBottom: 4 }}>Attendance Trends</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Daily overview of student presence</p>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--maroon-900)' }}></div>
                  <span style={{ fontSize: '0.9rem' }}>Present</span>
                </div>
                <div style={{ background: '#F5F5F5', padding: '6px 12px', borderRadius: 6, fontSize: '0.85rem' }}>
                  Last 7 Days ▾
                </div>
              </div>
            </div>

            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--maroon-900)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--maroon-900)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(val) => `${val}%`} domain={[80, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="var(--maroon-900)" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Current Absentees */}
          <div style={{ background: 'var(--bg-surface)', padding: '24px 0', borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '0 24px', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--maroon-900)', marginBottom: 4 }}>Current Absentees</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Students marked absent today</p>
              </div>
              <button style={{ background: '#F5F5F5', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.85rem', color: 'var(--maroon-900)', fontWeight: 500, cursor: 'pointer' }}>
                View All List
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 550 }}>
                <thead>
                  <tr style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: '#FAFAFA' }}>
                    <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>STUDENT PROFILE</th>
                    <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>GRADE/SECTION</th>
                    <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>PARENT CONTACT</th>
                    <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {absentees.map((abs, i) => (
                    <tr key={i} style={{ borderBottom: i !== absentees.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FCEFEF', color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 }}>
                          {abs.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--maroon-900)' }}>{abs.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {abs.id}</div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--maroon-900)', fontWeight: 500 }}>{abs.grade}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-main)' }}>{abs.parent}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: 12, 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          background: abs.status === 'Unexcused' ? '#FEE2E2' : '#FEF3C7',
                          color: abs.status === 'Unexcused' ? '#991B1B' : '#92400E',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: abs.status === 'Unexcused' ? '#EF4444' : '#F59E0B' }}></div>
                          {abs.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="admin-right-col" style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 24, flexShrink: 0 }}>
          
          {/* Urgent Actions */}
          <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--maroon-900)' }}>Urgent Actions</h2>
                <span style={{ background: 'var(--maroon-900)', color: '#fff', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>3</span>
              </div>
              <MoreHorizontal size={18} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Action 1 */}
              <div style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 12, borderLeft: '4px solid #EF4444', background: '#FAFAFA' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--maroon-900)' }}>Fee Overdue</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>42 Students pending Q3 payment.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-main)' }}>View List</button>
                </div>
              </div>

              {/* Action 2 */}
              <div style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 12, borderLeft: '4px solid var(--maroon-900)', background: '#FAFAFA' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FCEFEF', color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--maroon-900)' }}>Leave Requests</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>5 Staff requests pending approval.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-main)' }}>Review All</button>
                </div>
              </div>

              {/* Action 3 */}
              <div style={{ padding: 16, border: '1px solid var(--accent)', borderRadius: 12, borderLeft: '4px solid var(--accent)', background: '#FFF7ED' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Wrench size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#92400E' }}>Maintenance Due</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Bus 04 requires scheduled service.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-main)' }}>Schedule</button>
                </div>
              </div>
            </div>
          </div>

          {/* Course Schedule */}
          <div style={{ background: 'var(--maroon-900)', padding: 24, borderRadius: 16, color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>Course Schedule</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Today's planned activities</p>
              </div>
              <MoreHorizontal size={18} color="rgba(255,255,255,0.7)" style={{ cursor: 'pointer' }} />
            </div>

            {/* Date Picker */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              {[
                { m: 'SEP', d: '22', active: false },
                { m: 'SEP', d: '23', active: true },
                { m: 'SEP', d: '24', active: false },
                { m: 'SEP', d: '25', active: false },
                { m: 'SEP', d: '26', active: false }
              ].map((dt, i) => (
                <div key={i} style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 12px',
                  background: dt.active ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}>
                  <div style={{ fontSize: '0.7rem', opacity: dt.active ? 1 : 0.7, fontWeight: 600 }}>{dt.m}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{dt.d}</div>
                </div>
              ))}
            </div>

            {/* Schedule Item */}
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={24} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>Staff Briefing</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>Main Auditorium</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.2)', width: 'fit-content', padding: '4px 10px', borderRadius: 12 }}>
                    <CalendarDays size={12} /> 08:30 AM
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FREE TEACHERS SECTION - Embedded in Admin Dashboard
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FCEFEF', color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--maroon-900)', margin: 0 }}>Free Teachers Now</h2>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>Real-time faculty availability based on timetable</p>
            </div>
          </div>
        </div>

        {/* Day Selector + Subject Filter */}
        <div className="card" style={{ padding: 18, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Calendar size={16} color="var(--maroon-900)" />
            <span style={{ fontWeight: 600, color: 'var(--maroon-900)', fontSize: '0.9rem', marginRight: 4 }}>Day:</span>
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: selectedDay === day ? 'var(--maroon-900)' : 'var(--bg-surface-hover)',
                  color: selectedDay === day ? '#fff' : 'var(--text-main)',
                  fontWeight: selectedDay === day ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.85rem'
                }}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: '#fff', fontSize: '0.85rem', fontWeight: 500 }}
            >
              {subjectsList.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Free Teachers Grid */}
        {freeError ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#991B1B', background: '#FEE2E2', border: '1px solid #FCA5A5' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 600 }}>Failed to load free teachers</div>
            <div style={{ fontSize: '0.85rem', marginTop: 4 }}>{freeError}</div>
          </div>
        ) : freeLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Analyzing timetable...</p>
          </div>
        ) : (
          <div className="free-teachers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {TEACHING_PERIODS.map((periodStr) => {
              const freeList = getFreeTeachersForPeriod(periodStr);
              return (
                <div key={periodStr} className="card" style={{ border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%', padding: 18 }}>
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FCEFEF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--maroon-900)' }}>
                        <Clock size={16} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{periodStr.split(' (')[0]}</h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {periodStr.includes('(') ? periodStr.split(' (')[1].replace(')', '') : ''}
                        </div>
                      </div>
                    </div>
                    <span style={{ background: freeList.length > 0 ? '#D1FAE5' : '#FEF3C7', color: freeList.length > 0 ? '#065F46' : '#92400E', padding: '3px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700 }}>
                      {freeList.length} Free
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    {freeList.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {freeList.slice(0, 5).map((t, i) => (
                          <div key={t.id || i} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--maroon-900)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                                {t.name ? t.name.charAt(0).toUpperCase() : 'T'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>{t.name || 'Faculty'}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--gold-600)', fontWeight: 600 }}>{t.subject || 'General'}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {t.phone && (
                                <a href={`tel:${t.phone}`} style={{ padding: 5, background: '#fff', borderRadius: 4, color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                                  <Phone size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                        {freeList.length > 5 && (
                          <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, paddingTop: 4 }}>
                            +{freeList.length - 5} more teachers
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)' }}>
                        <AlertCircle size={22} style={{ opacity: 0.4, margin: '0 auto 6px auto' }} />
                        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>No teachers free</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-dashboard-grid { flex-direction: column !important; }
          .admin-right-col { width: 100% !important; }
        }
        @media (max-width: 640px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .free-teachers-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}
