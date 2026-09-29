import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { projectService } from '../services/projectService';
import StatCard from '../components/Dashboard/StatCard';
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
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { formatLanguageName } from '../utils/languageFormatter';

const API_BASE_URL = api.defaults.baseURL?.replace('/api/v1', '') ?? '';

const FacultyDashboardViewPage = () => {
  const { facultyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [faculty, setFaculty] = useState(null);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Redirect non-admins
  useEffect(() => {
    const role = (user?.role || '').toLowerCase();
    if (user && role !== 'admin') {
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
        setAssignedProjects(projectRes || []);
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
    pending: assignedProjects.filter(
      (p) => (p.status || '').toLowerCase() !== 'evaluated' && (p.status || '').toLowerCase() !== 'published'
    ).length,
    evaluated: assignedProjects.filter(
      (p) => (p.status || '').toLowerCase() === 'evaluated' || (p.status || '').toLowerCase() === 'published'
    ).length,
    avgScore:
      assignedProjects.length > 0
        ? Math.round(assignedProjects.reduce((acc, curr) => acc + (curr.total_score || 0), 0) / assignedProjects.length)
        : 0,
  };

  const filteredProjects = assignedProjects.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.course_name?.toLowerCase().includes(q) ||
      p.team_name?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] bg-transparent font-sans">
        <div className="animate-spin w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-400 mt-3 font-medium">Loading faculty dashboard...</p>
      </div>
    );
  }

  if (error || !faculty) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3 text-center min-h-[60vh] bg-transparent font-sans">
        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-500 mb-1">
          <ExclamationCircleIcon className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Unable to Load Faculty Dashboard</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">{error || 'Faculty account could not be found.'}</p>
        <button
          onClick={() => navigate('/faculty')}
          className="mt-2 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50 transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Faculty Directory
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 pt-1.5 sm:pt-2 pb-6 sm:pb-8 space-y-4 max-w-7xl mx-auto min-h-screen font-sans bg-transparent dark:bg-slate-950 relative overflow-x-hidden">
      {/* Antigravity Spatial Depth Ambient Glows */}
      <div className="absolute top-0 right-1/4 -translate-y-24 w-[480px] h-[480px] bg-gradient-to-br from-indigo-500/10 to-violet-500/5 dark:from-indigo-600/15 dark:to-purple-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <button
          onClick={() => navigate('/faculty')}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 rounded-lg shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all select-none group w-fit"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all" />
          <span>Back to Faculty Directory</span>
        </button>

        {/* Refined Read-only Mode Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs shadow-2xs">
          <EyeIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span>
            <strong className="font-semibold">Inspection Mode:</strong> Viewing faculty dashboard in read-only administrative state.
          </span>
        </div>
      </div>

      {/* Modern Compact Faculty Profile Card */}
      <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {/* Top Accent Glow Line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {faculty.profile_photo ? (
              <img
                src={`${API_BASE_URL}${faculty.profile_photo}?v=${new Date(faculty.updated_at || Date.now()).getTime()}`}
                alt={faculty.full_name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover ring-2 ring-indigo-500/20 shadow-xs flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/20 flex-shrink-0">
                {faculty.full_name?.[0]?.toUpperCase() || 'F'}
              </div>
            )}

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {faculty.full_name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                  <BuildingOffice2Icon className="w-3 h-3" />
                  <span>{faculty.department || 'Academic Faculty'}</span>
                </span>
              </div>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{faculty.username}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{faculty.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AcademicCapIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Joined {faculty.created_at ? format(new Date(faculty.created_at), 'MMMM yyyy') : '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active status indicator */}
          <div className="flex-shrink-0 self-start sm:self-center">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                faculty.is_active
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${faculty.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {faculty.is_active ? 'Active Status' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <StatCard
          title="Total Assigned"
          value={stats.total}
          subtitle="Allocated student projects"
          icon={<FolderIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="indigo"
          trend="neutral"
          trendValue={`${stats.total} Projects`}
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          subtitle="Submissions in review queue"
          icon={<ClockIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="amber"
          trend={stats.pending > 0 ? 'neutral' : 'up'}
          trendValue={stats.pending > 0 ? `${stats.pending} in queue` : 'Completed'}
        />
        <StatCard
          title="Evaluated & Published"
          value={stats.evaluated}
          subtitle="Completed project reviews"
          icon={<CheckBadgeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="green"
          trend={stats.evaluated > 0 ? 'up' : 'neutral'}
          trendValue={stats.evaluated > 0 ? `${stats.evaluated} Evaluated` : '0 Evaluated'}
        />
        <StatCard
          title="Average AI Score"
          value={
            stats.avgScore > 0 ? (
              <span className="inline-flex items-baseline gap-1">
                <span>{stats.avgScore}</span>
                <span className="text-base sm:text-lg font-normal text-slate-400 dark:text-slate-500">/ 100</span>
              </span>
            ) : (
              '—'
            )
          }
          subtitle="Across assigned submissions"
          icon={<ChartBarIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="purple"
          trend={stats.avgScore >= 75 ? 'up' : null}
          trendValue={stats.avgScore >= 75 ? 'On Track' : null}
        />
      </div>

      {/* Assigned Projects Table Container */}
      <div className="bg-white dark:bg-slate-900/90 shadow-xs rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 font-sans">
        {/* Table Header & Search Filter */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50 flex-shrink-0">
              <ClipboardDocumentCheckIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Assigned Student Projects
                </h3>
                <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                  {assignedProjects.length}
                </span>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 font-normal">
                Academic projects assigned to this faculty member for verification and grading.
              </p>
            </div>
          </div>

          {/* Compact Search Input */}
          <div className="relative w-full sm:w-60 flex-shrink-0">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects or team..."
              className="w-full pl-8.5 pr-3 py-1.5 text-[13px] bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs font-medium"
            />
          </div>
        </div>

        {/* Table Content */}
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <FolderIcon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 stroke-1" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {search ? 'No matching projects found' : 'No projects assigned'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {search ? 'Try adjusting your search criteria.' : 'This faculty member has not been assigned any student projects yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80">
              <thead className="bg-slate-50/70 dark:bg-slate-800/40">
                <tr>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-12">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Project Title
                  </th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Language / Domain
                  </th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Team Name
                  </th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Submitted Date
                  </th>
                  <th className="px-4 py-3 text-center text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    AI Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[14px]">
                {filteredProjects.map((project, index) => {
                  const isEvaluated =
                    project.status?.toLowerCase() === 'evaluated' || project.status?.toLowerCase() === 'published';
                  const isSubmitted = project.status?.toLowerCase() === 'submitted';

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors select-none group"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-slate-400 dark:text-slate-500 text-[14px]">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 min-w-[200px]">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[250px] text-[14px]">
                          {project.title}
                        </div>
                        <div className="text-[12px] font-mono text-slate-400 mt-0.5">
                          ID: #{project.id?.substring(0, 8)}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[13px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                          {formatLanguageName(project.course_name) || 'General'}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300 text-[14px]">
                        {project.team_name || '—'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-normal text-[14px]">
                        {project.created_at ? format(new Date(project.created_at), 'MMM dd, yyyy') : '—'}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[12px] font-bold rounded-md border ${
                            isEvaluated
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                              : isSubmitted
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isEvaluated ? 'bg-emerald-500' : isSubmitted ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                          />
                          {(project.status || 'draft').replace('_', ' ').toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {project.total_score != null ? (
                          <div className="inline-flex items-center gap-1 font-mono">
                            <span
                              className={`text-[14px] font-bold ${
                                project.total_score >= 80
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : project.total_score >= 60
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {Number(project.total_score).toFixed(1)}
                            </span>
                            <span className="text-[12px] text-slate-400 font-normal">/100</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal text-[14px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboardViewPage;

