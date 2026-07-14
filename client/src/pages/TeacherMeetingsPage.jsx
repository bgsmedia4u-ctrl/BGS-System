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

      if (error) throw error;
      setMeetings(data || []);
    } catch (err) {
      console.error('Meetings fetch error:', err);
      toast.error('Failed to load meetings');
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
    return (
      <div key={m.id} className="card" style={{ 
        marginBottom: 16, 
        opacity: isCancelled ? 0.6 : 1,
        borderLeft: `4px solid ${isCancelled ? 'var(--text-muted)' : 'var(--gold-500)'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{m.title}</h3>
              {isCancelled && (
                <span className="badge badge-draft" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  <XCircle size={12} /> Cancelled
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-500)', fontSize: 14, fontWeight: 600 }}>
                <Calendar size={16} />
                {new Date(m.meeting_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14 }}>
                <Clock size={16} />
                {m.start_time.substring(0,5)} - {m.end_time.substring(0,5)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14 }}>
                {m.location?.toLowerCase().includes('http') ? <Video size={16} /> : <MapPin size={16} />}
                {m.location?.toLowerCase().includes('http') ? (
                  <a href={m.location} target="_blank" rel="noreferrer" style={{ color: 'var(--gold-500)', textDecoration: 'none' }}>Join Link</a>
                ) : (m.location || 'Location TBA')}
              </div>
            </div>

            {m.description && (
              <div style={{ 
                background: 'rgba(0,0,0,0.2)', 
                padding: 12, 
                borderRadius: 8, 
                fontSize: 14, 
                color: 'var(--text-muted)',
                whiteSpace: 'pre-wrap'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, fontSize: 12, textTransform: 'uppercase' }}>Agenda</div>
                {m.description}
              </div>
            )}
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-submitted" style={{ 
              background: m.audience_type === 'all_staff' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(37, 99, 235, 0.1)', 
              color: m.audience_type === 'all_staff' ? '#10B981' : '#60A5FA',
              border: 'none'
            }}>
              {m.audience_type === 'all_staff' ? 'All Staff' : m.audience_type === 'department' ? 'Department' : 'Individual'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Meetings</h1>
        <p className="page-subtitle">View your upcoming and past scheduled meetings</p>
      </div>

      <div className="page-body fade-in">
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} style={{ color: 'var(--gold-500)' }}/> Upcoming Meetings
          </h2>
          {upcomingMeetings.length > 0 ? (
            upcomingMeetings.map(m => renderMeetingCard(m, false))
          ) : (
            <div className="empty-state" style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--border)' }}>
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
