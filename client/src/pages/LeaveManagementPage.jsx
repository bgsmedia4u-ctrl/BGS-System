import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTeacherLeaves, submitLeaveRequest } from '../api/leaveService';
import { supabase } from '../api/supabase';
import Layout from '../components/Layout';
import { CalendarOff, Plus, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeaveManagementPage() {
  const { user, profile } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState('Full Day');
  const [reason, setReason] = useState('');
  const [substituteId, setSubstituteId] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaves();
    fetchTeachers();
  }, [user]);

  async function fetchLeaves() {
    setLoading(true);
    try {
      const data = await getTeacherLeaves(user.id);
      setLeaves(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leave history');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeachers() {
    try {
      const { data, error } = await supabase.from('profiles').select('id, name').eq('role', 'teacher').neq('id', user.id);
      if (error) throw error;
      setTeachers(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitLeaveRequest({
        teacher_id: user.id,
        date,
        period,
        reason,
        substitute_teacher_id: substituteId || null
      });
      toast.success('Leave request submitted!');
      setShowForm(false);
      setDate('');
      setPeriod('Full Day');
      setReason('');
      setSubstituteId('');
      fetchLeaves();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  }

  const renderBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="badge badge-submitted"><CheckCircle size={12}/> Approved</span>;
      case 'pending': return <span className="badge badge-draft"><Clock size={12}/> Pending</span>;
      case 'rejected': return <span className="badge" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}><XCircle size={12}/> Rejected</span>;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title"><CalendarOff size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 8, color: 'var(--accent)' }}/> Leave Management</h1>
          <p className="page-subtitle">Request leaves and manage substitute assignments</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Request Leave
          </button>
        )}
      </div>

      <div className="page-body fade-in">
        {showForm && (
          <div className="card" style={{ marginBottom: 24, background: 'var(--bg-surface-hover)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontWeight: 600 }}>New Leave Request</h3>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" required className="form-input" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label className="form-label">Period</label>
                <select required className="form-input" value={period} onChange={e => setPeriod(e.target.value)}>
                  <option value="Full Day">Full Day</option>
                  <option value="Morning">Morning (1st Half)</option>
                  <option value="Afternoon">Afternoon (2nd Half)</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Reason</label>
                <textarea required className="form-input" rows="2" value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide a brief reason..." />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Suggested Substitute (Optional)</label>
                <select className="form-input" value={substituteId} onChange={e => setSubstituteId(e.target.value)}>
                  <option value="">-- No Preference --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>My Leave History</h3>
          {loading ? (
             <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Period</th>
                    <th>Reason</th>
                    <th>Substitute</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length > 0 ? (
                    leaves.map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 500 }}>{new Date(l.date).toLocaleDateString()}</td>
                        <td>{l.period}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{l.reason}</td>
                        <td>{l.substitute ? l.substitute.raw_user_meta_data?.full_name || 'Assigned' : '-'}</td>
                        <td>{renderBadge(l.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No leave requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
