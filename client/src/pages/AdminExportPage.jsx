import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../api/supabase';
import { pdfService } from '../api/pdfService';
import Layout from '../components/Layout';
import { Download, Calendar, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatTopics } from '../utils/formatters';

export default function AdminExportPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reports, setReports] = useState([]);

  // Fetch reports automatically when date changes
  useEffect(() => {
    async function fetchReportsForDate() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('weekly_reports')
          .select(`
            *,
            profiles (name, email)
          `)
          .eq('report_date', selectedDate)
          .eq('status', 'submitted');

        if (error) throw error;
        setReports(data || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load reports for preview');
      } finally {
        setLoading(false);
      }
    }
    
    fetchReportsForDate();
  }, [selectedDate]);

  const handleExport = () => {
    if (reports.length === 0) {
      toast.error('No submitted reports found for this date.');
      return;
    }
    
    toast.success('Generating PDF...');
    pdfService.generateWeeklyReport(reports, selectedDate);
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Export Reports</h1>
        <p className="page-subtitle">Download submitted reports as a consolidated PDF</p>
      </div>

      <div className="page-body fade-in">
        <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
            <label className="form-label">
              <Calendar size={14} style={{ display: 'inline', marginRight: 6 }}/>
              Select Report Date
            </label>
            <input 
              type="date" 
              className="form-input" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleExport}
            disabled={loading || reports.length === 0}
            style={{ height: 42 }}
          >
            <Download size={16} /> 
            {loading ? 'Loading...' : `Export PDF (${reports.length} Reports)`}
          </button>
        </div>

        <div className="card">
          <h2 className="card-title" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} /> Preview: Submitted Reports on {selectedDate}
          </h2>
          
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : reports.length > 0 ? (
            <div className="table-container table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Teacher Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Topics Covered (Last Week)</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.profiles?.name}</td>
                      <td>{r.profiles?.email}</td>
                      <td style={{ color: 'var(--gold-500)', fontWeight: 500 }}>{r.subject || '-'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.topics_covered ? formatTopics(r.topics_covered).substring(0, 50) + '...' : 'None'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <p className="empty-state-text">No teachers have submitted reports for this date yet.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
