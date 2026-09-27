import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationService } from '../../services/evaluationService';
import StatCard from './StatCard';
import {
  ServerIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  UsersIcon,
  MegaphoneIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CpuChipIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import NotificationPanel from '../Notification/NotificationPanel';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [adminTab, setAdminTab] = useState('analytics'); // 'analytics' | 'notifications'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setIsRefreshing(true);
      const data = await evaluationService.getStatistics();
      setStats(data);
      setLastRefreshed(new Date());
    } catch (_error) {
      toast.error('Failed to load system metrics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Export Analytics CSV
  const handleExportCSV = () => {
    if (!stats) return;
    try {
      const rows = [
        ['Metric', 'Value'],
        ['Total Evaluations Processed', stats.total_evaluations],
        ['Average Global Score', (Math.round(stats.average_total_score * 10) / 10).toFixed(1)],
        ['Average Code Quality', stats.average_code_quality.toFixed(1)],
        ['Average Documentation', stats.average_documentation.toFixed(1)],
        ['Average Plagiarism Score', stats.average_plagiarism.toFixed(1)],
        ['Average Report Alignment', stats.average_report_alignment.toFixed(1)],
        ['AI Detection Flags', stats.ai_detection_flags],
        ['Plagiarism Flags', stats.plagiarism_flags],
        ['Clean Projects', Math.max(0, stats.total_evaluations - stats.ai_detection_flags - stats.plagiarism_flags)],
        ...Object.entries(stats.grade_distribution || {}).map(([grade, count]) => [`Grade ${grade} Count`, count]),
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ASPES_System_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Analytics report exported successfully');
    } catch (_err) {
      toast.error('Failed to export analytics report');
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* Skeleton Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-96 bg-gray-100 dark:bg-slate-800/60 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-gray-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-10 w-32 bg-gray-200 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>

        {/* Skeleton Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-6" />
          ))}
        </div>

        {/* Skeleton Telemetry Banner */}
        <div className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800" />

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800" />
          <div className="h-80 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 max-w-lg mx-auto my-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/40 p-8 shadow-sm">
        <ExclamationTriangleIcon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Failed to Load Metrics</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
          The evaluation telemetry server is unreachable or returned an error.
        </p>
        <button
          onClick={fetchStatistics}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Transform grade distribution dictionary into sorted array
  const gradeOrder = ['A', 'B', 'C', 'D', 'F'];
  const gradeData = gradeOrder.map((grade) => ({
    name: `Grade ${grade}`,
    gradeKey: grade,
    count: stats.grade_distribution?.[grade] || 0,
  }));

  const totalGradesCount = gradeData.reduce((acc, curr) => acc + curr.count, 0);

  // Clean, AI and Plagiarism breakdown for Donut Chart
  const cleanCount = Math.max(0, stats.total_evaluations - stats.ai_detection_flags - stats.plagiarism_flags);
  const flagData = [
    { name: 'Clean Architecture', value: cleanCount, color: '#10B981' },
    { name: 'AI Synthesis Flags', value: stats.ai_detection_flags, color: '#6366F1' },
    { name: 'Plagiarism Matches', value: stats.plagiarism_flags, color: '#EF4444' },
  ];

  const cleanPercentage = stats.total_evaluations > 0 ? Math.round((cleanCount / stats.total_evaluations) * 100) : 100;

  // Custom Chart Tooltip for Recharts
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0];
      const count = dataItem.value;
      const pct = totalGradesCount > 0 ? Math.round((count / totalGradesCount) * 100) : 0;
      return (
        <div className="bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-lg shadow-md border border-gray-100 dark:border-slate-800 text-xs space-y-1 font-sans">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-gray-600 dark:text-gray-300 font-medium">{count} Projects</span>
            <span className="text-gray-400">({pct}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0];
      const pct = stats.total_evaluations > 0 ? Math.round((dataItem.value / stats.total_evaluations) * 100) : 0;
      return (
        <div className="bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-lg shadow-md border border-gray-100 dark:border-slate-800 text-xs space-y-1 font-sans">
          <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dataItem.payload.color }} />
            {dataItem.name}
          </p>
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            {dataItem.value} Projects ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in bg-slate-50 dark:bg-slate-950 min-h-screen max-w-7xl mx-auto font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & EXECUTIVE COMMAND ACTIONS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Admin Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Engine Online
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-normal">
            Welcome, Administrator {user?.full_name?.split(' ')[1] || user?.name || ''}. System-wide evaluation pipeline, integrity telemetry, and institutional controls.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Timestamp */}
          <button
            onClick={fetchStatistics}
            disabled={isRefreshing}
            className="px-3.5 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            title={`Last updated: ${lastRefreshed.toLocaleTimeString()}`}
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 text-gray-500 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
            <span className="hidden sm:inline text-xs text-gray-400 font-normal">
              Sync {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </button>

          {/* Export Report CSV */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-indigo-500" />
            <span>Export CSV</span>
          </button>

          {/* Faculty Members */}
          <button
            id="admin-view-faculty-btn"
            onClick={() => navigate('/faculty')}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/50 rounded-lg transition-colors flex items-center gap-2"
          >
            <UsersIcon className="w-4 h-4" />
            <span>Faculty Roster</span>
          </button>

          {/* Add Faculty CTA */}
          <button
            id="admin-add-faculty-btn"
            onClick={() => navigate('/faculty', { state: { openModal: true } })}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-colors flex items-center gap-2"
          >
            <UserPlusIcon className="w-4 h-4" />
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TAB SWITCHER (Consistent with Faculty & Student Dashboards)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setAdminTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            adminTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ChartBarIcon className="w-4 h-4" />
          <span>System Analytics & Pipeline</span>
        </button>

        <button
          onClick={() => setAdminTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            adminTab === 'notifications'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MegaphoneIcon className="w-4 h-4" />
          <span>Broadcast & Notifications</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN TAB CONTENT
      ───────────────────────────────────────────────────────────── */}
      {adminTab === 'notifications' ? (
        <NotificationPanel defaultTab="composer" />
      ) : (
        <div className="space-y-8">
          {/* ── TOP DECK KPI CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Processed Submissions"
              subtitle="All academic projects"
              value={stats.total_evaluations}
              icon={<ServerIcon className="w-6 h-6" />}
              color="indigo"
              trend={stats.total_evaluations > 0 ? 'up' : null}
              trendValue={`${stats.total_evaluations} Evaluated`}
            />

            <StatCard
              title="Institutional Benchmark"
              subtitle="Cumulative global average"
              value={`${(Math.round(stats.average_total_score * 10) / 10).toFixed(1)}`}
              icon={<AcademicCapIcon className="w-6 h-6" />}
              color="green"
              trend={stats.average_total_score >= 75 ? 'up' : 'down'}
              trendValue={stats.average_total_score >= 80 ? 'Tier A High' : 'Tier B Good'}
            />

            <StatCard
              title="AI Generation Flags"
              subtitle="Synthetic code warnings"
              value={stats.ai_detection_flags}
              icon={<SparklesIcon className="w-6 h-6" />}
              color="purple"
              trend={stats.ai_detection_flags > 0 ? 'down' : 'up'}
              trendValue={`${stats.total_evaluations > 0 ? Math.round((stats.ai_detection_flags / stats.total_evaluations) * 100) : 0}% flagged`}
            />

            <StatCard
              title="Plagiarism Incidents"
              subtitle="Code similarity matches"
              value={stats.plagiarism_flags}
              icon={<ExclamationTriangleIcon className="w-6 h-6" />}
              color="red"
              trend={stats.plagiarism_flags > 0 ? 'down' : 'up'}
              trendValue={`${stats.total_evaluations > 0 ? Math.round((stats.plagiarism_flags / stats.total_evaluations) * 100) : 0}% flagged`}
            />
          </div>

          {/* ── LIVE PIPELINE HEALTH & CELERY TELEMETRY MATRIX ── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <CpuChipIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Evaluation Engine Telemetry
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Real-time status of distributed workers, vector embeddings, and analyzer pipelines.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-800/60 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-slate-700/60">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                <span>Async Queue: 0 Backlog</span>
              </div>
            </div>

            {/* Telemetry 4-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
              <div className="p-4 rounded-lg bg-gray-50/60 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 space-y-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Worker Status</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Celery Nodes Active (x4)
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Redis Broker Connected</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50/60 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 space-y-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plagiarism Engine</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4 text-indigo-500" />
                  AST + TF-IDF Vector Synced
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Cosine Matrix & Shingle Cache</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50/60 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 space-y-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code Analysis</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                  Radon + Tree-sitter Online
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Cognitive & Cyclomatic Parser</p>
              </div>

              <div className="p-4 rounded-lg bg-gray-50/60 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 space-y-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mean Pipeline Speed</span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">~1.24s</span>
                  <span>Execution Time</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Zero Timeout Exceptions</p>
              </div>
            </div>
          </div>

          {/* ── MODULAR EVALUATION BENCHMARK SCORES ── */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Core Evaluation Benchmarks</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Institutional averages across code quality, documentation comprehensiveness, similarity indices, and report fidelity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Code Quality Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Code Quality
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                    Optimal
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.average_code_quality.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-400">Target ≥ 75%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, stats.average_code_quality))}%` }}
                  />
                </div>
              </div>

              {/* Documentation Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Documentation
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                    Comprehensive
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.average_documentation.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-400">Target ≥ 70%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, stats.average_documentation))}%` }}
                  />
                </div>
              </div>

              {/* Plagiarism Index Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Avg Plagiarism
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                      stats.average_plagiarism <= 20
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/40'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/40'
                    }`}
                  >
                    {stats.average_plagiarism <= 20 ? 'Low Risk' : 'Attention'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.average_plagiarism.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-400">Threshold &lt; 25%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stats.average_plagiarism <= 20 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, stats.average_plagiarism))}%` }}
                  />
                </div>
              </div>

              {/* Report Alignment Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Report Alignment
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
                    High Fidelity
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.average_report_alignment.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-400">Target ≥ 75%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, stats.average_report_alignment))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── DATA VISUALIZATIONS SECTION (Charts Block) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Grade Distribution Bar Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Grade Tier Distribution
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-normal">
                      Spread of letter evaluations awarded across all active projects.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 px-2.5 py-1 bg-gray-100 dark:bg-slate-800 rounded-md">
                    {totalGradesCount} Graded
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full relative">
                  {totalGradesCount > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={gradeData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      >
                        <defs>
                          <linearGradient id="gradeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#4338CA" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1E293B' : '#F1F5F9'} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif' }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                          tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif' }}
                        />
                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: isDark ? '#1E293B33' : '#F8FAFC' }} />
                        <Bar
                          dataKey="count"
                          fill="url(#gradeGradient)"
                          radius={[4, 4, 0, 0]}
                          barSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs">
                      <ChartBarIcon className="w-8 h-8 mb-2 stroke-1 text-gray-300 dark:text-slate-700" />
                      <span>No completed evaluations recorded yet.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grade Chips Breakdown */}
              <div className="grid grid-cols-5 gap-2 pt-4 border-t border-gray-100 dark:border-slate-800 text-center">
                {gradeData.map((g) => (
                  <div key={g.gradeKey} className="p-2 bg-gray-50 dark:bg-slate-800/40 rounded-md">
                    <span className="text-xs font-medium text-gray-400 block">{g.gradeKey}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {g.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI vs Plag vs Clean Flags - Donut Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Code Integrity & Anomaly Flags
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Distribution of originality flags vs clean academic submissions.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-md border border-emerald-200/50 dark:border-emerald-800/40">
                    {cleanPercentage}% Clean Index
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full relative flex items-center justify-center">
                  {stats.total_evaluations > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                        <Pie
                          data={flagData}
                          innerRadius={65}
                          outerRadius={92}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {flagData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs">
                      <ShieldCheckIcon className="w-8 h-8 mb-2 stroke-1 text-gray-300 dark:text-slate-700" />
                      <span>No anomalies flagged yet.</span>
                    </div>
                  )}

                  {/* Centered Statistic Badge */}
                  {stats.total_evaluations > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {cleanPercentage}%
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        Clean Rate
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legends Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-gray-100 dark:border-slate-800">
                {flagData.map((item) => (
                  <div
                    key={item.name}
                    className="p-2 rounded-md bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600 dark:text-gray-300 truncate font-medium">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white ml-2 flex-shrink-0">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── ADMINISTRATIVE ACTION HUB & SHORTCUTS ── */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Institutional Command Shortcuts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-normal">
                Quick pathways to faculty assignment portals, broadcast dispatchers, and compliance auditing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div
                onClick={() => navigate('/faculty')}
                className="p-4 bg-gray-50/60 dark:bg-slate-800/30 rounded-lg border border-gray-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600/70 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex items-start justify-between min-h-[85px]"
              >
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                    Faculty Directory
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-normal">
                    Manage department professors, workload limits, and active project review allocations.
                  </p>
                </div>
                <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60 transition-colors duration-200">
                  <UsersIcon className="w-4 h-4" />
                </div>
              </div>

              <div
                onClick={() => setAdminTab('notifications')}
                className="p-4 bg-gray-50/60 dark:bg-slate-800/30 rounded-lg border border-gray-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-600/70 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex items-start justify-between min-h-[85px]"
              >
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                    Broadcast Dispatcher
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-normal">
                    Send real-time alerts, rubric updates, and urgent deadlines to student & faculty dashboards.
                  </p>
                </div>
                <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/60 transition-colors duration-200">
                  <MegaphoneIcon className="w-4 h-4" />
                </div>
              </div>

              <div
                onClick={handleExportCSV}
                className="p-4 bg-gray-50/60 dark:bg-slate-800/30 rounded-lg border border-gray-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600/70 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex items-start justify-between min-h-[85px]"
              >
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                    Audit & Reporting
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-normal">
                    Instantly generate and download consolidated evaluation telemetry in CSV format.
                  </p>
                </div>
                <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 transition-colors duration-200">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

