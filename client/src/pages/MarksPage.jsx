import Layout from '../components/Layout';
import { PenLine, Clock, Sparkles } from 'lucide-react';

export default function MarksPage() {
  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Enter Marks</h1>
        <p className="page-subtitle">BGS Sidlaghatta</p>
      </div>
      <div className="page-body fade-in">
        <div className="card" style={{
          textAlign: 'center',
          padding: '80px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(147, 31, 31, 0.15), rgba(168, 36, 36, 0.08))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PenLine size={36} style={{ color: 'var(--navy-400)' }} />
          </div>

          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Coming Soon
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 420, lineHeight: 1.7 }}>
              The <strong style={{ color: 'var(--text-secondary)' }}>Enter Marks</strong> feature is currently under development.
              You will be able to enter exam marks for each student, class-wise, with automatic grade calculation.
            </p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            padding: '10px 20px',
            borderRadius: 10,
            marginTop: 8,
          }}>
            <Clock size={16} style={{ color: 'var(--warning)' }} />
            <span style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 600 }}>Expected launch: Next update</span>
          </div>

          <div style={{
            marginTop: 16,
            display: 'flex', alignItems: 'center', gap: 8,
            color: 'var(--text-muted)', fontSize: 13,
          }}>
            <Sparkles size={14} />
            <span>Planned features: Student marks entry, Grade calculation, Report cards</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
