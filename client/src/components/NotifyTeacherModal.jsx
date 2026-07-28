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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: 20
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        width: '100%',
        maxWidth: 750,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        color: '#1a1515'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fdf8f8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FCEFEF', color: 'var(--maroon-900, #7A1A1A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--maroon-900, #7A1A1A)' }}>Teacher SMS Notification</h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sub-tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#fafafa'
        }}>
          <button
            onClick={() => setActiveSubTab('compose')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSubTab === 'compose' ? '2px solid var(--maroon-900, #7A1A1A)' : '2px solid transparent',
              color: activeSubTab === 'compose' ? 'var(--maroon-900, #7A1A1A)' : '#94a3b8',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              transition: 'all 0.2s'
            }}
          >
            <Send size={16} /> Compose SMS
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSubTab === 'history' ? '2px solid var(--maroon-900, #7A1A1A)' : '2px solid transparent',
              color: activeSubTab === 'history' ? 'var(--maroon-900, #7A1A1A)' : '#94a3b8',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              transition: 'all 0.2s'
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                  Select DLT Approved Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#f9fafb',
                    border: '1px solid #e2e8f0',
                    color: '#1a1515',
                    outline: 'none',
                    fontSize: 14
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
                    padding: 12,
                    borderRadius: 8,
                    background: '#fdf8f8',
                    border: '1px dashed rgba(122, 26, 26, 0.25)',
                    fontSize: 13,
                    color: '#7A1A1A',
                    lineHeight: 1.5
                  }}>
                    <strong>Template Preview:</strong> {currentTemplate.body_preview}
                  </div>
                )}
              </div>

              {/* Dynamic Variables */}
              {currentTemplate && currentTemplate.variable_count > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
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
                      borderRadius: 8,
                      background: '#f9fafb',
                      border: '1px solid #e2e8f0',
                      color: '#1a1515',
                      outline: 'none',
                      resize: 'vertical',
                      fontSize: 14
                    }}
                  />
                </div>
              )}

              {/* Teacher Recipients */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                    Recipients ({selectedTeacherIds.length} selected)
                  </label>
                  <label style={{ fontSize: 12, color: 'var(--maroon-900, #7A1A1A)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAllTeachers}
                      checked={teachers.length > 0 && selectedTeacherIds.length === teachers.length}
                      style={{ accentColor: 'var(--maroon-900, #7A1A1A)' }}
                    />
                    Select All Teachers
                  </label>
                </div>

                <div style={{
                  maxHeight: 180,
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  background: '#f9fafb',
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  {teachers.map(t => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, padding: '6px 8px', borderRadius: 6, background: selectedTeacherIds.includes(t.id) ? '#FCEFEF' : 'transparent', transition: 'all 0.15s' }}>
                      <input 
                        type="checkbox"
                        checked={selectedTeacherIds.includes(t.id)}
                        onChange={() => handleTeacherToggle(t.id)}
                        style={{ accentColor: 'var(--maroon-900, #7A1A1A)' }}
                      />
                      <span style={{ fontWeight: 500, color: '#1a1515' }}>{t.name}</span>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>({t.phone || 'No phone'})</span>
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
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 14
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--maroon-900, #7A1A1A)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: sending ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    boxShadow: '0 2px 8px rgba(122,26,26,0.25)',
                    transition: 'all 0.2s'
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
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  No SMS notifications sent yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 500 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Recipient</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Template</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 500 }}>{log.recipient_phone}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--maroon-900, #7A1A1A)', fontWeight: 500 }}>{log.template_id}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              background: log.status === 'sent' ? '#D1FAE5' : '#FEE2E2',
                              color: log.status === 'sent' ? '#065F46' : '#991B1B'
                            }}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
