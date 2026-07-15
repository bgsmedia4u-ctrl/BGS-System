import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReportByDate, saveReport } from '../api/reportService';
import Layout from '../components/Layout';
import {
  Save,
  Send,
  Plus,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

function DynamicList({ title, data, onChange, disabled, placeholderCount }) {
  const addRow = () => {
    if (data.length >= 9) {
      toast.error('Maximum 9 classes allowed');
      return;
    }
    onChange([...data, { class_name: '', count: '' }]);
  };

  const updateRow = (idx, field, val) => {
    const updated = [...data];
    updated[idx][field] = val;
    onChange(updated);
  };

  const removeRow = (idx) => {
    onChange(data.filter((_, i) => i !== idx));
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-title" style={{ marginBottom: 12 }}>{title}</div>
      {data.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>No entries yet.</div>
      )}
      {data.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input 
              type="text" 
              className="form-input"
              placeholder="Class Name (e.g. 11 PCM)"
              value={item.class_name}
              onChange={(e) => updateRow(idx, 'class_name', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div style={{ width: 120 }}>
            <input 
              type="number" 
              className="form-input"
              placeholder={placeholderCount}
              value={item.count}
              onChange={(e) => updateRow(idx, 'count', e.target.value)}
              disabled={disabled}
            />
          </div>
          {!disabled && (
            <button className="btn btn-ghost" onClick={() => removeRow(idx)} style={{ color: 'var(--error)', padding: '10px' }}>
              <Trash2 size={18} />
            </button>
          )}
        </div>
      ))}
      {!disabled && data.length < 9 && (
        <button className="btn btn-secondary btn-sm" onClick={addRow}>
          <Plus size={14} /> Add Class
        </button>
      )}
    </div>
  );
}

function TopicsList({ title, data, onChange, disabled }) {
  const addRow = () => {
    if (data.length >= 10) {
      toast.error('Maximum 10 classes allowed');
      return;
    }
    onChange([...data, { class_name: '', topics: '' }]);
  };

  const updateRow = (idx, field, val) => {
    const updated = [...data];
    updated[idx][field] = val;
    onChange(updated);
  };

  const removeRow = (idx) => {
    onChange(data.filter((_, i) => i !== idx));
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-title" style={{ marginBottom: 12 }}>{title}</div>
      {data.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>No entries yet.</div>
      )}
      {data.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 120px' }}>
            <input 
              type="text" 
              className="form-input"
              placeholder="Class (e.g. 10A)"
              value={item.class_name}
              onChange={(e) => updateRow(idx, 'class_name', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div style={{ flex: '3 1 200px' }}>
            <textarea 
              className="form-textarea"
              style={{ minHeight: '44px', padding: '10px 14px' }}
              placeholder="Topics covered..."
              value={item.topics}
              onChange={(e) => updateRow(idx, 'topics', e.target.value)}
              disabled={disabled}
            />
          </div>
          {!disabled && (
            <button 
              type="button" 
              className="btn btn-ghost" 
              style={{ color: 'var(--error)', padding: 10 }}
              onClick={() => removeRow(idx)}
              title="Remove"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
      {!disabled && data.length < 10 && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={addRow} style={{ marginTop: 8 }}>
          <Plus size={14} /> Add Class
        </button>
      )}
    </div>
  );
}

function NonTeachingList({ data, onChange, disabled }) {
  const updateRow = (idx, val) => {
    const updated = [...data];
    updated[idx].task = val;
    onChange(updated);
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      {data.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 100, paddingTop: 10, fontWeight: 500 }}>
            {item.day}
          </div>
          <div style={{ flex: 1 }}>
            <textarea 
              className="form-textarea"
              style={{ minHeight: '44px', padding: '10px 14px' }}
              placeholder={`Tasks for ${item.day}...`}
              value={item.task}
              onChange={(e) => updateRow(idx, e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      ))}
    </div>
  );
}


export default function ReportFormPage() {
  const { dateParam } = useParams(); // changed from weekStart
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [reportDate, setReportDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
  const [reportId, setReportId] = useState(null);
  const [status, setStatus] = useState('draft');
  const [subject, setSubject] = useState('');

  // Last Week
  const [topicsCovered, setTopicsCovered] = useState([]);
  const [isNonTeaching, setIsNonTeaching] = useState(false);
  const [nonTeachingTasks, setNonTeachingTasks] = useState([
    { day: 'Monday', task: '' },
    { day: 'Tuesday', task: '' },
    { day: 'Wednesday', task: '' },
    { day: 'Thursday', task: '' },
    { day: 'Friday', task: '' },
    { day: 'Saturday', task: '' }
  ]);
  const [isOnSchedule, setIsOnSchedule] = useState(true);
  const [challenges, setChallenges] = useState('');

  // CET
  const [skipCet, setSkipCet] = useState(false);
  const [cetBook, setCetBook] = useState('');
  const [cetQuestions, setCetQuestions] = useState([]);
  const [cetTests, setCetTests] = useState([]);
  const [cetDoubt, setCetDoubt] = useState([]);

  // NEET
  const [skipNeet, setSkipNeet] = useState(false);
  const [neetBook, setNeetBook] = useState('');
  const [neetQuestions, setNeetQuestions] = useState([]);
  const [neetTests, setNeetTests] = useState([]);
  const [neetDoubt, setNeetDoubt] = useState([]);

  // JEE
  const [skipJee, setSkipJee] = useState(false);
  const [jeeBook, setJeeBook] = useState('');
  const [jeeQuestions, setJeeQuestions] = useState([]);
  const [jeeTests, setJeeTests] = useState([]);
  const [jeeDoubt, setJeeDoubt] = useState([]);

  useEffect(() => {
    if (user) {
      fetchReport(reportDate);
    }
  }, [reportDate, user]);

  async function fetchReport(targetDate) {
    setLoading(true);
    try {
      const data = await getReportByDate(user.id, targetDate);

      if (data) {
        setReportId(data.id);
        setStatus(data.status);
        setSubject(data.subject || '');
        
        let parsedTopics = [];
        let parsedIsNonTeaching = false;
        let parsedNonTeachingTasks = [
          { day: 'Monday', task: '' },
          { day: 'Tuesday', task: '' },
          { day: 'Wednesday', task: '' },
          { day: 'Thursday', task: '' },
          { day: 'Friday', task: '' },
          { day: 'Saturday', task: '' }
        ];

        try {
          if (data.topics_covered) {
            const parsed = JSON.parse(data.topics_covered);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.isNonTeaching !== undefined) {
              parsedIsNonTeaching = parsed.isNonTeaching;
              if (parsed.tasks && Array.isArray(parsed.tasks)) {
                parsedNonTeachingTasks = parsed.tasks;
              }
            } else if (Array.isArray(parsed)) {
              parsedTopics = parsed;
            } else {
              parsedTopics = [{ class_name: '', topics: data.topics_covered }];
            }
          }
        } catch (e) {
          parsedTopics = [{ class_name: '', topics: data.topics_covered }];
        }
        setTopicsCovered(parsedTopics);
        setIsNonTeaching(parsedIsNonTeaching);
        setNonTeachingTasks(parsedNonTeachingTasks);

        setIsOnSchedule(data.is_on_schedule ?? true);
        setChallenges(data.challenges || '');

        setSkipCet(data.skip_cet ?? false);
        setCetBook(data.cet_book || '');
        setCetQuestions(data.cet_questions || []);
        setCetTests(data.cet_tests || []);
        setCetDoubt(data.cet_doubt || []);

        setSkipNeet(data.skip_neet ?? false);
        setNeetBook(data.neet_book || '');
        setNeetQuestions(data.neet_questions || []);
        setNeetTests(data.neet_tests || []);
        setNeetDoubt(data.neet_doubt || []);

        setSkipJee(data.skip_jee ?? false);
        setJeeBook(data.jee_book || '');
        setJeeQuestions(data.jee_questions || []);
        setJeeTests(data.jee_tests || []);
        setJeeDoubt(data.jee_doubt || []);
      } else {
        // Reset form for new date
        setReportId(null);
        setStatus('draft');
        setSubject('');
        
        setTopicsCovered([]);
        setIsNonTeaching(false);
        setNonTeachingTasks([
          { day: 'Monday', task: '' },
          { day: 'Tuesday', task: '' },
          { day: 'Wednesday', task: '' },
          { day: 'Thursday', task: '' },
          { day: 'Friday', task: '' },
          { day: 'Saturday', task: '' }
        ]);
        setIsOnSchedule(true);
        setChallenges('');

        setSkipCet(false);
        setCetBook('');
        setCetQuestions([]);
        setCetTests([]);
        setCetDoubt([]);

        setSkipNeet(false);
        setNeetBook('');
        setNeetQuestions([]);
        setNeetTests([]);
        setNeetDoubt([]);

        setSkipJee(false);
        setJeeBook('');
        setJeeQuestions([]);
        setJeeTests([]);
        setJeeDoubt([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load report for this date');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (newStatus = 'draft') => {
    if (status === 'submitted') return; // Cannot edit
    
    setSaving(true);
    try {
      let topicsToSave = JSON.stringify(topicsCovered);
      if (isNonTeaching) {
        topicsToSave = JSON.stringify({ isNonTeaching: true, tasks: nonTeachingTasks });
      }

      const payload = {
        user_id: user.id,
        report_date: reportDate,
        subject: subject,
        status: newStatus,
        topics_covered: topicsToSave,
        is_on_schedule: isOnSchedule,
        challenges: challenges,
        
        skip_cet: skipCet,
        cet_book: cetBook,
        cet_questions: cetQuestions,
        cet_tests: cetTests,
        cet_doubt: cetDoubt,

        skip_neet: skipNeet,
        neet_book: neetBook,
        neet_questions: neetQuestions,
        neet_tests: neetTests,
        neet_doubt: neetDoubt,

        skip_jee: skipJee,
        jee_book: jeeBook,
        jee_questions: jeeQuestions,
        jee_tests: jeeTests,
        jee_doubt: jeeDoubt,
      };

      if (newStatus === 'submitted') {
        payload.submitted_at = new Date().toISOString();
      }

      const data = await saveReport(payload, reportId);
      if (!reportId) {
        setReportId(data.id);
      }

      setStatus(newStatus);

      if (newStatus === 'submitted') {
        toast.success('Report submitted successfully!');
        navigate('/dashboard');
      } else {
        toast.success('Draft saved successfully');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const isReadOnly = status === 'submitted';

  if (loading && !reportId) {
    return (
      <Layout>
        <div className="loading-spinner" style={{ minHeight: '60vh' }}>
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Weekly Update</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <span className="badge badge-pending">BGS Sidlaghatta</span>
            {status === 'submitted' ? (
              <span className="badge badge-submitted">Submitted</span>
            ) : (
              <span className="badge badge-draft">Draft</span>
            )}
          </div>
        </div>
        
        {!isReadOnly && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => handleSave('draft')} disabled={saving}>
              <Save size={16} /> Save Draft
            </button>
            <button className="btn btn-primary" onClick={() => handleSave('submitted')} disabled={saving}>
              <Send size={16} /> Submit
            </button>
          </div>
        )}
      </div>

      <div className="page-body fade-in">
        {isReadOnly && (
          <div style={{ padding: 16, background: 'var(--status-warning-bg)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: 8, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--status-warning-text)' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: 14 }}>This report has been submitted and cannot be edited.</span>
          </div>
        )}

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} /> Select Report Date
              </label>
              <input 
                type="date" 
                className="form-input" 
                value={reportDate} 
                onChange={(e) => setReportDate(e.target.value)}
                disabled={isReadOnly}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Teacher Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={user?.user_metadata?.full_name || user?.user_metadata?.name || 'Teacher'}
                disabled
                style={{ opacity: 0.7 }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Subject Taught</label>
              <input 
                type="text" 
                className="form-input" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Physics, Chemistry..."
              />
            </div>
          </div>
        </div>

        {/* 1. Last Week Section */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 className="card-title" style={{ fontSize: 18, margin: 0, color: 'var(--gold-500)' }}>Last Week Section</h2>
            <label className="form-checkbox-group" style={{ cursor: isReadOnly ? 'not-allowed' : 'pointer', background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: 6 }}>
              <input 
                type="checkbox" 
                className="form-checkbox"
                checked={isNonTeaching}
                onChange={(e) => setIsNonTeaching(e.target.checked)}
                disabled={isReadOnly}
              />
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>Non-Teaching Staff? (Day-wise Entry)</span>
            </label>
          </div>
          
          {isNonTeaching ? (
            <NonTeachingList 
              data={nonTeachingTasks} 
              onChange={setNonTeachingTasks} 
              disabled={isReadOnly} 
            />
          ) : (
            <TopicsList 
              title="Chapters / Topics Covered (Class Wise)" 
              data={topicsCovered} 
              onChange={setTopicsCovered} 
              disabled={isReadOnly} 
            />
          )}
          <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
            <label className="form-checkbox-group" style={{ cursor: isReadOnly ? 'not-allowed' : 'pointer' }}>
              <input 
                type="checkbox" 
                className="form-checkbox"
                checked={isOnSchedule}
                onChange={(e) => setIsOnSchedule(e.target.checked)}
                disabled={isReadOnly}
              />
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>Is the syllabus on schedule?</span>
            </label>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Challenges Last Week</label>
            <textarea 
              className="form-textarea" 
              value={challenges} 
              onChange={(e) => setChallenges(e.target.value)}
              disabled={isReadOnly}
              placeholder="Any issues with attendance, understanding, etc."
            />
          </div>
        </div>

        {/* 2. CET Section */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 className="card-title" style={{ fontSize: 18, margin: 0, color: 'var(--gold-500)' }}>CET Section</h2>
            <label className="form-checkbox-group" style={{ cursor: isReadOnly ? 'not-allowed' : 'pointer', background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: 6 }}>
              <input 
                type="checkbox" 
                className="form-checkbox"
                checked={skipCet}
                onChange={(e) => setSkipCet(e.target.checked)}
                disabled={isReadOnly}
              />
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>Don't take CET? (Skip)</span>
            </label>
          </div>
          
          {!skipCet && (
            <div className="fade-in">
              <div className="form-group">
                <label className="form-label">Book / Source Referred</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={cetBook} 
                  onChange={(e) => setCetBook(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. NCERT, MTG..."
                />
              </div>

              <DynamicList title="1. No. of Questions Done" data={cetQuestions} onChange={setCetQuestions} disabled={isReadOnly} placeholderCount="No. Questions" />
              <DynamicList title="2. Tests Conducted" data={cetTests} onChange={setCetTests} disabled={isReadOnly} placeholderCount="No. Tests" />
              <DynamicList title="3. Doubt-Solving Classes" data={cetDoubt} onChange={setCetDoubt} disabled={isReadOnly} placeholderCount="No. Classes" />
            </div>
          )}
        </div>

        {/* 3. NEET Section */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 className="card-title" style={{ fontSize: 18, margin: 0, color: 'var(--gold-500)' }}>NEET Section</h2>
            <label className="form-checkbox-group" style={{ cursor: isReadOnly ? 'not-allowed' : 'pointer', background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: 6 }}>
              <input 
                type="checkbox" 
                className="form-checkbox"
                checked={skipNeet}
                onChange={(e) => setSkipNeet(e.target.checked)}
                disabled={isReadOnly}
              />
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>Don't take NEET? (Skip)</span>
            </label>
          </div>
          
          {!skipNeet && (
            <div className="fade-in">
              <div className="form-group">
                <label className="form-label">Book / Source Referred</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={neetBook} 
                  onChange={(e) => setNeetBook(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Allen Modules..."
                />
              </div>

              <DynamicList title="1. No. of Questions Done" data={neetQuestions} onChange={setNeetQuestions} disabled={isReadOnly} placeholderCount="No. Questions" />
              <DynamicList title="2. Tests Conducted" data={neetTests} onChange={setNeetTests} disabled={isReadOnly} placeholderCount="No. Tests" />
              <DynamicList title="3. Doubt-Solving Classes" data={neetDoubt} onChange={setNeetDoubt} disabled={isReadOnly} placeholderCount="No. Classes" />
            </div>
          )}
        </div>

        {/* 4. JEE Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 className="card-title" style={{ fontSize: 18, margin: 0, color: 'var(--gold-500)' }}>JEE Section</h2>
            <label className="form-checkbox-group" style={{ cursor: isReadOnly ? 'not-allowed' : 'pointer', background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: 6 }}>
              <input 
                type="checkbox" 
                className="form-checkbox"
                checked={skipJee}
                onChange={(e) => setSkipJee(e.target.checked)}
                disabled={isReadOnly}
              />
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>Don't take JEE? (Skip)</span>
            </label>
          </div>
          
          {!skipJee && (
            <div className="fade-in">
              <div className="form-group">
                <label className="form-label">Book / Source Referred</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={jeeBook} 
                  onChange={(e) => setJeeBook(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. HC Verma..."
                />
              </div>

              <DynamicList title="1. No. of Questions Done" data={jeeQuestions} onChange={setJeeQuestions} disabled={isReadOnly} placeholderCount="No. Questions" />
              <DynamicList title="2. Tests Conducted" data={jeeTests} onChange={setJeeTests} disabled={isReadOnly} placeholderCount="No. Tests" />
              <DynamicList title="3. Doubt-Solving Classes" data={jeeDoubt} onChange={setJeeDoubt} disabled={isReadOnly} placeholderCount="No. Classes" />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

