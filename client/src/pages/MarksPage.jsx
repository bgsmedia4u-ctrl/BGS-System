import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../api/supabase';
import Layout from '../components/Layout';
import { 
  getTestsByBatch, 
  getClassOptions, 
  createTest, 
  getStudentsByBatch, 
  getMarkEntries, 
  saveMarkEntries 
} from '../api/marksService';
import { pdfService } from '../api/pdfService';
import { 
  BookOpen, 
  Users, 
  Printer, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MarksPage() {
  const { user } = useAuth();
  
  // Views: 'BATCH_SELECT', 'ACTION_MENU', 'CREATE_TEST', 'ENTER_MARKS', 'PRINT_RESULTS'
  const [currentView, setCurrentView] = useState('BATCH_SELECT');
  
  const [stream, setStream] = useState('Science');
  const [year, setYear] = useState('1st Year');
  const [cls, setCls] = useState('');
  const [departments, setDepartments] = useState([]);
  const { profile } = useAuth();
  
  useEffect(() => {
    if (profile?.institution_id) {
      supabase.from('departments').select('name').eq('institution_id', profile.institution_id)
        .then(({ data }) => setDepartments(data || []));
    }
  }, [profile]);
  
  if (profile?.role === 'admin') {
    return (
      <Layout>
        <div className="page-body fade-in" style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
          <div className="card" style={{ maxWidth: 560, textAlign: 'center', padding: 44, border: '1px solid #FCA5A5', background: '#FFFBFB', borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <AlertCircle size={38} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#991B1B', marginBottom: 14 }}>Academic Marks Strictly Restricted</h2>
            <p style={{ color: 'var(--text-main)', fontSize: '0.98rem', lineHeight: 1.6, marginBottom: 24 }}>
              Under institutional pedagogical policy and data protection guidelines, administrative accounts are barred from viewing, modifying, or exporting student academic mark ledgers and assessment scores.
            </p>
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '14px 20px', borderRadius: 12, fontSize: '0.88rem', fontWeight: 600 }}>
              🛡️ Exclusive Access: Only authorized pedagogical teaching personnel directly conducting course evaluations hold authorization for examination ledgers.
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Data state
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Refresh tests when entering actions
  const loadTests = async () => {
    try {
      const data = await getTestsByBatch(stream, year, cls);
      setTests(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tests.');
    }
  };

  const loadStudents = async () => {
    try {
      const data = await getStudentsByBatch(stream, year, cls);
      setStudents(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students.');
    }
  };

  const handleBatchSelect = () => {
    if (!cls) {
      toast.error('Please select a class.');
      return;
    }
    setCurrentView('ACTION_MENU');
    loadTests();
    loadStudents();
  };

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {currentView !== 'BATCH_SELECT' && (
          <button 
            className="btn btn-ghost" 
            onClick={() => {
              if (currentView === 'ACTION_MENU') setCurrentView('BATCH_SELECT');
              else setCurrentView('ACTION_MENU');
            }}
            style={{ padding: 8 }}
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h1 className="page-title">Marks Entry</h1>
          <p className="page-subtitle">
            {currentView === 'BATCH_SELECT' 
              ? 'Select class batch to continue' 
              : `${stream} • ${year} • ${cls}`}
          </p>
        </div>
      </div>
      
      <div className="page-body fade-in">
        {currentView === 'BATCH_SELECT' && (
          <BatchSelectView 
            stream={stream} setStream={setStream}
            year={year} setYear={setYear}
            cls={cls} setCls={setCls}
            onContinue={handleBatchSelect}
            departments={departments}
          />
        )}
        
        {currentView === 'ACTION_MENU' && (
          <ActionMenuView onSelectView={setCurrentView} />
        )}

        {currentView === 'CREATE_TEST' && (
          <CreateTestView 
            stream={stream} year={year} cls={cls} userId={user?.id}
            onSuccess={() => {
              loadTests();
              setCurrentView('ACTION_MENU');
            }}
          />
        )}

        {currentView === 'ENTER_MARKS' && (
          <EnterMarksView 
            tests={tests} students={students}
          />
        )}

        {currentView === 'PRINT_RESULTS' && (
          <PrintResultsView 
            tests={tests} students={students} stream={stream} year={year} cls={cls}
          />
        )}
      </div>
    </Layout>
  );
}

// ─── VIEWS ───

function BatchSelectView({ stream, setStream, year, setYear, cls, setCls, onContinue, departments }) {
  const classOptions = getClassOptions(stream, year);
  
  // Auto-select first class if options change
  useEffect(() => {
    if (classOptions.length > 0 && !classOptions.includes(cls)) {
      setCls(classOptions[0]);
    }
  }, [classOptions, cls, setCls]);

  return (
    <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2 className="card-title" style={{ marginBottom: 20 }}>Select Batch</h2>
      
      <div className="form-group">
        <label className="form-label">Stream</label>
        <select className="form-select" value={stream} onChange={e => setStream(e.target.value)}>
          {departments && departments.length > 0 ? (
            departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)
          ) : (
            <>
              <option value="Science">Science</option>
              <option value="Commerce">Commerce</option>
            </>
          )}
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

function ActionMenuView({ onSelectView }) {
  const actions = [
    { id: 'CREATE_TEST', title: 'Create Test', icon: Plus, desc: 'Define a new test and subjects' },
    { id: 'ENTER_MARKS', title: 'Enter Marks', icon: BookOpen, desc: 'Input student marks for a test' },
    { id: 'PRINT_RESULTS', title: 'Print Results', icon: Printer, desc: 'Generate ranked results sheet' },
  ];

  return (
    <div className="stats-grid">
      {actions.map(action => (
        <div 
          key={action.id} 
          className="stat-card" 
          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12 }}
          onClick={() => onSelectView(action.id)}
        >
          <div className="stat-icon gold"><action.icon size={24} /></div>
          <div>
            <div className="card-title">{action.title}</div>
            <div className="card-description">{action.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreateTestView({ stream, year, cls, userId, onSuccess }) {
  const [testName, setTestName] = useState('');
  const [subjects, setSubjects] = useState([{ name: '', maxMarks: '' }]);
  const [selectedClasses, setSelectedClasses] = useState([cls]);
  const [loading, setLoading] = useState(false);
  const classOptions = getClassOptions(stream, year);

  const handleAddSubject = () => {
    setSubjects([...subjects, { name: '', maxMarks: '' }]);
  };

  const handleUpdateSubject = (idx, field, val) => {
    const updated = [...subjects];
    updated[idx][field] = val;
    setSubjects(updated);
  };

  const handleRemoveSubject = (idx) => {
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!testName.trim()) return toast.error('Test name is required.');
    
    const validSubjects = subjects.filter(s => s.name.trim() && s.maxMarks > 0);
    if (validSubjects.length === 0) return toast.error('Add at least one valid subject with max marks > 0.');
    
    if (selectedClasses.length === 0) return toast.error('Select at least one class for the test.');

    setLoading(true);
    try {
      // Create a test for each selected class
      for (const c of selectedClasses) {
        await createTest(testName, stream, year, c, validSubjects, userId);
      }
      toast.success(selectedClasses.length > 1 ? 'Tests created successfully for multiple classes!' : 'Test created successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to create test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2 className="card-title" style={{ marginBottom: 20 }}>Create New Test</h2>
      
      <div className="form-group">
        <label className="form-label">Test Name</label>
        <input 
          className="form-input" 
          placeholder="e.g. Unit Test 1" 
          value={testName}
          onChange={e => setTestName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Apply to Classes ({stream} - {year})</label>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
          {classOptions.map(c => (
            <label key={c} className="form-checkbox-group" style={{ cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                className="form-checkbox"
                checked={selectedClasses.includes(c)}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedClasses([...selectedClasses, c]);
                  } else {
                    setSelectedClasses(selectedClasses.filter(x => x !== c));
                  }
                }}
              />
              <span style={{ fontSize: 14 }}>{c}</span>
            </label>
          ))}
        </div>
        <p className="form-help">The test will be created for each selected class.</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label className="form-label">Subjects</label>
        <div className="dynamic-rows">
          {subjects.map((sub, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 12 }}>
              <input 
                className="form-input" 
                placeholder="Subject Name" 
                style={{ flex: 2 }}
                value={sub.name}
                onChange={e => handleUpdateSubject(idx, 'name', e.target.value)}
              />
              <input 
                type="number"
                className="form-input" 
                placeholder="Max Marks" 
                style={{ flex: 1 }}
                value={sub.maxMarks}
                onChange={e => handleUpdateSubject(idx, 'maxMarks', e.target.value)}
              />
              <button className="btn btn-ghost" onClick={() => handleRemoveSubject(idx)} style={{ color: 'var(--error)' }}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button className="add-row-btn" onClick={handleAddSubject}>
            <Plus size={16} /> Add Subject
          </button>
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreate} disabled={loading}>
        {loading ? 'Creating...' : 'Create Test'}
      </button>
    </div>
  );
}

function EnterMarksView({ tests, students }) {
  const [selectedTestId, setSelectedTestId] = useState('');
  const [markData, setMarkData] = useState({}); // { studentId: { subjectName: value, is_absent: boolean } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedTest = tests.find(t => t.id === selectedTestId);

  // Load existing entries when test changes
  useEffect(() => {
    if (!selectedTestId) return;
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const entries = await getMarkEntries(selectedTestId);
        const nextData = {};
        
        // Initialize with empty for all students
        students.forEach(st => {
          nextData[st.id] = { marks: {}, is_absent: false };
          selectedTest.subjects.forEach(sub => {
            nextData[st.id].marks[sub.name] = '';
          });
        });

        // Merge existing
        entries.forEach(e => {
          if (nextData[e.student_id]) {
            nextData[e.student_id].marks = { ...nextData[e.student_id].marks, ...e.marks };
            nextData[e.student_id].is_absent = e.is_absent;
          }
        });
        setMarkData(nextData);
      } catch (err) {
        toast.error('Failed to load marks.');
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [selectedTestId, students, selectedTest]);

  const handleMarkChange = (studentId, subjectName, value) => {
    setMarkData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: {
          ...prev[studentId].marks,
          [subjectName]: value
        }
      }
    }));
  };

  const handleAbsentChange = (studentId, checked) => {
    setMarkData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        is_absent: checked
      }
    }));
  };

  const handleSave = async () => {
    // Validate bounds
    for (const st of students) {
      if (markData[st.id]?.is_absent) continue; // skip validation if absent
      
      for (const sub of selectedTest.subjects) {
        const val = Number(markData[st.id]?.marks[sub.name]);
        if (val > sub.maxMarks || val < 0) {
          return toast.error(`Invalid mark for ${st.name} in ${sub.name}. Max is ${sub.maxMarks}.`);
        }
      }
    }

    setSaving(true);
    try {
      const entriesToSave = students.map(st => ({
        student_id: st.id,
        is_absent: markData[st.id].is_absent,
        marks: markData[st.id].is_absent ? {} : markData[st.id].marks // clear marks if absent
      }));
      
      await saveMarkEntries(selectedTestId, entriesToSave);
      toast.success('Marks saved successfully!');
    } catch (err) {
      toast.error('Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card">
        <label className="form-label">Select Test</label>
        <select className="form-select" value={selectedTestId} onChange={e => setSelectedTestId(e.target.value)}>
          <option value="">-- Choose Test --</option>
          {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {selectedTestId && !loading && students.length === 0 && (
        <div className="card empty-state">
          <Users className="empty-state-icon" size={48} />
          <h3 className="empty-state-title">No Students Found</h3>
          <p className="empty-state-text">Add students to this class in the database first.</p>
        </div>
      )}

      {selectedTestId && !loading && students.length > 0 && (
        <div className="card table-container marks-entry-container">
          <div className="table-responsive">
            <table className="table marks-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>Roll</th>
                  <th style={{ minWidth: 200 }}>Name</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Absent</th>
                  {selectedTest.subjects.map(sub => (
                    <th key={sub.name} style={{ textAlign: 'center' }}>
                      {sub.name} <br/> <span style={{ fontSize: 10, opacity: 0.7 }}>({sub.maxMarks})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(st => {
                  const rowData = markData[st.id] || { marks: {}, is_absent: false };
                  const isAbsent = rowData.is_absent;
                  return (
                    <tr key={st.id} className={isAbsent ? 'row-absent' : ''}>
                      <td style={{ color: 'var(--text-muted)' }}>{st.roll_number || '-'}</td>
                      <td style={{ fontWeight: 500 }}>{st.name}</td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          className="form-checkbox"
                          checked={isAbsent}
                          onChange={e => handleAbsentChange(st.id, e.target.checked)}
                        />
                      </td>
                      {selectedTest.subjects.map(sub => {
                        const val = rowData.marks[sub.name] || '';
                        const isOver = Number(val) > sub.maxMarks;
                        return (
                          <td key={sub.name} style={{ textAlign: 'center' }}>
                            <input 
                              type="number"
                              className={`form-input mark-input ${isOver ? 'mark-error' : ''}`}
                              value={val}
                              onChange={e => handleMarkChange(st.id, sub.name, e.target.value)}
                              disabled={isAbsent}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save All Marks'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PrintResultsView({ tests, students, stream, year, cls }) {
  const [selectedTestId, setSelectedTestId] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedTest = tests.find(t => t.id === selectedTestId);
  const totalMaxMarks = selectedTest?.subjects.reduce((sum, sub) => sum + Number(sub.maxMarks), 0) || 0;

  useEffect(() => {
    if (!selectedTestId) return;
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const data = await getMarkEntries(selectedTestId);
        setEntries(data);
      } catch (err) {
        toast.error('Failed to load results.');
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [selectedTestId]);

  // Merge students with entries, calculate totals, and sort
  const getRankedResults = () => {
    if (!selectedTest) return [];
    
    const results = students.map(st => {
      const entry = entries.find(e => e.student_id === st.id);
      let total = 0;
      const parsedMarks = {};
      
      if (entry && !entry.is_absent) {
        Object.entries(entry.marks || {}).forEach(([sub, val]) => {
          const num = Number(val);
          parsedMarks[sub] = num;
          total += num;
        });
      }

      return {
        ...st,
        marks: parsedMarks,
        is_absent: entry?.is_absent || false,
        total_marks: entry?.is_absent ? 0 : total,
        has_entry: !!entry
      };
    });

    // Sort: total desc (absent last), then name asc
    results.sort((a, b) => {
      if (a.is_absent && !b.is_absent) return 1;
      if (!a.is_absent && b.is_absent) return -1;
      if (b.total_marks !== a.total_marks) return b.total_marks - a.total_marks;
      return a.name.localeCompare(b.name);
    });

    return results;
  };

  const rankedResults = getRankedResults();

  const handlePrint = () => {
    window.print();
  };

  const handlePdf = () => {
    const batchLabel = `${stream} - ${year} - ${cls}`;
    pdfService.generateMarksReport(selectedTest.name, batchLabel, selectedTest.subjects, rankedResults, totalMaxMarks);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card no-print">
        <label className="form-label">Select Test to Print</label>
        <select className="form-select" value={selectedTestId} onChange={e => setSelectedTestId(e.target.value)}>
          <option value="">-- Choose Test --</option>
          {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {selectedTestId && !loading && (
        <div className="card print-container table-container" style={{ padding: 32 }}>
          <div className="print-header" style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>BGS Public School & PU College</h2>
            <h3 style={{ color: 'var(--navy-700)', marginBottom: 4 }}>Test Results: {selectedTest.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {stream} | {year} | {cls}
            </p>
          </div>

          <div className="table-responsive">
            <table className="table marks-table print-table">
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>Rank</th>
                  <th style={{ width: 60 }}>Roll</th>
                  <th style={{ minWidth: 200 }}>Student Name</th>
                  {selectedTest.subjects.map(sub => (
                    <th key={sub.name} style={{ textAlign: 'center' }}>
                      {sub.name} <br/> <span style={{ fontSize: 10, opacity: 0.8 }}>({sub.maxMarks})</span>
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    Total <br/> <span style={{ fontSize: 10, opacity: 0.8 }}>({totalMaxMarks})</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rankedResults.map((st, idx) => {
                  const rank = st.is_absent ? '-' : idx + 1;
                  return (
                    <tr key={st.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--gold-500)' }}>{rank}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{st.roll_number || '-'}</td>
                      <td style={{ fontWeight: 500 }}>{st.name}</td>
                      
                      {selectedTest.subjects.map(sub => {
                        let cellContent = '-';
                        if (st.is_absent) cellContent = 'AB';
                        else if (st.has_entry) cellContent = st.marks[sub.name] ?? '-';
  
                        return (
                          <td key={sub.name} style={{ textAlign: 'center', color: st.is_absent ? 'var(--error)' : 'inherit' }}>
                            {cellContent}
                          </td>
                        );
                      })}
                      
                      <td style={{ textAlign: 'center', fontWeight: 700, background: 'var(--bg-secondary)' }}>
                        {st.is_absent ? 'AB' : st.total_marks}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={handlePdf}>
              Download PDF
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} /> Print Sheet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

