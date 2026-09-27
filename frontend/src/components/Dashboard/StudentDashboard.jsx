import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import StatCard from './StatCard';
import { FolderIcon, ClockIcon, CheckCircleIcon, ChartBarIcon, ArrowUpOnSquareIcon, SparklesIcon, TrashIcon, ExclamationTriangleIcon, PencilSquareIcon, XMarkIcon, BellIcon } from '@heroicons/react/24/outline';
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
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
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
      description: project.description || ''
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
      setProjects(projects.map(p => 
        p.id === projectToEdit.id 
          ? { ...p, title: updatedProject.title, description: updatedProject.description }
          : p
      ));
      
      toast.success('Project updated successfully');
      setShowEditModal(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateAverageScore = (projList) => {
    const evaluated = projList.filter(p => ['evaluated', 'published'].includes(p.status.toLowerCase()));
    if (evaluated.length === 0) return 0;

    const total = evaluated.reduce((acc, p) => acc + (p.evaluation?.total_score || 0), 0);
    return Math.round(total / evaluated.length) || 'N/A';
  };

  const stats = {
    total: projects.length,
    pending: projects.filter(p => ['submitted', 'under_evaluation'].includes(p.status.toLowerCase())).length,
    evaluated: projects.filter(p => ['evaluated', 'published'].includes(p.status.toLowerCase())).length,
    avgScore: calculateAverageScore(projects)
  };

  const statusColorMap = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    submitted: 'bg-amber-50 text-amber-700 border-amber-200',
    under_evaluation: 'bg-blue-50 text-blue-700 border-blue-200',
    evaluated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    published: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    returned: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  if (loading) {
    return <div className="p-6 flex justify-center items-center h-[calc(100vh-4rem)]"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 dark:text-white">
      {/* Header Banner */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_24px_rgba(0,0,0,0.35)] p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            {`${user?.full_name?.split(' ')[0] || 'Student'}'s Dashboard`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Monitor your project evaluations, track AI analysis milestones, and review faculty remarks.
          </p>
        </div>
        <Link 
          to="/projects/new" 
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 flex-shrink-0"
        >
          <ArrowUpOnSquareIcon className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={stats.total}
          icon={<FolderIcon className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={<ClockIcon className="w-5 h-5" />}
          color="amber"
          trend={stats.pending > 0 ? "up" : null}
          trendValue="Queue"
        />
        <StatCard
          title="Successfully Scored"
          value={stats.evaluated}
          icon={<CheckCircleIcon className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Global Average"
          value={stats.avgScore}
          icon={<SparklesIcon className="w-5 h-5" />}
          color="indigo"
        />
      </div>

      {/* Tab Switcher Pills */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
        <button
          onClick={() => setDashboardTab('projects')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
            dashboardTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60'
          }`}
        >
          <FolderIcon className="w-3.5 h-3.5" />
          <span>My Projects ({projects.length})</span>
        </button>

        <button
          onClick={() => setDashboardTab('notifications')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
            dashboardTab === 'notifications'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60'
          }`}
        >
          <BellIcon className="w-3.5 h-3.5" />
          <span>Notification Panel & Feedback</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
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
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_24px_rgba(0,0,0,0.35)] rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Recent Activity Stream
            </h2>
            <Link to="/projects" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline transition-colors">
              View all ({projects.length})
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <FolderIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No active projects yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Submit your first project code and documentation to begin AI automated evaluation.
              </p>
              <div className="mt-5">
                <Link 
                  to="/projects/new" 
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm hover:-translate-y-0.5 transition-all"
                >
                  <ArrowUpOnSquareIcon className="w-3.5 h-3.5" />
                  <span>Submit Project</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-left">
                <thead className="bg-slate-50/70 dark:bg-slate-800/40">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-14">Sr.No</th>
                    <th scope="col" className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project Overview</th>
                    <th scope="col" className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Submitted</th>
                    <th scope="col" className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phase</th>
                    <th scope="col" className="px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Score</th>
                    <th scope="col" className="px-4 py-3 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {projects.slice(0, 5).map((project, index) => (
                    <tr key={project.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-slate-400 dark:text-slate-500 text-center">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[240px]">
                            {project.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {formatLanguageName(project.course_name) || 'Academic Project'}
                            </span>
                            {project.team_name && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                {project.team_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {project.submitted_at ? format(new Date(project.submitted_at), 'MMM dd, yyyy') : 'Draft'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold capitalize border ${
                          project.status === 'evaluated' || project.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : project.status === 'under_evaluation'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : project.status === 'submitted'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                        }`}>
                          {formatStatus(project.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {project.total_score !== null && project.total_score !== undefined ? (
                          <span className={`text-xs font-bold ${project.total_score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : project.total_score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {Number(project.total_score).toFixed(1)} <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600 font-bold">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200/50 dark:border-indigo-800/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleEditClick(project)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-0.5 transition-all duration-150"
                            title="Edit Project"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(project)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-700 hover:-translate-y-0.5 transition-all duration-150"
                            title="Delete Project"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isDeleting && setShowConfirmModal(false)}></div>

          <div className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-5 sm:p-6 max-w-md w-full z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Project</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to permanently delete <span className="font-semibold text-slate-900 dark:text-white">&quot;{projectToDelete?.title}&quot;</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            {['submitted', 'under_evaluation'].includes(projectToDelete?.status.toLowerCase()) && (
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                Notice: This project is currently in the {formatStatus(projectToDelete?.status)} phase.
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50"
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setShowEditModal(false)}></div>

          <div className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-5 sm:p-6 max-w-lg w-full z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <PencilSquareIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Project Details</h3>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="e.g., Quantum Neural Networks v2"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white font-normal focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none transition-colors resize-y"
                  placeholder="Describe the core objectives and methodology..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50"
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
