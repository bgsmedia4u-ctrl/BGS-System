import { useState, useEffect } from 'react';
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
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const { user } = useAuth();
  
  // Views: 'BATCH_SELECT', 'MARK_ATTENDANCE', 'PRINT_VIEW'
  const [currentView, setCurrentView] = useState('BATCH_SELECT');
  
  // Batch state
  const [stream, setStream] = useState('Science');
  const [year, setYear] = useState('1st Year');
  const [cls, setCls] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Data state
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const studentsData = await getStudentsByBatch(stream, year, cls);
      setStudents(studentsData);

      const session = await getAttendanceSession(stream, year, cls, date);
      const records = await getAttendanceRecords(session?.id);
      
      const nextData = {};
      studentsData.forEach(st => nextData[st.id] = false);
      records.forEach(r => nextData[r.student_id] = r.is_absent);
      setAttendanceData(nextData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSelect = () => {
    if (!cls) return toast.error('Please select a class.');
    if (!date) return toast.error('Please select a date.');
    setCurrentView('MARK_ATTENDANCE');
    loadData();
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
    students.forEach(st => next[st.id] = true);
    setAttendanceData(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const recordsToSave = students.map(st => ({
        student_id: st.id,
        is_absent: attendanceData[st.id] || false
      }));
      await saveAttendance(stream, year, cls, date, recordsToSave, user?.id);
      toast.success('Attendance saved!');
    } catch (err) {
      toast.error('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const absentCount = Object.values(attendanceData).filter(Boolean).length;
  const presentCount = students.length - absentCount;

  const filteredStudents = students.filter(st => 
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (st.roll_number || '').toString().includes(searchQuery)
  );

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {currentView !== 'BATCH_SELECT' && (
          <button 
            className="btn btn-ghost" 
            onClick={() => {
              if (currentView === 'PRINT_VIEW') setCurrentView('MARK_ATTENDANCE');
              else setCurrentView('BATCH_SELECT');
            }}
            style={{ padding: 8 }}
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">
            {currentView === 'BATCH_SELECT' 
              ? 'Select class and date to continue' 
              : `${stream} • ${year} • ${cls} • ${date}`}
          </p>
        </div>
      </div>
      
      <div className="page-body fade-in">
        {currentView === 'BATCH_SELECT' && (
          <BatchSelectView 
            stream={stream} setStream={setStream}
            year={year} setYear={setYear}
            cls={cls} setCls={setCls}
            date={date} setDate={setDate}
            onContinue={handleBatchSelect}
          />
        )}

        {currentView === 'MARK_ATTENDANCE' && !loading && students.length === 0 && (
          <div className="card empty-state">
            <Users className="empty-state-icon" size={48} />
            <h3 className="empty-state-title">No Students Found</h3>
            <p className="empty-state-text">Add students to this class in the database first.</p>
          </div>
        )}

        {currentView === 'MARK_ATTENDANCE' && loading && (
          <div className="loading-spinner"><div className="spinner" /></div>
        )}

        {currentView === 'MARK_ATTENDANCE' && !loading && students.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* ── Stats Bar ── */}
            <div className="attendance-stats-bar">
              <div className="attendance-stat present">
                <UserCheck size={18} />
                <span><strong>{presentCount}</strong> Present</span>
              </div>
              <div className="attendance-stat absent">
                <UserX size={18} />
                <span><strong>{absentCount}</strong> Absent</span>
              </div>
              <div className="attendance-stat total">
                <Users size={18} />
                <span><strong>{students.length}</strong> Total</span>
              </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="attendance-toolbar">
              <div className="attendance-search">
                <Search size={16} className="attendance-search-icon" />
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
              </div>
              <div className="attendance-quick-actions">
                <button className="btn btn-sm btn-ghost" onClick={markAllPresent} title="Mark All Present" style={{ color: 'var(--success)' }}>
                  <CheckCircle size={16} /> All Present
                </button>
                <button className="btn btn-sm btn-ghost" onClick={markAllAbsent} title="Mark All Absent" style={{ color: 'var(--error)' }}>
                  <XCircle size={16} /> All Absent
                </button>
              </div>
            </div>

            {/* ── Student Tiles ── */}
            <div className="attendance-grid">
              {filteredStudents.map(st => {
                const isAbsent = attendanceData[st.id] || false;
                return (
                  <div 
                    key={st.id}
                    className={`attendance-tile ${isAbsent ? 'absent' : 'present'}`}
                    onClick={() => toggleAbsent(st.id)}
                  >
                    <div className="attendance-tile-roll">{st.roll_number || '-'}</div>
                    <div className="attendance-tile-name">{st.name}</div>
                    <div className="attendance-tile-status">
                      {isAbsent ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Bottom Actions ── */}
            <div className="attendance-bottom-bar no-print">
              <button className="btn btn-secondary" onClick={() => setCurrentView('PRINT_VIEW')}>
                <Printer size={16} /> View Report
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        )}

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

// ─── BATCH SELECT ───

function BatchSelectView({ stream, setStream, year, setYear, cls, setCls, date, setDate, onContinue }) {
  const classOptions = getClassOptions(stream, year);
  
  useEffect(() => {
    if (classOptions.length > 0 && !classOptions.includes(cls)) {
      setCls(classOptions[0]);
    }
  }, [classOptions, cls, setCls]);

  return (
    <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2 className="card-title" style={{ marginBottom: 20 }}>Select Batch & Date</h2>
      
      <div className="form-group">
        <label className="form-label">Date</label>
        <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Stream</label>
        <select className="form-select" value={stream} onChange={e => setStream(e.target.value)}>
          <option value="Science">Science</option>
          <option value="Commerce">Commerce</option>
        </select>
      </div>
      
      <div className="form-group">
        <label className="form-label">Year</label>
        <select className="form-select" value={year} onChange={e => setYear(e.target.value)}>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Class</label>
        <select className="form-select" value={cls} onChange={e => setCls(e.target.value)}>
          <option value="">-- Select Class --</option>
          {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}

// ─── PRINT VIEW ───

function PrintAttendanceView({ stream, year, cls, date, students, attendanceData }) {
  const absentStudents = students.filter(st => attendanceData[st.id]);
  const presentCount = students.length - absentStudents.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card print-container" style={{ padding: 32 }}>
        <div className="print-header" style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ color: 'var(--navy-900)', marginBottom: 8 }}>BGS Public School & PU College</h2>
          <h3 style={{ color: 'var(--navy-700)', marginBottom: 4 }}>Daily Attendance Report</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {stream} | {year} | {cls} | Date: {date}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 32, padding: 16, background: 'var(--bg-secondary)', borderRadius: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy-900)' }}>{students.length}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>{presentCount}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Absent</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--error)' }}>{absentStudents.length}</div>
          </div>
        </div>

        <h4 style={{ marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Absentees List</h4>
        {absentStudents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Everyone was present! 🎉</p>
        ) : (
          <div className="table-responsive">
            <table className="table print-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Roll</th>
                  <th>Student Name</th>
                </tr>
              </thead>
              <tbody>
                {absentStudents.map(st => (
                  <tr key={st.id}>
                    <td>{st.roll_number}</td>
                    <td style={{ fontWeight: 500, color: 'var(--error)' }}>{st.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>
    </div>
  );
}

