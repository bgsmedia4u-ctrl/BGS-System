import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../api/supabase';
import { 
  getTeacherAssignments, 
  assignSubjectToTeacher, 
  removeSubjectAssignment, 
  resetTeacherProgress,
  getAssignmentProgressWithMaster,
  saveChapterProgressRecord,
  getConsolidatedPrincipalProgress,
  getMasterSyllabusStructure,
  createSyllabusModule
} from '../api/syllabusService';
import Layout from '../components/Layout';
import { 
  BookOpenCheck, Check, Search, Plus, Save, Trash2, RotateCcw, 
  FileSpreadsheet, Printer, ShieldCheck, UserCheck, AlertCircle, 
  BarChart3, Settings, ChevronRight, CheckCircle2, Clock, PlayCircle, Eye, Filter, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SyllabusTrackerPage() {
  const { user, profile } = useAuth();
  const role = profile?.role || 'teacher';
  const isAdmin = role === 'admin';
  const isPrincipal = role === 'principal' || role === 'admin';

  // Navigation Tabs: 'my_workspace', 'principal_dashboard', 'admin_panel'
  const [activeTab, setActiveTab] = useState(() => {
    if (role === 'principal') return 'principal_dashboard';
    if (role === 'admin') return 'principal_dashboard';
    return 'my_workspace';
  });

  // State: My Teaching Workspace
  const [myAssignments, setMyAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [chapterProgressList, setChapterProgressList] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [savingChapter, setSavingChapter] = useState(null);

  // State: Principal Dashboard
  const [consolidatedData, setConsolidatedData] = useState([]);
  const [principalLoading, setPrincipalLoading] = useState(false);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStream, setFilterStream] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [inspectingAssignment, setInspectingAssignment] = useState(null);

  // State: Admin Panel
  const [allProfiles, setAllProfiles] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [masterStructure] = useState(() => getMasterSyllabusStructure());

  // Form: Assign Subject
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignYear, setAssignYear] = useState('1st PUC');
  const [assignStream, setAssignStream] = useState('Science');
  const [assignClass, setAssignClass] = useState('I PUC Science A');
  const [assignSubject, setAssignSubject] = useState('Physics');
  const [customSubject, setCustomSubject] = useState('');

  // Form: Add Supplementary Chapter (Admin)
  const [showSuppForm, setShowSuppForm] = useState(false);
  const [suppChapterName, setSuppChapterName] = useState('');
  const [suppSubject, setSuppSubject] = useState('Physics');

  useEffect(() => {
    if (!user?.id) return;
    if (activeTab === 'my_workspace') {
      loadMyWorkspace();
    } else if (activeTab === 'principal_dashboard' && isPrincipal) {
      loadPrincipalDashboard();
    } else if (activeTab === 'admin_panel' && isAdmin) {
      loadAdminPanel();
    }
  }, [activeTab, user?.id, role]);

  // ─── LOADERS ───
  async function loadMyWorkspace() {
    setWorkspaceLoading(true);
    try {
      const data = await getTeacherAssignments(user.id, role);
      setMyAssignments(data || []);
      if (selectedAssignment) {
        // Refresh active assignment if selected
        const stillExists = data.find(a => a.id === selectedAssignment.id);
        if (stillExists) {
          await selectAssignmentForViewing(stillExists);
        } else {
          setSelectedAssignment(null);
          setChapterProgressList([]);
        }
      }
    } catch (err) {
      toast.error('Failed to load assigned courses');
    } finally {
      setWorkspaceLoading(false);
    }
  }

  async function loadPrincipalDashboard() {
    setPrincipalLoading(true);
    try {
      const report = await getConsolidatedPrincipalProgress();
      setConsolidatedData(report || []);
    } catch (err) {
      toast.error('Failed to aggregate syllabus statistics');
    } finally {
      setPrincipalLoading(false);
    }
  }

  async function loadAdminPanel() {
    setAdminLoading(true);
    try {
      const [assigns, profs] = await Promise.all([
        getTeacherAssignments(user.id, 'admin'),
        supabase.from('profiles').select('id, name, email, role, subject').order('name', { ascending: true })
      ]);
      setAllAssignments(assigns || []);
      if (profs.data) {
        // Exclude accounts if appropriate, or list all teachers & staff
        setAllProfiles(profs.data.filter(p => p.name));
        if (!assignTeacherId && profs.data.length > 0) {
          setAssignTeacherId(profs.data[0].id);
        }
      }
    } catch (err) {
      toast.error('Failed to load administrative management data');
    } finally {
      setAdminLoading(false);
    }
  }

  async function selectAssignmentForViewing(assignment) {
    setSelectedAssignment(assignment);
    setWorkspaceLoading(true);
    try {
      const chapters = await getAssignmentProgressWithMaster(assignment, user.id, role);
      setChapterProgressList(chapters || []);
    } catch (err) {
      toast.error(err.message || 'Could not access syllabus progress');
      setSelectedAssignment(null);
    } finally {
      setWorkspaceLoading(false);
    }
  }

  // ─── TEACHER PROGRESS ACTIONS ───
  async function handleUpdateChapter(chapterName, newStatus, newPercentage, newRemarks) {
    if (!selectedAssignment) return;
    setSavingChapter(chapterName);
    try {
      await saveChapterProgressRecord(
        selectedAssignment, 
        chapterName, 
        newStatus, 
        newPercentage, 
        newRemarks, 
        user.id, 
        role
      );
      // Update locally
      setChapterProgressList(prev => prev.map(ch => {
        if (ch.chapter_name !== chapterName) return ch;
        let perc = parseInt(newPercentage, 10);
        if (isNaN(perc)) perc = 0;
        if (newStatus === 'completed') perc = 100;
        if (newStatus === 'not_started') perc = 0;
        return {
          ...ch,
          status: newStatus,
          completion_percentage: perc,
          remarks: newRemarks
        };
      }));
      toast.success('Chapter progress updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update progress');
    } finally {
      setSavingChapter(null);
    }
  }

  // ─── ADMIN ACTIONS ───
  async function handleAssignSubject(e) {
    e.preventDefault();
    if (!assignTeacherId) {
      toast.error('Please select a teacher from the directory.');
      return;
    }
    const finalSubject = customSubject.trim() || assignSubject;
    if (!finalSubject) {
      toast.error('Please specify the academic subject.');
      return;
    }
    try {
      await assignSubjectToTeacher({
        teacher_id: assignTeacherId,
        academic_year: assignYear,
        stream: assignStream,
        class_name: assignClass.trim() || 'General Class',
        subject: finalSubject
      }, role);
      toast.success('Subject assigned successfully!');
      setCustomSubject('');
      await loadAdminPanel();
    } catch (err) {
      toast.error(err.message || 'Error assigning subject');
    }
  }

  async function handleRemoveAssignment(assignId) {
    if (!window.confirm('Remove this subject assignment? Teacher progress associated with it will no longer appear on dashboards.')) return;
    try {
      await removeSubjectAssignment(assignId, role);
      toast.success('Assignment removed');
      setAllAssignments(prev => prev.filter(a => a.id !== assignId));
    } catch (err) {
      toast.error(err.message || 'Could not remove assignment');
    }
  }

  async function handleResetProgress(assign) {
    if (!window.confirm(`⚠️ Reset all syllabus completion records for ${assign.subject} (${assign.class_name})? This cannot be undone.`)) return;
    try {
      await resetTeacherProgress(assign, role);
      toast.success('Teacher progress records reset to zero.');
      await loadAdminPanel();
    } catch (err) {
      toast.error(err.message || 'Reset failed');
    }
  }

  async function handleCreateSupplement(e) {
    e.preventDefault();
    if (!suppChapterName.trim()) return;
    try {
      await createSyllabusModule({
        stream: assignStream,
        year: assignYear,
        class: assignClass,
        subject: suppSubject,
        chapter_name: suppChapterName.trim(),
        created_by: user.id
      }, role);
      toast.success('Supplementary chapter added to syllabus database');
      setSuppChapterName('');
      setShowSuppForm(false);
    } catch (err) {
      toast.error(err.message || 'Could not add chapter');
    }
  }

  // ─── REPORT EXPORT (PRINCIPAL) ───
  function handleExportCSV() {
    if (!consolidatedData.length) {
      toast.error('No progress records available for export.');
      return;
    }
    const headers = ['Teacher Name', 'Subject', 'Class / Section', 'Academic Year', 'Stream', 'Chapters Completed', 'Total Chapters', 'Overall Progress (%)', 'Status'];
    const rows = filteredPrincipalData.map(d => [
      `"${d.teacher_name}"`,
      `"${d.subject}"`,
      `"${d.class_name}"`,
      `"${d.academic_year}"`,
      `"${d.stream}"`,
      d.chapters_completed,
      d.total_chapters,
      d.progress_percentage,
      `"${d.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Syllabus_Progress_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel CSV Report downloaded!');
  }

  // Filter logic for Principal table
  const filteredPrincipalData = useMemo(() => {
    return consolidatedData.filter(d => {
      if (filterTeacher && !d.teacher_name.toLowerCase().includes(filterTeacher.toLowerCase())) return false;
      if (filterSubject && !d.subject.toLowerCase().includes(filterSubject.toLowerCase())) return false;
      if (filterStream && d.stream !== filterStream) return false;
      if (filterYear && d.academic_year !== filterYear) return false;
      if (filterClass && !d.class_name.toLowerCase().includes(filterClass.toLowerCase())) return false;
      return true;
    });
  }, [consolidatedData, filterTeacher, filterSubject, filterStream, filterYear, filterClass]);

  // Available dynamic subject list for admin form
  const availableSubjectsForStream = useMemo(() => {
    return masterStructure.streamSubjectMap[assignStream] || masterStructure.subjects || ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Economics', 'Business Studies', 'Computer Science'];
  }, [assignStream, masterStructure]);

  const formatSubjectDisplay = (assign) => {
    if (!assign || !assign.subject) return '';
    const yr = (assign.academic_year || '').includes('1st') ? '1st Year' : (assign.academic_year || '').includes('2nd') ? '2nd Year' : '';
    if (yr && !assign.subject.toLowerCase().includes(yr.toLowerCase()) && !assign.subject.toLowerCase().includes('puc')) {
      return `${yr} ${assign.subject}`;
    }
    return assign.subject;
  };

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">
            <BookOpenCheck size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 8, color: 'var(--accent)' }}/> 
            Strict Syllabus Tracking System
          </h1>
          <p className="page-subtitle">Role-based monitoring with read-only master curriculum integrity</p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, background: 'var(--bg-surface)', padding: 6, borderRadius: 12, border: '1px solid var(--border-color)' }}>
          {isPrincipal && (
            <button
              onClick={() => { setActiveTab('principal_dashboard'); setSelectedAssignment(null); }}
              className={`btn ${activeTab === 'principal_dashboard' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.88rem', color: activeTab === 'principal_dashboard' ? '#ffffff' : 'var(--text-main)', backgroundColor: activeTab === 'principal_dashboard' ? 'var(--maroon-900, #731313)' : 'transparent' }}
            >
              <BarChart3 size={16} /> Monitor Teacher Progress
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => { setActiveTab('admin_panel'); setSelectedAssignment(null); }}
              className={`btn ${activeTab === 'admin_panel' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.88rem', color: activeTab === 'admin_panel' ? '#ffffff' : 'var(--text-main)', backgroundColor: activeTab === 'admin_panel' ? 'var(--maroon-900, #731313)' : 'transparent' }}
            >
              <Settings size={16} /> Curriculum Registry
            </button>
          )}

          <button
            onClick={() => { setActiveTab('my_workspace'); setSelectedAssignment(null); loadMyWorkspace(); }}
            className={`btn ${activeTab === 'my_workspace' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.88rem', color: activeTab === 'my_workspace' ? '#ffffff' : 'var(--text-main)', backgroundColor: activeTab === 'my_workspace' ? 'var(--maroon-900, #731313)' : 'transparent', fontWeight: activeTab === 'my_workspace' ? 700 : 500 }}
          >
            <UserCheck size={16} /> Teacher Panel (My Subjects)
          </button>
        </div>
      </div>

      <div className="page-body fade-in">
        
        {/* ═════════════════════════════════════════════════════════════════════
            TAB 1: TEACHER PANEL (MY ASSIGNED SUBJECTS ONLY)
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'my_workspace' && (
          <div>
            {!selectedAssignment ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>My Assigned Subjects</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Select an assigned class below to manage chapter completion and remarks. You can only view and edit your own assigned curriculum.
                    </p>
                  </div>
                  <button onClick={loadMyWorkspace} className="btn btn-ghost" title="Refresh list" style={{ padding: '8px 12px' }}>
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>

                {workspaceLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <div className="loading-spinner"><div className="spinner"></div></div>
                  </div>
                ) : myAssignments.length === 0 ? (
                  <div className="card" style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)' }}>
                    <AlertCircle size={44} style={{ color: 'var(--maroon-700)', margin: '0 auto 14px', opacity: 0.8 }} />
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>No Subjects Assigned Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '10px auto 20px', lineHeight: 1.5 }}>
                      Your profile currently has no active syllabus tracking courses. You can self-enroll in your teaching subjects right now or ask an institution administrator to configure them in the Admin Panel.
                    </p>
                    
                    {role === 'admin' && (
                      <div style={{ marginBottom: 24 }}>
                        <button 
                          onClick={() => setActiveTab('admin_panel')} 
                          className="btn" 
                          style={{ background: 'var(--primary, #1d4ed8)', color: '#fff', padding: '10px 22px', fontSize: 15, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                        >
                          <Settings size={18} /> Open Admin Panel & Assign Courses →
                        </button>
                      </div>
                    )}

                    <div style={{ maxWidth: 500, margin: '0 auto', background: 'var(--bg-app, #f8fafc)', padding: '22px', borderRadius: 12, border: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} style={{ color: 'var(--maroon-700)' }} /> Quick Self-Enroll Teaching Subject:
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                        <select 
                          id="quick-year"
                          defaultValue="1st PUC"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: '#fff', color: 'var(--text-main)', flex: '1 1 110px' }}
                        >
                          <option value="1st PUC">1st PUC</option>
                          <option value="2nd PUC">2nd PUC</option>
                        </select>
                        <select 
                          id="quick-stream"
                          defaultValue="Science"
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: '#fff', color: 'var(--text-main)', flex: '1 1 120px' }}
                        >
                          <option value="Science">Science</option>
                          <option value="Commerce">Commerce</option>
                        </select>
                        <select 
                          id="quick-subject"
                          defaultValue={user?.user_metadata?.subject || "Physics"}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 14, background: '#fff', color: 'var(--text-main)', flex: '2 1 150px' }}
                        >
                          {masterStructure.subjects?.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                      <button 
                        onClick={async () => {
                          const yr = document.getElementById('quick-year').value;
                          const str = document.getElementById('quick-stream').value;
                          const sub = document.getElementById('quick-subject').value;
                          const cls = yr === '1st PUC' ? `I PUC ${str} A` : `II PUC ${str} A`;
                          try {
                            setWorkspaceLoading(true);
                            await assignSubjectToTeacher({
                              teacher_id: user?.id,
                              academic_year: yr,
                              stream: str,
                              class_name: cls,
                              subject: sub
                            }, role, user?.id);
                            toast.success(`Successfully enrolled in ${sub} (${yr})!`);
                            const fresh = await getTeacherAssignments(user?.id, role);
                            setMyAssignments(fresh);
                          } catch (e) {
                            toast.error(e.message || 'Failed to enroll');
                          } finally {
                            setWorkspaceLoading(false);
                          }
                        }}
                        style={{ background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center', height: 42, fontSize: 14 }}
                      >
                        Activate Course Tracker
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 20 }}>
                    {myAssignments.map(assign => (
                      <div 
                        key={assign.id}
                        onClick={() => selectAssignmentForViewing(assign)}
                        className="card hover-card" 
                        style={{ padding: 22, cursor: 'pointer', border: '1px solid var(--border-color)', transition: 'all 0.2s ease', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: 'var(--bg-surface-hover)', color: 'var(--maroon-900)', border: '1px solid var(--border-color)' }}>
                              {assign.academic_year} • {assign.stream}
                            </span>
                            <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                          </div>
                          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {formatSubjectDisplay(assign)}
                          </h3>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🏫 {assign.class_name}</span>
                          </div>
                        </div>

                        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 700 }}>
                            Manage Syllabus Progress →
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            Independent Data
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* CHAPTER CHECKLIST EDITOR FOR SELECTED ASSIGNMENT */
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '18px 24px', borderRadius: 16, border: '1px solid var(--border-color)', marginBottom: 24 }}>
                  <div>
                    <button 
                      onClick={() => setSelectedAssignment(null)}
                      className="btn btn-ghost" 
                      style={{ padding: '4px 0', marginBottom: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)' }}
                    >
                      ← Back to Assigned Subjects
                    </button>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                      <h2 style={{ margin: '0 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {formatSubjectDisplay(selectedAssignment)}
                      </h2>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--maroon-900)' }}>
                        ({selectedAssignment.class_name} • {selectedAssignment.academic_year} {selectedAssignment.stream})
                      </span>
                    </div>
                  </div>

                  {/* Automatic Progress Calculator Badge */}
                  {(() => {
                    const total = chapterProgressList.length;
                    const completed = chapterProgressList.filter(c => c.status === 'completed' || c.completion_percentage === 100).length;
                    const avgPerc = total > 0 ? Math.round(chapterProgressList.reduce((s, c) => s + (c.completion_percentage || 0), 0) / total) : 0;
                    return (
                      <div style={{ textAlign: 'right', background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                          Overall Progress
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: avgPerc >= 75 ? '#16A34A' : avgPerc >= 45 ? '#D97706' : '#DC2626', lineHeight: 1.2 }}>
                          {avgPerc}%
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {completed} of {total} Chapters Complete
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {workspaceLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <div className="loading-spinner"><div className="spinner"></div></div>
                  </div>
                ) : chapterProgressList.length === 0 ? (
                  <div className="card" style={{ padding: '50px 24px', textAlign: 'center' }}>
                    <BookOpenCheck size={44} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
                    <h3 style={{ margin: 0 }}>No Master Chapters On Record</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '10px auto 0' }}>
                      We did not find default master chapters for <strong>{selectedAssignment.subject}</strong> ({selectedAssignment.academic_year}). Ask an Admin to inspect the master syllabus or add supplementary chapters in the Admin Panel.
                    </p>
                  </div>
                ) : (
                  <div className="card" style={{ overflow: 'hidden', border: '1px solid var(--border-color)', padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ margin: 0, width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
                            <th style={{ padding: '14px 18px', width: '35%', fontSize: '0.88rem' }}>Chapter / Unit Topic</th>
                            <th style={{ padding: '14px 18px', width: '22%', fontSize: '0.88rem' }}>Status</th>
                            <th style={{ padding: '14px 18px', width: '20%', fontSize: '0.88rem' }}>Completion (%)</th>
                            <th style={{ padding: '14px 18px', width: '23%', fontSize: '0.88rem' }}>Faculty Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chapterProgressList.map((ch, index) => {
                            const isSaving = savingChapter === ch.chapter_name;
                            return (
                              <tr key={ch.chapter_name} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}>
                                <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>#{index + 1}</span> {ch.chapter_name}
                                  </div>
                                  {ch.updated_at && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                      Last saved: {new Date(ch.updated_at).toLocaleDateString()}
                                    </div>
                                  )}
                                </td>

                                <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                                  <select
                                    className="form-input"
                                    value={ch.status}
                                    disabled={isSaving}
                                    onChange={(e) => {
                                      const newSt = e.target.value;
                                      let newP = ch.completion_percentage;
                                      if (newSt === 'completed') newP = 100;
                                      if (newSt === 'not_started') newP = 0;
                                      if (newSt === 'in_progress' && newP === 0) newP = 50;
                                      handleUpdateChapter(ch.chapter_name, newSt, newP, ch.remarks);
                                    }}
                                    style={{ 
                                      padding: '8px 12px', 
                                      fontWeight: 600,
                                      borderRadius: 8,
                                      border: '1px solid var(--border-color)',
                                      background: ch.status === 'completed' ? '#DCFCE7' : ch.status === 'in_progress' ? '#FEF9C3' : 'var(--bg-card)',
                                      color: ch.status === 'completed' ? '#166534' : ch.status === 'in_progress' ? '#854D0E' : 'var(--text-secondary)'
                                    }}
                                  >
                                    <option value="not_started">⭕ Not Started</option>
                                    <option value="in_progress">🟡 In Progress</option>
                                    <option value="completed">✅ Completed</option>
                                  </select>
                                </td>

                                <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      step="5"
                                      value={ch.completion_percentage}
                                      disabled={isSaving}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        let st = ch.status;
                                        if (val === 100) st = 'completed';
                                        else if (val === 0) st = 'not_started';
                                        else st = 'in_progress';
                                        // Live local update without beating DB until drop, or send updates
                                        setChapterProgressList(prev => prev.map(item => item.chapter_name === ch.chapter_name ? { ...item, completion_percentage: val, status: st } : item));
                                      }}
                                      onMouseUp={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        let st = val === 100 ? 'completed' : val === 0 ? 'not_started' : 'in_progress';
                                        handleUpdateChapter(ch.chapter_name, st, val, ch.remarks);
                                      }}
                                      onTouchEnd={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        let st = val === 100 ? 'completed' : val === 0 ? 'not_started' : 'in_progress';
                                        handleUpdateChapter(ch.chapter_name, st, val, ch.remarks);
                                      }}
                                      style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--accent)' }}
                                    />
                                    <span style={{ width: 44, fontWeight: 700, fontSize: '0.9rem', textAlign: 'right', color: 'var(--text-main)' }}>
                                      {ch.completion_percentage}%
                                    </span>
                                  </div>
                                </td>

                                <td style={{ padding: '16px 18px', verticalAlign: 'top' }}>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <input
                                      type="text"
                                      className="form-input"
                                      placeholder="Add note or test date..."
                                      defaultValue={ch.remarks}
                                      disabled={isSaving}
                                      onBlur={(e) => {
                                        if (e.target.value !== ch.remarks) {
                                          handleUpdateChapter(ch.chapter_name, ch.status, ch.completion_percentage, e.target.value);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.target.blur();
                                        }
                                      }}
                                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                                    />
                                    {isSaving && <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', alignSelf: 'center', color: 'var(--accent)' }} />}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 2: PRINCIPAL MONITORING DASHBOARD (CONSOLIDATED)
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'principal_dashboard' && isPrincipal && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Individual Teacher Progress & Syllabus Monitor
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Real-time monitoring into every individual teacher's syllabus progress across academic years, streams, and classes configured in their Profile.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleExportCSV} className="btn" style={{ background: '#16A34A', color: '#fff', border: 'none', fontWeight: 600, padding: '9px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileSpreadsheet size={18} /> Export Excel / CSV
                </button>
                <button onClick={() => window.print()} className="btn btn-ghost" style={{ border: '1px solid var(--border-color)', fontWeight: 600, padding: '9px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Printer size={18} /> Print Report
                </button>
                <button onClick={loadPrincipalDashboard} className="btn btn-ghost" title="Refresh Live Statistics">
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{ padding: 16, marginBottom: 24, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', minWidth: 70 }}>
                <Filter size={16} /> Filters:
              </div>

              <div style={{ flex: '1 1 180px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Filter by Teacher Name..."
                  value={filterTeacher}
                  onChange={e => setFilterTeacher(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ flex: '1 1 160px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Filter Subject..."
                  value={filterSubject}
                  onChange={e => setFilterSubject(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ flex: '1 1 140px' }}>
                <select className="form-input" value={filterStream} onChange={e => setFilterStream(e.target.value)} style={{ padding: '8px 12px', fontSize: '0.88rem' }}>
                  <option value="">All Streams</option>
                  <option value="Science">Science</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Arts">Arts</option>
                </select>
              </div>

              <div style={{ flex: '1 1 140px' }}>
                <select className="form-input" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ padding: '8px 12px', fontSize: '0.88rem' }}>
                  <option value="">All Academic Years</option>
                  <option value="1st PUC">1st PUC</option>
                  <option value="2nd PUC">2nd PUC</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                </select>
              </div>

              {(filterTeacher || filterSubject || filterStream || filterYear || filterClass) && (
                <button 
                  onClick={() => { setFilterTeacher(''); setFilterSubject(''); setFilterStream(''); setFilterYear(''); setFilterClass(''); }}
                  className="btn btn-ghost" 
                  style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#DC2626' }}
                >
                  Reset Filters
                </button>
              )}
            </div>

            {principalLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 500 }}>Aggregating institution-wide progress...</p>
              </div>
            ) : filteredPrincipalData.length === 0 ? (
              <div className="card" style={{ padding: '50px 24px', textAlign: 'center' }}>
                <BarChart3 size={44} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
                <h3 style={{ margin: 0 }}>No Syllabus Records Found</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '10px auto 0' }}>
                  No active subject assignments match your filters. Navigate to the Admin Management tab to assign academic subjects to faculty members.
                </p>
              </div>
            ) : (
              <div className="card" style={{ overflow: 'hidden', padding: 0, border: '1px solid var(--border-color)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
                        <th style={{ padding: '14px 18px', fontSize: '0.88rem' }}>Teacher</th>
                        <th style={{ padding: '14px 18px', fontSize: '0.88rem' }}>Subject</th>
                        <th style={{ padding: '14px 18px', fontSize: '0.88rem' }}>Class</th>
                        <th style={{ padding: '14px 18px', fontSize: '0.88rem', textAlign: 'center' }}>Chapters Completed</th>
                        <th style={{ padding: '14px 18px', fontSize: '0.88rem', textAlign: 'center' }}>Overall Progress</th>
                        <th style={{ padding: '14px 18px', fontSize: '0.88rem' }}>Status</th>
                        <th style={{ padding: '14px 18px', fontSize: '0.88rem', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrincipalData.map(row => (
                        <tr key={row.assignment_id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}>
                          <td style={{ padding: '16px 18px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {row.teacher_name}
                          </td>
                          <td style={{ padding: '16px 18px', fontWeight: 600, color: 'var(--maroon-900)' }}>
                            {row.subject}
                          </td>
                          <td style={{ padding: '16px 18px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: 600 }}>{row.class_name}</span> <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>({row.academic_year} {row.stream})</span>
                          </td>
                          <td style={{ padding: '16px 18px', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                            {row.chapters_completed} / {row.total_chapters}
                          </td>
                          <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                              <div style={{ width: 80, height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{ 
                                  height: '100%', 
                                  width: `${row.progress_percentage}%`, 
                                  background: row.progress_percentage >= 75 ? '#16A34A' : row.progress_percentage >= 45 ? '#D97706' : '#DC2626' 
                                }}></div>
                              </div>
                              <span style={{ fontWeight: 800, minWidth: 40, textAlign: 'right' }}>
                                {row.progress_percentage}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 18px' }}>
                            <span style={{
                              padding: '5px 12px',
                              borderRadius: 20,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              background: row.status === 'On Track' ? '#DCFCE7' : row.status === 'Behind Schedule' ? '#FEF9C3' : '#FEE2E2',
                              color: row.status === 'On Track' ? '#166534' : row.status === 'Behind Schedule' ? '#854D0E' : '#991B1B',
                              display: 'inline-block'
                            }}>
                              {row.status === 'On Track' ? '● On Track' : row.status === 'Behind Schedule' ? '▲ Behind Schedule' : '■ Needs Attention'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                            <button
                              onClick={() => setInspectingAssignment(row)}
                              className="btn btn-ghost"
                              style={{ padding: '6px 12px', fontSize: '0.82rem', border: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--accent)' }}
                            >
                              <Eye size={15} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Inspect Chapter Breakdown Modal (Principal Read-Only View) */}
            {inspectingAssignment && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div className="card fade-in" style={{ width: '100%', maxWidth: 750, maxHeight: '90vh', overflowY: 'auto', background: '#fff', padding: 28, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)' }}>
                        Detailed Chapter Audit
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {inspectingAssignment.subject} — {inspectingAssignment.teacher_name}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--maroon-900)', fontWeight: 600, fontSize: '0.9rem' }}>
                        {inspectingAssignment.class_name} ({inspectingAssignment.academic_year} {inspectingAssignment.stream})
                      </p>
                    </div>
                    <button onClick={() => setInspectingAssignment(null)} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '1rem', fontWeight: 700 }}>
                      ✕
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                    <table className="table" style={{ margin: 0, width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-surface)' }}>
                          <th style={{ padding: '12px 16px', fontSize: '0.84rem' }}>Chapter</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.84rem' }}>Status</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.84rem', textAlign: 'center' }}>Completion</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.84rem' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(inspectingAssignment.master_chapters || []).map((chName, i) => {
                          const rec = (inspectingAssignment.raw_progress || []).find(r => r.chapter_name === chName);
                          const st = rec?.status || 'not_started';
                          const perc = rec?.completion_percentage !== undefined ? rec.completion_percentage : (st === 'completed' ? 100 : 0);
                          return (
                            <tr key={chName} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem' }}>
                                <span style={{ opacity: 0.6 }}>#{i + 1}</span> {chName}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: st === 'completed' ? '#DCFCE7' : st === 'in_progress' ? '#FEF9C3' : '#F1F5F9', color: st === 'completed' ? '#166534' : st === 'in_progress' ? '#854D0E' : '#475569' }}>
                                  {st === 'completed' ? 'Completed' : st === 'in_progress' ? 'In Progress' : 'Not Started'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>
                                {perc}%
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: rec?.remarks ? 'var(--text-main)' : 'var(--text-tertiary)', fontStyle: rec?.remarks ? 'normal' : 'italic' }}>
                                {rec?.remarks || 'No remarks recorded'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: 24, textAlign: 'right' }}>
                    <button onClick={() => setInspectingAssignment(null)} className="btn btn-primary" style={{ padding: '8px 20px', fontWeight: 600 }}>
                      Close Audit Modal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 3: CURRICULUM REGISTRY & MASTER SYLLABUS LIBRARY
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'admin_panel' && isAdmin && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Curriculum Registry & Master Library
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Teachers select their subject, stream, 1st/2nd academic year, and classes directly in their Profile settings. Admin monitors and oversees all active syllabus records here.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 28 }}>
              
              {/* Profile Integration Banner */}
              <div className="card" style={{ padding: 22, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={22} style={{ color: '#16A34A' }} /> Self-Service Teacher Profile & Syllabus Tracking Active
                </h3>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.92rem', color: '#15803D', lineHeight: 1.5 }}>
                  In accordance with institutional requirements, administrators do not manually assign subjects and syllabi. Teachers connect directly via their <strong>Profile Configuration</strong> by selecting their Subject, Stream, Academic Year (1st/2nd Year), and 2 or more classes. Once saved, their selections immediately reflect in the Syllabus Tracker and individual teacher monitoring dashboard.
                </p>
              </div>

              {/* Box 2: Active Faculty Assignments Registry */}
              <div className="card" style={{ padding: 24, border: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Active Faculty Subject Assignments ({allAssignments.length})
                </h3>

                {adminLoading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                    <div className="loading-spinner"><div className="spinner"></div></div>
                  </div>
                ) : allAssignments.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No active teacher course assignments found in database.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '2px solid var(--border-color)' }}>
                          <th style={{ padding: '12px 16px', fontSize: '0.85rem' }}>Teacher</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.85rem' }}>Subject</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.85rem' }}>Class / Section</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.85rem' }}>Academic Year & Stream</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.85rem', textAlign: 'right' }}>Management Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allAssignments.map(assign => (
                          <tr key={assign.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                              {assign.teacher_name}
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--maroon-900)' }}>
                              {assign.subject}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              {assign.class_name}
                            </td>
                            <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                              {assign.academic_year} ({assign.stream})
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                              <button 
                                onClick={() => handleResetProgress(assign)} 
                                className="btn btn-ghost" 
                                style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 8, fontWeight: 600 }}
                                title="Reset all completed chapters to zero for this assignment"
                              >
                                <RotateCcw size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Reset Progress
                              </button>
                              <button 
                                onClick={() => handleRemoveAssignment(assign.id)} 
                                className="btn btn-ghost" 
                                style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 8, fontWeight: 600 }}
                              >
                                <Trash2 size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Box 3: Supplementary DB Syllabus Creator */}
              <div className="card" style={{ padding: 24, border: '1px solid var(--border-color)', background: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showSuppForm ? 16 : 0 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Master Syllabus Curriculum Library
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      1st and 2nd PUC Karnataka board syllabi are imported read-only directly from JSON system manifests.
                    </p>
                  </div>
                  <button onClick={() => setShowSuppForm(!showSuppForm)} className="btn btn-ghost" style={{ border: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.85rem' }}>
                    {showSuppForm ? 'Hide Form' : '+ Add Custom DB Supplementary Chapter'}
                  </button>
                </div>

                {showSuppForm && (
                  <form onSubmit={handleCreateSupplement} style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ marginBottom: 0, flex: '1 1 200px' }}>
                        <label className="form-label">Subject</label>
                        <input type="text" className="form-input" value={suppSubject} onChange={e => setSuppSubject(e.target.value)} style={{ padding: '8px 12px' }} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0, flex: '2 1 300px' }}>
                        <label className="form-label">Supplementary Chapter / Unit Name</label>
                        <input type="text" className="form-input" value={suppChapterName} placeholder="e.g. Advanced Practical Evaluation" onChange={e => setSuppChapterName(e.target.value)} style={{ padding: '8px 12px' }} />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ padding: '9px 18px', fontWeight: 700, background: 'var(--maroon-900)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                        Save Chapter to DB
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
