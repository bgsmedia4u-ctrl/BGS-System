import { useState, useEffect } from 'react';
import { getNotificationTemplates, notifyTeachers, getNotificationLog } from '../data/notifications';
import { getAllTeachers } from '../data/profileService';
import { Send, Users, FileText, CheckCircle, AlertCircle, Clock, X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotifyTeacherModal({ isOpen, onClose }) {
  const [activeSubTab, setActiveSubTab] = useState('compose'); // 'compose' | 'history'
  const [templates, setTemplates] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [variables, setVariables] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  async function loadData() {
    setLoading(true);
    try {
      const [tmplData, teacherData, logData] = await Promise.all([
        getNotificationTemplates(),
        getAllTeachers(),
        getNotificationLog()
      ]);
      setTemplates(tmplData || []);
      setTeachers(teacherData || []);
      setLogs(logData || []);

      if (tmplData && tmplData.length > 0) {
        setSelectedTemplateId(tmplData[0].template_id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }

  const currentTemplate = templates.find(t => t.template_id === selectedTemplateId);

  function handleSelectAllTeachers(e) {
    if (e.target.checked) {
      setSelectedTeacherIds(teachers.map(t => t.id));
    } else {
      setSelectedTeacherIds([]);
    }
  }

  function handleTeacherToggle(teacherId) {
    setSelectedTeacherIds(prev => 
      prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId]
    );
  }

  async function handleSendSms(e) {
    e.preventDefault();
    if (!selectedTemplateId) {
      toast.error('Please select an SMS template');
      return;
    }
    if (selectedTeacherIds.length === 0) {
      toast.error('Please select at least one teacher recipient');
      return;
    }

    setSending(true);
    try {
      const res = await notifyTeachers({
        templateId: selectedTemplateId,
        recipientIds: selectedTeacherIds,
        variables
      });

      const deliveredCount = Array.isArray(res?.results)
        ? res.results.filter(r => r.status === 'sent').length
        : selectedTeacherIds.length;
      toast.success(`SMS sent to ${deliveredCount} teacher(s)!`);
      setSelectedTeacherIds([]);
      setVariables({});
      
      // Refresh log
      const updatedLog = await getNotificationLog();
      setLogs(updatedLog);
      setActiveSubTab('history');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to send SMS notification');
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: 20
    }}>
      <div style={{
        background: 'var(--surface-card, #121c2d)',
        border: '1px solid var(--border-color, #23344e)',
        borderRadius: 12,
        width: '100%',
        maxWidth: 750,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        color: '#fff'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color, #23344e)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageSquare style={{ color: 'var(--color-gold-500, #c9a227)' }} size={22} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Teacher SMS Notification (MSG91)</h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8b9bb4',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sub-tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color, #23344e)',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <button
            onClick={() => setActiveSubTab('compose')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: activeSubTab === 'compose' ? 'transparent' : 'transparent',
              borderBottom: activeSubTab === 'compose' ? '2px solid var(--color-gold-500, #c9a227)' : '2px solid transparent',
              color: activeSubTab === 'compose' ? 'var(--color-gold-500, #c9a227)' : '#8b9bb4',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Send size={16} /> Send SMS
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: activeSubTab === 'history' ? 'transparent' : 'transparent',
              borderBottom: activeSubTab === 'history' ? '2px solid var(--color-gold-500, #c9a227)' : '2px solid transparent',
              color: activeSubTab === 'history' ? 'var(--color-gold-500, #c9a227)' : '#8b9bb4',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Clock size={16} /> Sent Log ({logs.length})
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {activeSubTab === 'compose' ? (
            <form onSubmit={handleSendSms} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Template Picker */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a0aec0', marginBottom: 6 }}>
                  Select DLT Approved Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 6,
                    background: '#0d1522',
                    border: '1px solid #23344e',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  {templates.map(t => (
                    <option key={t.template_id} value={t.template_id}>
                      {t.name} ({t.template_id})
                    </option>
                  ))}
                </select>
                {currentTemplate && (
                  <div style={{
                    marginTop: 8,
                    padding: 10,
                    borderRadius: 6,
                    background: 'rgba(201, 162, 39, 0.1)',
                    border: '1px dashed rgba(201, 162, 39, 0.3)',
                    fontSize: 12,
                    color: '#f5e9c8'
                  }}>
                    <strong>Template Preview:</strong> {currentTemplate.body_preview}
                  </div>
                )}
              </div>

              {/* Dynamic Variables */}
              {currentTemplate && currentTemplate.variable_count > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a0aec0', marginBottom: 6 }}>
                    Notice Message / Variable ({currentTemplate.variable_names?.[1] || 'Notice Text'})
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter notice details to fill into template variable..."
                    value={variables.var2 || ''}
                    onChange={(e) => setVariables(prev => ({ ...prev, var2: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 6,
                      background: '#0d1522',
                      border: '1px solid #23344e',
                      color: '#fff',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}

              {/* Teacher Recipients */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#a0aec0' }}>
                    Recipients ({selectedTeacherIds.length} selected)
                  </label>
                  <label style={{ fontSize: 12, color: 'var(--color-gold-500, #c9a227)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAllTeachers}
                      checked={teachers.length > 0 && selectedTeacherIds.length === teachers.length}
                    />
                    Select All Teachers
                  </label>
                </div>

                <div style={{
                  maxHeight: 180,
                  overflowY: 'auto',
                  border: '1px solid #23344e',
                  borderRadius: 6,
                  background: '#0d1522',
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  {teachers.map(t => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, padding: '4px 6px', borderRadius: 4 }}>
                      <input 
                        type="checkbox"
                        checked={selectedTeacherIds.includes(t.id)}
                        onChange={() => handleTeacherToggle(t.id)}
                      />
                      <span>{t.name}</span>
                      <span style={{ color: '#718096', fontSize: 12 }}>({t.phone || 'No phone'})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 6,
                    border: '1px solid #23344e',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--color-gold-500, #c9a227)',
                    color: '#0b1f3a',
                    fontWeight: 700,
                    cursor: sending ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Send size={16} /> {sending ? 'Sending...' : 'Send SMS via MSG91'}
                </button>
              </div>
            </form>
          ) : (
            /* History Subtab */
            <div>
              {logs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#718096' }}>
                  No SMS notifications sent yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #23344e', color: '#a0aec0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Date</th>
                      <th style={{ padding: '8px 12px' }}>Recipient</th>
                      <th style={{ padding: '8px 12px' }}>Template</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px 12px', color: '#a0aec0' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px' }}>{log.recipient_phone}</td>
                        <td style={{ padding: '8px 12px', color: '#c9a227' }}>{log.template_id}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: log.status === 'sent' ? 'rgba(30, 125, 50, 0.2)' : 'rgba(179, 38, 30, 0.2)',
                            color: log.status === 'sent' ? '#48bb78' : '#f56565'
                          }}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
