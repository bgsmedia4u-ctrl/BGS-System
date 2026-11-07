import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { 
  getStudentById, 
  getStudentMarks, 
  getStudentAttendance, 
  getStudentCompliances,
  getStudentTestReport,
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
  X,
  Printer,
  Award,
  Calendar,
  FileText,
  Check,
  XCircle,
  Percent,
  Eye,
  GraduationCap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../layout.css';

export default function StudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  const [student, setStudent] = useState(null);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [compliances, setCompliances] = useState([]);
  const [testReport, setTestReport] = useState({
    testsConducted: 0,
    testsAttended: 0,
    testsAbsent: 0,
    averageScore: 0,
    testReports: []
  });
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
        const studentData = await getStudentById(id);
        setStudent(studentData);
        
        if (studentData) {
          const [marksData, attData, compData, testReportData] = await Promise.all([
            getStudentMarks(id),
            getStudentAttendance(id),
            getStudentCompliances(id),
            getStudentTestReport(id, studentData.stream, studentData.year, studentData.class)
          ]);
          
          setMarks(marksData || []);
          setAttendance(attData || []);
          setCompliances(compData || []);
          setTestReport(testReportData || {
            testsConducted: 0,
            testsAttended: 0,
            testsAbsent: 0,
            averageScore: 0,
            testReports: []
          });
        }
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
      toast.success(`Student "${student.name}" permanently deleted from application.`);
      navigate('/students');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to permanently delete student');
      setRemoveSubmitting(false);
    }
  }

  // ── Exact Attendance Calculation ──
  // Starts from zero: if 0 days attendance taken -> 0%.
  // When sessions exist: totalDays (days attendance took) vs absentDays (days student absent).
  // attendedDays = totalDays - absentDays.
  // percentage = (attendedDays / totalDays) * 100.
  const attendanceStats = useMemo(() => {
    const totalDays = attendance.length;
    if (totalDays === 0) {
      return { totalDays: 0, attendedDays: 0, absentDays: 0, percentage: 0 };
    }
    const absentDays = attendance.filter(a => a.is_absent).length;
    const attendedDays = totalDays - absentDays;
    const percentage = Math.round((attendedDays / totalDays) * 100);
    return { totalDays, attendedDays, absentDays, percentage };
  }, [attendance]);

  const marksChartData = useMemo(() => {
    if (!testReport.testReports || testReport.testReports.length === 0) return [];
    return [...testReport.testReports]
      .reverse()
      .map(t => ({
        name: t.testName || 'Test',
        score: t.isAttended ? t.percentage : 0,
        status: t.isAttended ? 'Attended' : 'Absent',
        date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''
      }));
  }, [testReport.testReports]);

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
        {/* Navigation & Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button 
            onClick={() => navigate('/students')} 
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
          >
            <ArrowLeft size={16} /> Back to Student Directory
          </button>

          <button
            onClick={() => window.print()}
            style={{
              background: '#fff',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Printer size={15} /> Print Student Report
          </button>
        </div>
        
        {/* Header Profile Card */}
        <div style={{ background: 'var(--bg-surface)', padding: 28, borderRadius: 16, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--maroon-900)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(115, 19, 19, 0.25)' }}>
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

          {/* Admin Management Actions: Move Class / Permanent Delete */}
          {isAdmin && (
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
                <ArrowRightLeft size={16} /> Move Class
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
                <Trash2 size={16} /> Delete Student
              </button>
            </div>
          )}
        </div>

        {/* ── 4 Top Summary Metric Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 24 }}>
          {/* Metric 1: College Attendance Rate */}
          <div style={{ background: 'var(--bg-surface)', padding: 22, borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>College Attendance</div>
              <div style={{ background: attendanceStats.percentage >= 75 ? '#ECFDF5' : '#FEE2E2', color: attendanceStats.percentage >= 75 ? '#065F46' : '#DC2626', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={18} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2.4rem', fontWeight: 700, lineHeight: 1.1, color: attendanceStats.totalDays === 0 ? 'var(--text-muted)' : attendanceStats.percentage >= 75 ? '#059669' : '#DC2626', marginBottom: 6 }}>
                {attendanceStats.percentage}%
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600 }}>
                {attendanceStats.totalDays === 0 
                  ? 'Starts at 0% (0 days taken)' 
                  : `${attendanceStats.attendedDays} attended / ${attendanceStats.totalDays} days took`}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {attendanceStats.absentDays} day(s) student absent
              </div>
            </div>
          </div>

          {/* Metric 2: Tests Conducted */}
          <div style={{ background: 'var(--bg-surface)', padding: 22, borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tests Conducted</div>
              <div style={{ background: '#E0F2FE', color: '#0369A1', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={18} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2.4rem', fontWeight: 700, lineHeight: 1.1, color: 'var(--maroon-900)', marginBottom: 6 }}>
                {testReport.testsConducted}
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600 }}>
                Total Tests for Batch
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {student.stream} • {student.year} • {student.class}
              </div>
            </div>
          </div>

          {/* Metric 3: Tests Attended */}
          <div style={{ background: 'var(--bg-surface)', padding: 22, borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tests Attended</div>
              <div style={{ background: '#FEF3C7', color: '#92400E', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2.4rem', fontWeight: 700, lineHeight: 1.1, color: '#065F46', marginBottom: 6 }}>
                {testReport.testsAttended} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {testReport.testsConducted}</span>
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600 }}>
                {testReport.testsAbsent} Test(s) Missed / Absent
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Test Participation: {testReport.testsConducted > 0 ? Math.round((testReport.testsAttended / testReport.testsConducted) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Metric 4: Academic Average Score */}
          <div style={{ background: 'var(--bg-surface)', padding: 22, borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Average Score</div>
              <div style={{ background: '#FCEFEF', color: 'var(--maroon-900)', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={18} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2.4rem', fontWeight: 700, lineHeight: 1.1, color: testReport.averageScore >= 60 ? '#059669' : testReport.averageScore > 0 ? '#D97706' : 'var(--text-muted)', marginBottom: 6 }}>
                {testReport.averageScore}%
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600 }}>
                Overall Across Attended Tests
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {testReport.averageScore >= 85 ? 'Outstanding Distinction' : testReport.averageScore >= 60 ? 'First Class Standing' : testReport.averageScore >= 35 ? 'Satisfactory Progress' : 'Needs Academic Attention'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Test Marks & Academic Report Table ── */}
        <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--maroon-900)' }}>
                <FileText size={20} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Individual Test Marks & Academic Report</h2>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Full record of all tests conducted for {student.stream} {student.year} ({student.class}), student attendance status, and subject scores.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', background: '#F8FAFC', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                Conducted: <strong>{testReport.testsConducted}</strong> | Attended: <strong style={{ color: '#059669' }}>{testReport.testsAttended}</strong> | Absent: <strong style={{ color: '#DC2626' }}>{testReport.testsAbsent}</strong>
              </span>

              <button
                onClick={() => navigate(`/marks?stream=${student.stream}&year=${student.year}&class=${encodeURIComponent(student.class)}`)}
                style={{
                  background: '#FCEFEF',
                  border: '1px solid #F5C6CB',
                  color: 'var(--maroon-900)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <PenLine size={13} /> Enter Marks
              </button>
            </div>
          </div>

          {testReport.testReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <BookOpen size={40} style={{ opacity: 0.3, margin: '0 auto 10px auto', color: 'var(--maroon-900)' }} />
              <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-main)', marginBottom: 4 }}>No Tests Conducted Yet</div>
              <div style={{ fontSize: '0.86rem' }}>Tests created and scheduled for {student.stream} {student.year} ({student.class}) under "Mark Entry" will appear here automatically.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: '2px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Test Name & Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Test Attendance</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Subject Marks Obtained</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Total Score</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {testReport.testReports.map((t) => {
                    const testDate = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recorded Date';

                    return (
                      <tr key={t.testId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--maroon-900)', fontSize: '0.92rem' }}>{t.testName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{testDate}</div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          {t.isAttended ? (
                            <span style={{ background: '#ECFDF5', color: '#065F46', padding: '4px 10px', borderRadius: 12, fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={13} /> Attended
                            </span>
                          ) : (
                            <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '4px 10px', borderRadius: 12, fontWeight: 700, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <XCircle size={13} /> Absent / Missed
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          {t.isAttended ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {t.subjects.map(s => (
                                <span key={s.name} style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 }}>
                                  {s.name}: <strong style={{ color: 'var(--maroon-900)' }}>{s.score !== null ? s.score : 'N/A'}</strong> / {s.maxMarks}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#DC2626', fontSize: '0.84rem', fontStyle: 'italic' }}>
                              Student was absent during test administration
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {t.isAttended ? (
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                              {t.totalScore} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {t.totalMaxMarks}</span>
                            </div>
                          ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                              0 / {t.totalMaxMarks}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          {t.isAttended ? (
                            <span style={{ 
                              background: t.percentage >= 75 ? '#ECFDF5' : t.percentage >= 50 ? '#EFF6FF' : '#FEF2F2', 
                              color: t.percentage >= 75 ? '#065F46' : t.percentage >= 50 ? '#1D4ED8' : '#DC2626', 
                              padding: '4px 12px', 
                              borderRadius: 8, 
                              fontWeight: 700, 
                              fontSize: '0.9rem' 
                            }}>
                              {t.percentage}%
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Performance Chart & Attendance Log Side-by-Side ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 24 }}>
          {/* Academic Performance Chart */}
          <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--maroon-900)' }}>
              <BookOpen size={20} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Performance Trend Over Tests</h2>
            </div>
            {marksChartData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0', fontSize: '0.88rem' }}>
                No completed test records available to plot.
              </div>
            ) : (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marksChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} domain={[0, 100]} />
                    <Tooltip 
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="score" fill="var(--maroon-900)" radius={[4, 4, 0, 0]} barSize={36} name="Score %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* College Attendance Overview & Session Log */}
          <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--maroon-900)' }}>
                <Clock size={20} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>College Attendance Record</h2>
              </div>
              <button
                onClick={() => navigate(`/attendance?stream=${student.stream}&year=${student.year}&class=${encodeURIComponent(student.class)}`)}
                style={{
                  background: '#FCEFEF',
                  border: '1px solid #F5C6CB',
                  color: 'var(--maroon-900)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <PenLine size={12} /> Class Attendance Sheet
              </button>
            </div>

            {/* Attendance Formula Card */}
            <div style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                Calculation: Days Attended vs Days Attendance Took
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <div><strong>{attendanceStats.attendedDays}</strong> attended / <strong>{attendanceStats.totalDays}</strong> total days</div>
                <div style={{ color: '#DC2626', fontWeight: 600 }}>{attendanceStats.absentDays} absent</div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {attendanceStats.totalDays === 0 
                  ? 'Attendance starts from 0% until attendance is taken.' 
                  : `Percentage: (${attendanceStats.attendedDays} / ${attendanceStats.totalDays}) × 100 = ${attendanceStats.percentage}%`}
              </div>
            </div>

            {/* Individual Attendance Sessions Log */}
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--maroon-900)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Recorded Sessions Log ({attendance.length})</span>
              {isAdmin && <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>Admin can click to toggle</span>}
            </div>

            {attendance.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
                No attendance sessions recorded yet. College attendance starts from 0%.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                {attendance.map((r) => {
                  const sessionDate = r.attendance_sessions?.date || 'Recorded Date';
                  const isAbsent = r.is_absent;

                  return (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA', padding: '6px 10px', borderRadius: 6, fontSize: '0.82rem', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontWeight: 500 }}>{sessionDate}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isAdmin ? (
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
                        ) : (
                          <span style={{
                            borderRadius: 12,
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: isAbsent ? '#FEE2E2' : '#DCFCE7',
                            color: isAbsent ? '#DC2626' : '#16A34A'
                          }}>
                            {isAbsent ? '✗ Absent' : '✓ Present'}
                          </span>
                        )}

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

        {/* ── Compliances & Remarks ── */}
        <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--maroon-900)' }}>
            <AlertTriangle size={20} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Teacher Remarks & Compliances</h2>
          </div>
          {compliances.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.88rem' }}>No remarks or compliance notices recorded for this student.</div>
          ) : (
            <ul style={{ paddingLeft: 20, color: 'var(--text-main)', fontSize: '0.92rem', margin: 0 }}>
              {compliances.slice(0, 6).map((c, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginRight: 8 }}>{new Date(c.date).toLocaleDateString()}</span>
                  {c.remark}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Move Class Modal (Admin Only) ── */}
        {isAdmin && isShiftOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: 520, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ padding: '20px 24px', background: 'var(--maroon-900)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ArrowRightLeft size={20} /> Move Student to Another Class
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', opacity: 0.85 }}>Transfer {student.name} to target class while preserving all marks & attendance</p>
                </div>
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
                        const nextClasses = CLASS_OPTIONS[`${newStream}|${shiftForm.targetYear}`] || ['FTB - 1'];
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
                        const nextClasses = CLASS_OPTIONS[`${shiftForm.targetStream}|${newYear}`] || ['FTB - 1'];
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
                    {shiftSubmitting ? 'Moving Class...' : 'Confirm Move Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Permanently Delete Modal (Admin Only) ── */}
        {isAdmin && isRemoveOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: 440, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <Trash2 size={24} />
              </div>

              <h3 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700 }}>
                Permanently Delete Student?
              </h3>

              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
                Are you sure you want to permanently delete <strong>{student.name}</strong> (Roll No: #{student.roll_number}) from the application?
              </p>

              <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', padding: 12, borderRadius: 8, fontSize: '0.8rem', color: '#9A3412', marginBottom: 20 }}>
                ⚠️ <strong>Permanent Action:</strong> This will completely delete the student record along with all their test marks and attendance records permanently from the database. This action cannot be undone.
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button type="button" onClick={() => setIsRemoveOpen(false)} style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', flex: 1 }}>
                  Cancel
                </button>
                <button type="button" onClick={handleRemoveSubmit} disabled={removeSubmitting} style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', flex: 1 }}>
                  {removeSubmitting ? 'Deleting...' : 'Yes, Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
