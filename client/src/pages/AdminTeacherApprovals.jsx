import { useState, useEffect } from 'react';
import { getPendingTeachers, getProcessedTeachers, updateTeacherStatus } from '../api/authService';
import { Check, X, Shield, RefreshCw, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function AdminTeacherApprovals() {
  const [pending, setPending] = useState([]);
  const [processed, setProcessed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    setLoading(true);
    try {
      const pendingData = await getPendingTeachers();
      const processedData = await getProcessedTeachers();
      setPending(pendingData);
      setProcessed(processedData);
    } catch (err) {
      toast.error('Failed to load teachers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id, newStatus, currentList) {
    try {
      // Optimistic update
      if (newStatus === 'approved' || newStatus === 'rejected') {
        const teacher = pending.find(t => t.id === id);
        if (teacher) {
          setPending(prev => prev.filter(t => t.id !== id));
          setProcessed(prev => [{ ...teacher, status: newStatus }, ...prev]);
        } else {
          // It was a revoke action from processed list
          const pTeacher = processed.find(t => t.id === id);
          if (pTeacher && newStatus === 'pending') {
            setProcessed(prev => prev.filter(t => t.id !== id));
            setPending(prev => [{ ...pTeacher, status: newStatus }, ...prev]);
          } else if (pTeacher && newStatus === 'rejected') {
            setProcessed(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
          }
        }
      }

      await updateTeacherStatus(id, newStatus);
      toast.success(`Teacher ${newStatus === 'pending' ? 'access revoked' : newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
      fetchTeachers(); // Revert on failure
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 24px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <Link to="/admin-portal" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'color var(--transition)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <ArrowLeft size={20} /> Back to Portal
          </Link>
          <div style={{ flex: 1 }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={28} color="var(--accent)" />
            Teacher Approvals
          </h1>
        </div>

        {/* Pending Section */}
        <div className="card" style={{ marginBottom: 32, padding: '32px 0' }}>
          <h2 className="card-title" style={{ padding: '0 32px', marginBottom: 24 }}>Pending Approvals ({pending.length})</h2>
          
          {pending.length === 0 ? (
            <p style={{ padding: '0 32px', color: 'var(--text-muted)' }}>No pending registrations.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px 32px', fontWeight: 500 }}>Teacher</th>
                    <th style={{ padding: '16px 32px', fontWeight: 500 }}>Contact</th>
                    <th style={{ padding: '16px 32px', fontWeight: 500 }}>Registered</th>
                    <th style={{ padding: '16px 32px', textAlign: 'right', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(teacher => (
                    <tr key={teacher.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background var(--transition)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="user-avatar-placeholder">{teacher.name.substring(0, 2).toUpperCase()}</div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{teacher.name}</div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 32px' }}>
                        <div style={{ color: 'var(--text-main)' }}>{teacher.email}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{teacher.phone || 'No phone'}</div>
                      </td>
                      <td style={{ padding: '16px 32px', color: 'var(--text-muted)' }}>{new Date(teacher.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '16px 32px', textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleUpdateStatus(teacher.id, 'approved', 'pending')}
                          style={{ background: 'var(--success)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-full)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, boxShadow: 'var(--shadow-sm)' }}
                        >
                          <Check size={16} /> Approve
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(teacher.id, 'rejected', 'pending')}
                          style={{ background: 'var(--bg-surface-hover)', color: 'var(--error)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 'var(--radius-full)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
                        >
                          <X size={16} /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Processed Section */}
        <div className="card" style={{ padding: '32px 0' }}>
          <h2 className="card-title" style={{ padding: '0 32px', marginBottom: 24 }}>Processed Teachers ({processed.length})</h2>
          
          {processed.length === 0 ? (
            <p style={{ padding: '0 32px', color: 'var(--text-muted)' }}>No processed teachers.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px 32px', fontWeight: 500 }}>Teacher</th>
                    <th style={{ padding: '16px 32px', fontWeight: 500 }}>Email</th>
                    <th style={{ padding: '16px 32px', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '16px 32px', textAlign: 'right', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processed.map(teacher => (
                    <tr key={teacher.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background var(--transition)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="user-avatar-placeholder" style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{teacher.name.substring(0, 2).toUpperCase()}</div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{teacher.name}</div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 32px', color: 'var(--text-muted)' }}>{teacher.email}</td>
                      <td style={{ padding: '16px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-main)' }}>
                          <span style={{ 
                            width: 8, height: 8, borderRadius: '50%', 
                            background: teacher.status === 'approved' ? 'var(--success)' : 'var(--error)',
                            boxShadow: `0 0 0 2px ${teacher.status === 'approved' ? 'var(--success-bg)' : 'var(--error-bg)'}`
                          }} />
                          {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                        </div>
                      </td>
                      <td style={{ padding: '16px 32px', textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        {teacher.status === 'approved' && (
                          <button 
                            onClick={() => {
                              if (window.confirm(`Revoke access for ${teacher.name}?`)) {
                                handleUpdateStatus(teacher.id, 'rejected', 'processed');
                              }
                            }}
                            style={{ background: 'var(--bg-surface-hover)', color: 'var(--error)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 'var(--radius-full)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
                          >
                            <Trash2 size={16} /> Revoke
                          </button>
                        )}
                        {teacher.status === 'rejected' && (
                          <button 
                            onClick={() => handleUpdateStatus(teacher.id, 'approved', 'processed')}
                            style={{ background: 'var(--bg-surface-hover)', color: 'var(--success)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 'var(--radius-full)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
                          >
                            <Check size={16} /> Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
