import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSyllabus, updateSyllabusProgress, createSyllabusModule } from '../api/syllabusService';
import Layout from '../components/Layout';
import { BookOpenCheck, Check, Search, Plus, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SyllabusTrackerPage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [stream, setStream] = useState('Science');
  const [year, setYear] = useState('1st Year');
  const [cls, setCls] = useState('Class A');
  const [subject, setSubject] = useState(profile?.subject || 'All Subjects');

  // Admin Create Mode
  const [showCreate, setShowCreate] = useState(false);
  const [newChapter, setNewChapter] = useState('');
  const [newSubject, setNewSubject] = useState(profile?.subject || '');

  useEffect(() => {
    if (profile?.subject) {
      setSubject(profile.subject);
      setNewSubject(profile.subject);
    } else {
      setSubject('All Subjects');
    }
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [stream, year, cls, subject]);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await getSyllabus(stream, year, cls);
      setModules(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load syllabus');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleProgress(moduleId, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    try {
      await updateSyllabusProgress(moduleId, user.id, newStatus);
      // Optimistic update
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, progress: { status: newStatus } } : m));
      toast.success(newStatus === 'completed' ? 'Marked as completed' : 'Marked as not started');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update progress');
    }
  }

  async function handleCreateModule(e) {
    e.preventDefault();
    if (!newChapter.trim()) return;
    const targetSubject = newSubject.trim() || subject;
    if (!targetSubject || targetSubject === 'All Subjects') {
      toast.error('Please specify the subject for this chapter');
      return;
    }
    try {
      const newMod = await createSyllabusModule({
        stream, year, class: cls, subject: targetSubject, chapter_name: newChapter.trim(), created_by: user.id
      }, profile.role);
      
      setModules([...modules, { ...newMod, progress: { status: 'not_started' } }]);
      setNewChapter('');
      setShowCreate(false);
      toast.success('Chapter added to syllabus');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create chapter');
    }
  }

  const standardSubjects = ['All Subjects', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Economics', 'Business Studies', 'Computer Science', 'English', 'Kannada'];
  const availableSubjects = Array.from(new Set([...standardSubjects, ...modules.map(m => m.subject).filter(Boolean)]));
  const filteredModules = subject && subject !== 'All Subjects' ? modules.filter(m => m.subject === subject) : modules;
  const completedCount = filteredModules.filter(m => m.progress?.status === 'completed').length;
  const progressPercent = filteredModules.length > 0 ? Math.round((completedCount / filteredModules.length) * 100) : 0;

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title"><BookOpenCheck size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 8, color: 'var(--accent)' }}/> Syllabus Tracker</h1>
          <p className="page-subtitle">Track your coverage across chapters</p>
        </div>
        {isAdmin && !showCreate && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Chapter
          </button>
        )}
      </div>

      <div className="page-body fade-in">
        {/* Filters */}
        <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Stream</label>
            <select className="form-input" value={stream} onChange={e => setStream(e.target.value)}>
              <option value="Science">Science</option>
              <option value="Commerce">Commerce</option>
              <option value="Arts">Arts</option>
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
              <option value="Class A">Class A</option>
              <option value="Class B">Class B</option>
              <option value="FTB-1">FTB-1</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Subject</label>
            <select className="form-input" value={subject} onChange={e => setSubject(e.target.value)}>
              {availableSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Admin Create Form */}
        {isAdmin && showCreate && (
          <form className="card" onSubmit={handleCreateModule} style={{ marginBottom: 24, background: 'var(--bg-surface-hover)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontWeight: 600 }}>Add New Syllabus Chapter</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input type="text" className="form-input" placeholder="Subject (e.g. Mathematics)" value={newSubject} onChange={e => setNewSubject(e.target.value)} required style={{ minWidth: 180 }} />
              <input type="text" className="form-input" placeholder="Chapter Name (e.g. Trigonometry, Kinematics...)" value={newChapter} onChange={e => setNewChapter(e.target.value)} required style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary"><Save size={16}/> Save</button>
            </div>
          </form>
        )}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{subject} Progress</h3>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{progressPercent}% Completed</div>
          </div>
          
          {/* Progress Bar */}
          <div style={{ height: 8, background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, var(--accent-light), var(--accent-dark))', transition: 'width var(--transition)' }} />
          </div>

          {loading ? (
             <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : filteredModules.length > 0 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {filteredModules.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 500 }}>{m.chapter_name}</div>
                  <button 
                    onClick={() => handleToggleProgress(m.id, m.progress.status)}
                    style={{ 
                      width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: `2px solid ${m.progress.status === 'completed' ? 'var(--success)' : 'var(--border)'}`,
                      background: m.progress.status === 'completed' ? 'var(--success)' : 'transparent',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all var(--transition)'
                    }}
                  >
                    {m.progress.status === 'completed' && <Check size={16} />}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              No chapters defined for {subject} in this class.
              {isAdmin && <div>Click "Add Chapter" above to create one.</div>}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
