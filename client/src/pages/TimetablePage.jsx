import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTimetable, getTeacherTimetable, updateTimetableEntry } from '../api/timetableService';
import { supabase } from '../api/supabase';
import Layout from '../components/Layout';
import { Clock, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = ['1st Period', '2nd Period', '3rd Period', 'Lunch', '4th Period', '5th Period'];

export default function TimetablePage({ isAdmin = false }) {
  const { user, profile } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  // Filters (for Admin to view specific classes)
  const [stream, setStream] = useState('Science');
  const [year, setYear] = useState('1st Year');
  const [cls, setCls] = useState('Class A');

  // Dynamic Options
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  // Edit Mode (Admin only)
  const [editingKey, setEditingKey] = useState(null); // format: "Day|Period"
  const [editSubject, setEditSubject] = useState('');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editStream, setEditStream] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editCls, setEditCls] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      fetchTeacherData();
    }
  }, [isAdmin, stream, year, cls]);

  async function fetchTeacherData() {
    setLoading(true);
    try {
      const data = await getTeacherTimetable(user.id);
      setTimetable(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAdminData() {
    setLoading(true);
    try {
      const data = await getTimetable(stream, year, cls);
      setTimetable(data || []);
      
      const { data: tData } = await supabase.from('profiles').select('id, name').eq('role', 'teacher');
      setTeachers(tData || []);
      
      if (profile?.institution_id) {
        const [deptRes, subjRes, clsRes] = await Promise.all([
          supabase.from('departments').select('name').eq('institution_id', profile.institution_id),
          supabase.from('subjects').select('name').eq('institution_id', profile.institution_id),
          supabase.from('classes').select('name').eq('institution_id', profile.institution_id)
        ]);
        setDepartments(deptRes.data || []);
        setSubjects(subjRes.data || []);
        setClasses(clsRes.data || []);
        
        // Auto-select first if available and current is invalid, or just let it fall back
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }

  // Get entry for a specific day and period
  const getEntry = (day, period) => {
    return timetable.find(t => t.day_of_week === day && t.period === period);
  };

  const startEditing = (day, period, entry) => {
    setEditingKey(`${day}|${period}`);
    setEditSubject(entry?.subject || (!isAdmin ? profile?.subject : ''));
    setEditTeacherId(entry?.teacher_id || (!isAdmin ? user.id : ''));
    setEditStream(entry?.stream || 'Science');
    setEditYear(entry?.year || '1st Year');
    setEditCls(entry?.class || 'Class A');
  };

  const cancelEditing = () => {
    setEditingKey(null);
  };

  const saveEditing = async (day, period, entryId) => {
    try {
      const targetStream = isAdmin ? stream : editStream;
      const targetYear = isAdmin ? year : editYear;
      const targetCls = isAdmin ? cls : editCls;

      const updated = await updateTimetableEntry({
        id: entryId,
        stream: targetStream,
        year: targetYear,
        class: targetCls,
        day_of_week: day,
        period,
        subject: editSubject,
        teacher_id: editTeacherId
      });
      
      const teacherInfo = teachers.find(t => t.id === editTeacherId);
      const newEntry = { ...updated, teacher: { raw_user_meta_data: { full_name: teacherInfo?.name } } };
      
      setTimetable(prev => {
        const existing = prev.findIndex(p => p.id === updated.id);
        if (existing > -1) {
          const arr = [...prev];
          arr[existing] = newEntry;
          return arr;
        }
        return [...prev, newEntry];
      });
      
      setEditingKey(null);
      toast.success('Timetable updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update timetable');
    }
  };

  const authorizedAssignments = isAdmin ? [] : [...new Map(
    timetable.filter(t => t.teacher_id === user.id && t.stream && t.year && t.class && t.subject)
      .map(t => [ `${t.stream}|${t.year}|${t.class}|${t.subject}`, { stream: t.stream, year: t.year, class: t.class, subject: t.subject } ])
  ).values()];

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title"><Clock size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 8, color: 'var(--accent)' }}/> {isAdmin ? 'Manage Timetable' : 'My Timetable'}</h1>
          <p className="page-subtitle">{isAdmin ? 'Configure class schedules and assign teachers' : 'Your weekly class schedule'}</p>
        </div>
      </div>

      <div className="page-body fade-in">
        {isAdmin && (
          <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="form-label">Stream</label>
              <select className="form-input" value={stream} onChange={e => setStream(e.target.value)}>
                {departments.length > 0 ? (
                  departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)
                ) : (
                  <>
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts">Arts</option>
                  </>
                )}
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
                {classes.length > 0 ? (
                  classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)
                ) : (
                  <>
                    <option value="Class A">Class A</option>
                    <option value="Class B">Class B</option>
                    <option value="FTB-1">FTB-1</option>
                  </>
                )}
              </select>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
             <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ minWidth: 800 }}>
                <thead>
                  <tr>
                    <th style={{ width: 100, background: 'var(--bg-surface-hover)' }}>Period</th>
                    {DAYS.map(day => <th key={day} style={{ textAlign: 'center' }}>{day}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map(period => (
                    <tr key={period}>
                      <td style={{ fontWeight: 600, background: 'var(--bg-surface-hover)', whiteSpace: 'nowrap' }}>{period}</td>
                      {period === 'Lunch' ? (
                        <td colSpan="6" style={{ textAlign: 'center', background: 'var(--bg-surface-hover)', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          Lunch Break
                        </td>
                      ) : (
                        DAYS.map(day => {
                          const entry = getEntry(day, period);
                          const isEditing = editingKey === `${day}|${period}`;
                          
                          return (
                            <td key={day} style={{ verticalAlign: 'top', height: 80, borderRight: '1px solid var(--border)' }}>
                              {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10, position: 'relative', background: 'var(--bg-surface)', padding: 8, borderRadius: 8, boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
                                  {!isAdmin ? (
                                    <select className="form-input" 
                                      value={editStream && editYear && editCls && editSubject ? `${editStream}|${editYear}|${editCls}|${editSubject}` : ""}
                                      onChange={e => {
                                        const [s, y, c, sub] = e.target.value.split('|');
                                        if(s && y && c && sub) {
                                          setEditStream(s); setEditYear(y); setEditCls(c); setEditSubject(sub);
                                        } else {
                                          setEditStream(''); setEditYear(''); setEditCls(''); setEditSubject('');
                                        }
                                      }}
                                      style={{ padding: '6px 8px', fontSize: 13 }}>
                                      <option value="">Select assignment...</option>
                                      {authorizedAssignments.map(a => (
                                        <option key={`${a.stream}|${a.year}|${a.class}|${a.subject}`} value={`${a.stream}|${a.year}|${a.class}|${a.subject}`}>
                                          {a.stream} - {a.year} - {a.class} ({a.subject})
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    subjects.length > 0 ? (
                                      <select className="form-input" value={editSubject} onChange={e => setEditSubject(e.target.value)} style={{ padding: '6px 8px', fontSize: 13 }}>
                                        <option value="">Select Subject...</option>
                                        {subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                      </select>
                                    ) : (
                                      <input type="text" className="form-input" placeholder="Subject" value={editSubject} onChange={e => setEditSubject(e.target.value)} style={{ padding: '6px 8px', fontSize: 13 }} />
                                    )
                                  )}
                                  {isAdmin && (
                                    <select className="form-input" value={editTeacherId} onChange={e => setEditTeacherId(e.target.value)} style={{ padding: '6px 8px', fontSize: 13 }}>
                                      <option value="">Unassigned</option>
                                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                  )}
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn btn-primary" style={{ padding: '4px', flex: 1, justifyContent: 'center' }} onClick={() => saveEditing(day, period, entry?.id)}><Check size={14}/></button>
                                    <button className="btn btn-ghost" style={{ padding: '4px', flex: 1, justifyContent: 'center' }} onClick={cancelEditing}><X size={14}/></button>
                                  </div>
                                </div>
                              ) : entry ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }} className="group">
                                  <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{entry.subject}</div>
                                  {!isAdmin && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.stream} • {entry.class}</div>}
                                  {isAdmin && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.teacher?.raw_user_meta_data?.full_name || 'Unassigned'}</div>}
                                  
                                  <button 
                                    className="btn btn-ghost" 
                                    style={{ position: 'absolute', top: 0, right: 0, padding: 4, opacity: 0 }}
                                    onClick={() => startEditing(day, period, entry)}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <button className="btn btn-ghost" style={{ padding: '8px', borderStyle: 'dashed' }} onClick={() => startEditing(day, period, null)}>
                                    <Edit2 size={14} style={{ opacity: 0.5 }} />
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
