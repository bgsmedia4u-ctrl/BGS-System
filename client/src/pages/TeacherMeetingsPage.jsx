import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../api/supabase';
import Layout from '../components/Layout';
import { Calendar, Video, MapPin, XCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherMeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  async function fetchMeetings() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('meeting_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Meetings query failed:', error.message);
        setMeetings([]);
        return;
      }
      setMeetings(data || []);
    } catch (err) {
      console.error('Meetings fetch exception:', err);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      </Layout>
    );
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0];

  const upcomingMeetings = [];
  const pastMeetings = [];

  meetings.forEach(m => {
    if (m.meeting_date > todayStr || (m.meeting_date === todayStr && m.end_time > currentTime)) {
      upcomingMeetings.push(m);
    } else {
      pastMeetings.push(m);
    }
  });

  // Sort past meetings descending
  pastMeetings.sort((a, b) => {
    if (a.meeting_date !== b.meeting_date) return b.meeting_date.localeCompare(a.meeting_date);
    return b.start_time.localeCompare(a.start_time);
  });

  const renderMeetingCard = (m, isPast) => {
    const isCancelled = m.status === 'cancelled';
    const statusColor = isCancelled ? 'var(--text-muted)' : isPast ? 'var(--text-muted)' : 'var(--success)';
    const statusBg = isCancelled ? 'var(--bg-surface-hover)' : isPast ? 'var(--bg-surface-hover)' : 'var(--success-bg)';
    
    return (
      <div key={m.id} className="card" style={{ 
        marginBottom: 16, 
        opacity: isCancelled ? 0.6 : 1,
        border: '1px solid var(--border)',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 280 }}>
          {/* Organizer Avatar placeholder */}
          <div className="user-avatar-placeholder" style={{ width: 44, height: 44, fontSize: 16 }}>
            Admin
          </div>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-main)' }}>{m.title}</h3>
              {/* Inline Dot Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
                <span style={{ 
                  width: 8, height: 8, borderRadius: '50%', 
                  background: statusColor,
                  boxShadow: `0 0 0 2px ${statusBg}`
                }} />
                {isCancelled ? 'Cancelled' : isPast ? 'Completed' : 'Scheduled'}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} />
                {new Date(m.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={14} />
                {m.start_time.substring(0,5)} - {m.end_time.substring(0,5)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {m.location?.toLowerCase().includes('http') ? <Video size={14} /> : <MapPin size={14} />}
                {m.location?.toLowerCase().includes('http') ? (
                  <a href={m.location} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Join Link</a>
                ) : (m.location || 'Location TBA')}
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <span style={{ 
            fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--radius-full)',
            background: m.audience_type === 'all_staff' ? 'var(--info-bg)' : 'var(--bg-surface-hover)', 
            color: m.audience_type === 'all_staff' ? 'var(--info)' : 'var(--text-muted)',
          }}>
            {m.audience_type === 'all_staff' ? 'All Staff' : m.audience_type === 'department' ? 'Department' : 'Individual'}
          </span>
          {m.description && (
             <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
               {m.description}
             </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title" style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Meetings</h1>
        <p className="page-subtitle" style={{ fontSize: 15, color: 'var(--text-muted)' }}>View your upcoming and past scheduled meetings</p>
      </div>

      <div className="page-body fade-in">
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} style={{ color: 'var(--gold-500)' }}/> Upcoming Meetings
          </h2>
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map(m => renderMeetingCard(m, false))
          ) : (
            <div className="empty-state" style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <Calendar className="empty-state-icon" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--text-muted)' }} size={32} />
              <p className="empty-state-title" style={{ fontWeight: 600, fontSize: 16 }}>No upcoming meetings</p>
              <p className="empty-state-text" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                You have no scheduled meetings at this time.
              </p>
            </div>
          )}
        </div>

        {pastMeetings.length > 0 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 16 }}>Past Meetings</h2>
            {pastMeetings.map(m => renderMeetingCard(m, true))}
          </div>
        )}
      </div>
    </Layout>
  );
}

