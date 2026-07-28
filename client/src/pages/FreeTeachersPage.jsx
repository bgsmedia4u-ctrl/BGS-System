import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import Layout from '../components/Layout';
import { UserCheck, Clock, Calendar, CheckCircle, Mail, Phone, AlertCircle, Filter, Shield } from 'lucide-react';
import '../layout.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TEACHING_PERIODS = [
  '1st Period (9:45 - 10:45 AM)',
  '2nd Period (10:45 - 11:45 AM)',
  '3rd Period (11:45 AM - 12:45 PM)',
  '4th Period (1:30 - 2:30 PM)',
  '5th Period (2:30 - 3:30 PM)'
];

export default function FreeTeachersPage() {
  const [selectedDay, setSelectedDay] = useState(() => {
    const dayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
    if (dayIndex >= 1 && dayIndex <= 6) return DAYS[dayIndex - 1];
    return 'Monday';
  });
  
  const [teachers, setTeachers] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [profilesRes, timetableRes] = await Promise.all([
        supabase.from('profiles').select('*').in('role', ['teacher', 'admin']),
        supabase.from('timetable').select('*')
      ]);
      
      const teacherList = (profilesRes.data || []).filter(t => t.role === 'teacher' || t.subject);
      setTeachers(teacherList);
      setTimetable(timetableRes.data || []);
    } catch (e) {
      console.error('Error fetching free teacher data:', e);
    } finally {
      setLoading(false);
    }
  }

  // Calculate free teachers for a specific period on the selected day
  const getFreeTeachersForPeriod = (periodStr) => {
    // Clean period string matching (whether db stores "1st Period" or full time string)
    const basePeriod = periodStr.split(' ')[0] + ' ' + periodStr.split(' ')[1];
    
    // Find teacher IDs busy during this day and period (excluding Free Hour or prep slots)
    const busyTeacherIds = new Set(
      timetable
        .filter(t => t.day_of_week === selectedDay && 
          (t.period === periodStr || t.period?.startsWith(basePeriod)) && 
          t.subject !== 'Free Hour' && 
          t.subject !== 'Preparation Time')
        .map(t => t.teacher_id)
    );

    return teachers.filter(t => {
      const isFree = !busyTeacherIds.has(t.id);
      const matchesSubj = filterSubject === 'All' || (t.subject && t.subject.toLowerCase() === filterSubject.toLowerCase());
      return isFree && matchesSubj;
    });
  };

  const subjectsList = ['All', ...new Set(teachers.map(t => t.subject).filter(Boolean))];

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">
            <UserCheck size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 10, color: 'var(--maroon-900)' }} />
            Automatic Teacher Free-Period Detection
          </h1>
          <p className="page-subtitle">
            Real-time automated inspection of faculty availability based on active database timetables. Notice: College Prayer (9:30 – 9:45 AM) is excluded from teaching calculations.
          </p>
        </div>
      </div>

      <div className="page-body fade-in">
        {/* Control Toolbar */}
        <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--maroon-900)' }}>
              <Calendar size={18} /> Day of Week:
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: selectedDay === day ? 'var(--maroon-900)' : 'var(--bg-surface-hover)',
                    color: selectedDay === day ? '#fff' : 'var(--text-main)',
                    fontWeight: selectedDay === day ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Filter size={16} color="var(--text-muted)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Subject Filter:</span>
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: '#fff', fontSize: '0.9rem', fontWeight: 500 }}
            >
              {subjectsList.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Prayer Banner reminder */}
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', padding: '14px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 500 }}>
          <Shield size={20} style={{ flexShrink: 0 }} />
          <span><strong>College Prayer Note:</strong> The 9:30 AM – 9:45 AM assembly window is designated as institutional College Prayer and is not treated as a teaching period. All staff are participating in prayer and ignored in free-slot calculations.</span>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Analyzing timetable slots and faculty schedules...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20 }}>
            {TEACHING_PERIODS.map((periodStr) => {
              const freeList = getFreeTeachersForPeriod(periodStr);
              return (
                <div key={periodStr} className="card" style={{ border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FCEFEF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--maroon-900)' }}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{periodStr.split(' (')[0]}</h3>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {periodStr.includes('(') ? periodStr.split(' (')[1].replace(')', '') : periodStr}
                        </div>
                      </div>
                    </div>
                    <span style={{ background: freeList.length > 0 ? '#D1FAE5' : '#FEF3C7', color: freeList.length > 0 ? '#065F46' : '#92400E', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>
                      {freeList.length} Free {freeList.length === 1 ? 'Teacher' : 'Teachers'}
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    {freeList.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {freeList.map((t, i) => (
                          <div key={t.id || i} style={{ padding: 12, borderRadius: 10, background: 'var(--bg-surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--maroon-900)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                                {t.name ? t.name.charAt(0).toUpperCase() : 'T'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.name || 'Faculty Member'}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--gold-600)', fontWeight: 600 }}>
                                  {t.subject || t.department || 'General Faculty'}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {t.email && (
                                <a href={`mailto:${t.email}`} title={t.email} style={{ padding: 8, background: '#fff', borderRadius: 6, color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                                  <Mail size={15} />
                                </a>
                              )}
                              {t.phone && (
                                <a href={`tel:${t.phone}`} title={t.phone} style={{ padding: 8, background: '#fff', borderRadius: 6, color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                                  <Phone size={15} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                        <AlertCircle size={28} style={{ opacity: 0.4, margin: '0 auto 8px auto' }} />
                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>No teachers free during this time slot</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>All faculty members are currently assigned to classes.</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
