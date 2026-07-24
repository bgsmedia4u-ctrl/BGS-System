import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

export default function Fee() {
  const [feeData, setFeeData] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRoute, setFilterRoute] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [feeRes, routesRes, classesRes] = await Promise.all([
        api.get('/fee', { params: { route: filterRoute, class: filterClass, status: filterStatus } }),
        api.get('/routes'),
        api.get('/students/classes'),
      ]);
      setFeeData(feeRes.data);
      setRoutes(routesRes.data);
      setClasses(classesRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterRoute, filterClass, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEdit = (studentId, currentFee) => {
    setEditId(studentId);
    setEditValue(currentFee.toString());
  };

  const saveFee = async (studentId) => {
    setSaving(true);
    try {
      await api.put(`/fee/${studentId}`, { feeDue: parseFloat(editValue) || 0 });
      setEditId(null);
      showToast('Fee updated and synced');
      fetchData();
    } catch (err) {
      showToast('Failed to update fee', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e, studentId) => {
    if (e.key === 'Enter') saveFee(studentId);
    if (e.key === 'Escape') setEditId(null);
  };

  const getStatusBadge = (status) => {
    const styles = {
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      due: 'bg-red-50 text-red-700 border-red-200',
      partial: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return styles[status] || styles.paid;
  };

  const totalDue = feeData.reduce((sum, f) => sum + (f.feeDue || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Print header */}
      <div className="print-header hidden">
        <h1>BGS Public School &amp; PU College</h1>
        <p>Fee Status Report</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Fee Management</h1>
          <p className="text-sm text-gray-500 mt-1">{feeData.length} records â€” Total due: â‚¹{totalDue.toLocaleString('en-IN')}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-lg hover:bg-navy-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={filterRoute}
          onChange={(e) => setFilterRoute(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
        >
          <option value="">All Routes</option>
          {routes.map(r => (
            <option key={r.id} value={r.routeNumber}>{r.routeNumber}</option>
          ))}
        </select>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
        >
          <option value="">All Classes</option>
          {classes.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="due">Due</option>
          <option value="partial">Partial</option>
        </select>
        {(filterRoute || filterClass || filterStatus) && (
          <button
            onClick={() => { setFilterRoute(''); setFilterClass(''); setFilterStatus(''); }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-900 text-white">
                <th className="px-4 py-3 text-left font-semibold w-12">#</th>
                <th className="px-4 py-3 text-left font-semibold">Student Name</th>
                <th className="px-4 py-3 text-left font-semibold">Class</th>
                <th className="px-4 py-3 text-left font-semibold">Route</th>
                <th className="px-4 py-3 text-left font-semibold">Place</th>
                <th className="px-4 py-3 text-right font-semibold w-36">Fee Due (â‚¹)</th>
                <th className="px-4 py-3 text-center font-semibold w-24">Status</th>
                <th className="px-4 py-3 text-center font-semibold w-20 no-print">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {feeData.map((f, idx) => (
                <tr key={f.studentId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-navy-900">{f.name}</td>
                  <td className="px-4 py-2.5 text-gray-700">{f.class}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 bg-navy-50 text-navy-700 text-xs font-medium rounded-full">{f.route}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{f.place}</td>
                  <td className="px-4 py-2.5 text-right">
                    {editId === f.studentId ? (
                      <input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, f.studentId)}
                        autoFocus
                        className="fee-input w-28"
                      />
                    ) : (
                      <span className={`font-medium ${f.feeDue > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                        {f.feeDue > 0 ? `â‚¹${f.feeDue.toLocaleString('en-IN')}` : 'â€”'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {f.feeDue === 0 ? (
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        Paid
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-center no-print">
                    {editId === f.studentId ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => saveFee(f.studentId)}
                          disabled={saving}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Save"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                          title="Cancel"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(f.studentId, f.feeDue)}
                        className="p-1.5 text-navy-600 hover:bg-navy-50 rounded transition-colors"
                        title="Edit fee"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {feeData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No fee records found.
                  </td>
                </tr>
              )}
            </tbody>
            {feeData.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={5} className="px-4 py-3 text-right text-navy-900">Total</td>
                  <td className="px-4 py-3 text-right text-navy-900">â‚¹{totalDue.toLocaleString('en-IN')}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
