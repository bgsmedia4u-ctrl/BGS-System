import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ name: '', class: '', route: '', place: '', phone: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, routesRes, classesRes] = await Promise.all([
        api.get('/students', { params: { search, class: filterClass, route: filterRoute } }),
        api.get('/routes'),
        api.get('/students/classes'),
      ]);
      setStudents(studentsRes.data);
      setRoutes(routesRes.data);
      setClasses(classesRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, filterRoute]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students', {
        name: form.name,
        class: form.class,
        route: form.route,
        place: form.place,
        phone: form.phone,
      });
      setForm({ name: '', class: '', route: '', place: '', phone: '' });
      setShowForm(false);
      showToast('Student added successfully');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add student', 'error');
    }
  };

  const startEdit = (student) => {
    setEditId(student.id);
    setEditData({ ...student });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    try {
      await api.put(`/students/${editId}`, {
        name: editData.name,
        class: editData.class,
        route: editData.route,
        place: editData.place,
        phone: editData.phone,
      });
      setEditId(null);
      showToast('Student updated');
      fetchData();
    } catch (err) {
      showToast('Failed to update', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/students/${id}`);
      showToast('Student deleted');
      fetchData();
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
          <h1 className="text-xl font-bold text-navy-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">{students.length} students found</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="no-print inline-flex items-center gap-2 px-4 py-2.5 bg-gold-500 text-white text-sm font-semibold rounded-lg hover:bg-gold-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="add-form bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Add New Student</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Student Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
            <input
              type="text"
              placeholder="Class"
              required
              value={form.class}
              onChange={(e) => setForm({ ...form, class: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
            <select
              required
              value={form.route}
              onChange={(e) => setForm({ ...form, route: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
            >
              <option value="">Select Route</option>
              {routes.map((r) => (
                <option key={r.id} value={r.routeNumber}>{r.routeNumber} — {r.routeName}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Place / Stop"
              required
              value={form.place}
              onChange={(e) => setForm({ ...form, place: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-navy-900 text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterRoute}
          onChange={(e) => setFilterRoute(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
        >
          <option value="">All Routes</option>
          {routes.map((r) => (
            <option key={r.id} value={r.routeNumber}>{r.routeNumber}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-900 text-white">
                <th className="px-4 py-3 text-left font-semibold w-12">#</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Class</th>
                <th className="px-4 py-3 text-left font-semibold">Route</th>
                <th className="px-4 py-3 text-left font-semibold">Place / Stop</th>
                <th className="px-4 py-3 text-left font-semibold">Phone</th>
                <th className="px-4 py-3 text-center font-semibold no-print w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s, idx) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  {editId === s.id ? (
                    <>
                      <td className="px-4 py-2.5 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-2.5">
                        <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full px-2 py-1 border border-navy-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-navy-500" />
                      </td>
                      <td className="px-4 py-2.5">
                        <input value={editData.class} onChange={(e) => setEditData({ ...editData, class: e.target.value })}
                          className="w-full px-2 py-1 border border-navy-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-navy-500" />
                      </td>
                      <td className="px-4 py-2.5">
                        <select value={editData.route} onChange={(e) => setEditData({ ...editData, route: e.target.value })}
                          className="w-full px-2 py-1 border border-navy-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-navy-500">
                          {routes.map(r => <option key={r.id} value={r.routeNumber}>{r.routeNumber}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <input value={editData.place} onChange={(e) => setEditData({ ...editData, place: e.target.value })}
                          className="w-full px-2 py-1 border border-navy-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-navy-500" />
                      </td>
                      <td className="px-4 py-2.5">
                        <input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          className="w-full px-2 py-1 border border-navy-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-navy-500" />
                      </td>
                      <td className="px-4 py-2.5 no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Save">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors" title="Cancel">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-navy-900">{s.name}</td>
                      <td className="px-4 py-2.5 text-gray-700">{s.class}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 bg-navy-50 text-navy-700 text-xs font-medium rounded-full">{s.route}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{s.place}</td>
                      <td className="px-4 py-2.5 text-gray-700">{s.phone || '—'}</td>
                      <td className="px-4 py-2.5 no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => startEdit(s)} className="p-1.5 text-navy-600 hover:bg-navy-50 rounded transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No students found. Add a student to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
