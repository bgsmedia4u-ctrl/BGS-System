import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTimetable, getTeacherTimetable, updateTimetableEntry, deleteTimetableEntry } from '../api/timetableService';
import { getAllTeachers } from '../data/profileService';
import { supabase } from '../api/supabase';
import Layout from '../components/Layout';
import { Clock, Edit2, Check, X, Plus, Trash2, BookOpen, Calendar, UserCheck, MapPin, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [
  'College Prayer (9:30 - 9:45 AM)',
  '1st Period (9:45 - 10:45 AM)',
  '2nd Period (10:45 - 11:45 AM)',
  '3rd Period (11:45 AM - 12:45 PM)',
  'Lunch (12:45 - 1:30 PM)',
  '4th Period (1:30 - 2:30 PM)',
  '5th Period (2:30 - 3:30 PM)'
];

const DEFAULT_SUBJECTS = [
  'Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 
  'Computer Science', 'Economics', 'Accountancy', 'Business Studies', 
  'History', 'Political Science', 'Sociology', 'Kannada', 'Hindi'
];

export default function TimetablePage({ isAdmin = false }) {
  const { user, profile } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  // Filters (for Admin to view specific class matrices)
  const [stream, setStream] = useState('Science');
  const [year, setYear] = useState('1st Year');
  const [cls, setCls] = useState('Class A');

  // Dynamic Options from DB
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  // Slot Editor Modal State
  const [activeModal, setActiveModal] = useState(null); // { day, period, entry }
  const [slotType, setSlotType] = useState('class'); // 'class' or 'free'
  const [formSubject, setFormSubject] = useState('');
  const [formStream, setFormStream] = useState('Science');
  const [formYear, setFormYear] = useState('1st Year');
  const [formClass, setFormClass] = useState('Class A');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      fetchTeacherData();
    }
  }, [isAdmin, stream, year, cls, user]);

  async function fetchTeacherData() {
    setLoading(true);
    try {
      if (!user?.id) return;
      const data = await getTeacherTimetable(user.id);
      setTimetable(data || []);
      
      // Load institutional dropdowns for suggestions
      if (profile?.institution_id) {
        const [deptRes, subjRes, clsRes] = await Promise.all([
          supabase.from('departments').select('name').eq('institution_id', profile.institution_id),
          supabase.from('subjects').select('name').eq('institution_id', profile.institution_id),
          supabase.from('classes').select('name').eq('institution_id', profile.institution_id)
        ]);
        setDepartments(deptRes.data || []);
        setSubjects(subjRes.data || []);
        setClasses(clsRes.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load timetable entries');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAdminData() {
    setLoading(true);
    try {
      const data = await getTimetable(stream, year, cls);
      setTimetable(data || []);
      
      const tData = await getAllTeachers();
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
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load timetable matrix');
    } finally {
      setLoading(false);
    }
  }

  const getEntry = (day, period) => {
    return timetable.find(t => t.day_of_week === day && t.period === period);
  };

  const handleOpenEditor = (day, period, entry) => {
    const isFree = entry?.subject === 'Free Hour' || entry?.subject === 'Preparation Time';
    setSlotType(isFree ? 'free' : 'class');
    setFormSubject(isFree ? '' : (entry?.subject || profile?.subject || 'Physics'));
    setFormStream(entry?.stream || (isAdmin ? stream : 'Science'));
    setFormYear(entry?.year || (isAdmin ? year : '1st Year'));
    setFormClass(entry?.class || (isAdmin ? cls : 'Class A'));
    setFormTeacherId(entry?.teacher_id || (!isAdmin ? user?.id : (teachers[0]?.id || '')));
    
    setActiveModal({ day, period, entry });
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSaving(false);
  };

  const handleSaveSlot = async () => {
    if (!activeModal) return;
    setSaving(true);
    try {
      const isFree = slotType === 'free';
      const payload = {
        id: activeModal.entry?.id,
        stream: isFree ? (isAdmin ? stream : 'Faculty Available') : formStream,
        year: isFree ? (isAdmin ? year : 'Prep Time') : formYear,
        class: isFree ? (isAdmin ? cls : 'Office / Staff Room') : formClass,
        day_of_week: activeModal.day,
        period: activeModal.period,
        subject: isFree ? 'Free Hour' : (formSubject.trim() || 'Assigned Class'),
        teacher_id: !isAdmin ? user.id : (formTeacherId || null),
        isTeacherEdit: !isAdmin
      };

      await updateTimetableEntry(payload);
      toast.success(isFree ? 'Slot recorded as Free Hour!' : 'Class schedule saved successfully!');
      handleCloseModal();

      if (isAdmin) {
        await fetchAdminData();
      } else {
        await fetchTeacherData();
      }
    } catch (err) {
      console.error('Save error:', err);
      if (err.message?.includes('row-level security')) {
        toast.error('Database security restriction: Please apply the RLS migration script in your Supabase SQL Editor.');
      } else {
        toast.error(err.message || 'Failed to update timetable slot.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSlot = async () => {
    if (!activeModal?.entry?.id) {
      handleCloseModal();
      return;
    }
    setSaving(true);
    try {
      await deleteTimetableEntry(activeModal.entry.id);
      toast.success('Timetable slot cleared!');
      handleCloseModal();
      if (isAdmin) {
        await fetchAdminData();
      } else {
        await fetchTeacherData();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear schedule slot.');
      setSaving(false);
    }
  };

  const suggestions = subjects.length > 0 ? subjects.map(s => s.name) : DEFAULT_SUBJECTS;

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">
            <Clock size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 10, color: 'var(--maroon-900)' }}/> 
            {isAdmin ? 'Institutional Timetable Manager' : 'My Faculty Schedule & Free Hours'}
          </h1>
          <p className="page-subtitle">
            {isAdmin 
              ? 'Configure batch timetables and assign instructional faculty across streams' 
              : 'Effortlessly organize when you are conducting class instructions and when you are in free hour preparation'}
          </p>
        </div>
      </div>

      <div className="page-body fade-in">
        {/* Admin Batch Filter Header */}
        {isAdmin && (
          <div className="card" style={{ marginBottom: 24, padding: '20px 24px', background: '#FFFBFB', border: '1px solid var(--border-color)', borderRadius: 14 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--maroon-900)', marginBottom: 16 }}>Select Academic Matrix to Manage</h3>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Stream / Department</label>
                <select className="form-input" value={stream} onChange={e => setStream(e.target.value)} style={{ padding: '10px 12px' }}>
                  {departments.length > 0 ? (
                    departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)
                  ) : (
                    <>
                      <option value="Science">Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts</option>
                      <option value="General">General</option>
                    </>
                  )}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Academic Year</label>
                <select className="form-input" value={year} onChange={e => setYear(e.target.value)} style={{ padding: '10px 12px' }}>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>Section / Batch</label>
                <select className="form-input" value={cls} onChange={e => setCls(e.target.value)} style={{ padding: '10px 12px' }}>
                  {classes.length > 0 ? (
                    classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)
                  ) : (
                    <>
                      <option value="Class A">Class A</option>
                      <option value="Class B">Class B</option>
                      <option value="Section C">Section C</option>
                      <option value="FTB-1">FTB-1</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Timetable Grid */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid var(--border-color)' }}>
          {loading ? (
             <div style={{ padding: 60, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div><p style={{ marginTop: 14, color: 'var(--text-muted)' }}>Loading schedule...</p></div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ minWidth: 900, borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ width: 140, padding: '16px 18px', fontWeight: 700, color: 'var(--maroon-900)', textAlign: 'left' }}>Time / Period</th>
                    {DAYS.map(day => (
                      <th key={day} style={{ textAlign: 'center', padding: '16px 14px', fontWeight: 700, color: 'var(--maroon-900)', fontSize: '0.95rem' }}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map(period => (
                    <tr key={period} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ fontWeight: 700, background: 'var(--bg-surface-hover)', padding: '16px 18px', color: 'var(--text-main)', fontSize: '0.85rem', width: 140 }}>
                        {period}
                      </td>
                      {period.includes('Prayer') ? (
                        <td colSpan="6" style={{ textAlign: 'center', background: '#FEF3C7', color: '#92400E', fontWeight: 700, letterSpacing: '0.04em', padding: '16px', fontSize: '0.9rem' }}>
                          🙏 College Prayer (9:30 AM – 9:45 AM) • Institutional Assembly Period
                        </td>
                      ) : period.includes('Lunch') ? (
                        <td colSpan="6" style={{ textAlign: 'center', background: 'var(--bg-surface-hover)', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '16px', fontSize: '0.88rem' }}>
                          🍽️ Mid-Day Lunch Break (12:45 PM – 1:30 PM)
                        </td>
                      ) : (
                        DAYS.map(day => {
                          const entry = getEntry(day, period);
                          const isFree = entry?.subject === 'Free Hour' || entry?.subject === 'Preparation Time';
                          
                          return (
                            <td 
                              key={day} 
                              style={{ verticalAlign: 'middle', height: 96, padding: '10px 8px', textAign: 'center', background: entry ? (isFree ? '#F0FDF4' : '#F8FAFC') : '#FFF', borderRight: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }}
                              onClick={() => handleOpenEditor(day, period, entry)}
                            >
                              {entry ? (
                                isFree ? (
                                  <div style={{ padding: '10px', borderRadius: '10px', background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                      🟢 Free Hour
                                    </span>
                                    <span style={{ fontSize: '0.73rem', color: '#166534', fontWeight: 500 }}>Prep • Available</span>
                                  </div>
                                ) : (
                                  <div style={{ padding: '10px', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--maroon-900)' }}>{entry.subject}</div>
                                    {!isAdmin && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>{entry.stream} • {entry.class}</div>}
                                    {isAdmin && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>{entry.teacher?.raw_user_meta_data?.full_name || 'Assigned Faculty'}</div>}
                                  </div>
                                )
                              ) : (
                                <div style={{ height: '100%', minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #CBD5E1', borderRadius: '8px', background: '#FAFAFA', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 500 }}>
                                  + Set Slot
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

      {/* Interactive Slot Editor Modal */}
      {activeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={handleCloseModal}
              style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={22} />
            </button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--maroon-900)', marginBottom: 6 }}>
              Configure Schedule Slot
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 20, fontWeight: 500 }}>
              {activeModal.day} • {activeModal.period}
            </p>

            {/* Slot Type Toggle (In Class vs Free Hour) */}
            <div style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>What will you be doing during this hour?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setSlotType('class')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: slotType === 'class' ? '2px solid var(--maroon-900)' : '1px solid var(--border-color)',
                    background: slotType === 'class' ? '#FFF5F5' : '#fff',
                    color: slotType === 'class' ? 'var(--maroon-900)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                >
                  🏫 In Class (Teaching)
                </button>
                <button
                  type="button"
                  onClick={() => setSlotType('free')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: slotType === 'free' ? '2px solid #16A34A' : '1px solid var(--border-color)',
                    background: slotType === 'free' ? '#F0FDF4' : '#fff',
                    color: slotType === 'free' ? '#16A34A' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                >
                  🟢 Free Hour (Prep)
                </button>
              </div>
            </div>

            {/* In Class Form Configuration */}
            {slotType === 'class' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Subject / Course Title</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Physics, Chemistry, Mathematics, English..." 
                    value={formSubject} 
                    onChange={e => setFormSubject(e.target.value)}
                    list="subject-suggestions"
                    style={{ padding: '10px 12px' }}
                  />
                  <datalist id="subject-suggestions">
                    {suggestions.map(sub => <option key={sub} value={sub} />)}
                  </datalist>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Stream</label>
                    <select className="form-input" value={formStream} onChange={e => setFormStream(e.target.value)} style={{ padding: '10px 12px' }}>
                      <option value="Science">Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Year</label>
                    <select className="form-input" value={formYear} onChange={e => setFormYear(e.target.value)} style={{ padding: '10px 12px' }}>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="All Years">All Years</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Class / Section</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formClass} 
                    placeholder="e.g. Class A, Section B, FTB-1..." 
                    onChange={e => setFormClass(e.target.value)}
                    style={{ padding: '10px 12px' }}
                  />
                </div>

                {isAdmin && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Assign Faculty</label>
                    <select className="form-input" value={formTeacherId} onChange={e => setFormTeacherId(e.target.value)} style={{ padding: '10px 12px' }}>
                      <option value="">-- Select Teacher --</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject || 'Faculty'})</option>)}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 18, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, color: '#166534', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>✨ Free Hour Scheduled</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.84rem', color: '#15803D' }}>
                  By selecting Free Hour, you will be recorded as available for preparation time or substitute teaching assignments on the faculty availability dashboard during this period.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
              {activeModal.entry?.id ? (
                <button 
                  type="button" 
                  onClick={handleRemoveSlot} 
                  disabled={saving}
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <Trash2 size={16} /> Clear Slot
                </button>
              ) : <div></div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  disabled={saving}
                  className="btn btn-ghost" 
                  style={{ padding: '10px 18px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveSlot} 
                  disabled={saving}
                  className="btn btn-primary" 
                  style={{ padding: '10px 22px', fontWeight: 700, background: 'var(--maroon-900)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
