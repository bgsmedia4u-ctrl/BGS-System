import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, getAllTasks, getAllTeacherProfiles, createTask, updateTask, deleteTask } from '../api/taskService';
import Layout from '../components/Layout';
import { CheckSquare, Plus, Check, Clock, Trash2, Target, User, ChevronDown, ChevronUp, MessageSquare, AlertTriangle, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isTaskOverdue(task) {
  if (!task?.deadline || task.status === 'done') return false;
  const deadlineDate = parseLocalDate(task.deadline);
  if (!deadlineDate || isNaN(deadlineDate.getTime())) return false;
  deadlineDate.setHours(23, 59, 59, 999);
  return deadlineDate < new Date();
}

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
  high:   { label: 'High',   bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  medium: { label: 'Medium', bg: '#E0F2FE', color: '#0369A1', dot: '#38BDF8' },
  low:    { label: 'Low',    bg: '#D1FAE5', color: '#065F46', dot: '#34D399' },
};

const STATUS_CONFIG = {
  todo:        { label: 'To Do',        bg: 'var(--bg-surface-hover)', color: 'var(--text-main)', icon: <CheckSquare size={14} /> },
  in_progress: { label: 'In Progress',  bg: '#FEF3C7',                color: '#92400E',          icon: <Clock size={14} /> },
  done:        { label: 'Completed',    bg: '#D1FAE5',                color: '#065F46',          icon: <Check size={14} /> },
};

export default function TasksPage({ isAdmin: isAdminProp }) {
  const { user, profile } = useAuth();
  const isAdmin = isAdminProp || profile?.role === 'admin';

  const [tasks, setTasks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin: Assign new task form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');
  const [assignPriority, setAssignPriority] = useState('medium');
  const [saving, setSaving] = useState(false);

  // Teacher: Update remarks modal
  const [editingTask, setEditingTask] = useState(null);
  const [editRemarks, setEditRemarks] = useState('');
  const modalTriggerRef = useRef(null);
  const modalRef = useRef(null);

  const closeModal = () => {
    setEditingTask(null);
    setEditRemarks('');
    if (modalTriggerRef.current) {
      modalTriggerRef.current.focus();
    }
  };

  useEffect(() => {
    if (!editingTask) return;
    const modalEl = modalRef.current;
    if (modalEl) {
      const focusable = modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) focusable[0].focus();
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingTask]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [user, isAdmin]);

  async function fetchData() {
    setLoading(true);
    try {
      if (isAdmin) {
        const [taskData, teacherData] = await Promise.all([
          getAllTasks(),
          getAllTeacherProfiles()
        ]);
        setTasks(taskData || []);
        setTeachers(teacherData || []);
        if (teacherData?.length > 0 && !assignTeacherId) {
          setAssignTeacherId(teacherData[0].id);
        }
      } else {
        const data = await getTasks(user.id);
        setTasks(data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  // Admin: Assign new task
  async function handleAssignTask(e) {
    e.preventDefault();
    if (!assignTeacherId || !assignTitle.trim()) {
      toast.error('Please select a teacher and enter a task title.');
      return;
    }
    setSaving(true);
    try {
      const newTask = await createTask(
        user.id,
        assignTeacherId,
        assignTitle.trim(),
        assignDesc.trim(),
        assignDeadline || null,
        assignPriority
      );
      setTasks([newTask, ...tasks]);
      setAssignTitle('');
      setAssignDesc('');
      setAssignDeadline('');
      setAssignPriority('medium');
      setShowAssignForm(false);
      toast.success('Task assigned successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to assign task');
    } finally {
      setSaving(false);
    }
  }

  // Teacher: Update task status
  async function handleStatusChange(task, newStatus) {
    try {
      await updateTask(task.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      toast.success(`Task moved to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update task status');
    }
  }

  // Teacher: Save remarks
  async function handleSaveRemarks() {
    if (!editingTask) return;
    try {
      await updateTask(editingTask.id, { remarks: editRemarks });
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, remarks: editRemarks } : t));
      closeModal();
      toast.success('Remarks updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save remarks');
    }
  }

  // Admin: Delete task
  async function handleDeleteTask(taskId) {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete task');
    }
  }

  // Build teacher name map
  const teacherMap = useMemo(() => {
    const map = {};
    teachers.forEach(t => { map[t.id] = t.name || t.email || 'Unknown'; });
    return map;
  }, [teachers]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (searchTerm && !t.title?.toLowerCase().includes(searchTerm.toLowerCase()) && !t.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterTeacher && t.teacher_id !== filterTeacher) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, searchTerm, filterTeacher, filterStatus]);

  // Group tasks by teacher for admin view
  const tasksByTeacher = useMemo(() => {
    const grouped = {};
    filteredTasks.forEach(t => {
      const key = t.teacher_id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });
    return grouped;
  }, [filteredTasks]);

  const columns = [
    { id: 'todo', label: 'To Do', icon: <CheckSquare size={14}/>, color: 'var(--text-main)', bg: 'var(--bg-surface-hover)' },
    { id: 'in_progress', label: 'In Progress', icon: <Clock size={14}/>, color: '#92400E', bg: '#FEF3C7' },
    { id: 'done', label: 'Completed', icon: <Check size={14}/>, color: '#065F46', bg: '#D1FAE5' }
  ];

  // ═══════════ RENDER ═══════════
  return (
    <Layout>
      <div className="page-header tasks-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">
            <Target size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 8, color: 'var(--accent)' }}/>
            Event Tasks Tracker
          </h1>
          <p className="page-subtitle">
            {isAdmin 
              ? 'Assign tasks to teachers and monitor their progress in real-time'
              : 'View tasks assigned by admin and update your progress'}
          </p>
        </div>
        {isAdmin && !showAssignForm && (
          <button className="btn btn-primary" onClick={() => setShowAssignForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Assign New Task
          </button>
        )}
      </div>

      <div className="page-body fade-in">

        {/* ═══ ADMIN: ASSIGN TASK FORM ═══ */}
        {isAdmin && showAssignForm && (
          <form className="card" onSubmit={handleAssignTask} style={{ marginBottom: 24, background: 'var(--bg-surface)', border: '2px solid var(--maroon-900)', padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FCEFEF', color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--maroon-900)' }}>Assign New Task to Teacher</h3>
            </div>

            <div className="tasks-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Select Teacher *</label>
                <select className="form-input" value={assignTeacherId} onChange={e => setAssignTeacherId(e.target.value)} required>
                  {teachers.filter(t => t.role === 'teacher').map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subject || 'General'})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Task Title *</label>
                <input type="text" className="form-input" value={assignTitle} onChange={e => setAssignTitle(e.target.value)} required placeholder="e.g. Submit lab records" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Deadline</label>
                <input type="date" className="form-input" value={assignDeadline} onChange={e => setAssignDeadline(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Priority</label>
                <select className="form-input" value={assignPriority} onChange={e => setAssignPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Description (Optional)</label>
              <textarea className="form-input" value={assignDesc} onChange={e => setAssignDesc(e.target.value)} placeholder="Detailed instructions for the teacher..." rows={3} style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAssignForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {saving ? 'Assigning...' : <><Plus size={16} /> Assign Task</>}
              </button>
            </div>
          </form>
        )}

        {/* ═══ FILTERS ═══ */}
        {isAdmin && (
          <div className="card tasks-filters" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 200px', minWidth: 160 }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13, background: '#fff' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} color="var(--text-muted)" />
              <select
                value={filterTeacher}
                onChange={e => setFilterTeacher(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13, background: '#fff' }}
              >
                <option value="">All Teachers</option>
                {teachers.filter(t => t.role === 'teacher').map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13, background: '#fff' }}
            >
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Completed</option>
            </select>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <div className="loading-spinner"><div className="spinner"></div></div>
          </div>
        ) : isAdmin ? (
          /* ═══ ADMIN VIEW: Tasks Grouped by Teacher ═══ */
          <div>
            {/* Summary Stats */}
            <div className="tasks-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
              {columns.map(col => {
                const count = filteredTasks.filter(t => t.status === col.id).length;
                return (
                  <div key={col.id} style={{ background: col.bg, padding: '16px 18px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: col.color }}>{count}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: col.color, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {col.icon} {col.label}
                    </div>
                  </div>
                );
              })}
              <div style={{ background: '#FCEFEF', padding: '16px 18px', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--maroon-900)' }}>{filteredTasks.length}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Target size={14} /> Total Tasks
                </div>
              </div>
            </div>

            {/* Tasks Table by Teacher */}
            {Object.keys(tasksByTeacher).length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', border: '2px dashed var(--border-color)' }}>
                <Target size={40} style={{ color: 'var(--text-muted)', opacity: 0.4, margin: '0 auto 12px' }} />
                <h3 style={{ margin: '0 0 8px', color: 'var(--text-main)' }}>No Tasks Assigned Yet</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Click "Assign New Task" to get started.</p>
              </div>
            ) : (
              Object.keys(tasksByTeacher).map(teacherId => {
                const teacherTasks = tasksByTeacher[teacherId];
                const teacherName = teacherMap[teacherId] || 'Unknown Teacher';
                const completed = teacherTasks.filter(t => t.status === 'done').length;
                const total = teacherTasks.length;
                const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div key={teacherId} className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
                    {/* Teacher Header */}
                    <div className="teacher-task-group-header" style={{ padding: '16px 20px', background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--maroon-900)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                          {teacherName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{teacherName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{completed}/{total} tasks completed</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 100, height: 6, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden' }}>
                          <div style={{ width: `${progressPct}%`, height: '100%', background: progressPct === 100 ? '#065F46' : 'var(--maroon-900)', borderRadius: 4, transition: 'width 0.3s' }}></div>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: progressPct === 100 ? '#065F46' : 'var(--maroon-900)' }}>{progressPct}%</span>
                      </div>
                    </div>

                    {/* Task Cards */}
                    <div style={{ padding: 16 }}>
                      <div className="admin-tasks-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                        {teacherTasks.map(task => {
                          const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                          const stat = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
                          const isExpanded = expandedTaskId === task.id;
                          const isOverdue = isTaskOverdue(task);

                          return (
                            <div key={task.id} style={{
                              padding: 16,
                              borderRadius: 12,
                              border: isOverdue ? '1px solid #EF4444' : '1px solid var(--border-color)',
                              background: '#fff',
                              borderLeft: `4px solid ${prio.dot}`,
                              transition: 'all 0.2s',
                              position: 'relative'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: task.status === 'done' ? 'line-through' : 'none', wordBreak: 'break-word' }}>
                                    {task.title}
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: prio.bg, color: prio.color }}>{prio.label}</span>
                                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', gap: 3 }}>{stat.icon} {stat.label}</span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button onClick={() => setExpandedTaskId(isExpanded ? null : task.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)' }}>
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </button>
                                  <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#EF4444', opacity: 0.6 }}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {task.deadline && (
                                <div style={{ fontSize: 12, marginTop: 8, color: isOverdue ? '#EF4444' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: isOverdue ? 600 : 400 }}>
                                  <Clock size={12} /> Due: {parseLocalDate(task.deadline).toLocaleDateString()}
                                  {isOverdue && <AlertTriangle size={12} style={{ marginLeft: 4 }} />}
                                </div>
                              )}

                              {isExpanded && (
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                                  {task.description && (
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                                      <strong>Description:</strong> {task.description}
                                    </div>
                                  )}
                                  {task.remarks && (
                                    <div style={{ fontSize: 13, color: '#065F46', background: '#D1FAE5', padding: '8px 12px', borderRadius: 8, marginBottom: 8 }}>
                                      <strong>Teacher Remarks:</strong> {task.remarks}
                                    </div>
                                  )}
                                  {task.updated_at && (
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                      Last updated: {new Date(task.updated_at).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ═══ TEACHER VIEW: Kanban Board ═══ */
          <div>
            {filteredTasks.length === 0 ? (
              <div className="card" style={{ padding: '60px 24px', textAlign: 'center', marginTop: 12, border: '2px dashed var(--border-color)', borderRadius: 20, background: '#fff' }}>
                <Target size={56} style={{ color: 'var(--accent)', opacity: 0.8, margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 10px', color: 'var(--text-main)', fontSize: '1.4rem', fontWeight: 700 }}>No Tasks Assigned</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem', lineHeight: 1.6 }}>Your admin hasn't assigned any tasks yet.<br />Check back here once new assignments arrive!</p>
              </div>
            ) : (
              <div className="tasks-kanban" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
                {columns.map(col => {
                  const colTasks = filteredTasks.filter(t => t.status === col.id);
                  return (
                    <div key={col.id} className="card" style={{ padding: 20, background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '8px 16px', background: col.bg, color: col.color, borderRadius: 24, width: 'fit-content', fontWeight: 700, fontSize: '1rem' }}>
                        {col.icon} {col.label}
                        <span style={{ marginLeft: 8, background: 'rgba(255,255,255,0.8)', padding: '2px 10px', borderRadius: 12, fontSize: 13, color: col.color }}>
                          {colTasks.length}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {colTasks.map(task => {
                          const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                          const isOverdue = isTaskOverdue(task);

                          return (
                            <div key={task.id} className="card" style={{
                              padding: 20,
                              marginBottom: 0,
                              cursor: 'default',
                              borderLeft: `5px solid ${prio.dot}`,
                              background: isOverdue ? '#FFF5F5' : '#fff',
                              borderRadius: 14,
                              boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: task.status === 'done' ? 'line-through' : 'none', wordBreak: 'break-word', flex: 1 }}>
                                  {task.title}
                                </div>
                                <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: prio.bg, color: prio.color, flexShrink: 0 }}>{prio.label}</span>
                              </div>

                              {task.description && (
                                <div style={{ fontSize: 14, marginTop: 10, color: 'var(--text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {task.description}
                                </div>
                              )}

                              {task.deadline && (
                                <div style={{ fontSize: 13, marginTop: 12, color: isOverdue ? '#EF4444' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: isOverdue ? 700 : 500 }}>
                                  <Clock size={15} /> Due: {parseLocalDate(task.deadline).toLocaleDateString()}
                                  {isOverdue && <AlertTriangle size={15} />}
                                </div>
                              )}

                              {task.remarks && (
                                <div style={{ fontSize: 13, marginTop: 12, padding: '8px 12px', background: '#D1FAE5', borderRadius: 8, color: '#065F46', lineHeight: 1.5 }}>
                                  <strong>Your Remarks:</strong> {task.remarks}
                                </div>
                              )}

                              {/* Status buttons + Remarks */}
                              <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
                                {col.id !== 'todo' && (
                                  <button className="btn btn-ghost" style={{ flex: 1, padding: '8px 12px', fontSize: 13, minWidth: 80, fontWeight: 600, height: 38 }} onClick={() => handleStatusChange(task, 'todo')}>
                                    To Do
                                  </button>
                                )}
                                {col.id !== 'in_progress' && (
                                  <button className="btn btn-ghost" style={{ flex: 1, padding: '8px 12px', fontSize: 13, color: '#92400E', borderColor: '#FEF3C7', minWidth: 80, fontWeight: 600, height: 38 }} onClick={() => handleStatusChange(task, 'in_progress')}>
                                    Start
                                  </button>
                                )}
                                {col.id !== 'done' && (
                                  <button className="btn btn-ghost" style={{ flex: 1, padding: '8px 12px', fontSize: 13, color: '#065F46', borderColor: '#D1FAE5', minWidth: 80, fontWeight: 600, height: 38 }} onClick={() => handleStatusChange(task, 'done')}>
                                    Complete
                                  </button>
                                )}
                                <button
                                  className="btn btn-primary"
                                  style={{ flex: 1, padding: '8px 12px', fontSize: 13, minWidth: 95, background: 'var(--maroon-900)', color: '#fff', fontWeight: 600, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                  onClick={(e) => { modalTriggerRef.current = e.currentTarget; setEditingTask(task); setEditRemarks(task.remarks || ''); }}
                                >
                                  <MessageSquare size={14} /> Remarks
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {colTasks.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14, border: '2px dashed var(--border-color)', borderRadius: 12 }}>
                            No tasks here
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ REMARKS MODAL (Teacher) ═══ */}
      {editingTask && (
        <div 
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label="Update Remarks"
          style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500,
            padding: 28, boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--maroon-900)' }}>
                <MessageSquare size={18} style={{ verticalAlign: 'bottom', marginRight: 8 }} />
                Update Remarks
              </h3>
              <button aria-label="Close modal" onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>{editingTask.title}</div>
              {editingTask.description && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{editingTask.description}</div>
              )}
            </div>
            <textarea
              value={editRemarks}
              onChange={e => setEditRemarks(e.target.value)}
              placeholder="Add your progress notes, updates, or remarks..."
              rows={4}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 8,
                border: '1px solid var(--border-color)', fontSize: 14,
                resize: 'vertical', background: '#f9fafb', boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={closeModal} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border-color)', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
                Cancel
              </button>
              <button onClick={handleSaveRemarks} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--maroon-900)', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(122,26,26,0.25)' }}>
                Save Remarks
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .tasks-page-header { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .tasks-page-header .btn { width: 100% !important; justify-content: center !important; }
          .tasks-form-grid { grid-template-columns: 1fr !important; }
          .tasks-filters { flex-direction: column !important; align-items: stretch !important; }
          .tasks-filters > div, .tasks-filters > select { width: 100% !important; min-width: 0 !important; flex: 1 1 100% !important; }
          .tasks-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-tasks-card-grid { grid-template-columns: 1fr !important; }
          .tasks-kanban { grid-template-columns: 1fr !important; }
          .teacher-task-group-header { flex-direction: column !important; align-items: flex-start !important; }
        }
        @media (max-width: 480px) {
          .tasks-stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}
