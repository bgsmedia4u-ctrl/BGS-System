import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

export default function RouteSheet() {
  const { id } = useParams();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(id || '');
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      fetchRouteData();
    }
  }, [selectedRoute]);

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/routes');
      setRoutes(res.data);
      if (id) {
        const found = res.data.find(r => r.id === id);
        if (found) {
          setSelectedRoute(found.routeNumber);
          setRouteInfo(found);
        }
      }
    } catch (err) {
      console.error('Fetch routes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRouteData = async () => {
    try {
      const [studentsRes, feeRes] = await Promise.all([
        api.get('/students', { params: { route: selectedRoute } }),
        api.get('/fee', { params: { route: selectedRoute } }),
      ]);

      setStudents(studentsRes.data);

      const info = routes.find(r => r.routeNumber === selectedRoute);
      setRouteInfo(info);

      // Build fee map
      const feeMap = {};
      feeRes.data.forEach(f => {
        feeMap[f.studentId] = f.feeDue || 0;
      });
      setFees(feeMap);
    } catch (err) {
      console.error('Fetch route data error:', err);
    }
  };

  const updateFee = (studentId, value) => {
    setFees(prev => ({
      ...prev,
      [studentId]: value === '' ? '' : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = students.map(s => ({
        studentId: s.id,
        feeDue: parseFloat(fees[s.id]) || 0,
      }));

      await api.put('/fee/bulk/update', { updates });
      showToast('Fee records saved and synced');
      fetchRouteData();
    } catch (err) {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const lines = [`*${selectedRoute} — Fee Due Report*`, `*BGS Public School & PU College*`, ''];
    let total = 0;

    students.forEach((s, i) => {
      const fee = parseFloat(fees[s.id]) || 0;
      if (fee > 0) {
        lines.push(`${i + 1}. ${s.name} (${s.place}) — ₹${fee}`);
        total += fee;
      }
    });

    if (total === 0) {
      lines.push('No pending fees for this route.');
    } else {
      lines.push('');
      lines.push(`*Total Due: ₹${total}*`);
    }

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const totalDue = students.reduce((sum, s) => sum + (parseFloat(fees[s.id]) || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Print header (hidden on screen) */}
      <div className="print-header hidden">
        <h1>BGS Public School &amp; PU College</h1>
        <p>{selectedRoute} — Fee Due Sheet</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 no-print">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Route Sheet</h1>
          <p className="text-sm text-gray-500 mt-1">View and edit fee due amounts by route</p>
        </div>
      </div>

      {/* Route selector */}
      <div className="no-print bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Route</label>
        <select
          value={selectedRoute}
          onChange={(e) => setSelectedRoute(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
        >
          <option value="">— Choose a route —</option>
          {routes.map(r => (
            <option key={r.id} value={r.routeNumber}>{r.routeNumber} — {r.routeName}</option>
          ))}
        </select>
      </div>

      {selectedRoute && students.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
            <span className="px-3 py-1.5 bg-navy-50 text-navy-700 rounded-lg font-medium">
              {students.length} Students
            </span>
            <span className={`px-3 py-1.5 rounded-lg font-medium ${totalDue > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              Total Due: ₹{totalDue.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900 text-white">
                    <th className="px-4 py-3 text-left font-semibold w-12">#</th>
                    <th className="px-4 py-3 text-left font-semibold">Student Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Place / Stop</th>
                    <th className="px-4 py-3 text-right font-semibold w-40">Fee Due (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-navy-900">{s.name}</td>
                      <td className="px-4 py-2.5 text-gray-700">{s.place}</td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={fees[s.id] ?? 0}
                          onChange={(e) => updateFee(s.id, e.target.value)}
                          className="fee-input no-print"
                        />
                        <span className="hidden print:inline text-right">{fees[s.id] || 0}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={3} className="px-4 py-3 text-right text-navy-900">Total</td>
                    <td className="px-4 py-3 text-right text-navy-900">₹{totalDue.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div className="no-print flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 text-white text-sm font-semibold rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-60"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-lg hover:bg-navy-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Share via WhatsApp
            </button>
          </div>
        </>
      )}

      {selectedRoute && students.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No students found for {selectedRoute}
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
