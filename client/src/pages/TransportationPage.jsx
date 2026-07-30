import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';
import Layout from '../components/Layout';
import { Bus, Navigation, MapPin, Phone, Users, Shield, Plus, Search } from 'lucide-react';
import '../layout.css';

export default function TransportationPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRoutes();
  }, []);

  async function fetchRoutes() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('transport_routes').select('*');
      if (error && error.code !== '42P01') {
        console.warn('Transport routes query info:', error.message);
      }
      setRoutes(data || []);
    } catch (e) {
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredRoutes = routes.filter(r => 
    r.route_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">
            <Bus size={28} style={{ display: 'inline', verticalAlign: 'bottom', marginRight: 10, color: 'var(--maroon-900)' }} />
            Transportation & Fleet Logistics
          </h1>
          <p className="page-subtitle">Manage institutional bus networks, route trajectories, driver contacts, and vehicle assignments</p>
        </div>
      </div>

      <div className="page-body fade-in">
        <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-bar" style={{ width: 320, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search routes or drivers..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
            />
          </div>
          <button style={{ background: 'var(--maroon-900)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Plus size={18} /> Add Transport Route
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <div className="loading-spinner"><div className="spinner"></div></div>
          </div>
        ) : filteredRoutes.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 20 }}>
            {filteredRoutes.map((r, i) => (
              <div key={r.id || i} className="card" style={{ border: '1px solid var(--border-color)', padding: 22, borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FCEFEF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--maroon-900)' }}>
                      <Bus size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--maroon-900)' }}>{r.route_name || `Route #${i + 1}`}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vehicle No: {r.vehicle_number || 'BGS-BUS-01'}</span>
                    </div>
                  </div>
                  <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>Active Route</span>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                    <Navigation size={16} color="var(--gold-600)" />
                    <strong>Stops:</strong> {r.stops || 'Main Campus ↔ Shidlaghatta Town Circle'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                    <Users size={16} color="var(--maroon-900)" />
                    <strong>Driver:</strong> {r.driver_name || 'Staff Driver'} ({r.driver_phone || '555-0199'})
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bus size={48} style={{ opacity: 0.3, margin: '0 auto 16px auto', color: 'var(--maroon-900)' }} />
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontWeight: 600 }}>No Transportation Routes Configured</h3>
            <p style={{ maxWidth: 450, margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
              Institutional bus transportation routes, vehicle GPS logs, and driver itineraries will be displayed here once entered into the database.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
