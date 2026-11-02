import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { getClassOptions, getStudentsByBatch } from '../api/marksService';
import { getAttendanceSession, getAttendanceRecords, saveAttendance } from '../api/attendanceService';
import { 
  Users, 
  Printer, 
  ArrowLeft, 
  Save, 
  UserCheck, 
  UserX, 
  Search, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  PenLine, 
  Calendar, 
  BookOpen, 
  AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../layout.css';

export default function AttendancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read URL params if opened from Admin Portal or Quick Links
  const paramStream = searchParams.get('stream');
  const paramYear = searchParams.get('year');
  const paramCls = searchParams.get('class') || searchParams.get('cls');
  const paramDate = searchParams.get('date');
  const paramEdit = searchParams.get('edit');

  // Views: 'BATCH_SELECT', 'MARK_ATTENDANCE', 'PRINT_VIEW'
  const [currentView, setCurrentView] = useState(() => (paramCls && paramDate) ? 'MARK_ATTENDANCE' : 'BATCH_SELECT');
  
  // Batch state
  const [stream, setStream] = useState(paramStream || 'Science');
  const [year, setYear] = useState(paramYear || '1st Year');
  const [cls, setCls] = useState(paramCls || '');
  const [date, setDate] = useState(paramDate || new Date().toISOString().split('T')[0]);
  
  // Data state
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [isExistingSession, setIsExistingSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-load if navigated with query params
  useEffect(() => {
    if (paramCls && paramDate) {
      setCurrentView('MARK_ATTENDANCE');
      loadData(paramStream || stream, paramYear || year, paramCls, paramDate);
    }
  }, [paramStream, paramYear, paramCls, paramDate]);

  const loadData = async (sStream = stream, sYear = year, sCls = cls, sDate = date) => {
    if (!sCls) return;
    setLoading(true);
    try {
      const studentsData = await getStudentsByBatch(sStream, sYear, sCls);
      setStudents(studentsData);

      const session = await getAttendanceSession(sStream, sYear, sCls, sDate);
      const records = await getAttendanceRecords(session?.id);
      
      const nextData = {};
      if (records && records.length > 0) {
        // Editing an existing session: populate from records
        records.forEach(r => {
          nextData[r.student_id] = r.is_absent;
        });
        // Any newly registered students not in records yet initially start at zero (is_absent: true)
        studentsData.forEach(st => {
          if (nextData[st.id] === undefined) {
            nextData[st.id] = true;
          }
        });
        setIsExistingSession(true);
      } else {
        // Initial state: EVERYONE'S ATTENDANCE WILL BE ZERO!
        // is_absent: true for all students -> 0 present, 0% attendance
        studentsData.forEach(st => {
          nextData[st.id] = true;
        });
        setIsExistingSession(false);
      }
      setAttendanceData(nextData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance roster.');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSelect = () => {
    if (!cls) return toast.error('Please select a class.');
    if (!date) return toast.error('Please select a date.');
    setCurrentView('MARK_ATTENDANCE');
    loadData(stream, year, cls, date);
  };

  const toggleAbsent = (studentId) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const markAllPresent = () => {
    const next = {};
    students.forEach(st => next[st.id] = false);
    setAttendanceData(next);
  };

  const markAllAbsent = () => {
    const next = {};
    // Reset to initial zero
    students.forEach(st => next[st.id] = true);
    setAttendanceData(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsToSave = students.map(st => ({
        student_id: st.id,
        is_absent: attendanceData[st.id] !== undefined ? attendanceData[st.id] : true
      }));
      await saveAttendance(stream, year, cls, date, recordsToSave, user?.id);
      setIsExistingSession(true);
      toast.success(`Attendance successfully saved! (${presentCount} Present, ${absentCount} Absent)`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const absentCount = Object.values(attendanceData).filter(Boolean).length;
  const presentCount = students.length - absentCount;
  const attendancePercentage = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const filteredStudents = useMemo(() => {
    return students.filter(st => 
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (st.roll_number || '').toString().includes(searchQuery)
    );
  }, [students, searchQuery]);

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {currentView !== 'BATCH_SELECT' && (
            <button 
              className="btn btn-ghost" 
              onClick={() => {
                if (currentView === 'PRINT_VIEW') setCurrentView('MARK_ATTENDANCE');
                else setCurrentView('BATCH_SELECT');
              }}
              style={{ padding: 8, cursor: 'pointer' }}
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="page-title" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--maroon-900)', margin: 0 }}>
              Attendance Management & Editor
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
              {currentView === 'BATCH_SELECT' 
                ? 'Select class batch and date to view or edit student attendance' 
                : `${stream} • ${year} • ${cls} • Date: ${date}`}
            </p>
          </div>
        </div>

        {currentView === 'MARK_ATTENDANCE' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setCurrentView('BATCH_SELECT')}
              style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '8px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Calendar size={14} /> Change Batch / Date
            </button>
          </div>
        )}
      </div>
      
      <div className="page-body fade-in" style={{ marginTop: 20 }}>
        {/* VIEW 1: BATCH SELECT */}
        {currentView === 'BATCH_SELECT' && (
          <BatchSelectView 
            stream={stream} setStream={setStream}
            year={year} setYear={setYear}
            cls={cls} setCls={setCls}
            date={date} setDate={setDate}
            onContinue={handleBatchSelect}
          />
        )}

        {/* VIEW 2: MARK / EDIT ATTENDANCE */}
        {currentView === 'MARK_ATTENDANCE' && !loading && students.length === 0 && (
          <div className="card empty-state" style={{ padding: 48, textAlign: 'center' }}>
            <Users className="empty-state-icon" size={48} style={{ color: 'var(--maroon-900)', opacity: 0.4, margin: '0 auto 16px auto' }} />
            <h3 className="empty-state-title" style={{ margin: '0 0 8px 0' }}>No Students Registered</h3>
            <p className="empty-state-text" style={{ color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 20px auto' }}>
              No students are currently registered in {stream} ({year}) - {cls}. Use the Student Management page to register students.
            </p>
            <button
              onClick={() => navigate('/students')}
              style={{ background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              Go to Student Registration
            </button>
          </div>
        )}

        {currentView === 'MARK_ATTENDANCE' && loading && (
          <div className="loading-spinner" style={{ padding: 60, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading batch attendance roster...</div>
          </div>
        )}

        {currentView === 'MARK_ATTENDANCE' && !loading && students.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Status Information Banner */}
            <div style={{
              background: isExistingSession ? '#F0F9FF' : '#FEF3C7',
              border: `1px solid ${isExistingSession ? '#BAE6FD' : '#FDE68A'}`,
              borderRadius: 12,
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isExistingSession ? <PenLine size={18} color="#0369A1" /> : <AlertCircle size={18} color="#92400E" />}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isExistingSession ? '#0369A1' : '#92400E' }}>
                    {isExistingSession ? 'Editing Existing Attendance Session' : 'New Session — Initial Attendance is Zero'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: isExistingSession ? '#0c4a6e' : '#78350f' }}>
                    {isExistingSession 
                      ? 'You are editing saved attendance records. Click any student tile to toggle Present/Absent.' 
                      : 'Initial attendance starts at 0% (all students initialized as absent). Click tiles or "All Present" to record attendance.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  background: isExistingSession ? '#0284C7' : '#D97706',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}>
                  {isExistingSession ? 'Saved Record' : 'Initial (0% Present)'}
                </span>
              </div>
            </div>

            {/* ── Stats Bar ── */}
            <div className="attendance-stats-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="attendance-stat present" style={{ flex: 1, minWidth: 140 }}>
                <UserCheck size={18} />
                <span><strong>{presentCount}</strong> Present</span>
              </div>
              <div className="attendance-stat absent" style={{ flex: 1, minWidth: 140 }}>
                <UserX size={18} />
                <span><strong>{absentCount}</strong> Absent</span>
              </div>
              <div className="attendance-stat total" style={{ flex: 1, minWidth: 140 }}>
                <Users size={18} />
                <span><strong>{students.length}</strong> Total</span>
              </div>
              <div style={{
                flex: 1,
                minWidth: 160,
                background: attendancePercentage >= 75 ? '#ECFDF5' : '#FFF1F2',
                border: `1px solid ${attendancePercentage >= 75 ? '#A7F3D0' : '#FECDD3'}`,
                borderRadius: 10,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: attendancePercentage >= 75 ? '#065F46' : '#9F1239'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Rate:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{attendancePercentage}%</span>
              </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="attendance-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div className="attendance-search" style={{ width: 280, position: 'relative' }}>
                <Search size={16} className="attendance-search-icon" style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Filter student name or roll..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none' }}
                />
              </div>
              
              <div className="attendance-quick-actions" style={{ display: 'flex', gap: 10 }}>
                <button 
                  type="button"
                  className="btn btn-sm btn-ghost" 
                  onClick={markAllPresent} 
                  title="Mark All Students Present" 
                  style={{ color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '8px 14px', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <CheckCircle size={16} /> Mark All Present
                </button>
                <button 
                  type="button"
                  className="btn btn-sm btn-ghost" 
                  onClick={markAllAbsent} 
                  title="Reset to Zero (All Absent)" 
                  style={{ color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', padding: '8px 14px', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <XCircle size={16} /> Reset to Zero (All Absent)
                </button>
              </div>
            </div>

            {/* ── Student Tiles ── */}
            <div className="attendance-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
              {filteredStudents.map(st => {
                const isAbsent = attendanceData[st.id] !== undefined ? attendanceData[st.id] : true;
                return (
                  <div 
                    key={st.id}
                    className={`attendance-tile ${isAbsent ? 'absent' : 'present'}`}
                    onClick={() => toggleAbsent(st.id)}
                    style={{
                      background: isAbsent ? '#FFF5F5' : '#F0FDF4',
                      border: `2px solid ${isAbsent ? '#FCA5A5' : '#86EFAC'}`,
                      borderRadius: 12,
                      padding: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div>
                      <div className="attendance-tile-roll" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        #{st.roll_number || 'N/A'}
                      </div>
                      <div 
                        className="attendance-tile-name" 
                        style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem', marginTop: 2 }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/student/${st.id}`); }}
                        title="Click to view student profile"
                      >
                        {st.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: isAbsent ? '#DC2626' : '#16A34A', fontWeight: 600, marginTop: 4 }}>
                        {isAbsent ? '✗ Absent (0)' : '✓ Present (1)'}
                      </div>
                    </div>

                    <div className="attendance-tile-status">
                      {isAbsent ? (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <XCircle size={20} />
                        </div>
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle size={20} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Bottom Actions Bar ── */}
            <div className="attendance-bottom-bar no-print" style={{ background: 'var(--bg-surface)', padding: 18, borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => setCurrentView('PRINT_VIEW')}
                style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={16} /> View & Print Summary
              </button>

              <button 
                type="button"
                className="btn btn-primary" 
                onClick={handleSave} 
                disabled={saving}
                style={{
                  background: 'var(--maroon-900)',
                  color: '#fff',
                  border: 'none',
                  padding: '11px 26px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(115, 19, 19, 0.25)'
                }}
              >
                <Save size={18} /> {saving ? 'Saving Attendance...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: PRINT / SUMMARY VIEW */}
        {currentView === 'PRINT_VIEW' && (
          <PrintAttendanceView 
            stream={stream} year={year} cls={cls} date={date} 
            students={students} attendanceData={attendanceData}
          />
        )}
      </div>
    </Layout>
  );
}

// ─── BATCH SELECT VIEW ───
function BatchSelectView({ stream, setStream, year, setYear, cls, setCls, date, setDate, onContinue }) {
  const classOptions = getClassOptions(stream, year);
  
  useEffect(() => {
    if (classOptions.length > 0 && !classOptions.includes(cls)) {
      setCls(classOptions[0]);
    }
  }, [classOptions, cls, setCls]);

  return (
    <div className="card" style={{ maxWidth: 520, margin: '20px auto', background: 'var(--bg-surface)', padding: 28, borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ background: '#FCEFEF', color: 'var(--maroon-900)', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--maroon-900)', margin: 0 }}>Select Batch & Date</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Choose class section and session date to take or edit attendance</p>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Attendance Date</label>
          <input 
            type="date" 
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.92rem' }} 
            value={date} 
            onChange={e => setDate(e.target.value)} 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Stream</label>
            <select 
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.92rem' }} 
              value={stream} 
              onChange={e => setStream(e.target.value)}
            >
              <option value="Science">Science</option>
              <option value="Commerce">Commerce</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Year</label>
            <select 
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.92rem' }} 
              value={year} 
              onChange={e => setYear(e.target.value)}
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Class / Section</label>
          <select 
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.92rem' }} 
            value={cls} 
            onChange={e => setCls(e.target.value)}
          >
            <option value="">-- Select Class --</option>
            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: 12, fontSize: '0.82rem', color: '#92400E' }}>
          ℹ️ <strong>Initial Zero State:</strong> For brand new attendance sessions, all students start with 0% attendance. You can easily mark presence individually or click "Mark All Present".
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: 8, background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }} 
          onClick={onContinue}
        >
          Open Attendance Sheet →
        </button>
      </div>
    </div>
  );
}

// ─── PRINT VIEW ───
function PrintAttendanceView({ stream, year, cls, date, students, attendanceData }) {
  const absentStudents = students.filter(st => attendanceData[st.id]);
  const presentCount = students.length - absentStudents.length;
  const pct = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card print-container" style={{ padding: 32, background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)' }}>
        <div className="print-header" style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ color: 'var(--maroon-900)', margin: '0 0 6px 0', fontSize: '1.5rem', fontWeight: 700 }}>BGS Public School & PU College</h2>
          <h3 style={{ color: 'var(--text-main)', margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 600 }}>Daily Attendance Register</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            {stream} • {year} • {cls} • Date: {date}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 32, padding: 16, background: '#FAFAFA', borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Students</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--maroon-900)' }}>{students.length}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Present</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#16A34A' }}>{presentCount}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Absent</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626' }}>{absentStudents.length}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Attendance Rate</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: pct >= 75 ? '#16A34A' : '#DC2626' }}>{pct}%</div>
          </div>
        </div>

        <h4 style={{ marginBottom: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 8, color: 'var(--maroon-900)' }}>
          Absentees List ({absentStudents.length})
        </h4>
        {absentStudents.length === 0 ? (
          <p style={{ color: '#059669', fontStyle: 'italic', fontWeight: 500 }}>All students are marked present.</p>
        ) : (
          <div className="table-responsive">
            <table className="table print-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ width: 80, padding: 10, textAlign: 'left' }}>Roll No</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Student Name</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Parent Phone</th>
                </tr>
              </thead>
              <tbody>
                {absentStudents.map(st => (
                  <tr key={st.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>#{st.roll_number || 'N/A'}</td>
                    <td style={{ padding: 10, fontWeight: 500, color: '#DC2626' }}>{st.name}</td>
                    <td style={{ padding: 10, color: 'var(--text-muted)' }}>{st.parent_phone || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={() => window.print()}
            style={{ background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>
    </div>
  );
}
