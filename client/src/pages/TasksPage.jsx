import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTasks, createTask, updateTask, deleteTask } from '../api/taskService';
import Layout from '../components/Layout';
import { CheckSquare, Plus, Check, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Task state
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getTasks(user.id);
      setTasks(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const newTask = await createTask(user.id, title.trim(), deadline || null);
      setTasks([newTask, ...tasks]);
      setTitle('');
      setDeadline('');
      setShowNew(false);
      toast.success('Task created');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create task');
    }
  }

  async function handleMove(task, newStatus) {
    try {
      await updateTask(task.id, user.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
      toast.error('Failed to update task');
    }
  }

  async function handleDelete(taskId) {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId, user.id);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete task');
    }
  }

  const columns = [
    { id: 'todo', label: 'To Do', icon: <CheckSquare size={16}/>, color: 'var(--text-main)', bg: 'var(--bg-surface)' },
    { id: 'in_progress', label: 'In Progress', icon: <Clock size={16}/>, color: 'var(--warning)', bg: 'var(--warning-bg)' },
    { id: 'done', label: 'Done', icon: <Check size={16}/>, color: 'var(--success)', bg: 'var(--success-bg)' }
  ];

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title"><CheckSquare size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 8, color: 'var(--accent)' }}/> My Tasks</h1>
          <p className="page-subtitle">Manage your personal checklist and deadlines</p>
        </div>
        {!showNew && (
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      <div className="page-body fade-in">
        {showNew && (
          <form className="card" onSubmit={handleCreate} style={{ marginBottom: 24, background: 'var(--bg-surface-hover)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 2, minWidth: 200 }}>
                <label className="form-label">Task Description</label>
                <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} required placeholder="What needs to be done?" />
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 150 }}>
                <label className="form-label">Deadline (Optional)</label>
                <input type="date" className="form-input" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', height: 42 }}>Save</button>
                <button type="button" className="btn btn-ghost" style={{ padding: '10px 20px', height: 42 }} onClick={() => setShowNew(false)}>Cancel</button>
              </div>
            </div>
          </form>
        )}

        {loading ? (
           <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {columns.map(col => (
              <div key={col.id} className="card" style={{ padding: 16, background: 'var(--bg-surface-hover)', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '4px 12px', background: col.bg, color: col.color, borderRadius: 'var(--radius-full)', width: 'fit-content', fontWeight: 600 }}>
                  {col.icon} {col.label}
                  <span style={{ marginLeft: 8, background: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: 10, fontSize: 12 }}>
                    {tasks.filter(t => t.status === col.id).length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tasks.filter(t => t.status === col.id).map(task => (
                    <div key={task.id} className="card" style={{ padding: 16, marginBottom: 0, cursor: 'default', borderLeft: task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done' ? '4px solid var(--error)' : '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 500, fontSize: 14, color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                          {task.title}
                        </div>
                        <button className="btn btn-ghost" style={{ padding: 4, color: 'var(--error)', opacity: 0.5 }} onClick={() => handleDelete(task.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      {task.deadline && (
                        <div style={{ fontSize: 12, marginTop: 8, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> Due: {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        {col.id !== 'todo' && (
                          <button className="btn btn-ghost" style={{ flex: 1, padding: '6px', fontSize: 12 }} onClick={() => handleMove(task, 'todo')}>
                            To Do
                          </button>
                        )}
                        {col.id !== 'in_progress' && (
                          <button className="btn btn-ghost" style={{ flex: 1, padding: '6px', fontSize: 12, color: 'var(--warning)', borderColor: 'var(--warning-bg)' }} onClick={() => handleMove(task, 'in_progress')}>
                            Start
                          </button>
                        )}
                        {col.id !== 'done' && (
                          <button className="btn btn-ghost" style={{ flex: 1, padding: '6px', fontSize: 12, color: 'var(--success)', borderColor: 'var(--success-bg)' }} onClick={() => handleMove(task, 'done')}>
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {tasks.filter(t => t.status === col.id).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13, border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                      No tasks here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
