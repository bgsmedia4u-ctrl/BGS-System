import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, UserCheck, Clock, UserX, Calendar, Filter, 
  ChevronDown, Search, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getBiometricRecords, getBiometricHistory } from '../api/biometricService';
import toast from 'react-hot-toast';
import { format, subDays, parseISO } from 'date-fns';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

export default function AdminAttendanceDashboard() {
  const [records, setRecords] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch last 7 days of records for charts, and all for table (ideally paginated, but fetching recent)
      const startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const data = await getBiometricRecords(startDate);
      setRecords(data);
      
      const hist = await getBiometricHistory();
      setHistory(hist.slice(0, 5)); // Last 5 uploads
    } catch (err) {
      console.error(err);
      toast.error('Failed to load biometric data');
    } finally {
      setLoading(false);
    }
  }

  // --- Derived Data for Charts & Metrics --- //
  
  const todayRecords = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return records.filter(r => r.date === today);
  }, [records]);

  const metrics = useMemo(() => {
    const total = todayRecords.length;
    const present = todayRecords.filter(r => r.status === 'Present').length;
    const late = todayRecords.filter(r => r.status === 'Late').length;
    const absent = todayRecords.filter(r => r.status === 'Absent').length;
    
    return {
      total,
      presentPct: total ? Math.round(((present + late) / total) * 100) : 0,
      late,
      absent
    };
  }, [todayRecords]);

  const trendData = useMemo(() => {
    // Group by date for the last 7 days
    const grouped = {};
    for (let i = 6; i >= 0; i--) {
      grouped[format(subDays(new Date(), i), 'yyyy-MM-dd')] = { Present: 0, Late: 0, Absent: 0 };
    }
    
    records.forEach(r => {
      if (grouped[r.date]) {
        grouped[r.date][r.status] = (grouped[r.date][r.status] || 0) + 1;
      }
    });

    return Object.entries(grouped).map(([date, counts]) => ({
      name: format(parseISO(date), 'MMM dd'),
      ...counts
    }));
  }, [records]);

  const deptData = useMemo(() => {
    const grouped = {};
    todayRecords.forEach(r => {
      const dept = r.profiles?.department || 'Unknown';
      if (!grouped[dept]) grouped[dept] = 0;
      grouped[dept]++;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [todayRecords]);

  // --- Filtered Records for Table --- //
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchDate = r.date === dateFilter;
      const matchStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchDept = deptFilter === 'All' || (r.profiles?.department || 'Unknown') === deptFilter;
      const matchSearch = (r.profiles?.name || r.staff_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      // If dateFilter is empty, show all. Otherwise strict match.
      return (!dateFilter || matchDate) && matchStatus && matchDept && matchSearch;
    });
  }, [records, dateFilter, statusFilter, deptFilter, searchQuery]);

  const departments = useMemo(() => {
    const depts = new Set(records.map(r => r.profiles?.department || 'Unknown'));
    return ['All', ...Array.from(depts)];
  }, [records]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Biometric Attendance</h1>
        <p className="text-[var(--text-secondary)] mt-1">Analytics and logs for staff attendance.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Tracked Today" value={metrics.total} icon={<Users size={24} />} color="text-blue-500" bg="bg-blue-500/10" />
        <MetricCard title="Present / Late" value={`${metrics.presentPct}%`} icon={<UserCheck size={24} />} color="text-green-500" bg="bg-green-500/10" />
        <MetricCard title="Late Arrivals" value={metrics.late} icon={<Clock size={24} />} color="text-yellow-500" bg="bg-yellow-500/10" />
        <MetricCard title="Absent" value={metrics.absent} icon={<UserX size={24} />} color="text-red-500" bg="bg-red-500/10" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6 text-[var(--text-primary)]">7-Day Attendance Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--surface-active)' }} contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="Present" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Late" stackId="a" fill="#F59E0B" />
                <Bar dataKey="Absent" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-6 text-[var(--text-primary)]">Today by Department</h3>
          <div className="h-[300px]">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--text-secondary)]">
                No data for today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[var(--border)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Attendance Logs</h3>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
              <input 
                type="text" 
                placeholder="Search name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full lg:w-48 pl-9 pr-4 py-2 bg-[var(--surface-active)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--primary)] outline-none"
              />
            </div>
            
            <input 
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-[var(--surface-active)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--primary)] outline-none"
            />
            
            <select 
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="px-4 py-2 bg-[var(--surface-active)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--primary)] outline-none appearance-none"
            >
              {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Depts' : d}</option>)}
            </select>
            
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-[var(--surface-active)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--primary)] outline-none appearance-none"
            >
              <option value="All">All Status</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-hover)] text-[var(--text-secondary)] text-sm tracking-wider">
                <th className="p-4 font-medium">Teacher</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Check In</th>
                <th className="p-4 font-medium">Check Out</th>
                <th className="p-4 font-medium">Hours</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((row, i) => (
                  <motion.tr 
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-[var(--surface-active)] text-[var(--text-primary)]"
                  >
                    <td className="p-4">
                      <div className="font-medium">{row.profiles?.name || row.staff_name || 'Unknown Staff'}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{row.profiles?.email || 'No Email'}</div>
                    </td>
                    <td className="p-4">{row.profiles?.department || '-'}</td>
                    <td className="p-4">{row.date}</td>
                    <td className="p-4">{row.check_in || '-'}</td>
                    <td className="p-4">{row.check_out || '-'}</td>
                    <td className="p-4">{row.working_hours ? `${row.working_hours}h` : '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        row.status === 'Present' ? 'bg-green-500/10 text-green-500' :
                        row.status === 'Late' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-secondary)]">
                    No records found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, bg }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 rounded-2xl flex items-center justify-between"
    >
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">{title}</p>
        <h4 className="text-3xl font-bold text-[var(--text-primary)]">{value}</h4>
      </div>
      <div className={`p-4 rounded-xl ${bg} ${color}`}>
        {icon}
      </div>
    </motion.div>
  );
}
