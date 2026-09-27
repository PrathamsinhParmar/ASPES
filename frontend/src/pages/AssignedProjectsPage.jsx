import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';
import {
  RectangleStackIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
  QueueListIcon,
  CheckBadgeIcon,
  PresentationChartLineIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { useNotifications } from '../context/NotificationContext';
import NotificationPanel from '../components/Notification/NotificationPanel';
import { formatLanguageName } from '../utils/languageFormatter';

const statusColorMap = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  submitted: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30',
  under_evaluation: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30',
  evaluated: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30',
  published: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/30',
  returned: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30',
};

const AssignedProjectsPage = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'notifications'
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Redirect students away
  useEffect(() => {
    const role = (user?.role || '').toUpperCase();
    if (user && role !== 'PROFESSOR' && role !== 'FACULTY' && role !== 'ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/projects/assigned');
        setProjects(res.data);
      } catch (err) {
        setError('Failed to load assigned projects.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssigned();
  }, []);

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.team_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.course_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: projects.length,
    pending: projects.filter(p => ['submitted', 'under_evaluation'].includes(p.status?.toLowerCase())).length,
    evaluated: projects.filter(p => ['evaluated', 'published'].includes(p.status?.toLowerCase())).length,
    avgScore: (() => {
      const scored = projects.filter(p => p.total_score != null);
      if (!scored.length) return null;
      return (scored.reduce((s, p) => s + p.total_score, 0) / scored.length).toFixed(1);
    })(),
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 min-h-screen bg-slate-50/50 dark:bg-slate-950 animate-fade-in relative font-sans max-w-7xl mx-auto">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 dark:bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10 translate-x-1/2 -translate-y-1/2" />

      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs flex-shrink-0">
            <RectangleStackIcon className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Assigned Projects</h1>
            <p className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400 mt-0.5">Projects submitted by students assigned to you</p>
          </div>
        </div>
        {/* Search bar */}
        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-all"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Projects', value: stats.total, icon: DocumentDuplicateIcon, color: 'blue' },
          { label: 'Pending Review', value: stats.pending, icon: QueueListIcon, color: 'amber', badge: '↑ Queue' },
          { label: 'Successfully Scored', value: stats.evaluated, icon: CheckBadgeIcon, color: 'emerald' },
          { label: 'Global Average', value: stats.avgScore ?? '0', icon: PresentationChartLineIcon, color: 'indigo' },
        ].map(({ label, value, icon: Icon, color, badge }) => (
          <div key={label} className="group relative overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_20px_-2px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200 cursor-default flex justify-between items-center">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
              <div className="flex items-center gap-2.5">
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
                {badge && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                    {badge}
                  </span>
                )}
              </div>
            </div>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-${color}-50 dark:bg-${color}-950/60 border border-${color}-100/80 dark:border-${color}-800/50 shadow-xs group-hover:-translate-y-0.5 transition-transform duration-200 flex-shrink-0`}>
              <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 text-${color}-600 dark:text-${color}-400`} />
            </div>
          </div>
        ))}
      </div>

      {/* Faculty View Tab Switcher */}
      <div className="inline-flex items-center p-1 bg-slate-200/60 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs gap-1">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            activeTab === 'projects'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <RectangleStackIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>Assigned Projects List</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
            activeTab === 'projects'
              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40'
              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            activeTab === 'notifications'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <BellIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>Submission Notifications & Directives</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Render either NotificationPanel or Projects Table */}
      {activeTab === 'notifications' ? (
        <NotificationPanel />
      ) : error ? (
        <div className="text-center py-16 text-rose-500 font-semibold">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-10 sm:p-12 text-center shadow-sm">
          <ClipboardDocumentListIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-white">No assigned projects yet</p>
          <p className="text-xs text-slate-400 mt-1">Projects submitted by students selecting you as faculty will appear here.</p>
        </div>
      ) : (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_24px_rgba(0,0,0,0.35)] rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80">
          <div className="px-5 py-3 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <ClipboardDocumentListIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">Student Project Submissions</h3>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/40 px-2.5 py-0.5 rounded-md">{filtered.length} projects</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/70 dark:divide-slate-800/70">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800/60">
                <tr>
                  {['#', 'Project', 'Language', 'Team', 'Submitted', 'Status', 'AI Score', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((project, index) => (
                  <tr key={project.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-150 group">
                    <td className="px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[200px]">{project.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{formatLanguageName(project.course_name) || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{project.team_name || '—'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {project.created_at ? format(new Date(project.created_at), 'MMM dd, yyyy') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 inline-flex text-[11px] leading-4 font-semibold rounded-md ${statusColorMap[project.status?.toLowerCase()] || statusColorMap.draft}`}>
                        {(project.status || 'draft').replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {project.total_score != null ? (
                        <span className={`text-xs sm:text-sm font-bold ${project.total_score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : project.total_score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {Number(project.total_score).toFixed(1)} <span className="text-slate-400 font-normal text-[11px]">/ 100</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-150"
                      >
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedProjectsPage;
