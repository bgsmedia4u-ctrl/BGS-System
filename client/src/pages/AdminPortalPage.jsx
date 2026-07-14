import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { pdfService } from '../api/pdfService';
import toast from 'react-hot-toast';
import { Shield, BarChart2, ClipboardList, Users, Megaphone, CheckCircle, FileEdit, XCircle, TrendingUp, Phone, Calendar, BookOpen, AlertTriangle, Trash2, Download, Send, Loader, Video, Plus, X, ClipboardCheck, PenLine } from 'lucide-react';
import { getWeekStart, formatDateISO, formatWeekLabel } from '../utils/week';

/* ── Cream & Maroon Design Tokens ── */
const C = {
  maroon900: '#2D0A0A',
  maroon800: '#4A1010',
  maroon700: '#7A1A1A',
  maroon600: '#931F1F',
  maroon500: '#A82424',
  maroon400: '#C23838',
  maroon300: '#D65A5A',
  cream100: '#FDF8F0',
  cream200: '#F7EEDC',
  cream300: '#EDD9B8',
  cream400: '#DFC49A',
  creamText: '#3D1A1A',
  mutedText: '#7A5050',
  border: '#E8D5C0',
};

/* ── Shared style helpers ── */
const s = {
  page: {
    minHeight: '100vh',
    background: C.cream100,
    fontFamily: "'Inter', sans-serif",
    color: C.creamText,
  },
  navbar: {
    background: `linear-gradient(135deg, ${C.maroon900}, ${C.maroon700})`,
    padding: '0 28px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 66,
    position: 'sticky', top: 0, zIndex: 200,
    boxShadow: '0 4px 20px rgba(45,10,10,0.4)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 14 },
  brandIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: 'rgba(253,248,240,0.12)',
    border: '1px solid rgba(253,248,240,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20,
  },
  brandText: { fontSize: 17, fontWeight: 700, color: C.cream100 },
  brandSub: { fontSize: 11, color: 'rgba(253,248,240,0.55)', marginTop: 1 },
  logoutBtn: {
    padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: 'rgba(253,248,240,0.1)', border: '1px solid rgba(253,248,240,0.2)',
    color: C.cream100, transition: 'all 0.2s',
  },
  body: { padding: '32px 28px', maxWidth: 1280, margin: '0 auto' },
  pageTitle: { fontSize: 26, fontWeight: 800, color: C.maroon700, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: C.mutedText },
  tabBar: {
    display: 'flex', gap: 0, marginBottom: 28,
    background: C.cream200, borderRadius: 12, padding: 4,
    border: `1px solid ${C.border}`, width: 'fit-content',
  },
  tab: (active) => ({
    padding: '9px 22px', borderRadius: 9, border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
    background: active ? `linear-gradient(135deg, ${C.maroon700}, ${C.maroon500})` : 'transparent',
    color: active ? C.cream100 : C.mutedText,
    boxShadow: active ? '0 2px 12px rgba(122,26,26,0.35)' : 'none',
  }),
  card: {
    background: '#fff',
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: 22,
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(122,26,26,0.06)',
  },
  sectionCard: (borderColor) => ({
    background: '#fff',
    border: `1px solid ${borderColor || C.border}`,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
  }),
  statCard: (color) => ({
    background: '#fff',
    border: `1px solid ${C.border}`,
    borderLeft: `4px solid ${color}`,
    borderRadius: 12,
    padding: '18px 20px',
    flex: 1,
    minWidth: 130,
    boxShadow: '0 2px 8px rgba(122,26,26,0.05)',
  }),
  label: { fontSize: 12, fontWeight: 600, color: C.mutedText, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 9, fontSize: 14,
    background: C.cream100, border: `1px solid ${C.border}`,
    color: C.creamText, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  badge: (type) => {
    const styles = {
      submitted: { background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' },
      draft: { background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' },
      missing: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' },
      admin: { background: `${C.maroon700}18`, color: C.maroon700, border: `1px solid ${C.maroon300}` },
    };
    return {
      ...(styles[type] || styles.admin),
      padding: '3px 10px', borderRadius: 20, fontSize: 12,
      fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5,
    };
  },
  th: {
    textAlign: 'left', padding: '11px 16px', fontSize: 11,
    fontWeight: 700, color: C.mutedText, textTransform: 'uppercase',
    letterSpacing: '0.05em', background: C.cream200,
    borderBottom: `1px solid ${C.border}`,
  },
  td: {
    padding: '14px 16px',
    borderBottom: `1px solid ${C.cream200}`,
    verticalAlign: 'middle',
    fontSize: 14,
  },
  primaryBtn: {
    padding: '9px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 700,
    background: `linear-gradient(135deg, ${C.maroon700}, ${C.maroon500})`,
    color: '#fff', boxShadow: '0 2px 10px rgba(122,26,26,0.35)',
    display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
  },
  ghostBtn: {
    padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
    background: C.cream200, border: `1px solid ${C.border}`,
    color: C.mutedText, transition: 'all 0.2s',
  },
  detailBox: (accent) => ({
    background: `${accent}08`,
    border: `1px solid ${accent}25`,
    borderLeft: `3px solid ${accent}`,
    borderRadius: 10, padding: 16, marginTop: 10,
  }),
  divider: { borderTop: `1px solid ${C.cream200}`, margin: '12px 0' },
};

export default function AdminPortalPage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  // Tabs: monitor | reports | teachers | announcements | meetings | attendance | tests
  const [activeTab, setActiveTab] = useState('monitor');

  // ── Monitor state ──
  const [teachers, setTeachers] = useState([]);
  const [dayReports, setDayReports] = useState([]);
  const [monitorLoading, setMonitorLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatDateISO(getWeekStart()));
  const [searchTerm, setSearchTerm] = useState('');

  // ── Reports state ──
  const [allReports, setAllReports] = useState([]);
  const [allLoading, setAllLoading] = useState(false);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // ── Teacher Profiles state ──
  const [profilesData, setProfilesData] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');

  // ── Announcements state ──
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnBody, setNewAnnBody] = useState('');
  const [annPosting, setAnnPosting] = useState(false);

  // ── Meetings state ──
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  
  const [meetTitle, setMeetTitle] = useState('');
  const [meetDesc, setMeetDesc] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetStart, setMeetStart] = useState('');
  const [meetEnd, setMeetEnd] = useState('');
  const [meetLoc, setMeetLoc] = useState('');
  const [meetAudience, setMeetAudience] = useState('all_staff');
  const [meetDept, setMeetDept] = useState('');
  const [meetAttendees, setMeetAttendees] = useState([]); // array of teacher_id
  const [meetSaving, setMeetSaving] = useState(false);

  // ── Attendance state ──
  const [attSessions, setAttSessions] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attDateFilter, setAttDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [attStreamFilter, setAttStreamFilter] = useState('');

  // ── Tests state ──
  const [adminTests, setAdminTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsStreamFilter, setTestsStreamFilter] = useState('');

  useEffect(() => {
    if (profile && profile.role !== 'admin') navigate('/dashboard');
  }, [profile]);

  useEffect(() => { fetchMonitor(selectedDate); }, [selectedDate]);

  useEffect(() => {
    if (activeTab === 'reports' && allReports.length === 0) fetchAllReports();
    if (activeTab === 'teachers' && profilesData.length === 0) fetchProfiles();
    if (activeTab === 'announcements' && announcements.length === 0) fetchAnnouncements();
    if (activeTab === 'meetings' && meetings.length === 0) fetchMeetings();
    if (activeTab === 'attendance' && attSessions.length === 0) fetchAttendanceSessions();
    if (activeTab === 'tests' && adminTests.length === 0) fetchAdminTests();
  }, [activeTab]);

  async function fetchMonitor(date) {
    setMonitorLoading(true);
    try {
      const [{ data: t, error: tE }, { data: r, error: rE }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'teacher').order('name'),
        supabase.from('weekly_reports').select('*').eq('report_date', date),
      ]);
      if (tE) throw tE; if (rE) throw rE;
      setTeachers(t || []);
      setDayReports(r || []);
    } catch (e) { toast.error('Failed to load monitor data'); }
    finally { setMonitorLoading(false); }
  }

  async function fetchAllReports() {
    setAllLoading(true);
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*, profiles(name, email, phone)')
        .order('report_date', { ascending: false });
      if (error) throw error;
      setAllReports(data || []);
    } catch (e) { toast.error('Failed to load reports'); }
    finally { setAllLoading(false); }
  }

  async function fetchProfiles() {
    setProfilesLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, weekly_reports(id, status, report_date)')
        .eq('role', 'teacher')
        .order('name');
      if (error) throw error;
      setProfilesData(data || []);
    } catch (e) { toast.error('Failed to load teacher profiles'); }
    finally { setProfilesLoading(false); }
  }

  async function fetchAnnouncements() {
    setAnnLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (e) { toast.error('Failed to load announcements'); }
    finally { setAnnLoading(false); }
  }

  async function fetchMeetings() {
    setMeetingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*, profiles(name)')
        .order('meeting_date', { ascending: false });
      if (error) throw error;
      setMeetings(data || []);
      if (profilesData.length === 0) {
        fetchProfiles();
      }
    } catch (e) {
      console.error('Meetings fetch error:', e);
      toast.error('Failed to load meetings'); 
    }
    finally { setMeetingsLoading(false); }
  }

  function openNewMeetingModal() {
    setEditingMeeting(null);
    setMeetTitle(''); setMeetDesc(''); setMeetDate(''); setMeetStart(''); setMeetEnd('');
    setMeetLoc(''); setMeetAudience('all_staff'); setMeetDept(''); setMeetAttendees([]);
    setShowMeetingModal(true);
  }

  async function openEditMeetingModal(m) {
    setEditingMeeting(m);
    setMeetTitle(m.title); setMeetDesc(m.description || ''); setMeetDate(m.meeting_date);
    setMeetStart(m.start_time.substring(0,5)); setMeetEnd(m.end_time.substring(0,5));
    setMeetLoc(m.location || ''); setMeetAudience(m.audience_type); setMeetDept(m.department || '');
    if (m.audience_type === 'individual') {
      const { data } = await supabase.from('meeting_attendees').select('teacher_id').eq('meeting_id', m.id);
      setMeetAttendees(data ? data.map(d => d.teacher_id) : []);
    } else {
      setMeetAttendees([]);
    }
    setShowMeetingModal(true);
  }

  async function saveMeeting() {
    if (!meetTitle || !meetDate || !meetStart || !meetEnd) return toast.error('Fill required fields');
    if (meetAudience === 'department' && !meetDept) return toast.error('Specify department');
    if (meetAudience === 'individual' && meetAttendees.length === 0) return toast.error('Select at least one teacher');
    
    setMeetSaving(true);
    try {
      const payload = {
        title: meetTitle, description: meetDesc, meeting_date: meetDate,
        start_time: meetStart, end_time: meetEnd, location: meetLoc,
        audience_type: meetAudience, department: meetDept,
        created_by: profile.id
      };
      let newMeetingId = null;

      if (editingMeeting) {
        const { error } = await supabase.from('meetings').update(payload).eq('id', editingMeeting.id);
        if (error) throw error;
        newMeetingId = editingMeeting.id;
        
        // Notify edit
        await supabase.from('announcements').insert({
          title: `Updated: ${meetTitle}`,
          body: `Meeting updated for ${meetDate} at ${meetStart}.`,
          posted_by: profile?.name || 'Admin',
        });
      } else {
        const { data, error } = await supabase.from('meetings').insert([payload]).select().single();
        if (error) throw error;
        newMeetingId = data.id;
        
        // Notify new
        await supabase.from('announcements').insert({
          title: `New Meeting: ${meetTitle}`,
          body: `A new meeting is scheduled for ${meetDate} at ${meetStart}. Location: ${meetLoc || 'TBA'}`,
          posted_by: profile?.name || 'Admin',
        });
      }

      // Handle attendees
      if (meetAudience === 'individual') {
        await supabase.from('meeting_attendees').delete().eq('meeting_id', newMeetingId);
        const attPayload = meetAttendees.map(tid => ({ meeting_id: newMeetingId, teacher_id: tid }));
        await supabase.from('meeting_attendees').insert(attPayload);
      }

      toast.success('Meeting saved!');
      setShowMeetingModal(false);
      fetchMeetings();
    } catch(e) { toast.error('Failed to save meeting'); }
    finally { setMeetSaving(false); }
  }

  async function toggleCancelMeeting(m) {
    const newStatus = m.status === 'scheduled' ? 'cancelled' : 'scheduled';
    try {
      const { error } = await supabase.from('meetings').update({ status: newStatus }).eq('id', m.id);
      if (error) throw error;
      if (newStatus === 'cancelled') {
        await supabase.from('announcements').insert({
          title: `Cancelled: ${m.title}`,
          body: `The meeting scheduled for ${m.meeting_date} has been cancelled.`,
          posted_by: profile?.name || 'Admin',
        });
      }
      toast.success(`Meeting ${newStatus}`);
      fetchMeetings();
    } catch(e) { toast.error('Failed to update status'); }
  }

  async function postAnnouncement() {
    if (!newAnnTitle.trim()) { toast.error('Title is required'); return; }
    setAnnPosting(true);
    try {
      const { error } = await supabase.from('announcements').insert({
        title: newAnnTitle.trim(),
        body: newAnnBody.trim(),
        posted_by: profile?.name || 'Admin',
      });
      if (error) throw error;
      toast.success('Announcement posted!');
      setNewAnnTitle('');
      setNewAnnBody('');
      fetchAnnouncements();
    } catch (e) { toast.error('Failed to post announcement'); }
    finally { setAnnPosting(false); }
  }

  async function deleteAnnouncement(id) {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Announcement deleted');
    } catch (e) { toast.error('Failed to delete'); }
  }

  async function fetchAttendanceSessions() {
    setAttLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*, attendance_records(id, student_id, is_absent)')
        .order('date', { ascending: false })
        .limit(100);
      if (error) throw error;
      setAttSessions(data || []);
    } catch (e) { toast.error('Failed to load attendance data'); }
    finally { setAttLoading(false); }
  }

  async function fetchAdminTests() {
    setTestsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setAdminTests(data || []);
    } catch (e) { toast.error('Failed to load tests'); }
    finally { setTestsLoading(false); }
  }

  async function handleLogout() {
    await logout();
    navigate('/admin-login');
  }

  function handleExportPdf(date) {
    const toExport = allReports.filter(r => r.report_date === date && r.status === 'submitted');
    if (!toExport.length) { toast.error('No submitted reports for this date'); return; }
    pdfService.generateWeeklyReport(toExport, date);
    toast.success('Generating PDF...');
  }

  // Computed
  const teacherStatuses = teachers.map(t => ({
    ...t, report: dayReports.find(r => r.user_id === t.id) || null,
  }));
  const filteredMonitor = teacherStatuses.filter(t =>
    (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const submitted = teacherStatuses.filter(t => t.report?.status === 'submitted').length;
  const draft = teacherStatuses.filter(t => t.report?.status === 'draft').length;
  const missing = teacherStatuses.filter(t => !t.report).length;

  const reportsByDate = allReports.reduce((acc, r) => {
    if (filterTeacher && !(r.profiles?.name || '').toLowerCase().includes(filterTeacher.toLowerCase())) return acc;
    if (!acc[r.report_date]) acc[r.report_date] = [];
    acc[r.report_date].push(r);
    return acc;
  }, {});

  const filteredProfiles = profilesData.filter(p =>
    (p.name || '').toLowerCase().includes(profileSearch.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(profileSearch.toLowerCase())
  );

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'A';
  const avatarImg = user?.user_metadata?.avatar_url;

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── NAVBAR ── */}
      <nav style={s.navbar}>
        <div style={s.brand}>
          <div style={s.brandIcon}><Shield size={20} /></div>
          <div>
            <div style={s.brandText}>BGS Admin Portal</div>
            <div style={s.brandSub}>Shidlaghatta · Management Access</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.cream100 }}>{profile?.name || 'Admin'}</div>
            <div style={{ fontSize: 11, color: 'rgba(253,248,240,0.5)' }}>Administrator</div>
          </div>
          {avatarImg
            ? <img src={avatarImg} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(253,248,240,0.3)' }} referrerPolicy="no-referrer" />
            : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(253,248,240,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cream100, fontWeight: 700 }}>{initials}</div>
          }
          <button style={s.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div style={s.body}>
        <div style={{ marginBottom: 26 }}>
          <h1 style={s.pageTitle}>Teacher Monitoring Center</h1>
          <p style={s.pageSubtitle}>Monitor all teachers' weekly submissions, view full reports and download PDFs</p>
        </div>

        {/* TABS */}
        <div style={{ ...s.tabBar, flexWrap: 'wrap' }}>
          <button style={s.tab(activeTab === 'monitor')} onClick={() => setActiveTab('monitor')}><BarChart2 size={16} style={{marginRight: 6}} /> Weekly Monitor</button>
          <button style={s.tab(activeTab === 'reports')} onClick={() => setActiveTab('reports')}><ClipboardList size={16} style={{marginRight: 6}} /> All Reports</button>
          <button style={s.tab(activeTab === 'teachers')} onClick={() => setActiveTab('teachers')}><Users size={16} style={{marginRight: 6}} /> Teacher Profiles</button>
          <button style={s.tab(activeTab === 'announcements')} onClick={() => setActiveTab('announcements')}><Megaphone size={16} style={{marginRight: 6}} /> Announcements</button>
          <button style={s.tab(activeTab === 'meetings')} onClick={() => setActiveTab('meetings')}><Calendar size={16} style={{marginRight: 6}} /> Meetings</button>
          <button style={s.tab(activeTab === 'attendance')} onClick={() => setActiveTab('attendance')}><ClipboardCheck size={16} style={{marginRight: 6}} /> Attendance</button>
          <button style={s.tab(activeTab === 'tests')} onClick={() => setActiveTab('tests')}><PenLine size={16} style={{marginRight: 6}} /> Tests</button>
        </div>

        {/* ══ TAB 1: WEEKLY MONITOR ══ */}
        {activeTab === 'monitor' && (
          <>
            {/* Controls */}
            <div style={{ ...s.card, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={s.label}>Monitoring Week</div>
                <input 
                  type="date" 
                  style={s.input} 
                  value={selectedDate} 
                  onChange={e => {
                    if (e.target.value) {
                      setSelectedDate(formatDateISO(getWeekStart(new Date(e.target.value))));
                    }
                  }} 
                />
                <div style={{ fontSize: 12, color: C.mutedText, marginTop: 4, fontWeight: 500 }}>
                  Week: {formatWeekLabel(selectedDate)}
                </div>
              </div>
              <div style={{ flex: 3, minWidth: 220 }}>
                <div style={s.label}>Search Teachers</div>
                <input type="text" style={s.input} placeholder="Name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={s.statCard(C.maroon600)}>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.maroon700 }}>{teachers.length}</div>
                <div style={{ fontSize: 12, color: C.mutedText, marginTop: 4, fontWeight: 600 }}><span style={{display:"flex", alignItems:"center", gap:4}}><Users size={14} /> Total Teachers</span></div>
              </div>
              <div style={s.statCard('#059669')}>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#065F46' }}>{submitted}</div>
                <div style={{ fontSize: 12, color: C.mutedText, marginTop: 4, fontWeight: 600 }}><><CheckCircle size={14} /> Submitted</></div>
              </div>
              <div style={s.statCard('#D97706')}>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#92400E' }}>{draft}</div>
                <div style={{ fontSize: 12, color: C.mutedText, marginTop: 4, fontWeight: 600 }}><><FileEdit size={14} /> Draft</></div>
              </div>
              <div style={s.statCard('#DC2626')}>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#991B1B' }}>{missing}</div>
                <div style={{ fontSize: 12, color: C.mutedText, marginTop: 4, fontWeight: 600 }}><><XCircle size={14} /> Not Started</></div>
              </div>
              <div style={{ ...s.statCard(C.maroon400), background: `linear-gradient(135deg, ${C.maroon900}, ${C.maroon700})` }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: C.cream100 }}>
                  {teachers.length > 0 ? Math.round((submitted / teachers.length) * 100) : 0}%
                </div>
                <div style={{ fontSize: 12, color: 'rgba(253,248,240,0.6)', marginTop: 4, fontWeight: 600 }}><TrendingUp size={14} style={{marginRight:4}} /> Completion Rate</div>
              </div>
            </div>

            {/* Table */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.maroon700 }}>Submission Status for Week ({formatWeekLabel(selectedDate)})</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={s.badge('submitted')}><CheckCircle size={14} /> {submitted}</span>
                  <span style={s.badge('draft')}><FileEdit size={14} /> {draft}</span>
                  <span style={s.badge('missing')}><XCircle size={14} /> {missing}</span>
                </div>
              </div>
              {monitorLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: C.mutedText }}>Loading...</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 10, overflow: 'hidden' }}>
                    <thead>
                      <tr>
                        {['#', 'Teacher Name', 'Contact', 'Subject', 'Status', 'Topics Covered'].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMonitor.map((t, i) => (
                        <tr key={t.id}
                          style={{ background: i % 2 === 0 ? '#fff' : C.cream100, transition: 'background 0.15s', cursor: 'default' }}
                          onMouseEnter={e => e.currentTarget.style.background = C.cream200}
                          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : C.cream100}>
                          <td style={{ ...s.td, color: C.mutedText, fontSize: 12 }}>{i + 1}</td>
                          <td style={s.td}>
                            <div style={{ fontWeight: 600, color: C.creamText }}>{t.name}</div>
                            <div style={{ fontSize: 12, color: C.mutedText, marginTop: 2 }}>{t.email}</div>
                          </td>
                          <td style={s.td}>
                            {t.phone
                              ? <span style={{ fontSize: 13, color: C.mutedText }}><Phone size={14} style={{marginRight:4}} /> {t.phone}</span>
                              : <span style={{ fontSize: 12, color: C.cream300 }}>—</span>}
                          </td>
                          <td style={s.td}>
                            <span style={{ color: C.maroon600, fontWeight: 600, fontSize: 13 }}>{t.report?.subject || '—'}</span>
                          </td>
                          <td style={s.td}>
                            {!t.report && <span style={s.badge('missing')}><><XCircle size={14} /> Not Started</></span>}
                            {t.report?.status === 'draft' && <span style={s.badge('draft')}><><FileEdit size={14} /> Draft</></span>}
                            {t.report?.status === 'submitted' && <span style={s.badge('submitted')}><><CheckCircle size={14} /> Submitted</></span>}
                          </td>
                          <td style={{ ...s.td, maxWidth: 240, color: C.mutedText, fontSize: 13 }}>
                            {t.report?.topics_covered ? t.report.topics_covered.substring(0, 55) + '...' : '—'}
                          </td>
                        </tr>
                      ))}
                      {filteredMonitor.length === 0 && (
                        <tr><td colSpan="6" style={{ padding: 40, textAlign: 'center', color: C.mutedText }}>No teachers found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ TAB 2: ALL REPORTS ══ */}
        {activeTab === 'reports' && (
          <>
            <div style={{ ...s.card, marginBottom: 20 }}>
              <div style={s.label}>Filter by Teacher Name</div>
              <input type="text" style={s.input} placeholder="Search teacher..." value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} />
            </div>

            {allLoading ? (
              <div style={{ padding: 60, textAlign: 'center', color: C.mutedText }}>Loading all reports...</div>
            ) : Object.keys(reportsByDate).length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: C.mutedText }}>No reports found.</div>
            ) : Object.entries(reportsByDate).map(([date, reps]) => (
              <div key={date} style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: C.maroon700 }}><Calendar size={16} style={{marginRight:6}} /> {date}</div>
                    <div style={{ fontSize: 12, color: C.mutedText, marginTop: 3 }}>
                      {reps.filter(r => r.status === 'submitted').length} submitted · {reps.filter(r => r.status === 'draft').length} draft
                    </div>
                  </div>
                  <button style={s.primaryBtn} onClick={() => handleExportPdf(date)}><><Download size={14} style={{marginRight:6}} /> Download PDF</></button>
                </div>

                {reps.map(r => (
                  <div key={r.id} style={{ background: C.cream100, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <span style={{ fontWeight: 700, color: C.creamText }}>{r.profiles?.name || 'Unknown'}</span>
                        {r.subject && <span style={{ marginLeft: 10, color: C.maroon500, fontSize: 13, fontWeight: 600 }}>· {r.subject}</span>}
                        <div style={{ fontSize: 12, color: C.mutedText, marginTop: 3 }}>{r.profiles?.email}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {r.status === 'submitted' ? <span style={s.badge('submitted')}><><CheckCircle size={14} /> Submitted</></span> : <span style={s.badge('draft')}><><FileEdit size={14} /> Draft</></span>}
                        <button style={s.ghostBtn} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                          {expandedId === r.id ? 'Hide ▲' : 'View ▼'}
                        </button>
                      </div>
                    </div>

                    {expandedId === r.id && (
                      <div style={{ padding: '0 18px 18px' }}>
                        <div style={s.detailBox(C.maroon500)}>
                          <div style={{ fontWeight: 700, color: C.maroon700, marginBottom: 10, fontSize: 13 }}><BookOpen size={16} style={{marginRight:6}} /> Last Week Overview</div>
                          <div style={{ fontSize: 13, color: C.creamText, marginBottom: 6 }}><strong>Topics:</strong> {r.topics_covered || 'Not specified'}</div>
                          <div style={{ fontSize: 13, marginBottom: 6, color: r.is_on_schedule ? '#065F46' : '#991B1B', fontWeight: 600 }}>
                            {r.is_on_schedule ? '<CheckCircle size={14} /> On schedule' : '<AlertTriangle size={14} /> Behind schedule'}
                          </div>
                          {r.challenges && <div style={{ fontSize: 13, color: C.mutedText }}><strong>Challenges:</strong> {r.challenges}</div>}
                        </div>

                        {['cet', 'neet', 'jee'].map(sec => {
                          if (r[`skip_${sec}`]) return (
                            <div key={sec} style={{ ...s.detailBox('#9CA3AF'), marginTop: 10 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#6B7280' }}>{sec.toUpperCase()} — Skipped by this teacher</div>
                            </div>
                          );
                          const qs = r[`${sec}_questions`] || [];
                          const ts = r[`${sec}_tests`] || [];
                          const ds = r[`${sec}_doubt`] || [];
                          const accent = sec === 'cet' ? '#2563EB' : sec === 'neet' ? '#7C3AED' : '#D97706';
                          return (
                            <div key={sec} style={{ ...s.detailBox(accent), marginTop: 10 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: accent, marginBottom: 10 }}>{sec.toUpperCase()} Section</div>
                              {r[`${sec}_book`] && <div style={{ fontSize: 13, color: C.mutedText, marginBottom: 10 }}><BookOpen size={14} style={{marginRight:4}} /> <strong>Book:</strong> {r[`${sec}_book`]}</div>}
                              {[['Questions Done', qs, 'questions'], ['Tests Conducted', ts, 'tests'], ['Doubt Classes', ds, 'classes']].map(([label, rows, unit]) =>
                                rows.length > 0 ? (
                                  <div key={label} style={{ marginBottom: 8 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: C.mutedText, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                                    {rows.map((row, i) => (
                                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.cream200}`, fontSize: 13 }}>
                                        <span style={{ color: C.creamText }}>{row.class_name}</span>
                                        <span style={{ color: accent, fontWeight: 700 }}>{row.count} {unit}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : null
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {/* ══ TAB 3: TEACHER PROFILES ══ */}
        {activeTab === 'teachers' && (
          <>
            <div style={{ ...s.card, marginBottom: 20 }}>
              <div style={s.label}>Search Teachers</div>
              <input type="text" style={s.input} placeholder="Name or email..." value={profileSearch} onChange={e => setProfileSearch(e.target.value)} />
            </div>

            {profilesLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.mutedText }}>Loading teacher profiles...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {filteredProfiles.map((t, i) => {
                  const totalReports = t.weekly_reports?.length || 0;
                  const submittedReports = t.weekly_reports?.filter(r => r.status === 'submitted').length || 0;
                  const initials = (t.name || 'T').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={t.id} style={{ ...s.card, marginBottom: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 12,
                          background: `linear-gradient(135deg, ${C.maroon800}, ${C.maroon600})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: C.cream100, fontWeight: 800, fontSize: 18, flexShrink: 0,
                        }}>{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: C.creamText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                          <div style={{ fontSize: 12, color: C.mutedText, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.email}</div>
                        </div>
                      </div>
                      <div style={s.divider} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
                        {[
                          { label: 'Total', value: totalReports, color: C.maroon600 },
                          { label: 'Submitted', value: submittedReports, color: '#059669' },
                          { label: 'Drafts', value: totalReports - submittedReports, color: '#D97706' },
                        ].map(stat => (
                          <div key={stat.label} style={{ textAlign: 'center', background: C.cream100, borderRadius: 8, padding: '10px 4px', border: `1px solid ${C.border}` }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: 11, color: C.mutedText, marginTop: 2, fontWeight: 600 }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>
                      {t.phone && (
                        <div style={{ marginTop: 14, fontSize: 13, color: C.mutedText }}><Phone size={14} style={{marginRight:4}} /> {t.phone}</div>
                      )}
                    </div>
                  );
                })}
                {filteredProfiles.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: C.mutedText }}>No teachers found.</div>
                )}
              </div>
            )}
          </>
        )}

        {/* ══ TAB 4: ANNOUNCEMENTS ══ */}
        {activeTab === 'announcements' && (
          <>
            {/* Compose */}
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.maroon700, marginBottom: 16 }}><Megaphone size={16} style={{marginRight: 6}} /> Post New Announcement</div>
              <div style={{ marginBottom: 14 }}>
                <div style={s.label}>Title</div>
                <input type="text" style={s.input} placeholder="e.g. Staff meeting tomorrow" value={newAnnTitle} onChange={e => setNewAnnTitle(e.target.value)} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={s.label}>Message (optional)</div>
                <textarea style={{ ...s.input, minHeight: 90, resize: 'vertical' }} placeholder="Type your announcement here..." value={newAnnBody} onChange={e => setNewAnnBody(e.target.value)} />
              </div>
              <button style={{ ...s.primaryBtn, opacity: annPosting ? 0.6 : 1 }} disabled={annPosting} onClick={postAnnouncement}>
                {annPosting ? '<Loader size={16} style={{marginRight:6}} /> Posting...' : '<Send size={16} style={{marginRight:6}} /> Broadcast to All Teachers'}
              </button>
            </div>

            {/* List */}
            {annLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.mutedText }}>Loading announcements...</div>
            ) : announcements.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: 48, color: C.mutedText }}>
                No announcements yet. Post one above and all teachers will see it on their dashboard!
              </div>
            ) : (
              announcements.map(a => (
                <div key={a.id} style={{ ...s.card, borderLeft: `4px solid ${C.maroon500}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: C.creamText, marginBottom: 4 }}>{a.title}</div>
                      {a.body && <div style={{ fontSize: 14, color: C.mutedText, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{a.body}</div>}
                      <div style={{ fontSize: 12, color: C.cream400, marginTop: 10 }}>
                        Posted by {a.posted_by} · {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <button
                      style={{ ...s.ghostBtn, color: '#991B1B', borderColor: '#FECACA', background: '#FEF2F2', fontSize: 11 }}
                      onClick={() => deleteAnnouncement(a.id)}
                    >
                      <><Trash2 size={14} style={{marginRight:4}} /> Delete</>
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ══ TAB 5: MEETINGS ══ */}
        {activeTab === 'meetings' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.maroon700 }}>Scheduled Meetings</h2>
              <button style={s.primaryBtn} onClick={openNewMeetingModal}><Plus size={16} /> New Meeting</button>
            </div>
            
            {meetingsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: C.mutedText }}>Loading meetings...</div>
            ) : meetings.length === 0 ? (
              <div style={{ ...s.card, textAlign: 'center', padding: 48, color: C.mutedText }}>
                No meetings scheduled.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {meetings.map(m => (
                  <div key={m.id} style={{ ...s.card, opacity: m.status === 'cancelled' ? 0.6 : 1, borderLeft: `4px solid ${m.status === 'cancelled' ? '#9CA3AF' : C.maroon500}`, marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 16, color: C.creamText }}>{m.title}</span>
                          {m.status === 'cancelled' && <span style={s.badge('missing')}>Cancelled</span>}
                        </div>
                        <div style={{ fontSize: 13, color: C.mutedText, marginBottom: 8 }}>
                          <Calendar size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {m.meeting_date} · {m.start_time.substring(0,5)} - {m.end_time.substring(0,5)}
                        </div>
                        <div style={{ fontSize: 13, color: C.mutedText, marginBottom: 8 }}>
                          <Video size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {m.location || 'No location set'}
                        </div>
                        <div style={{ fontSize: 12, color: C.cream400 }}>
                          Target: {m.audience_type === 'all_staff' ? 'All Staff' : m.audience_type === 'department' ? `Dept: ${m.department}` : 'Individuals'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={s.ghostBtn} onClick={() => openEditMeetingModal(m)}><FileEdit size={14} /> Edit</button>
                        <button style={{...s.ghostBtn, color: m.status === 'scheduled' ? '#991B1B' : '#065F46'}} onClick={() => toggleCancelMeeting(m)}>
                          {m.status === 'scheduled' ? <><XCircle size={14} /> Cancel</> : <><CheckCircle size={14} /> Restore</>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showMeetingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: C.cream100, padding: 24, borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: C.maroon700 }}>{editingMeeting ? 'Edit Meeting' : 'New Meeting'}</h3>
              <button onClick={() => setShowMeetingModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.mutedText }}><X size={20}/></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={s.label}>Title</label>
                <input style={s.input} value={meetTitle} onChange={e => setMeetTitle(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Date</label>
                  <input type="date" style={s.input} value={meetDate} onChange={e => setMeetDate(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Start Time</label>
                  <input type="time" style={s.input} value={meetStart} onChange={e => setMeetStart(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>End Time</label>
                  <input type="time" style={s.input} value={meetEnd} onChange={e => setMeetEnd(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={s.label}>Location / Link</label>
                <input style={s.input} value={meetLoc} onChange={e => setMeetLoc(e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Audience Type</label>
                <select style={s.input} value={meetAudience} onChange={e => setMeetAudience(e.target.value)}>
                  <option value="all_staff">All Staff</option>
                  <option value="department">Specific Department</option>
                  <option value="individual">Specific Individuals</option>
                </select>
              </div>
              {meetAudience === 'department' && (
                <div>
                  <label style={s.label}>Department</label>
                  <input style={s.input} placeholder="e.g. Science" value={meetDept} onChange={e => setMeetDept(e.target.value)} />
                </div>
              )}
              {meetAudience === 'individual' && (
                <div>
                  <label style={s.label}>Select Teachers</label>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, background: '#fff' }}>
                    {profilesData.map(t => (
                      <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4, cursor: 'pointer' }}>
                        <input type="checkbox" checked={meetAttendees.includes(t.id)} onChange={e => {
                          if (e.target.checked) setMeetAttendees(prev => [...prev, t.id]);
                          else setMeetAttendees(prev => prev.filter(id => id !== t.id));
                        }} />
                        <span style={{ fontSize: 13 }}>{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label style={s.label}>Agenda / Description</label>
                <textarea style={{...s.input, minHeight: 80, resize: 'vertical'}} value={meetDesc} onChange={e => setMeetDesc(e.target.value)} />
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button style={s.ghostBtn} onClick={() => setShowMeetingModal(false)}>Cancel</button>
              <button style={s.primaryBtn} onClick={saveMeeting} disabled={meetSaving}>
                {meetSaving ? 'Saving...' : 'Save Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* ══ TAB: ATTENDANCE ══ */}
        {activeTab === 'attendance' && (
          <>
            <div style={{...s.card, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end'}}>
              <div style={{flex: 1, minWidth: 160}}>
                <div style={s.label}>Filter by Date</div>
                <input type="date" style={s.input} value={attDateFilter} onChange={e => setAttDateFilter(e.target.value)} />
              </div>
              <div style={{flex: 1, minWidth: 160}}>
                <div style={s.label}>Filter by Stream</div>
                <select style={s.input} value={attStreamFilter} onChange={e => setAttStreamFilter(e.target.value)}>
                  <option value="">All Streams</option>
                  <option value="Science">Science</option>
                  <option value="Commerce">Commerce</option>
                </select>
              </div>
              <button style={s.primaryBtn} onClick={fetchAttendanceSessions}>Refresh</button>
            </div>

            {attLoading ? (
              <div style={{padding: 40, textAlign: 'center', color: C.mutedText}}>Loading attendance...</div>
            ) : (() => {
              const filtered = attSessions.filter(ses => {
                if (attDateFilter && ses.date !== attDateFilter) return false;
                if (attStreamFilter && ses.stream !== attStreamFilter) return false;
                return true;
              });
              return filtered.length === 0 ? (
                <div style={{...s.card, textAlign: 'center', padding: 40, color: C.mutedText}}>
                  No attendance records found for the selected filters.
                </div>
              ) : (
                <div style={{overflowX: 'auto'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`}}>
                    <thead>
                      <tr>
                        <th style={s.th}>Date</th>
                        <th style={s.th}>Stream</th>
                        <th style={s.th}>Year</th>
                        <th style={s.th}>Class</th>
                        <th style={s.th}>Total</th>
                        <th style={s.th}>Present</th>
                        <th style={s.th}>Absent</th>
                        <th style={s.th}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(ses => {
                        const records = ses.attendance_records || [];
                        const totalStudents = records.length;
                        const absentCount = records.filter(r => r.is_absent).length;
                        const presentCount = totalStudents - absentCount;
                        const pct = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
                        return (
                          <tr key={ses.id}>
                            <td style={s.td}>{ses.date}</td>
                            <td style={s.td}>{ses.stream}</td>
                            <td style={s.td}>{ses.year}</td>
                            <td style={s.td}><strong>{ses.class}</strong></td>
                            <td style={s.td}>{totalStudents}</td>
                            <td style={{...s.td, color: '#059669', fontWeight: 600}}>{presentCount}</td>
                            <td style={{...s.td, color: '#DC2626', fontWeight: 600}}>{absentCount}</td>
                            <td style={s.td}>
                              <span style={{
                                ...s.badge(pct >= 75 ? 'submitted' : pct >= 50 ? 'draft' : 'missing'),
                              }}>{pct}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </>
        )}

        {/* ══ TAB: TESTS ══ */}
        {activeTab === 'tests' && (
          <>
            <div style={{...s.card, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end'}}>
              <div style={{flex: 1, minWidth: 160}}>
                <div style={s.label}>Filter by Stream</div>
                <select style={s.input} value={testsStreamFilter} onChange={e => setTestsStreamFilter(e.target.value)}>
                  <option value="">All Streams</option>
                  <option value="Science">Science</option>
                  <option value="Commerce">Commerce</option>
                </select>
              </div>
              <button style={s.primaryBtn} onClick={fetchAdminTests}>Refresh</button>
            </div>

            {testsLoading ? (
              <div style={{padding: 40, textAlign: 'center', color: C.mutedText}}>Loading tests...</div>
            ) : (() => {
              const filtered = adminTests.filter(t => {
                if (testsStreamFilter && t.stream !== testsStreamFilter) return false;
                return true;
              });
              return filtered.length === 0 ? (
                <div style={{...s.card, textAlign: 'center', padding: 40, color: C.mutedText}}>
                  No tests created yet.
                </div>
              ) : (
                <div style={{overflowX: 'auto'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`}}>
                    <thead>
                      <tr>
                        <th style={s.th}>Test Name</th>
                        <th style={s.th}>Stream</th>
                        <th style={s.th}>Year</th>
                        <th style={s.th}>Class</th>
                        <th style={s.th}>Subjects</th>
                        <th style={s.th}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(t => (
                        <tr key={t.id}>
                          <td style={{...s.td, fontWeight: 600}}>{t.name}</td>
                          <td style={s.td}>{t.stream}</td>
                          <td style={s.td}>{t.year}</td>
                          <td style={s.td}><strong>{t.class}</strong></td>
                          <td style={s.td}>
                            {(t.subjects || []).map((sub, i) => (
                              <span key={i} style={{
                                display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                                background: `${C.maroon700}10`, color: C.maroon700,
                                fontSize: 12, fontWeight: 500, marginRight: 6, marginBottom: 4,
                                border: `1px solid ${C.maroon300}30`,
                              }}>
                                {sub.name} ({sub.maxMarks})
                              </span>
                            ))}
                          </td>
                          <td style={{...s.td, color: C.mutedText, fontSize: 13}}>
                            {new Date(t.created_at).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </>
        )}

      <style>{`
        * { box-sizing: border-box; }
        input[type=date]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; }
        @media (max-width: 640px) {
          nav { padding: 0 16px !important; }
          div[style*="padding: 32px 28px"] { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  );
}
