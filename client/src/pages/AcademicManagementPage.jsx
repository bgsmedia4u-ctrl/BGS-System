import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { BookOpen, Users, Building, GraduationCap, Plus, Trash2, Check, X } from 'lucide-react';

export default function AcademicManagementPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(true);

  // Data
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  // Forms
  const [deptName, setDeptName] = useState('');
  
  const [courseName, setCourseName] = useState('');
  const [courseDeptId, setCourseDeptId] = useState('');

  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjType, setSubjType] = useState('Core');
  const [subjCourseId, setSubjCourseId] = useState('');

  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [assignYearId, setAssignYearId] = useState('');

  useEffect(() => {
    if (profile?.role === 'admin' && profile?.institution_id) {
      fetchData();
    }
  }, [profile]);

  async function fetchData() {
    setLoading(true);
    try {
      const instId = profile.institution_id;
      
      const [deptRes, courseRes, subjRes, assignRes, teachersRes, classRes, yearRes] = await Promise.all([
        supabase.from('departments').select('*').eq('institution_id', instId),
        supabase.from('courses').select('*, departments(name)').eq('institution_id', instId),
        supabase.from('subjects').select('*, courses(name, departments(name))').eq('institution_id', instId),
        supabase.from('teacher_assignments').select(`
          *,
          teacher:profiles!teacher_id(name),
          subject:subjects(name),
          class:classes(name),
          academic_year:academic_years(name)
        `).eq('institution_id', instId),
        supabase.from('profiles').select('*').eq('role', 'teacher'),
        supabase.from('classes').select('*').eq('institution_id', instId),
        supabase.from('academic_years').select('*').eq('institution_id', instId)
      ]);

      setDepartments(deptRes.data || []);
      setCourses(courseRes.data || []);
      setSubjects(subjRes.data || []);
      setAssignments(assignRes.data || []);
      setTeachers(teachersRes.data || []);
      setClasses(classRes.data || []);
      setAcademicYears(yearRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load academic data');
    } finally {
      setLoading(false);
    }
  }

  // --- Handlers ---
  const addDepartment = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('departments').insert([
        { institution_id: profile.institution_id, name: deptName }
      ]).select().single();
      if (error) throw error;
      setDepartments([...departments, data]);
      setDeptName('');
      toast.success('Department added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addCourse = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('courses').insert([
        { institution_id: profile.institution_id, department_id: courseDeptId, name: courseName }
      ]).select('*, departments(name)').single();
      if (error) throw error;
      setCourses([...courses, data]);
      setCourseName('');
      toast.success('Course added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addSubject = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('subjects').insert([
        { institution_id: profile.institution_id, course_id: subjCourseId, name: subjName, subject_code: subjCode, type: subjType }
      ]).select('*, courses(name, departments(name))').single();
      if (error) throw error;
      setSubjects([...subjects, data]);
      setSubjName('');
      setSubjCode('');
      toast.success('Subject added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addAssignment = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('teacher_assignments').insert([
        { 
          institution_id: profile.institution_id, 
          teacher_id: assignTeacherId, 
          subject_id: assignSubjectId, 
          class_id: assignClassId, 
          academic_year_id: assignYearId 
        }
      ]).select(`
        *,
        teacher:profiles!teacher_id(name),
        subject:subjects(name),
        class:classes(name),
        academic_year:academic_years(name)
      `).single();
      if (error) throw error;
      setAssignments([...assignments, data]);
      toast.success('Assignment added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteItem = async (table, id, stateSetter, stateArray) => {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      stateSetter(stateArray.filter(i => i.id !== id));
      toast.success('Deleted successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (profile?.role !== 'admin') {
    return <Layout><div className="p-8">Access denied. Admins only.</div></Layout>;
  }

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title"><BookOpen size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 8, color: 'var(--accent)' }}/> Academic Management</h1>
          <p className="page-subtitle">Manage Departments, Courses, Subjects, and Teacher Assignments</p>
        </div>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <button className={`tab ${activeTab === 'departments' ? 'active' : ''}`} onClick={() => setActiveTab('departments')} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'departments' ? '2px solid var(--accent)' : 'none', color: activeTab === 'departments' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Departments</button>
        <button className={`tab ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'courses' ? '2px solid var(--accent)' : 'none', color: activeTab === 'courses' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Courses</button>
        <button className={`tab ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => setActiveTab('subjects')} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'subjects' ? '2px solid var(--accent)' : 'none', color: activeTab === 'subjects' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Subjects</button>
        <button className={`tab ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'assignments' ? '2px solid var(--accent)' : 'none', color: activeTab === 'assignments' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Teacher Assignments</button>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading...</div>
        ) : (
          <>
            {/* DEPARTMENTS TAB */}
            {activeTab === 'departments' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
                <div className="card">
                  <h3 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-primary)' }}>Add Department</h3>
                  <form onSubmit={addDepartment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Name</label>
                      <input type="text" className="form-input" value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g. Science" required />
                    </div>
                    <button type="submit" className="btn btn-primary"><Plus size={16} /> Add Department</button>
                  </form>
                </div>
                <div className="card">
                  <h3 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-primary)' }}>Existing Departments</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.length === 0 && <tr><td colSpan="2" style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)' }}>No departments found</td></tr>}
                        {departments.map(d => (
                          <tr key={d.id}>
                            <td>{d.name}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => deleteItem('departments', d.id, setDepartments, departments)} className="btn btn-ghost" style={{ padding: 4, color: 'var(--error)' }}><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* COURSES TAB */}
            {activeTab === 'courses' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
                <div className="card">
                  <h3 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-primary)' }}>Add Course</h3>
                  <form onSubmit={addCourse} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Department</label>
                      <select className="form-input" value={courseDeptId} onChange={e => setCourseDeptId(e.target.value)} required>
                        <option value="">Select Department...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Name</label>
                      <input type="text" className="form-input" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="e.g. PCMB" required />
                    </div>
                    <button type="submit" className="btn btn-primary"><Plus size={16} /> Add Course</button>
                  </form>
                </div>
                <div className="card">
                  <h3 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-primary)' }}>Existing Courses</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Department</th>
                          <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)' }}>No courses found</td></tr>}
                        {courses.map(c => (
                          <tr key={c.id}>
                            <td>{c.name}</td>
                            <td>{c.departments?.name}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => deleteItem('courses', c.id, setCourses, courses)} className="btn btn-ghost" style={{ padding: 4, color: 'var(--error)' }}><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUBJECTS TAB */}
            {activeTab === 'subjects' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
                <div className="card">
                  <h3 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-primary)' }}>Add Subject</h3>
                  <form onSubmit={addSubject} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Course</label>
                      <select className="form-input" value={subjCourseId} onChange={e => setSubjCourseId(e.target.value)} required>
                        <option value="">Select Course...</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.departments?.name})</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Name</label>
                      <input type="text" className="form-input" value={subjName} onChange={e => setSubjName(e.target.value)} placeholder="e.g. Physics" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Code (Optional)</label>
                      <input type="text" className="form-input" value={subjCode} onChange={e => setSubjCode(e.target.value)} placeholder="e.g. PHY-101" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Type</label>
                      <select className="form-input" value={subjType} onChange={e => setSubjType(e.target.value)} required>
                        <option value="Core">Core</option>
                        <option value="Elective">Elective</option>
                        <option value="Language">Language</option>
                        <option value="Lab">Lab</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary"><Plus size={16} /> Add Subject</button>
                  </form>
                </div>
                <div className="card">
                  <h3 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-primary)' }}>Existing Subjects</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Code</th>
                          <th>Type</th>
                          <th>Course</th>
                          <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)' }}>No subjects found</td></tr>}
                        {subjects.map(s => (
                          <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>{s.subject_code || '-'}</td>
                            <td><span className={`badge ${s.type === 'Core' ? 'bg-primary' : 'bg-secondary'}`} style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{s.type}</span></td>
                            <td>{s.courses?.name}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => deleteItem('subjects', s.id, setSubjects, subjects)} className="btn btn-ghost" style={{ padding: 4, color: 'var(--error)' }}><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ASSIGNMENTS TAB */}
            {activeTab === 'assignments' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
                <div className="card">
                  <h3 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-primary)' }}>Assign Teacher</h3>
                  <form onSubmit={addAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Teacher</label>
                      <select className="form-input" value={assignTeacherId} onChange={e => setAssignTeacherId(e.target.value)} required>
                        <option value="">Select Teacher...</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Subject</label>
                      <select className="form-input" value={assignSubjectId} onChange={e => setAssignSubjectId(e.target.value)} required>
                        <option value="">Select Subject...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.courses?.name})</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Class</label>
                      <select className="form-input" value={assignClassId} onChange={e => setAssignClassId(e.target.value)} required>
                        <option value="">Select Class...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.stream})</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Academic Year</label>
                      <select className="form-input" value={assignYearId} onChange={e => setAssignYearId(e.target.value)} required>
                        <option value="">Select Year...</option>
                        {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary"><Plus size={16} /> Assign</button>
                  </form>
                </div>
                <div className="card">
                  <h3 style={{ marginTop: 0, marginBottom: 16, color: 'var(--text-primary)' }}>Current Assignments</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Teacher</th>
                          <th>Subject</th>
                          <th>Class</th>
                          <th>Year</th>
                          <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)' }}>No assignments found</td></tr>}
                        {assignments.map(a => (
                          <tr key={a.id}>
                            <td>{a.teacher?.name}</td>
                            <td>{a.subject?.name}</td>
                            <td>{a.class?.name}</td>
                            <td>{a.academic_year?.name}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => deleteItem('teacher_assignments', a.id, setAssignments, assignments)} className="btn btn-ghost" style={{ padding: 4, color: 'var(--error)' }}><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
