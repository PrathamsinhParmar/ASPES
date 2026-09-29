import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import StatCard from './StatCard';
import {
  FolderIcon,
  ClockIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  ArrowUpOnSquareIcon,
  SparklesIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  XMarkIcon,
  BellIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon,
  AcademicCapIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPanel from '../Notification/NotificationPanel';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { formatLanguageName, formatStatus } from '../../utils/languageFormatter';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [dashboardTab, setDashboardTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getMyProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      setIsDeleting(true);
      await projectService.deleteProject(projectToDelete.id);
      setProjects(projects.filter((p) => p.id !== projectToDelete.id));
      toast.success('Project deleted successfully');
      setShowConfirmModal(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  const handleEditClick = (project) => {
    setProjectToEdit(project);
    setEditForm({
      title: project.title,
      description: project.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error('Project title is required');
      return;
    }

    try {
      setIsSaving(true);
      const updatedProject = await projectService.updateProjectMetadata(projectToEdit.id, editForm);

      // Update local state
      setProjects(
        projects.map((p) =>
          p.id === projectToEdit.id
            ? { ...p, title: updatedProject.title, description: updatedProject.description }
            : p
        )
      );

      toast.success('Project updated successfully');
      setShowEditModal(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateAverageScore = (projList) => {
    const evaluated = projList.filter((p) => ['evaluated', 'published'].includes(p.status?.toLowerCase()));
    if (evaluated.length === 0) return 0;

    const total = evaluated.reduce((acc, p) => acc + (p.evaluation?.total_score || p.total_score || 0), 0);
    return Math.round(total / evaluated.length) || 0;
  };

  const stats = {
    total: projects.length,
    pending: projects.filter((p) => ['submitted', 'under_evaluation'].includes(p.status?.toLowerCase())).length,
    evaluated: projects.filter((p) => ['evaluated', 'published'].includes(p.status?.toLowerCase())).length,
    avgScore: calculateAverageScore(projects),
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-8 space-y-4 animate-pulse font-sans">
        <div className="h-28 rounded-xl sm:rounded-2xl bg-slate-200/70 dark:bg-slate-800/50" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-200/70 dark:bg-slate-800/50" />
          ))}
        </div>
        <div className="h-96 rounded-xl sm:rounded-2xl bg-slate-200/70 dark:bg-slate-800/50" />
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || 'Student';

  return (
    <div className="px-4 sm:px-6 pt-1.5 sm:pt-2.5 pb-6 sm:pb-8 space-y-4 max-w-7xl mx-auto min-h-screen font-sans bg-transparent dark:bg-slate-950 relative overflow-x-hidden">
      {/* Antigravity Spatial Depth Ambient Glows */}
      <div className="absolute top-0 right-1/4 -translate-y-24 w-[480px] h-[480px] bg-gradient-to-br from-indigo-500/10 to-violet-500/5 dark:from-indigo-600/15 dark:to-purple-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-0 -translate-x-1/2 w-[380px] h-[380px] bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/5 rounded-full blur-[90px] pointer-events-none -z-10" />

      {/* Modern Compact Hero Card */}
      <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {/* Subtle Top Accent Sheen */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5 min-w-0">
            {/* Student Role Ribbon */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Student Workspace
              </span>
              {user?.username && (
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  @{user.username}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {`${firstName}'s Dashboard`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal max-w-2xl">
              Monitor your project evaluations, track AI analysis milestones, and review faculty remarks.
            </p>
          </div>

          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 flex-shrink-0"
          >
            <ArrowUpOnSquareIcon className="w-4 h-4" />
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {/* Modern Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        <StatCard
          title="Total Projects"
          value={stats.total}
          subtitle="Submitted academic projects"
          icon={<FolderIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="indigo"
          trend="neutral"
          trendValue={`${stats.total} Projects`}
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          subtitle="Awaiting faculty grading"
          icon={<ClockIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="amber"
          trend={stats.pending > 0 ? 'neutral' : 'up'}
          trendValue={stats.pending > 0 ? `${stats.pending} in queue` : 'Completed'}
        />
        <StatCard
          title="Successfully Scored"
          value={stats.evaluated}
          subtitle="Evaluated & published"
          icon={<CheckBadgeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="green"
          trend={stats.evaluated > 0 ? 'up' : 'neutral'}
          trendValue={stats.evaluated > 0 ? `${stats.evaluated} Scored` : '0 Scored'}
        />
        <StatCard
          title="Global Average"
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
          subtitle="Mean score across submissions"
          icon={<SparklesIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="purple"
          trend={stats.avgScore >= 75 ? 'up' : null}
          trendValue={stats.avgScore >= 75 ? 'On Track' : null}
        />
      </div>

      {/* Segmented Control Tab Switcher */}
      <div className="inline-flex items-center p-1 bg-slate-200/60 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs gap-1">
        <button
          onClick={() => setDashboardTab('projects')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            dashboardTab === 'projects'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <FolderIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>My Projects</span>
          <span
            className={`px-1.5 py-0.2 rounded-md text-[11px] font-bold ${
              dashboardTab === 'projects'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setDashboardTab('notifications')}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            dashboardTab === 'notifications'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <BellIcon className="w-3.5 h-3.5 text-amber-500" />
          <span>Notification Panel & Feedback</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Render either NotificationPanel or Projects Activity Stream */}
      {dashboardTab === 'notifications' ? (
        <NotificationPanel />
      ) : (
        /* Recent Projects Table Container */
        <div className="bg-white dark:bg-slate-900/90 shadow-xs rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 font-sans">
          {/* Table Header Banner */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50 flex-shrink-0">
                <ClipboardDocumentListIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">
                    Recent Activity Stream
                  </h3>
                  <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                    {projects.length}
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-normal">
                  Your project submissions, evaluation status progression, and AI automated scores.
                </p>
              </div>
            </div>

            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/50 dark:border-indigo-800/50 transition-colors w-fit flex-shrink-0"
            >
              <span>View all ({projects.length})</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-100 dark:border-indigo-900/50">
                <FolderIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No active projects yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto font-normal">
                Submit your project code and documentation to begin AI automated evaluation and faculty review.
              </p>
              <div className="mt-4">
                <Link
                  to="/projects/new"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs hover:-translate-y-0.5 transition-all"
                >
                  <ArrowUpOnSquareIcon className="w-3.5 h-3.5" />
                  <span>Submit Project</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80">
                <thead className="bg-slate-50/70 dark:bg-slate-800/40">
                  <tr>
                    <th className="px-4 py-3 text-center text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-14">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Project Overview
                    </th>
                    <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      Submitted
                    </th>
                    <th className="px-4 py-3 text-center text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Phase
                    </th>
                    <th className="px-4 py-3 text-center text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      AI Score
                    </th>
                    <th className="px-4 py-3 text-right text-[13px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[14px]">
                  {projects.slice(0, 5).map((project, index) => {
                    const statusLower = project.status?.toLowerCase() || '';
                    const isEvaluated = statusLower === 'evaluated' || statusLower === 'published';
                    const isSubmitted = statusLower === 'submitted';
                    const isUnderEval = statusLower === 'under_evaluation';

                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors select-none group"
                      >
                        <td className="px-4 py-3 font-mono font-medium text-slate-400 dark:text-slate-500 text-[14px] text-center">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3 min-w-[200px]">
                          <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[280px] text-[14px]">
                            {project.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded-md font-semibold text-[12px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                              {formatLanguageName(project.course_name) || 'General'}
                            </span>
                            {project.team_name && (
                              <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                                {project.team_name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-normal text-[14px]">
                          {project.submitted_at || project.created_at
                            ? format(new Date(project.submitted_at || project.created_at), 'MMM dd, yyyy')
                            : 'Draft'}
                        </td>

                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[12px] font-bold rounded-md border ${
                              isEvaluated
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                                : isSubmitted
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                                : isUnderEval
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isEvaluated
                                  ? 'bg-emerald-500'
                                  : isSubmitted
                                  ? 'bg-amber-500'
                                  : isUnderEval
                                  ? 'bg-blue-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {formatStatus(project.status).toUpperCase()}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {project.total_score != null ? (
                            <div className="inline-flex items-center gap-1 font-mono justify-center">
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

                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/projects/${project.id}`)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/50 dark:border-indigo-800/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 shadow-2xs"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => handleEditClick(project)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:-translate-y-0.5 transition-all duration-150"
                              title="Edit Project"
                            >
                              <PencilSquareIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(project)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 hover:-translate-y-0.5 transition-all duration-150"
                              title="Delete Project"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowConfirmModal(false)}
          />

          <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-5 sm:p-6 max-w-md w-full z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0 border border-rose-500/20">
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Project</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">&quot;{projectToDelete?.title}&quot;</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            {['submitted', 'under_evaluation'].includes(projectToDelete?.status?.toLowerCase()) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 font-medium">
                Notice: This project is currently in the {formatStatus(projectToDelete?.status)} phase.
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50"
                onClick={confirmDelete}
              >
                {isDeleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => !isSaving && setShowEditModal(false)}
          />

          <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-5 sm:p-6 max-w-lg w-full z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50">
                  <PencilSquareIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Project Details</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="e.g., Autonomous Drone Navigation"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Project Narrative
                </label>
                <textarea
                  id="description"
                  rows="3"
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-normal focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-y"
                  placeholder="Describe the core objectives and methodology..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
