import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../api/supabase';
import Layout from '../components/Layout';
import { Settings, User, BookOpen, Shield, FileText, Save, Check, Lock, Bell, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../layout.css';

const AVAILABLE_SUBJECTS = [
  'Physics',
  'Chemistry',
  'Mathematics',
  'Biology',
  'Accountancy',
  'Economics',
  'Business Studies',
  'Computer Science',
  'English',
  'Kannada',
  'Physical Education',
  'Administration & Operations'
];

const AVAILABLE_STREAMS = [
  'Science',
  'Commerce',
  'Arts',
  'General / Vocational'
];

const AVAILABLE_YEARS = [
  '1st PUC',
  '2nd PUC',
  'Both 1st & 2nd PUC'
];

const STANDARD_CLASSES = [
  '1st FTB',
  '2nd FTB - 1',
  '2nd FTB - 2',
  '1st Class A',
  '1st Class B',
  '2nd Class A',
  '2nd Class B',
  '1st Inspire',
  '2nd Inspire'
];

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [subject, setSubject] = useState('');
  const [stream, setStream] = useState('Science');
  const [academicYear, setAcademicYear] = useState('1st PUC');
  const [selectedClasses, setSelectedClasses] = useState(['1st FTB', '2nd FTB - 2']);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.name || user?.user_metadata?.full_name || '');
      setSubject(profile.subject || profile.department || 'Physics');
      setStream(profile.stream || 'Science');
      setAcademicYear(profile.academic_year || '1st PUC');
      if (profile.assigned_classes) {
        setSelectedClasses(profile.assigned_classes.split(',').map(c => c.trim()).filter(Boolean));
      }
    } else if (user) {
      setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      setSubject('Physics');
    }

    // Load actual assigned syllabus classes from teacher_subject_assignments
    async function loadSyllabusConfig() {
      if (!user?.id) return;
      try {
        const { data } = await supabase.from('teacher_subject_assignments').select('*').eq('teacher_id', user.id);
        if (data && data.length > 0) {
          setStream(data[0].stream || 'Science');
          const years = [...new Set(data.map(d => d.academic_year))];
          if (years.length > 1) setAcademicYear('Both 1st & 2nd PUC');
          else setAcademicYear(years[0] || '1st PUC');
          const classes = [...new Set(data.map(d => d.class_name))];
          if (classes.length > 0) setSelectedClasses(classes);
        }
      } catch (err) {
        console.warn('Could not load syllabus assignments in settings', err);
      }
    }
    loadSyllabusConfig();
  }, [profile, user]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!displayName.trim()) {
      return toast.error('Display name cannot be empty');
    }
    if (selectedClasses.length < 2 && profile?.role !== 'admin') {
      return toast.error('Please select at least 2 or more classes/sections for syllabus tracking.');
    }

    setSaving(true);
    try {
      // 1. Update auth user metadata if supported
      if (user?.id) {
        await supabase.auth.updateUser({
          data: { full_name: displayName }
        }).catch(err => console.warn('Auth meta update notice:', err.message));
      }

      // 2. Update or insert into supabase profiles table (upsert avoids missing profile FK errors)
      const updateData = {
        name: displayName.trim(),
        subject: subject,
        stream: stream,
        academic_year: academicYear,
        assigned_classes: selectedClasses.join(', ')
      };

      // Also update department if subject is administrative
      if (subject.includes('Administration')) {
        updateData.department = 'Administration';
      } else {
        updateData.department = subject;
      }

      const profilePayload = {
        id: user.id,
        email: user?.email || profile?.email || undefined,
        role: profile?.role || 'teacher',
        ...updateData
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (error && error.code !== 'PGRST116') {
        console.warn('Profile DB upsert:', error.message);
      }

      // 3. Sync directly to teacher_subject_assignments table so it immediately reflects on Syllabus Tracker!
      if (user?.id) {
        try {
          await supabase.from('teacher_subject_assignments').delete().eq('teacher_id', user.id);
          const assignmentRows = [];
          selectedClasses.forEach(clsName => {
            // Automatically determine if the batch belongs to 1st year or 2nd year
            let derivedYear = academicYear === 'Both 1st & 2nd PUC' ? '1st PUC' : academicYear;
            const lowerCls = clsName.toLowerCase();
            if (lowerCls.startsWith('1st') || lowerCls.includes('1st') || lowerCls.includes('pu 1')) {
              derivedYear = '1st PUC';
            } else if (lowerCls.startsWith('2nd') || lowerCls.includes('2nd') || lowerCls.includes('pu 2')) {
              derivedYear = '2nd PUC';
            }
            assignmentRows.push({
              teacher_id: user.id,
              academic_year: derivedYear,
              stream: stream,
              class_name: clsName,
              subject: subject
            });
          });
          if (assignmentRows.length > 0) {
            await supabase.from('teacher_subject_assignments').insert(assignmentRows);
          }
        } catch (syncErr) {
          console.warn('Error syncing syllabus assignments:', syncErr);
        }
      }

      // 4. Trigger context refresh
      if (refreshProfile) {
        await refreshProfile();
      }

      toast.success('Profile and Syllabus Tracker courses saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings: ' + (err.message || 'Network error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">
            <Settings size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 10, color: 'var(--maroon-900)' }} />
            Account & System Settings
          </h1>
          <p className="page-subtitle">Configure personal profile credentials, assigned teaching subjects, streams, classes, and institutional agreements</p>
        </div>
      </div>

      <div className="page-body fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 24 }}>
        {/* Profile Modification Section */}
        <div className="card" style={{ border: '1px solid var(--border-color)', padding: 22, borderRadius: 16, height: 'fit-content', boxSizing: 'border-box', width: '100%', maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 16, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FCEFEF', color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Profile & Syllabus Configuration</h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Configure your teaching subject, stream, year, and classes for Syllabus Tracker integration</span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
                Display Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  required
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: '0.95rem', background: '#fff', fontWeight: 500 }}
                />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>
                This name will be displayed on all attendance registries, syllabus monitors, and reports.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
                Primary Subject / Department Designation *
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: '0.95rem', background: '#fff', fontWeight: 500 }}
              >
                {AVAILABLE_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>
                Determines curriculum modules and chapters on Syllabus Tracker.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
                Academic Stream *
              </label>
              <select
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: '0.95rem', background: '#fff', fontWeight: 500 }}
              >
                {AVAILABLE_STREAMS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>
                Associates your profile with specific stream curricula (Science, Commerce, Arts).
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
                Academic Year / Grade (1year / 2nd year) *
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: '0.95rem', background: '#fff', fontWeight: 500 }}
              >
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>
                Select whether you teach 1st Year (1st PUC), 2nd Year (2nd PUC), or Both.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
                Assigned Classes / Sections (Select 2 or more) *
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                {STANDARD_CLASSES.map(cls => {
                  const isSelected = selectedClasses.includes(cls);
                  return (
                    <button
                      type="button"
                      key={cls}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedClasses(selectedClasses.filter(c => c !== cls));
                        } else {
                          setSelectedClasses([...selectedClasses, cls]);
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 20,
                        border: isSelected ? '1px solid var(--maroon-900)' : '1px solid var(--border-color)',
                        background: isSelected ? '#FCEFEF' : '#F9FAFB',
                        color: isSelected ? 'var(--maroon-900)' : 'var(--text-main)',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '0.88rem'
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}{cls}
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: '0.82rem', color: selectedClasses.length < 2 ? '#DC2626' : '#15803D', fontWeight: selectedClasses.length < 2 ? 600 : 500, display: 'block', marginTop: 8 }}>
                {selectedClasses.length < 2 ? '⚠️ Please select at least 2 or more classes/sections to enable syllabus tracking.' : `✓ ${selectedClasses.length} classes selected. Progress will be monitored individually per class.`}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
                Registered Email Address (Read-Only)
              </label>
              <input
                type="email"
                value={user?.email || 'authenticated@bgs.edu'}
                disabled
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color)', fontSize: '0.95rem', background: '#F9FAFB', color: '#6B7280', cursor: 'not-allowed' }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: 8,
                background: 'var(--maroon-900)',
                color: '#fff',
                border: 'none',
                padding: '13px 22px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                cursor: saving ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(115,19,19,0.2)'
              }}
            >
              {saving ? <div className="spinner" style={{ width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent' }} /> : <Save size={18} />}
              <span>{saving ? 'Saving & Syncing Syllabus...' : 'Save Profile & Syllabus Configuration'}</span>
            </button>
          </form>
        </div>

        {/* Legal & Notification Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Legal & Compliance Section */}
          <div className="card" style={{ border: '1px solid var(--border-color)', padding: 28, borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Institutional Legal Policies</h2>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Review mandatory data compliance, marks privacy, and terms of service</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Link
                to="/privacy"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: 'var(--text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Shield size={20} color="var(--maroon-900)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Privacy Policy</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data protection, student marks restriction, and MSG91 telemetry</div>
                  </div>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--maroon-900)', fontSize: '0.85rem' }}>View Policy →</span>
              </Link>

              <Link
                to="/terms"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: 'var(--text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileText size={20} color="var(--gold-600)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Terms & Conditions</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Staff access rules, assembly prayer guidelines, and audit compliance</div>
                  </div>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--maroon-900)', fontSize: '0.85rem' }}>View Terms →</span>
              </Link>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="card" style={{ border: '1px solid var(--border-color)', padding: 28, borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Notification Telemetry</h2>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage SMS meeting summons and attendance dispatch feeds</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>SMS Urgent Meeting Alerts</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Receive instantaneous MSG91 phone dispatches when summoned to faculty meetings</div>
                </div>
                <input
                  type="checkbox"
                  checked={smsNotifications}
                  onChange={(e) => setSmsNotifications(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: 'var(--maroon-900)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>In-App Notification Feed</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Display real-time bell badges for school announcements and leave approvals</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: 'var(--maroon-900)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
