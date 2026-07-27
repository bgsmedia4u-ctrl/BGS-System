import React from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { FileText, Shield, Check, ArrowLeft, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../layout.css';

export default function TermsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const content = (
    <div className="card" style={{ maxWidth: 880, margin: '0 auto', padding: 40, background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '2px solid var(--border-color)', paddingBottom: 20, marginBottom: 30 }}>
        <div style={{ width: 54, height: 54, borderRadius: '14px', background: '#FCEFEF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--maroon-900)' }}>
          <FileText size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--maroon-900)' }}>Institutional Terms & Conditions</h1>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>BGS Public School & PU College • Staff Portal Terms of Use</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: 'var(--text-main)', lineHeight: 1.6, fontSize: 15 }}>
        <section>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--maroon-900)', marginBottom: 12 }}>
            1. Authorized Access & Account Security
          </h2>
          <p>
            Access to this portal is restricted exclusively to active teaching staff, department coordinators, and institutional administrators of BGS Public School & PU College, Shidlaghatta. You are responsible for safeguarding your login credentials and ensuring all academic logs submitted under your profile are accurate and timely.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--maroon-900)', marginBottom: 12 }}>
            2. Academic Integrity & Marks Confidentiality
          </h2>
          <p>
            Assessment records and student mark entries are highly sensitive pedagogical records. Teachers must only enter, view, and modify student grades for subjects within their assigned supervisory purview. Administrators are bound by institutional policy and technical restrictions from overriding or accessing standalone student grades without explicit faculty authorization.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--maroon-900)', marginBottom: 12 }}>
            3. Timetable, Leave & Assembly Protocol
          </h2>
          <p>
            Faculty members are required to observe the official timetable schedules. Notice that the 9:30 AM – 9:45 AM window is dedicated to institutional College Prayer Assembly and takes precedence over all classroom lectures. Free-period calculations and replacement substitutions are calculated dynamically based on database schedules.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--maroon-900)', marginBottom: 12 }}>
            4. SMS Broadcast Regulation
          </h2>
          <p>
            The integrated MSG91 SMS gateway is provided solely for urgent institutional attendance notices, parent alerts, and formal staff meeting summons. Misuse of the messaging gateway for personal or non-academic broadcasting is strictly prohibited and subject to institutional audit.
          </p>
        </section>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>By accessing the portal, you agree to abide by these institutional policies.</span>
          <button 
            onClick={() => navigate(-1)} 
            style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );

  if (user) {
    return (
      <Layout>
        <div className="page-body fade-in">
          {content}
        </div>
      </Layout>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <img src="/Logo-removebg-preview.png" alt="BGS Logo" style={{ width: 64, height: 64, objectFit: 'contain', background: '#fff', borderRadius: '50%', padding: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'inline-block' }} />
        <h2 style={{ color: 'var(--maroon-900)', margin: '10px 0 0 0', fontWeight: 700 }}>BGS Teachers Portal</h2>
      </div>
      {content}
    </div>
  );
}
