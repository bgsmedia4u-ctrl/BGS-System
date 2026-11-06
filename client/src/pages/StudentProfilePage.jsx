import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { 
  getStudentById, 
  getStudentMarks, 
  getStudentAttendance, 
  getStudentCompliances,
  shiftStudent,
  removeStudent,
  getNextAvailableRollNumber,
  checkRollNumberAvailable
} from '../api/studentProfileService';
import { toggleAttendanceRecord } from '../api/attendanceService';
import { CLASS_OPTIONS } from '../api/marksService';
import { 
  User, 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRightLeft, 
  Trash2, 
  Phone, 
  CheckCircle2, 
  PenLine,
  X 
} from 'lucide-react';
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

  // Shift Modal State
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    targetStream: 'Science',
    targetYear: '1st Year',
    targetClass: 'Class A',
    targetRollNumber: ''
  });
  const [shiftRollCheck, setShiftRollCheck] = useState({ checking: false, available: true, message: '' });
  const [shiftSubmitting, setShiftSubmitting] = useState(false);
  const [attUpdatingId, setAttUpdatingId] = useState(null);

  // Remove Modal State
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);

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

  const targetClassOptions = useMemo(() => {
    const key = `${shiftForm.targetStream}|${shiftForm.targetYear}`;
    return CLASS_OPTIONS[key] || ['Class A', 'Class B', 'FTB', 'Inspire'];
  }, [shiftForm.targetStream, shiftForm.targetYear]);

  // Open Shift modal with student's current settings
  async function openShiftModal() {
    if (!student) return;
    const nextRoll = await getNextAvailableRollNumber(student.stream, student.year, student.class);

    setShiftForm({
      targetStream: student.stream,
      targetYear: student.year,
      targetClass: student.class,
      targetRollNumber: student.roll_number ? student.roll_number.toString() : nextRoll.toString()
    });

    setIsShiftOpen(true);
  }

  // Quick toggle attendance status for a session record
  async function handleToggleAttendance(record) {
    setAttUpdatingId(record.id);
    try {
      const updated = await toggleAttendanceRecord(record.id, record.is_absent);
      setAttendance(prev => prev.map(r => r.id === record.id ? { ...r, is_absent: updated.is_absent } : r));
      toast.success(`Attendance updated to ${updated.is_absent ? 'Absent' : 'Present'}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update attendance status');
    } finally {
      setAttUpdatingId(null);
    }
  }

  // Live roll number check in target batch
  useEffect(() => {
    if (!isShiftOpen || !shiftForm.targetRollNumber || !student) {
      setShiftRollCheck({ checking: false, available: true, message: '' });
      return;
    }

    const rollInt = parseInt(shiftForm.targetRollNumber, 10);
    if (isNaN(rollInt) || rollInt <= 0) {
      setShiftRollCheck({ checking: false, available: false, message: 'Roll number must be a positive integer.' });
      return;
    }

    let isMounted = true;
    setShiftRollCheck(prev => ({ ...prev, checking: true }));

    const timer = setTimeout(async () => {
      const isAvailable = await checkRollNumberAvailable(
        shiftForm.targetStream,
        shiftForm.targetYear,
        shiftForm.targetClass,
        rollInt,
        student.id
      );

      if (isMounted) {
        if (isAvailable) {
          setShiftRollCheck({ checking: false, available: true, message: `Roll No ${rollInt} is available in destination batch.` });
        } else {
          setShiftRollCheck({ checking: false, available: false, message: `Roll No ${rollInt} is already taken in destination batch.` });
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [shiftForm.targetRollNumber, shiftForm.targetStream, shiftForm.targetYear, shiftForm.targetClass, isShiftOpen, student]);

  async function handleShiftSubmit(e) {
    e.preventDefault();
    if (!shiftRollCheck.available) {
      toast.error('The selected Roll Number is not available');
      return;
    }

    setShiftSubmitting(true);
    try {
      const updated = await shiftStudent(student.id, {
        targetStream: shiftForm.targetStream,
        targetYear: shiftForm.targetYear,
        targetClass: shiftForm.targetClass,
        targetRollNumber: shiftForm.targetRollNumber
      });

      setStudent(prev => ({ ...prev, ...updated }));
      toast.success(`Student successfully shifted to ${shiftForm.targetStream} - ${shiftForm.targetClass}!`);
      setIsShiftOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to shift student');
    } finally {
      setShiftSubmitting(false);
    }
  }

  async function handleRemoveSubmit() {
    setRemoveSubmitting(true);
    try {
      await removeStudent(student.id);
      toast.success(`Student "${student.name}" removed successfully.`);
      navigate('/students');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to remove student');
      setRemoveSubmitting(false);
    }
  }

  const attendanceStats = useMemo(() => {
    if (!attendance.length) return { present: 0, absent: 0, percentage: 0 };
    const absent = attendance.filter(a => a.is_absent).length;
    const present = attendance.length - absent;
    const percentage = Math.round((present / attendance.length) * 100);
    return { present, absent, percentage };
  }, [attendance]);

  const marksData = useMemo(() => {
    return marks.map(entry => {
      const marksObj = entry.marks || {};
      const subjects = Object.keys(marksObj);
      let total = 0;
      subjects.forEach(sub => total += Number(marksObj[sub]) || 0);
      const maxPossible = subjects.length * 100;
      const percentage = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;
      
      return {
        name: entry.tests?.name || 'Unknown Test',
        score: percentage,
        date: new Date(entry.tests?.created_at).toLocaleDateString()
      };
    }).reverse();
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
          <button onClick={() => navigate('/students')} style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
            Go to Student Directory
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '0 0 24px 0' }}>
        <button 
          onClick={() => navigate('/students')} 
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 24, fontSize: '0.9rem', fontWeight: 500 }}
        >
          <ArrowLeft size={16} /> Back to Student Directory
        </button>
        
        {/* Header Profile Card */}
        <div style={{ background: 'var(--bg-surface)', padding: 28, borderRadius: 16, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--maroon-900)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>
              {student.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--maroon-900)', margin: '0 0 4px 0' }}>{student.name}</h1>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  background: '#ECFDF5', 
                  color: '#065F46', 
                  padding: '3px 10px', 
                  borderRadius: 12, 
                  fontSize: '0.78rem', 
                  fontWeight: 700 
                }}>
                  {student.status || 'Active'}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: 4 }}>
                <span><strong style={{ color: 'var(--text-main)' }}>Roll No:</strong> #{student.roll_number || 'N/A'}</span>
                <span><strong style={{ color: 'var(--text-main)' }}>Class:</strong> {student.class}</span>
                <span><strong style={{ color: 'var(--text-main)' }}>Stream:</strong> {student.stream}</span>
                <span><strong style={{ color: 'var(--text-main)' }}>Year:</strong> {student.year}</span>
                {student.parent_phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={13} /> {student.parent_phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Admin Management Actions: Shift / Remove */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={openShiftModal}
              style={{
                background: '#FCEFEF',
                border: '1px solid #F5C6CB',
                color: 'var(--maroon-900)',
                padding: '9px 16px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <ArrowRightLeft size={16} /> Shift Student
            </button>

            <button
              onClick={() => setIsRemoveOpen(true)}
              style={{
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: '#DC2626',
                padding: '9px 16px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={16} /> Remove
            </button>
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

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {attendance.length === 0 ? 'Initial attendance is 0% (no sessions recorded)' : `${attendance.length} session(s) recorded`}
              </span>
              <button
                onClick={() => navigate(`/attendance?stream=${student.stream}&year=${student.year}&class=${encodeURIComponent(student.class)}`)}
                style={{
                  background: '#FCEFEF',
                  border: '1px solid #F5C6CB',
                  color: 'var(--maroon-900)',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <PenLine size={13} /> Edit Batch Attendance
              </button>
            </div>

            {/* Individual Attendance Sessions Log with Admin Quick-Toggle */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--maroon-900)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Recorded Sessions</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>Admin can click status to edit</span>
              </div>
              {attendance.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No sessions recorded yet. Initial attendance baseline is 0%.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                  {attendance.slice(0, 10).map((r) => {
                    const sessionDate = r.attendance_sessions?.date || 'Recorded Date';
                    const isAbsent = r.is_absent;
                    return (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA', padding: '6px 10px', borderRadius: 6, fontSize: '0.82rem', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontWeight: 500 }}>{sessionDate}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => handleToggleAttendance(r)}
                            disabled={attUpdatingId === r.id}
                            style={{
                              border: 'none',
                              borderRadius: 12,
                              padding: '2px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: isAbsent ? '#FEE2E2' : '#DCFCE7',
                              color: isAbsent ? '#DC2626' : '#16A34A',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title="Click to toggle Present / Absent"
                          >
                            {isAbsent ? '✗ Absent' : '✓ Present'}
                          </button>
                          <button
                            onClick={() => navigate(`/attendance?stream=${r.attendance_sessions?.stream || student.stream}&year=${r.attendance_sessions?.year || student.year}&class=${encodeURIComponent(r.attendance_sessions?.class || student.class)}&date=${sessionDate}&edit=true`)}
                            style={{ background: 'none', border: 'none', color: 'var(--maroon-900)', cursor: 'pointer', padding: 2 }}
                            title="Open Full Session Editor"
                          >
                            <PenLine size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

        {/* Shift Modal */}
        {isShiftOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: 520, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ padding: '20px 24px', background: 'var(--maroon-900)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Shift Student: {student.name}</h3>
                <button onClick={() => setIsShiftOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleShiftSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Target Stream</label>
                    <select
                      value={shiftForm.targetStream}
                      onChange={e => {
                        const newStream = e.target.value;
                        const nextClasses = CLASS_OPTIONS[`${newStream}|${shiftForm.targetYear}`] || ['Class A'];
                        setShiftForm(prev => ({ ...prev, targetStream: newStream, targetClass: nextClasses[0] }));
                      }}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                      <option value="Science">Science</option>
                      <option value="Commerce">Commerce</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Target Year</label>
                    <select
                      value={shiftForm.targetYear}
                      onChange={e => {
                        const newYear = e.target.value;
                        const nextClasses = CLASS_OPTIONS[`${shiftForm.targetStream}|${newYear}`] || ['Class A'];
                        setShiftForm(prev => ({ ...prev, targetYear: newYear, targetClass: nextClasses[0] }));
                      }}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Target Class / Section</label>
                  <select
                    value={shiftForm.targetClass}
                    onChange={e => setShiftForm({ ...shiftForm, targetClass: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    {targetClassOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Target Roll Number *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={shiftForm.targetRollNumber}
                    onChange={e => setShiftForm({ ...shiftForm, targetRollNumber: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: shiftRollCheck.available ? '1px solid var(--border-color)' : '1px solid #EF4444', outline: 'none' }}
                  />
                  {shiftRollCheck.message && (
                    <div style={{ marginTop: 6, fontSize: '0.78rem', color: shiftRollCheck.available ? '#059669' : '#DC2626' }}>
                      {shiftRollCheck.message}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                  <button type="button" onClick={() => setIsShiftOpen(false)} style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={shiftSubmitting || !shiftRollCheck.available} style={{ background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                    {shiftSubmitting ? 'Shifting...' : 'Confirm Shift'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Remove Modal */}
        {isRemoveOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: 420, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <Trash2 size={24} />
              </div>

              <h3 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700 }}>
                Remove Student Record?
              </h3>

              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
                Are you sure you want to permanently remove <strong>{student.name}</strong> from the database? This action cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button type="button" onClick={() => setIsRemoveOpen(false)} style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', flex: 1 }}>
                  Cancel
                </button>
                <button type="button" onClick={handleRemoveSubmit} disabled={removeSubmitting} style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', flex: 1 }}>
                  {removeSubmitting ? 'Removing...' : 'Yes, Remove'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
