import React from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Shield, Lock, Eye, FileText, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import '../layout.css';

export default function PrivacyPolicyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const content = (
    <div className="card" style={{ maxWidth: 880, margin: '0 auto', padding: 40, background: '#fff', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '2px solid var(--border-color)', paddingBottom: 20, marginBottom: 30 }}>
        <div style={{ width: 54, height: 54, borderRadius: '14px', background: '#FCEFEF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--maroon-900)' }}>
          <Shield size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--maroon-900)' }}>Privacy Policy & Data Protection</h1>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>BGS Public School & PU College, Shidlaghatta • Last revised July 2026</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, color: 'var(--text-main)', lineHeight: 1.6, fontSize: 15 }}>
        <section>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Lock size={20} color="var(--gold-600)" /> 1. Overview of Data Processing
          </h2>
          <p>
            BGS Institutional Portal operates under strict educational confidentiality standards. We collect, store, and process staff profiles, academic attendance logs, lesson syllabi, and administrative schedules exclusively for facilitating educational operations, academic reporting, and institutional coordination.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Eye size={20} color="var(--gold-600)" /> 2. Information Collected & Visibility
          </h2>
          <p>
            <strong>Faculty Metadata:</strong> Full names, assigned academic departments, institutional email addresses, and phone contacts are maintained securely within our encrypted database.
            <br /><br />
            <strong>Academic Records & Marks Restriction:</strong> To enforce strict pedagogical integrity and student confidentiality, examination marks and assessment grades are strictly restricted. Only authorized subject teachers and faculty members directly responsible for assessment entry have read and write permission for mark ledgers. Administrative staff and general personnel are strictly prohibited from viewing individual student marks.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <FileText size={20} color="var(--gold-600)" /> 3. Third-Party Sharing & SMS Communications
          </h2>
          <p>
            We utilize verified telecommunication providers (MSG91) exclusively for delivering time-sensitive SMS alerts regarding institutional meetings, leave status updates, and emergency student absence notices to parents. Your phone number and institutional records are never traded, monetized, or transferred to third-party commercial advertisers.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--maroon-900)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle size={20} color="var(--gold-600)" /> 4. User Control & Rights
          </h2>
          <p>
            Staff members maintain total control over their personal display identifiers and academic subject designations. Via the personal <strong>Settings</strong> module, teachers may freely modify their full name and subject department at any time. For full account deletion or archived audit records, please contact the IT Administrator at Shidlaghatta Campus.
          </p>
        </section>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>© 2026 BGS Public School & PU College. All rights reserved.</span>
          <button 
            onClick={() => navigate(-1)} 
            style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ArrowLeft size={16} /> Return Back
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
