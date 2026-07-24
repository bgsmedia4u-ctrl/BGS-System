import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function RouteList() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/routes');
      setRoutes(res.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const lines = ['*BGS Public School & PU College*', '*Bus Route List*', ''];

    routes.forEach((r) => {
      lines.push(`*${r.routeNumber} — ${r.routeName}*`);
      lines.push(`Stops: ${r.stops.join(', ')}`);
      lines.push('');
    });

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
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
      {/* Print header */}
      <div className="print-header hidden">
        <h1>BGS Public School &amp; PU College</h1>
        <p>Bus Route List</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Route Sheets</h1>
          <p className="text-sm text-gray-500 mt-1">All bus routes with stop details</p>
        </div>
        <div className="no-print flex gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white text-sm font-semibold rounded-lg hover:bg-navy-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share
          </button>
        </div>
      </div>

      {/* Route cards */}
      <div className="space-y-4">
        {routes.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 bg-navy-50 border-b border-navy-100 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-navy-900">{r.routeNumber}</span>
                <span className="text-sm text-gray-500 ml-2">— {r.routeName}</span>
              </div>
              <span className="text-xs font-medium text-navy-600 bg-navy-100 px-2.5 py-1 rounded-full">
                {r.stops.length} stops
              </span>
            </div>
            <div className="px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {r.stops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-700">{stop}</span>
                    {i < r.stops.length - 1 && (
                      <svg className="w-3 h-3 text-gold-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {routes.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            No routes configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
