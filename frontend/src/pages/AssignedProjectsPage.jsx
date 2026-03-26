import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';
import {
  InboxArrowDownIcon,
  FolderOpenIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

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
  const navigate = useNavigate();
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
    <div className="p-5 sm:p-6 lg:p-8 space-y-6 min-h-screen bg-slate-50/50 dark:bg-slate-950 animate-fade-in relative">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 dark:bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10 translate-x-1/2 -translate-y-1/2" />

      {/* Header */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
            <InboxArrowDownIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Assigned Projects</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Projects submitted by students assigned to you</p>
          </div>
        </div>
        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-all"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Assigned', value: stats.total, icon: FolderOpenIcon, color: 'blue' },
          { label: 'Pending Review', value: stats.pending, icon: ClockIcon, color: 'amber' },
          { label: 'Evaluated', value: stats.evaluated, icon: CheckCircleIcon, color: 'emerald' },
          { label: 'Avg AI Score', value: stats.avgScore ?? '—', icon: SparklesIcon, color: 'indigo' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${color}-50 dark:bg-${color}-900/20`}>
                <Icon className={`w-5 h-5 text-${color}-500`} />
              </div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Projects Table */}
      {error ? (
        <div className="text-center py-16 text-rose-500 font-semibold">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center shadow-sm">
          <InboxArrowDownIcon className="w-14 h-14 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-base font-bold text-slate-700 dark:text-white">No assigned projects yet</p>
          <p className="text-sm text-slate-400 mt-1">Projects submitted by students selecting you as faculty will appear here.</p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Student Project Submissions</h3>
            <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{filtered.length} projects</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  {['#', 'Project', 'Language', 'Team', 'Submitted', 'Status', 'AI Score', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map((project, index) => (
                  <tr key={project.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5 transition-colors group">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-400 dark:text-slate-500">{index + 1}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[200px]">{project.title}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">{project.course_name || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{project.team_name || '—'}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {project.created_at ? format(new Date(project.created_at), 'MMM dd, yyyy') : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 inline-flex text-[10px] leading-4 font-bold rounded-md ${statusColorMap[project.status?.toLowerCase()] || statusColorMap.draft}`}>
                        {(project.status || 'draft').replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {project.total_score != null ? (
                        <span className={`text-sm font-extrabold ${project.total_score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : project.total_score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {Number(project.total_score).toFixed(1)} <span className="text-xs text-slate-400 font-medium">/ 100</span>
                        </span>
                      ) : (
                        <span className="text-sm text-slate-300 dark:text-slate-600 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
                        >
                          <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                          Details
                        </button>
                      </div>
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
