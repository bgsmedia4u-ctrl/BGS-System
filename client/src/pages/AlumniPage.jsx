import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import Layout from '../components/Layout';
import { GraduationCap, Award, Briefcase, Search, Mail, Phone, Globe, Filter } from 'lucide-react';
import '../layout.css';

export default function AlumniPage() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAlumni();
  }, []);

  async function fetchAlumni() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('alumni').select('*');
      if (error && error.code !== '42P01') {
        console.warn('Alumni query info:', error.message);
      }
      setAlumni(data || []);
    } catch (e) {
      setAlumni([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredAlumni = alumni.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.batch_year?.toString().includes(searchTerm) ||
    a.current_role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">
            <GraduationCap size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 10, color: 'var(--maroon-900)' }} />
            BGS Institutional Alumni Network
          </h1>
          <p className="page-subtitle">Track graduated scholars, career progression, mentorship partnerships, and historical batches</p>
        </div>
      </div>

      <div className="page-body fade-in">
        <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 280 }}>
            <div className="search-bar" style={{ flex: 1, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Search size={18} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search by alumni name, batch year, or profession..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Querying graduate registries...</p>
          </div>
        ) : filteredAlumni.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
            {filteredAlumni.map((a, i) => (
              <div key={a.id || i} className="card" style={{ border: '1px solid var(--border-color)', padding: 22, borderRadius: 14 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--gold-500)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                    {a.name ? a.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--maroon-900)' }}>{a.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Batch of {a.batch_year || '2024'} • {a.stream || 'Science'}</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
                    <Briefcase size={16} color="var(--maroon-900)" />
                    <span><strong>Current Status:</strong> {a.current_role || 'Higher Studies'} at {a.organization || 'University'}</span>
                  </div>
                  {a.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <Mail size={15} /> {a.email}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <GraduationCap size={48} style={{ opacity: 0.3, margin: '0 auto 16px auto', color: 'var(--maroon-900)' }} />
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontWeight: 600 }}>No Alumni Records in Database</h3>
            <p style={{ maxWidth: 450, margin: '0 auto', fontSize: '0.9rem' }}>
              Historical student cohorts and alumni directory files will populate this registry as graduated classes are verified in the database.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
