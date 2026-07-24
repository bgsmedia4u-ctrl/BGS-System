import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../utils/api';

const cardConfig = [
  {
    key: 'totalStudents',
    label: 'Total Students Enrolled',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    color: 'navy',
  },
  {
    key: 'totalPaid',
    label: 'Students — Paid',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'green',
  },
  {
    key: 'totalDue',
    label: 'Students — Fee Pending',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    color: 'amber',
  },
  {
    key: 'totalAmount',
    label: 'Total Fee Due Amount',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'red',
    prefix: '₹',
  },
];

const colorMap = {
  navy: { bg: 'bg-navy-50', text: 'text-navy-900', icon: 'text-navy-600', border: 'border-navy-200' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-900', icon: 'text-emerald-600', border: 'border-emerald-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-900', icon: 'text-amber-600', border: 'border-amber-200' },
  red: { bg: 'bg-red-50', text: 'text-red-900', icon: 'text-red-600', border: 'border-red-200' },
};

export default function Dashboard() {
  const [summary, setSummary] = useState({ totalStudents: 0, totalPaid: 0, totalDue: 0, totalAmount: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, chartRes] = await Promise.all([
        api.get('/fee/summary'),
        api.get('/fee/chart'),
      ]);
      setSummary(summaryRes.data);
      setChartData(chartRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-navy-900">{label}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gold-600">{payload[0].value}</span> students with fee due
          </p>
        </div>
      );
    }
    return null;
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
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of transportation and fee status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cardConfig.map((card) => {
          const colors = colorMap[card.color];
          return (
            <div
              key={card.key}
              className={`bg-white rounded-xl border ${colors.border} p-5 hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                  <p className={`text-2xl font-bold ${colors.text} mt-2`}>
                    {card.prefix || ''}{summary[card.key]?.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-navy-900">Fee Due by Route</h2>
          <p className="text-sm text-gray-500">Number of students with pending fee per route</p>
        </div>

        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            No routes with pending fees
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="route"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count > 0 ? '#c8922a' : '#1a3a5c'}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
