import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { 
  getAllStudents, 
  registerStudent, 
  shiftStudent, 
  batchShiftStudents, 
  removeStudent, 
  batchRemoveStudents, 
  getNextAvailableRollNumber, 
  checkRollNumberAvailable,
  getAdmissions,
  updateAdmissionStatus
} from '../api/studentProfileService';
import { CLASS_OPTIONS } from '../api/marksService';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ArrowRightLeft, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Phone, 
  Mail, 
  BookOpen, 
  Clock, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  FileText, 
  GraduationCap,
  Eye,
  Check,
  PenLine,
  Sun,
  Moon,
  Layers,
  ArrowRight
} from 'lucide-react';
import '../layout.css';

export default function StudentManagementPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'admissions' | 'classes'
  const [students, setStudents] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStream, setFilterStream] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Selected students for batch actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isBatchShiftModalOpen, setIsBatchShiftModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isBatchRemoveModalOpen, setIsBatchRemoveModalOpen] = useState(false);

  // Active target student for single actions
  const [targetStudent, setTargetStudent] = useState(null);

  // Form States - Registration
  const [regForm, setRegForm] = useState({
    name: '',
    stream: 'Science',
    year: '1st Year',
    class: 'FTB - 1',
    roll_number: '',
    parent_phone: '',
    parent_name: '',
    notes: ''
  });
  const [regRollCheck, setRegRollCheck] = useState({ checking: false, available: true, message: '' });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [linkedAdmissionId, setLinkedAdmissionId] = useState(null);

  // Form States - Shift (Single)
  const [shiftForm, setShiftForm] = useState({
    targetStream: 'Science',
    targetYear: '1st Year',
    targetClass: 'FTB - 1',
    targetRollNumber: ''
  });
  const [shiftRollCheck, setShiftRollCheck] = useState({ checking: false, available: true, message: '' });
  const [shiftSubmitting, setShiftSubmitting] = useState(false);

  // Form States - Shift (Batch)
  const [batchShiftForm, setBatchShiftForm] = useState({
    targetStream: 'Science',
    targetYear: '1st Year',
    targetClass: 'FTB - 1'
  });
  const [batchShiftSubmitting, setBatchShiftSubmitting] = useState(false);

  // Initial Fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [stuData, admData] = await Promise.all([
        getAllStudents(),
        getAdmissions()
      ]);
      setStudents(stuData || []);
      setAdmissions(admData || []);
    } catch (err) {
      console.error('Failed to load students:', err);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  }

  // Calculate dynamic class options for registration & shift
  const currentClassOptions = useMemo(() => {
    const key = `${regForm.stream}|${regForm.year}`;
    return CLASS_OPTIONS[key] || ['Class A', 'Class B', 'FTB', 'Inspire'];
  }, [regForm.stream, regForm.year]);

  const shiftTargetClassOptions = useMemo(() => {
    const key = `${shiftForm.targetStream}|${shiftForm.targetYear}`;
    return CLASS_OPTIONS[key] || ['Class A', 'Class B', 'FTB', 'Inspire'];
  }, [shiftForm.targetStream, shiftForm.targetYear]);

  const batchShiftTargetClassOptions = useMemo(() => {
    const key = `${batchShiftForm.targetStream}|${batchShiftForm.targetYear}`;
    return CLASS_OPTIONS[key] || ['Class A', 'Class B', 'FTB', 'Inspire'];
  }, [batchShiftForm.targetStream, batchShiftForm.targetYear]);

  // Check roll number uniqueness live for Registration
  useEffect(() => {
    if (!isRegisterOpen || !regForm.roll_number) {
      setRegRollCheck({ checking: false, available: true, message: '' });
      return;
    }

    const rollInt = parseInt(regForm.roll_number, 10);
    if (isNaN(rollInt) || rollInt <= 0) {
      setRegRollCheck({ checking: false, available: false, message: 'Roll number must be a positive integer.' });
      return;
    }

    let isMounted = true;
    setRegRollCheck(prev => ({ ...prev, checking: true }));

    const timer = setTimeout(async () => {
      // Check in-memory list first for instant responsiveness
      const localConflict = students.find(s => 
        s.stream === regForm.stream &&
        s.year === regForm.year &&
        s.class === regForm.class &&
        parseInt(s.roll_number, 10) === rollInt
      );

      if (localConflict) {
        if (isMounted) {
          setRegRollCheck({
            checking: false,
            available: false,
            message: `Roll No ${rollInt} is already assigned to "${localConflict.name}" in this class.`
          });
        }
        return;
      }

      // Check remote database
      const isAvailable = await checkRollNumberAvailable(regForm.stream, regForm.year, regForm.class, rollInt);
      if (isMounted) {
        if (isAvailable) {
          setRegRollCheck({ checking: false, available: true, message: `Roll No ${rollInt} is unique and available!` });
        } else {
          setRegRollCheck({ checking: false, available: false, message: `Roll No ${rollInt} is already registered in this batch.` });
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [regForm.roll_number, regForm.stream, regForm.year, regForm.class, isRegisterOpen, students]);

  // Check roll number uniqueness live for Shift
  useEffect(() => {
    if (!isShiftModalOpen || !shiftForm.targetRollNumber || !targetStudent) {
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
      const localConflict = students.find(s => 
        s.id !== targetStudent.id &&
        s.stream === shiftForm.targetStream &&
        s.year === shiftForm.targetYear &&
        s.class === shiftForm.targetClass &&
        parseInt(s.roll_number, 10) === rollInt
      );

      if (localConflict) {
        if (isMounted) {
          setShiftRollCheck({
            checking: false,
            available: false,
            message: `Roll No ${rollInt} is already assigned to "${localConflict.name}" in destination class.`
          });
        }
        return;
      }

      const isAvailable = await checkRollNumberAvailable(
        shiftForm.targetStream,
        shiftForm.targetYear,
        shiftForm.targetClass,
        rollInt,
        targetStudent.id
      );

      if (isMounted) {
        if (isAvailable) {
          setShiftRollCheck({ checking: false, available: true, message: `Roll No ${rollInt} is available in destination batch.` });
        } else {
          setShiftRollCheck({ checking: false, available: false, message: `Roll No ${rollInt} already taken in destination batch.` });
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [shiftForm.targetRollNumber, shiftForm.targetStream, shiftForm.targetYear, shiftForm.targetClass, isShiftModalOpen, targetStudent, students]);

  // Auto-suggest next roll number for Registration
  async function handleSuggestRegRoll(stream = regForm.stream, year = regForm.year, cls = regForm.class) {
    const nextRoll = await getNextAvailableRollNumber(stream, year, cls);
    setRegForm(prev => ({ ...prev, roll_number: nextRoll.toString() }));
  }

  // Open Register Modal
  async function openRegisterModal(prefill = null) {
    const stream = prefill?.stream || 'Science';
    const year = prefill?.year || '1st Year';
    const classes = CLASS_OPTIONS[`${stream}|${year}`] || ['FTB - 1'];
    const cls = prefill?.class || classes[0];

    const nextRoll = await getNextAvailableRollNumber(stream, year, cls);

    setRegForm({
      name: prefill?.name || '',
      stream,
      year,
      class: cls,
      roll_number: nextRoll.toString(),
      parent_phone: prefill?.parent_phone || '',
      parent_name: prefill?.parent_name || '',
      notes: prefill?.notes || ''
    });

    setLinkedAdmissionId(prefill?.admissionId || null);
    setIsRegisterOpen(true);
  }

  // Handle Register Student Submit (ADD)
  async function handleRegisterSubmit(e) {
    e.preventDefault();
    if (!regForm.name.trim()) {
      toast.error('Student Name is required');
      return;
    }
    if (!regForm.roll_number || !regRollCheck.available) {
      toast.error('Please assign a unique, available Roll Number');
      return;
    }

    setRegSubmitting(true);
    try {
      const newStudent = await registerStudent({
        ...regForm,
        roll_number: parseInt(regForm.roll_number, 10)
      });

      // Update state
      setStudents(prev => [newStudent, ...prev]);
      toast.success(`Student "${newStudent.name}" registered successfully with Roll No ${newStudent.roll_number}!`);

      // If registered from Admissions, mark application Approved
      if (linkedAdmissionId) {
        await updateAdmissionStatus(linkedAdmissionId, 'Approved');
        setAdmissions(prev => prev.map(a => a.id === linkedAdmissionId ? { ...a, status: 'Approved' } : a));
      }

      setIsRegisterOpen(false);
      setLinkedAdmissionId(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to register student');
    } finally {
      setRegSubmitting(false);
    }
  }

  // Open Single Shift Modal
  async function openShiftModal(student) {
    setTargetStudent(student);

    // Default target: same stream/year, next class
    const nextRoll = await getNextAvailableRollNumber(student.stream, student.year, student.class);

    setShiftForm({
      targetStream: student.stream,
      targetYear: student.year,
      targetClass: student.class,
      targetRollNumber: student.roll_number ? student.roll_number.toString() : nextRoll.toString()
    });

    setIsShiftModalOpen(true);
  }

  // Handle Single Student Shift (SHIFT)
  async function handleShiftSubmit(e) {
    e.preventDefault();
    if (!targetStudent) return;
    if (!shiftRollCheck.available) {
      toast.error('The selected Roll Number is not available in destination batch');
      return;
    }

    setShiftSubmitting(true);
    try {
      const updated = await shiftStudent(targetStudent.id, {
        targetStream: shiftForm.targetStream,
        targetYear: shiftForm.targetYear,
        targetClass: shiftForm.targetClass,
        targetRollNumber: shiftForm.targetRollNumber
      });

      // Update local state
      setStudents(prev => prev.map(s => s.id === targetStudent.id ? { ...s, ...updated } : s));
      toast.success(`Successfully shifted "${targetStudent.name}" to ${shiftForm.targetStream} - ${shiftForm.targetClass}!`);
      setIsShiftModalOpen(false);
      setTargetStudent(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to shift student');
    } finally {
      setShiftSubmitting(false);
    }
  }

  // Open Batch Shift Modal
  function openBatchShiftModal() {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one student to shift');
      return;
    }

    const firstStudent = students.find(s => selectedIds.has(s.id));
    setBatchShiftForm({
      targetStream: firstStudent ? firstStudent.stream : 'Science',
      targetYear: firstStudent ? firstStudent.year : '1st Year',
      targetClass: firstStudent ? firstStudent.class : 'FTB - 1'
    });

    setIsBatchShiftModalOpen(true);
  }

  // Handle Batch Shift Submit
  async function handleBatchShiftSubmit(e) {
    e.preventDefault();
    const idArray = Array.from(selectedIds);
    if (idArray.length === 0) return;

    setBatchShiftSubmitting(true);
    try {
      const shifted = await batchShiftStudents(idArray, {
        targetStream: batchShiftForm.targetStream,
        targetYear: batchShiftForm.targetYear,
        targetClass: batchShiftForm.targetClass
      });

      // Update local state
      const shiftedMap = new Map(shifted.map(s => [s.id, s]));
      setStudents(prev => prev.map(s => shiftedMap.has(s.id) ? { ...s, ...shiftedMap.get(s.id) } : s));

      toast.success(`Batch Shift Complete! ${shifted.length} students moved to ${batchShiftForm.targetStream} - ${batchShiftForm.targetClass} with unique roll numbers.`);
      setIsBatchShiftModalOpen(false);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to shift students in batch');
    } finally {
      setBatchShiftSubmitting(false);
    }
  }

  // Open Remove Modal (Single)
  function openRemoveModal(student) {
    setTargetStudent(student);
    setIsRemoveModalOpen(true);
  }

  // Handle Single Student Remove (REMOVE)
  async function handleRemoveConfirm() {
    if (!targetStudent) return;
    try {
      await removeStudent(targetStudent.id);
      setStudents(prev => prev.filter(s => s.id !== targetStudent.id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(targetStudent.id);
        return next;
      });
      toast.success(`Student "${targetStudent.name}" removed from database.`);
      setIsRemoveModalOpen(false);
      setTargetStudent(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to remove student');
    }
  }

  // Handle Batch Remove (REMOVE)
  async function handleBatchRemoveConfirm() {
    const idArray = Array.from(selectedIds);
    if (idArray.length === 0) return;

    try {
      await batchRemoveStudents(idArray);
      setStudents(prev => prev.filter(s => !selectedIds.has(s.id)));
      toast.success(`Removed ${idArray.length} student records from database.`);
      setSelectedIds(new Set());
      setIsBatchRemoveModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to remove selected students');
    }
  }

  // Row selection helpers
  function toggleSelectAll() {
    if (selectedIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  }

  function toggleSelectStudent(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || (
        (s.name && s.name.toLowerCase().includes(searchLower)) ||
        (s.roll_number && s.roll_number.toString().includes(searchLower)) ||
        (s.parent_phone && s.parent_phone.includes(searchLower)) ||
        (s.class && s.class.toLowerCase().includes(searchLower))
      );

      // Stream
      const matchStream = filterStream === 'ALL' || s.stream === filterStream;

      // Year
      const matchYear = filterYear === 'ALL' || s.year === filterYear;

      // Class
      const matchClass = filterClass === 'ALL' || s.class === filterClass;

      // Status
      const currentStatus = s.status || 'Active';
      const matchStatus = filterStatus === 'ALL' || currentStatus === filterStatus;

      return matchSearch && matchStream && matchYear && matchClass && matchStatus;
    });
  }, [students, searchTerm, filterStream, filterYear, filterClass, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => (s.status || 'Active') === 'Active').length;
    const science = students.filter(s => s.stream === 'Science').length;
    const commerce = students.filter(s => s.stream === 'Commerce').length;
    return { total, active, science, commerce };
  }, [students]);

  // Distinct classes for filter dropdown and Classes tab
  const allClasses = useMemo(() => {
    const map = new Map();
    students.forEach(s => {
      const key = `${s.stream} • ${s.year} • ${s.class}`;
      if (!map.has(key)) {
        map.set(key, {
          name: s.class,
          stream: s.stream,
          year: s.year,
          count: 0
        });
      }
      const item = map.get(key);
      item.count++;
    });
    return Array.from(map.values());
  }, [students]);

  return (
    <Layout>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ background: '#FCEFEF', color: 'var(--maroon-900)', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--maroon-900)', margin: 0 }}>
              Student Management & Registration
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
            Register new students, assign batches & sections, manage unique roll numbers, and oversee student profiles with full data continuity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => openRegisterModal()}
            style={{
              background: 'var(--maroon-900)',
              color: '#fff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(115, 19, 19, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <UserPlus size={18} /> Register Student
          </button>
        </div>
      </div>

      {/* ── Metric Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FCEFEF', color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Students</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--maroon-900)' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ECFDF5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Students</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#065F46' }}>{stats.active}</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#E0F2FE', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Science Stream</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0369A1' }}>{stats.science}</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Commerce Stream</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#92400E' }}>{stats.commerce}</div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border-color)', marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('directory')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 4px',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'directory' ? 700 : 500,
            color: activeTab === 'directory' ? 'var(--maroon-900)' : 'var(--text-muted)',
            borderBottom: activeTab === 'directory' ? '3px solid var(--maroon-900)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Users size={18} /> Student Directory ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('admissions')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 4px',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'admissions' ? 700 : 500,
            color: activeTab === 'admissions' ? 'var(--maroon-900)' : 'var(--text-muted)',
            borderBottom: activeTab === 'admissions' ? '3px solid var(--maroon-900)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <FileText size={18} /> Admissions Queue ({admissions.filter(a => a.status !== 'Approved').length})
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 4px',
            fontSize: '0.95rem',
            fontWeight: activeTab === 'classes' ? 700 : 500,
            color: activeTab === 'classes' ? 'var(--maroon-900)' : 'var(--text-muted)',
            borderBottom: activeTab === 'classes' ? '3px solid var(--maroon-900)' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Layers size={18} /> Classes & Sections ({allClasses.length})
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════
          TAB 1: STUDENT DIRECTORY
      ═══════════════════════════════════════════════════ */}
      {activeTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filters & Search Toolbar */}
          <div style={{ background: 'var(--bg-surface)', padding: 18, borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', flex: 1, minWidth: 280 }}>
              <div style={{ background: '#FAFAFA', border: '1px solid var(--border-color)', borderRadius: 8, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, width: 260 }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search name, roll no, phone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.88rem' }}
                />
                {searchTerm && (
                  <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSearchTerm('')} />
                )}
              </div>

              {/* Stream Filter */}
              <select
                value={filterStream}
                onChange={e => setFilterStream(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: '#FAFAFA', fontSize: '0.85rem', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">All Streams</option>
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
              </select>

              {/* Year Filter */}
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: '#FAFAFA', fontSize: '0.85rem', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
              </select>

              {/* Reset Filters */}
              {(filterStream !== 'ALL' || filterYear !== 'ALL' || filterClass !== 'ALL' || searchTerm) && (
                <button
                  onClick={() => {
                    setFilterStream('ALL');
                    setFilterYear('ALL');
                    setFilterClass('ALL');
                    setSearchTerm('');
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--maroon-900)', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '6px 8px' }}
                >
                  <RefreshCw size={12} /> Clear Filters
                </button>
              )}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong>{filteredStudents.length}</strong> of {students.length} students
            </div>
          </div>

          {/* Batch Actions Banner (when students selected) */}
          {selectedIds.size > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--maroon-900)', fontWeight: 600, fontSize: '0.92rem' }}>
                <CheckSquare size={18} /> {selectedIds.size} student(s) selected
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={openBatchShiftModal}
                  style={{ background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <ArrowRightLeft size={15} /> Shift Selected ({selectedIds.size})
                </button>

                <button
                  onClick={() => setIsBatchRemoveModalOpen(true)}
                  style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                >
                  <Trash2 size={15} /> Remove Selected ({selectedIds.size})
                </button>

                <button
                  onClick={() => setSelectedIds(new Set())}
                  style={{ background: '#fff', border: '1px solid #FECACA', color: 'var(--text-main)', padding: '7px 12px', borderRadius: 8, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* Student Table */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: '2px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '14px 16px', width: 44, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--maroon-900)' }}
                      />
                    </th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Roll No</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Student Name</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Stream & Year</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Class / Section</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Parent Contact</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Actions (Shift / Remove)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 12px auto' }}></div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading institutional student roster...</div>
                      </td>
                    </tr>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((stu) => {
                      const isSelected = selectedIds.has(stu.id);

                      return (
                        <tr
                          key={stu.id}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            background: isSelected ? '#FFF7F7' : 'transparent',
                            transition: 'background 0.1s'
                          }}
                        >
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectStudent(stu.id)}
                              style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--maroon-900)' }}
                            />
                          </td>

                          {/* Roll Number */}
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--maroon-900)' }}>
                            <span style={{ background: '#FCEFEF', padding: '3px 8px', borderRadius: 6, fontSize: '0.85rem' }}>
                              #{stu.roll_number || 'N/A'}
                            </span>
                          </td>

                          {/* Student Name */}
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--maroon-900)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                                {stu.name?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <div 
                                  onClick={() => navigate(`/student/${stu.id}`)}
                                  style={{ fontWeight: 600, color: 'var(--maroon-900)', cursor: 'pointer', textDecoration: 'none' }}
                                  className="hover-underline"
                                >
                                  {stu.name}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Stream & Year */}
                          <td style={{ padding: '14px 16px', fontSize: '0.88rem' }}>
                            <span style={{ fontWeight: 500 }}>{stu.year}</span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({stu.stream})</span>
                          </td>

                          {/* Class */}
                          <td style={{ padding: '14px 16px', fontSize: '0.88rem', fontWeight: 600 }}>
                            {stu.class}
                          </td>

                          {/* Parent Phone */}
                          <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                            {stu.parent_phone ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Phone size={13} color="var(--text-muted)" />
                                <span>{stu.parent_phone}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700 }}>
                              {stu.status || 'Active'}
                            </span>
                          </td>

                          {/* Actions: View / Attendance / Shift / Remove */}
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                onClick={() => navigate(`/student/${stu.id}`)}
                                title="View Full Student Profile"
                                style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}
                              >
                                <Eye size={14} /> Profile
                              </button>

                              <button
                                onClick={() => navigate(`/attendance?stream=${stu.stream}&year=${stu.year}&class=${encodeURIComponent(stu.class)}`)}
                                title="Edit Class Attendance"
                                style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600 }}
                              >
                                <UserCheck size={14} /> Attendance
                              </button>

                              <button
                                onClick={() => openShiftModal(stu)}
                                title="Shift / Transfer Student to another Class or Section"
                                style={{ background: '#FCEFEF', border: '1px solid #F5C6CB', color: 'var(--maroon-900)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600 }}
                              >
                                <ArrowRightLeft size={14} /> Shift
                              </button>

                              <button
                                onClick={() => openRemoveModal(stu)}
                                title="Remove Student from Database"
                                style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <Users size={40} style={{ opacity: 0.3, margin: '0 auto 12px auto', color: 'var(--maroon-900)' }} />
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>No students match your criteria</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 auto 16px auto', maxWidth: 400 }}>
                          No registered student records match the active search or filters. Clear your filters or register a new student.
                        </p>
                        <button
                          onClick={() => openRegisterModal()}
                          style={{ background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                        >
                          + Register New Student
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 2: ADMISSIONS QUEUE
      ═══════════════════════════════════════════════════ */}
      {activeTab === 'admissions' && (
        <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--maroon-900)', margin: 0 }}>Pending Admission Applications</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>Review submitted student applications and admit them directly into a class and shift with 1 click.</p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Applicant Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Parent Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Contact Phone</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '12px 16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {admissions.length > 0 ? (
                admissions.map((app) => (
                  <tr key={app.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--maroon-900)' }}>{app.applicant_name || app.name}</td>
                    <td style={{ padding: '16px' }}>{app.parent_name || 'N/A'}</td>
                    <td style={{ padding: '16px' }}>{app.contact_phone || app.phone || 'N/A'}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        background: app.status === 'Approved' ? '#D1FAE5' : '#FEF3C7', 
                        color: app.status === 'Approved' ? '#065F46' : '#92400E', 
                        padding: '4px 10px', 
                        borderRadius: 12, 
                        fontSize: '0.8rem', 
                        fontWeight: 600 
                      }}>
                        {app.status || 'New Application'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {app.status !== 'Approved' ? (
                        <button
                          onClick={() => openRegisterModal({
                            name: app.applicant_name || app.name,
                            parent_name: app.parent_name,
                            parent_phone: app.contact_phone || app.phone,
                            email: app.contact_email || app.email,
                            admissionId: app.id
                          })}
                          style={{ background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <Check size={14} /> Admit & Register Student
                        </button>
                      ) : (
                        <span style={{ color: '#065F46', fontSize: '0.85rem', fontWeight: 600 }}>Registered & Active</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FileText size={36} style={{ opacity: 0.3, margin: '0 auto 10px auto' }} />
                    <div style={{ fontWeight: 600 }}>No pending admission applications.</div>
                    <div style={{ fontSize: '0.85rem', marginTop: 4 }}>You can directly register students using the "+ Register Student" button above.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 3: CLASSES & SECTIONS OVERVIEW
      ═══════════════════════════════════════════════════ */}
      {activeTab === 'classes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
          {allClasses.map((cls, idx) => (
            <div key={idx} style={{ background: 'var(--bg-surface)', padding: 22, borderRadius: 16, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--maroon-900)', margin: '0 0 4px 0' }}>{cls.name}</h3>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{cls.year} • {cls.stream}</span>
                  </div>
                  <span style={{ background: '#FCEFEF', color: 'var(--maroon-900)', padding: '4px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700 }}>
                    {cls.stream}
                  </span>
                </div>

                <div style={{ background: '#FAFAFA', padding: '12px 16px', borderRadius: 10, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Enrolled</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--maroon-900)' }}>{cls.count} students</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => {
                    setFilterStream(cls.stream);
                    setFilterYear(cls.year);
                    setActiveTab('directory');
                  }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--maroon-900)',
                    color: 'var(--maroon-900)',
                    padding: '8px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  View Roster <ArrowRight size={13} />
                </button>
                <button
                  onClick={() => navigate(`/attendance?stream=${cls.stream}&year=${cls.year}&class=${encodeURIComponent(cls.name)}`)}
                  style={{
                    flex: 1,
                    background: '#FCEFEF',
                    border: '1px solid #F5C6CB',
                    color: 'var(--maroon-900)',
                    padding: '8px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <PenLine size={13} /> Edit Attendance
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL 1: REGISTER STUDENT (ADD)
      ═══════════════════════════════════════════════════ */}
      {isRegisterOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 560, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', background: 'var(--maroon-900)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Register New Student</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', opacity: 0.85 }}>Assign unique roll number, designated class, and institutional shift</p>
              </div>
              <button onClick={() => setIsRegisterOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Student Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={regForm.name}
                  onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.9rem' }}
                />
              </div>

              {/* Stream & Year Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>Stream *</label>
                  <select
                    value={regForm.stream}
                    onChange={e => {
                      const newStream = e.target.value;
                      const nextClasses = CLASS_OPTIONS[`${newStream}|${regForm.year}`] || ['Class A'];
                      setRegForm(prev => ({ ...prev, stream: newStream, class: nextClasses[0] }));
                      handleSuggestRegRoll(newStream, regForm.year, nextClasses[0]);
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.9rem' }}
                  >
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>Year *</label>
                  <select
                    value={regForm.year}
                    onChange={e => {
                      const newYear = e.target.value;
                      const nextClasses = CLASS_OPTIONS[`${regForm.stream}|${newYear}`] || ['Class A'];
                      setRegForm(prev => ({ ...prev, year: newYear, class: nextClasses[0] }));
                      handleSuggestRegRoll(regForm.stream, newYear, nextClasses[0]);
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.9rem' }}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                  </select>
                </div>
              </div>

              {/* Class Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>Class / Section *</label>
                <select
                  value={regForm.class}
                  onChange={e => {
                    const newClass = e.target.value;
                    setRegForm(prev => ({ ...prev, class: newClass }));
                    handleSuggestRegRoll(regForm.stream, regForm.year, newClass);
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.9rem' }}
                >
                  {currentClassOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Unique Roll Number with live availability check */}
              <div style={{ background: '#FAFAFA', padding: 14, borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--maroon-900)' }}>Unique Roll Number *</label>
                  <button
                    type="button"
                    onClick={() => handleSuggestRegRoll()}
                    style={{ background: 'none', border: 'none', color: 'var(--maroon-900)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Auto-Assign Next Free Roll No
                  </button>
                </div>

                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 1, 2, 3..."
                  value={regForm.roll_number}
                  onChange={e => setRegForm({ ...regForm, roll_number: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: regRollCheck.available ? '1px solid var(--border-color)' : '1px solid #EF4444', outline: 'none', fontSize: '0.95rem', fontWeight: 600 }}
                />

                {regRollCheck.message && (
                  <div style={{ marginTop: 6, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6, color: regRollCheck.available ? '#059669' : '#DC2626', fontWeight: 500 }}>
                    {regRollCheck.available ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {regRollCheck.message}
                  </div>
                )}
              </div>

              {/* Parent Contact & Guardian Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>Parent Phone (SMS Alerts) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={regForm.parent_phone}
                    onChange={e => setRegForm({ ...regForm, parent_phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>Parent / Guardian Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Kumar"
                    value={regForm.parent_name}
                    onChange={e => setRegForm({ ...regForm, parent_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regSubmitting || !regRollCheck.available}
                  style={{
                    background: regRollCheck.available ? 'var(--maroon-900)' : '#9CA3AF',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: regRollCheck.available ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {regSubmitting ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL 2: SHIFT STUDENT (SINGLE)
      ═══════════════════════════════════════════════════ */}
      {isShiftModalOpen && targetStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 540, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', background: 'var(--maroon-900)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ArrowRightLeft size={20} /> Shift Student
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', opacity: 0.85 }}>Transfer to new Class, Shift, or Year while preserving all student records</p>
              </div>
              <button onClick={() => setIsShiftModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleShiftSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Current Student Profile Box */}
              <div style={{ background: '#FCEFEF', border: '1px solid #F5C6CB', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--maroon-900)', fontWeight: 600, textTransform: 'uppercase' }}>Current Student Information</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--maroon-900)', marginTop: 2 }}>{targetStudent.name}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.85rem', color: 'var(--text-main)', flexWrap: 'wrap' }}>
                  <span><strong>Current Batch:</strong> {targetStudent.stream} • {targetStudent.year} • {targetStudent.class}</span>
                  <span><strong>Roll No:</strong> #{targetStudent.roll_number}</span>
                </div>
              </div>

              {/* Destination Stream & Year */}
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
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.9rem' }}
                  >
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Target Year (Promotion/Transfer)</label>
                  <select
                    value={shiftForm.targetYear}
                    onChange={e => {
                      const newYear = e.target.value;
                      const nextClasses = CLASS_OPTIONS[`${shiftForm.targetStream}|${newYear}`] || ['FTB - 1'];
                      setShiftForm(prev => ({ ...prev, targetYear: newYear, targetClass: nextClasses[0] }));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.9rem' }}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                  </select>
                </div>
              </div>

              {/* Destination Class */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Target Class / Section</label>
                <select
                  value={shiftForm.targetClass}
                  onChange={e => setShiftForm({ ...shiftForm, targetClass: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', fontSize: '0.9rem' }}
                >
                  {shiftTargetClassOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Target Roll Number */}
              <div style={{ background: '#FAFAFA', padding: 14, borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--maroon-900)' }}>Roll Number in Destination Class</label>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextRoll = await getNextAvailableRollNumber(shiftForm.targetStream, shiftForm.targetYear, shiftForm.targetClass);
                      setShiftForm(prev => ({ ...prev, targetRollNumber: nextRoll.toString() }));
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--maroon-900)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Auto-Assign Next Free Roll No
                  </button>
                </div>

                <input
                  type="number"
                  min="1"
                  required
                  value={shiftForm.targetRollNumber}
                  onChange={e => setShiftForm({ ...shiftForm, targetRollNumber: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: shiftRollCheck.available ? '1px solid var(--border-color)' : '1px solid #EF4444', outline: 'none', fontSize: '0.95rem', fontWeight: 600 }}
                />

                {shiftRollCheck.message && (
                  <div style={{ marginTop: 6, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6, color: shiftRollCheck.available ? '#059669' : '#DC2626', fontWeight: 500 }}>
                    {shiftRollCheck.available ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {shiftRollCheck.message}
                  </div>
                )}
              </div>

              {/* Data Continuity Guarantee Note */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 12, borderRadius: 8, fontSize: '0.82rem', color: '#166534', lineHeight: 1.4 }}>
                <strong>✓ Data Continuity Guarantee:</strong> All past test marks, attendance records, and remarks remain permanently bound to this student's unique ID and will carry over seamlessly.
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shiftSubmitting || !shiftRollCheck.available}
                  style={{
                    background: shiftRollCheck.available ? 'var(--maroon-900)' : '#9CA3AF',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: shiftRollCheck.available ? 'pointer' : 'not-allowed'
                  }}
                >
                  {shiftSubmitting ? 'Shifting...' : 'Confirm & Shift Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL 3: BATCH SHIFT STUDENTS
      ═══════════════════════════════════════════════════ */}
      {isBatchShiftModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 520, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', background: 'var(--maroon-900)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Batch Shift ({selectedIds.size} Students)</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', opacity: 0.85 }}>Transfer multiple selected students simultaneously</p>
              </div>
              <button onClick={() => setIsBatchShiftModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBatchShiftSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#FAFAFA', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                You have selected <strong>{selectedIds.size} students</strong> to shift. Unique sequential roll numbers will be automatically allocated in the destination class.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>Target Stream</label>
                  <select
                    value={batchShiftForm.targetStream}
                    onChange={e => {
                      const newStream = e.target.value;
                      const nextClasses = CLASS_OPTIONS[`${newStream}|${batchShiftForm.targetYear}`] || ['FTB - 1'];
                      setBatchShiftForm(prev => ({ ...prev, targetStream: newStream, targetClass: nextClasses[0] }));
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
                    value={batchShiftForm.targetYear}
                    onChange={e => {
                      const newYear = e.target.value;
                      const nextClasses = CLASS_OPTIONS[`${batchShiftForm.targetStream}|${newYear}`] || ['FTB - 1'];
                      setBatchShiftForm(prev => ({ ...prev, targetYear: newYear, targetClass: nextClasses[0] }));
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
                  value={batchShiftForm.targetClass}
                  onChange={e => setBatchShiftForm({ ...batchShiftForm, targetClass: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  {batchShiftTargetClassOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsBatchShiftModalOpen(false)}
                  style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchShiftSubmitting}
                  style={{ background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  {batchShiftSubmitting ? 'Shifting Students...' : `Confirm Shift for ${selectedIds.size} Students`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL 4: REMOVE STUDENT (SINGLE)
      ═══════════════════════════════════════════════════ */}
      {isRemoveModalOpen && targetStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 440, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Remove Student Record?
            </h3>

            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
              Are you sure you want to permanently remove <strong>{targetStudent.name}</strong> (Roll No: #{targetStudent.roll_number}) from {targetStudent.stream} - {targetStudent.class}?
            </p>

            <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', padding: 12, borderRadius: 8, fontSize: '0.8rem', color: '#9A3412', marginBottom: 20 }}>
              ⚠️ <strong>Warning:</strong> Removing this student will also delete their associated test marks and attendance records.
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setIsRemoveModalOpen(false)}
                style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveConfirm}
                style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', flex: 1 }}
              >
                Yes, Remove Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL 5: BATCH REMOVE STUDENTS
      ═══════════════════════════════════════════════════ */}
      {isBatchRemoveModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 450, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Remove {selectedIds.size} Students?
            </h3>

            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
              Are you sure you want to permanently delete {selectedIds.size} selected student records and their associated academic data?
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setIsBatchRemoveModalOpen(false)}
                style={{ background: '#F5F5F5', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchRemoveConfirm}
                style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', flex: 1 }}
              >
                Confirm Delete ({selectedIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
