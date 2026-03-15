import React, { useState, useEffect } from 'react';
import { evaluationService } from '../../services/evaluationService';
import StatCard from './StatCard';
import {
  ServerIcon,
  ChartPieIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await evaluationService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch admin statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex justify-center items-center h-full"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>;
  }

  if (!stats) return <div className="p-6 text-red-500">Failed to load system metrics.</div>;

  // Transform grade distribution dictionary into array for Recharts
  const gradeData = Object.keys(stats.grade_distribution || {}).map(grade => ({
    name: grade,
    count: stats.grade_distribution[grade]
  }));

  // Simple mock data for line chart (Projects Over Time) since API doesn't return time series yet
  const mockTimeData = [
    { name: 'Mon', projects: 4 },
    { name: 'Tue', projects: 9 },
    { name: 'Wed', projects: 12 },
    { name: 'Thu', projects: 8 },
    { name: 'Fri', projects: 15 },
    { name: 'Sat', projects: 5 },
    { name: 'Sun', projects: 2 }
  ];

  // Pie chart flag data
  const flagData = [
    { name: 'Clean', value: stats.total_evaluations - stats.ai_detection_flags - stats.plagiarism_flags, color: '#10B981' }, // emerald-500
    { name: 'AI Gen Code', value: stats.ai_detection_flags, color: '#6366F1' }, // indigo-500
    { name: 'Plagiarized', value: stats.plagiarism_flags, color: '#EF4444' } // red-500
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in bg-gray-50 dark:bg-slate-950 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Command Center</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">System-wide metrics and pipeline health.</p>
        </div>
      </div>

      {/* Top Deck Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Processed"
          value={stats.total_evaluations}
          icon={<ServerIcon className="w-8 h-8" />}
          color="indigo"
        />
        <StatCard
          title="Avg Global Score"
          value={Math.round(stats.average_total_score * 10) / 10}
          icon={<AcademicCapIcon className="w-8 h-8" />}
          color="green"
        />
        <StatCard
          title="AI Code Flags"
          value={stats.ai_detection_flags}
          icon={<ChartPieIcon className="w-8 h-8" />}
          color="purple"
          trend="up"
          trendValue="System active"
        />
        <StatCard
          title="Plagiarism Flags"
          value={stats.plagiarism_flags}
          icon={<ExclamationTriangleIcon className="w-8 h-8" />}
          color="red"
          trend="down"
          trendValue="Violations Count"
        />
      </div>

      {/* Breakdown Averages */}
      <div className="bg-white dark:bg-slate-900 p-6 shadow-sm rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-around flex-wrap gap-4 transition-all hover:shadow-md">
        <div className="text-center group cursor-default px-4">
          <p className="text-sm font-medium text-gray-400 group-hover:text-gray-500 transition-colors">Code Quality</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors transform group-hover:scale-105">{stats.average_code_quality.toFixed(1)}</p>
        </div>
        <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 hidden md:block"></div>
        <div className="text-center group cursor-default px-4">
          <p className="text-sm font-medium text-gray-400 group-hover:text-gray-500 transition-colors">Documentation</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 transition-colors transform group-hover:scale-105">{stats.average_documentation.toFixed(1)}</p>
        </div>
        <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 hidden md:block"></div>
        <div className="text-center group cursor-default px-4">
          <p className="text-sm font-medium text-gray-400 group-hover:text-gray-500 transition-colors">Alignment</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-amber-600 transition-colors transform group-hover:scale-105">{stats.average_report_alignment.toFixed(1)}</p>
        </div>
        <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 hidden md:block"></div>
        <div className="text-center flex flex-col items-center group cursor-default px-4">
          <ShieldCheckIcon className="h-6 w-6 text-indigo-500 mb-1 transition-all duration-300 group-hover:scale-125 group-hover:rotate-6 group-hover:drop-shadow-glow" />
          <p className="text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">Celery Workers Active</p>
        </div>
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Grade Distribution Bar Chart */}
        <div className="bg-white dark:bg-slate-900 shadow rounded-xl p-6 border border-gray-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Grade Distribution</h3>
          <div className="h-64 sm:h-80 w-full relative">
            {gradeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E5E7EB'} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: isDark ? '#1E293B' : '#F3F4F6' }} 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderRadius: '12px', 
                      border: isDark ? '1px solid #1E293B' : 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      color: isDark ? '#F1F5F9' : '#0F172A'
                    }} 
                    itemStyle={{ color: isDark ? '#F1F5F9' : '#0F172A' }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-400">No grades assigned yet.</div>
            )}
          </div>
        </div>

        {/* AI vs Plag vs Clean Flags - Pie Chart */}
        <div className="bg-white dark:bg-slate-900 shadow rounded-xl p-6 border border-gray-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">System Anomaly Flags</h3>
          <div className="h-64 sm:h-80 w-full bg-white dark:bg-slate-900 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={flagData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {flagData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderRadius: '12px', 
                    border: isDark ? '1px solid #1E293B' : 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: isDark ? '#F1F5F9' : '#0F172A' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-gray-600 dark:text-gray-400 font-medium text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
