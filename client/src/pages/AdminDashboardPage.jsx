import { useState } from 'react';
import Layout from '../components/Layout';
import { 
  Users, 
  Bus, 
  CheckCircle,
  MoreHorizontal,
  FileText,
  CalendarDays,
  Wrench
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import '../layout.css';

const attendanceData = [
  { name: '23 Sep', value: 86 },
  { name: '24 Sep', value: 92 },
  { name: '25 Sep', value: 96.5 },
  { name: '26 Sep', value: 90 },
  { name: '27 Sep', value: 89 },
  { name: '28 Sep', value: 93 },
  { name: '29 Sep', value: 98 },
];

const absentees = [
  { id: 'M-62358', name: 'Sarah Jenkins', grade: '10-A', parent: '555-0192', status: 'Unexcused', initials: 'SJ' },
  { id: 'M-62359', name: 'Marcus Chen', grade: '8-C', parent: '555-0844', status: 'Sick Leave', initials: 'MC' },
];

export default function AdminDashboardPage() {
  const [selectedDate] = useState('October 24, 2024');

  return (
    <Layout>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--maroon-900)' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>{selectedDate}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        
        {/* Main Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Top Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {/* Total Students */}
            <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', position: 'relative' }}>
              <div style={{ background: '#FCEFEF', color: 'var(--maroon-900)', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Users size={20} />
              </div>
              <div style={{ position: 'absolute', top: 20, right: 20, background: '#D1FAE5', color: '#065F46', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                ↑ 12
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 4 }}>Total Students</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--maroon-900)' }}>1,248</div>
            </div>

            {/* Total Staff */}
            <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--border-color)' }}>
              <div style={{ background: '#FCEFEF', color: 'var(--maroon-900)', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Users size={20} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 4 }}>Total Staff</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--maroon-900)' }}>86</div>
            </div>

            {/* Active Buses */}
            <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', position: 'relative' }}>
              <div style={{ background: 'var(--accent)', color: '#fff', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Bus size={20} />
              </div>
              <div style={{ position: 'absolute', top: 20, right: 20, background: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                1 Maint.
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 4 }}>Active Buses</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--maroon-900)' }}>14<span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/15</span></div>
            </div>

            {/* Today's Attendance */}
            <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--border-color)' }}>
              <div style={{ background: '#E0F2FE', color: '#0369A1', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <CheckCircle size={20} />
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 4 }}>Today's Attendance</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--maroon-900)' }}>94%</div>
            </div>
          </div>

          {/* Attendance Trends */}
          <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--maroon-900)', marginBottom: 4 }}>Attendance Trends</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Daily overview of student presence</p>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--maroon-900)' }}></div>
                  <span style={{ fontSize: '0.9rem' }}>Present</span>
                </div>
                <div style={{ background: '#F5F5F5', padding: '6px 12px', borderRadius: 6, fontSize: '0.85rem' }}>
                  Last 7 Days ▾
                </div>
              </div>
            </div>

            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--maroon-900)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--maroon-900)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(val) => `${val}%`} domain={[80, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="var(--maroon-900)" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Current Absentees */}
          <div style={{ background: 'var(--bg-surface)', padding: '24px 0', borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '0 24px' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--maroon-900)', marginBottom: 4 }}>Current Absentees</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Students marked absent today</p>
              </div>
              <button style={{ background: '#F5F5F5', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: '0.85rem', color: 'var(--maroon-900)', fontWeight: 500, cursor: 'pointer' }}>
                View All List
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', background: '#FAFAFA' }}>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>STUDENT PROFILE</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>GRADE/SECTION</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>PARENT CONTACT</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {absentees.map((abs, i) => (
                  <tr key={i} style={{ borderBottom: i !== absentees.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FCEFEF', color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                        {abs.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--maroon-900)' }}>{abs.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {abs.id}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--maroon-900)', fontWeight: 500 }}>{abs.grade}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-main)' }}>{abs.parent}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: 12, 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        background: abs.status === 'Unexcused' ? '#FEE2E2' : '#FEF3C7',
                        color: abs.status === 'Unexcused' ? '#991B1B' : '#92400E',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: abs.status === 'Unexcused' ? '#EF4444' : '#F59E0B' }}></div>
                        {abs.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Urgent Actions */}
          <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--maroon-900)' }}>Urgent Actions</h2>
                <span style={{ background: 'var(--maroon-900)', color: '#fff', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>3</span>
              </div>
              <MoreHorizontal size={18} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Action 1 */}
              <div style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 12, borderLeft: '4px solid #EF4444', background: '#FAFAFA' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--maroon-900)' }}>Fee Overdue</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>42 Students pending Q3 payment.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-main)' }}>View List</button>
                </div>
              </div>

              {/* Action 2 */}
              <div style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 12, borderLeft: '4px solid var(--maroon-900)', background: '#FAFAFA' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FCEFEF', color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--maroon-900)' }}>Leave Requests</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>5 Staff requests pending approval.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-main)' }}>Review All</button>
                </div>
              </div>

              {/* Action 3 */}
              <div style={{ padding: 16, border: '1px solid var(--accent)', borderRadius: 12, borderLeft: '4px solid var(--accent)', background: '#FFF7ED' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Wrench size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#92400E' }}>Maintenance Due</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Bus 04 requires scheduled service.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ background: '#fff', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-main)' }}>Schedule</button>
                </div>
              </div>
            </div>
          </div>

          {/* Course Schedule */}
          <div style={{ background: 'var(--maroon-900)', padding: 24, borderRadius: 16, color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>Course Schedule</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Today's planned activities</p>
              </div>
              <MoreHorizontal size={18} color="rgba(255,255,255,0.7)" style={{ cursor: 'pointer' }} />
            </div>

            {/* Date Picker */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              {[
                { m: 'SEP', d: '22', active: false },
                { m: 'SEP', d: '23', active: true },
                { m: 'SEP', d: '24', active: false },
                { m: 'SEP', d: '25', active: false },
                { m: 'SEP', d: '26', active: false }
              ].map((dt, i) => (
                <div key={i} style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 12px',
                  background: dt.active ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}>
                  <div style={{ fontSize: '0.7rem', opacity: dt.active ? 1 : 0.7, fontWeight: 600 }}>{dt.m}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{dt.d}</div>
                </div>
              ))}
            </div>

            {/* Schedule Item */}
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={24} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>Staff Briefing</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>Main Auditorium</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.2)', width: 'fit-content', padding: '4px 10px', borderRadius: 12 }}>
                    <CalendarDays size={12} /> 08:30 AM
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}
