import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ routeNumber: '', routeName: '', stops: '' });
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/routes');
      setRoutes(res.data);
    } catch (err) {
      console.error('Fetch routes error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stops = form.stops.split(',').map(s => s.trim()).filter(Boolean);

    try {
      if (editId) {
        await api.put(`/routes/${editId}`, {
          routeNumber: form.routeNumber,
          routeName: form.routeName,
          stops,
        });
        showToast('Route updated');
      } else {
        await api.post('/routes', {
          routeNumber: form.routeNumber,
          routeName: form.routeName,
          stops,
        });
        showToast('Route added');
      }
      setForm({ routeNumber: '', routeName: '', stops: '' });
      setShowForm(false);
      setEditId(null);
      fetchRoutes();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save route', 'error');
    }
  };

  const startEdit = (route) => {
    setEditId(route.id);
    setForm({
      routeNumber: route.routeNumber,
      routeName: route.routeName,
      stops: route.stops.join(', '),
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete route "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/routes/${id}`);
      showToast('Route deleted');
      fetchRoutes();
    } catch (err) {
      showToast('Failed to delete', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Routes</h1>
          <p className="text-sm text-gray-500 mt-1">{routes.length} routes configured</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ routeNumber: '', routeName: '', stops: '' }); }}
          className="no-print inline-flex items-center gap-2 px-4 py-2.5 bg-gold-500 text-white text-sm font-semibold rounded-lg hover:bg-gold-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Route
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="add-form bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-navy-900 mb-4">{editId ? 'Edit Route' : 'Add New Route'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Route Number (e.g., Route 02)"
              required
              value={form.routeNumber}
              onChange={(e) => setForm({ ...form, routeNumber: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
            <input
              type="text"
              placeholder="Route Name"
              required
              value={form.routeName}
              onChange={(e) => setForm({ ...form, routeName: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
            <input
              type="text"
              placeholder="Stops (comma-separated)"
              value={form.stops}
              onChange={(e) => setForm({ ...form, stops: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-navy-900 text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors"
              >
                {editId ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Routes Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-900 text-white">
                <th className="px-4 py-3 text-left font-semibold">Route Number</th>
                <th className="px-4 py-3 text-left font-semibold">Route Name</th>
                <th className="px-4 py-3 text-left font-semibold">Stops</th>
                <th className="px-4 py-3 text-center font-semibold w-48 no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {routes.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-navy-50 text-navy-700 text-xs font-semibold rounded-full">{r.routeNumber}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-navy-900">{r.routeName}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {r.stops.slice(0, 5).map((stop, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{stop}</span>
                      ))}
                      {r.stops.length > 5 && (
                        <span className="px-2 py-0.5 bg-gold-50 text-gold-700 text-xs rounded font-medium">+{r.stops.length - 5} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 no-print">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => navigate(`/routes/${r.id}/sheet`)}
                        className="px-3 py-1.5 text-xs font-medium text-gold-700 bg-gold-50 hover:bg-gold-100 rounded-lg transition-colors"
                        title="View Route Sheet"
                      >
                        Sheet
                      </button>
                      <button onClick={() => startEdit(r)} className="p-1.5 text-navy-600 hover:bg-navy-50 rounded transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(r.id, r.routeName)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {routes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                    No routes configured. Add a route to get started.
                  </td>
                </tr>
              )}
            </tbody>
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
