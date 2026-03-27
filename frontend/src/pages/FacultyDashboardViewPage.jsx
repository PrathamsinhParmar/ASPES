import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { projectService } from '../services/projectService';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  FolderIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  UserIcon,
  EnvelopeIcon,
  EyeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const API_BASE_URL = api.defaults.baseURL?.replace('/api/v1', '') ?? '';

const FacultyDashboardViewPage = () => {
  const { facultyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [faculty, setFaculty] = useState(null);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [facultyRes, projectRes] = await Promise.all([
          api.get(`/users/${facultyId}`),
          projectService.getAssignedProjects(0, 100, facultyId),
        ]);
        setFaculty(facultyRes.data);
        setAssignedProjects(projectRes);
      } catch (err) {
        setError('Failed to load faculty data. Make sure this is a valid faculty account.');
      } finally {
        setLoading(false);
      }
    };
    if (facultyId) fetchData();
  }, [facultyId]);

  const stats = {
    total: assignedProjects.length,
    pending: assignedProjects.filter(p => (p.status || '').toLowerCase() !== 'evaluated' && (p.status || '').toLowerCase() !== 'published').length,
    evaluated: assignedProjects.filter(p => (p.status || '').toLowerCase() === 'evaluated' || (p.status || '').toLowerCase() === 'published').length,
    avgScore: assignedProjects.length > 0 
      ? Math.round(assignedProjects.reduce((acc, curr) => acc + (curr.total_score || 0), 0) / assignedProjects.length) 
      : 0
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !faculty) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4 text-center min-h-screen bg-gray-50 dark:bg-slate-950">
        <ExclamationCircleIcon className="w-14 h-14 text-red-400" />
        <p className="text-gray-900 dark:text-white font-semibold">Error Loading Dashboard</p>
        <p className="text-sm text-gray-400">{error}</p>
        <button
          onClick={() => navigate('/faculty')}
          className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
        >
          ← Back to Faculty List
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in bg-gray-50 dark:bg-slate-950 min-h-screen">

      {/* Back Navigation */}
      <button
        onClick={() => navigate('/faculty')}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
      >
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Faculty List
      </button>

      {/* Read-Only Banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-700/30">
        <EyeIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <span className="font-semibold">Read-only view.</span> You are viewing this faculty dashboard as an administrator. No actions can be taken.
        </p>
      </div>

      {/* Faculty Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-5">
          {faculty.profile_photo ? (
            <img 
              src={`${API_BASE_URL}${faculty.profile_photo}?v=${new Date(faculty.updated_at || Date.now()).getTime()}`} 
              alt={faculty.full_name} 
              className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-indigo-500/10 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20 flex-shrink-0">
              {faculty.full_name?.[0]?.toUpperCase() || 'F'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{faculty.full_name}</h1>
            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
              {faculty.department || 'Faculty Member'}
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                <UserIcon className="w-4 h-4" />
                <span className="font-mono">{faculty.username}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                <EnvelopeIcon className="w-4 h-4" />
                {faculty.email}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                <AcademicCapIcon className="w-4 h-4" />
                Joined {faculty.created_at ? format(new Date(faculty.created_at), 'MMMM d, yyyy') : '—'}
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              faculty.is_active
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${faculty.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {faculty.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Stats Cards - Modern Horizontal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Assigned */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Total Assigned</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{stats.total}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <FolderIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Pending Review</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{stats.pending}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <ClockIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Evaluated */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Evaluated</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{stats.evaluated}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckBadgeIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Avg AI Score */}
        <div className="bg-indigo-600 rounded-3xl p-6 shadow-xl shadow-indigo-500/20 group relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-bold text-indigo-100/70 uppercase tracking-wider mb-1.5">Avg AI Score</p>
              <h3 className="text-3xl font-extrabold text-white leading-none">{stats.avgScore}<span className="text-sm font-bold opacity-50 ml-1">/100</span></h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:rotate-12 transition-transform">
              <ChartBarIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Projects — Read-only Table */}
      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Assigned Student Projects
          </h3>
          <span className="ml-auto text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full italic">Read-only View</span>
        </div>

        {assignedProjects.length === 0 ? (
          <div className="p-12 text-center">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-700 mb-3" />
            <p className="text-base font-medium text-gray-900 dark:text-white">No projects assigned</p>
            <p className="text-sm text-gray-400 mt-1">This faculty member has not been assigned any student projects yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
              <thead className="bg-gray-50/50 dark:bg-slate-800/50">
                <tr>
                  {['Count', 'Project', 'Language', 'Team', 'Date', 'Status', 'AI Score'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-4 text-left text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {assignedProjects.map((project, index) => (
                  <tr key={project.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5 transition-colors group">
                    <td className="px-4 py-4 text-base font-semibold text-slate-400 dark:text-slate-500">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                        {project.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        ID: {project.id?.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 capitalize">{project.course_name || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{project.team_name || '—'}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                      {project.created_at
                        ? format(new Date(project.created_at), 'MMM dd, yyyy')
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-3 py-1.5 inline-flex text-xs leading-4 font-bold rounded-md ${
                          project.status?.toLowerCase() === 'evaluated' || project.status?.toLowerCase() === 'published'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                            : project.status?.toLowerCase() === 'submitted'
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {(project.status || 'draft').replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {project.total_score != null ? (
                        <div className="flex items-center gap-1">
                          <span className={`text-base font-extrabold ${project.total_score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : project.total_score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {Number(project.total_score).toFixed(1)}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">/ 100</span>
                        </div>
                      ) : (
                        <span className="text-base text-slate-300 dark:text-slate-600 font-bold">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboardViewPage;
