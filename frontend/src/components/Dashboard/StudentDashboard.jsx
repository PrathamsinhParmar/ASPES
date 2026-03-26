import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import StatCard from './StatCard';
import { FolderIcon, ClockIcon, CheckCircleIcon, ChartBarIcon, ArrowUpOnSquareIcon, SparklesIcon, TrashIcon, ExclamationTriangleIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <div className="p-5 sm:p-6 lg:p-8 space-y-6 flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950 min-h-screen animate-fade-in relative z-0">
      
      {/* Absolute Decorative Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 dark:bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-200/20 dark:bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10 -translate-x-1/3 translate-y-1/3"></div>

      {/* Main Header Card */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            {`${user?.full_name?.split(' ')[0] || 'Student'}'s Dashboard`}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">Monitor your project evaluations and performance insights.</p>
        </div>
        <Link 
          to="/projects/new" 
          className="group relative overflow-hidden inline-flex items-center px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-500/20 text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 border border-indigo-400/20"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          <span className="relative flex items-center">
            <ArrowUpOnSquareIcon className="-ml-1 mr-2 h-5 w-5 stroke-[2.5px]" />
            New Project
          </span>
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 z-10 relative">
        <StatCard
          title="Total Projects"
          value={stats.total}
          icon={<FolderIcon className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={<ClockIcon className="w-6 h-6" />}
          color="amber"
          trend={stats.pending > 0 ? "up" : null}
          trendValue="Queue"
        />
        <StatCard
          title="Successfully Scored"
          value={stats.evaluated}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          color="emerald"
        />
        <StatCard
          title="Global Average"
          value={stats.avgScore}
          icon={<SparklesIcon className="w-6 h-6" />}
          color="indigo"
        />
      </div>

      {/* Recent Projects Table Container */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 z-10">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Recent Activity Stream</h3>
          <Link to="/projects" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline underline-offset-4 transition-all">View all</Link>
        </div>

        {projects.length === 0 ? (
          <div className="p-20 text-center bg-slate-50/20 dark:bg-slate-900/10 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800/50">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-white dark:bg-slate-800 shadow-2xl shadow-indigo-500/10 border border-slate-100 dark:border-slate-800 mb-8 transform hover:rotate-12 transition-all duration-500">
               <FolderIcon className="h-12 w-12 text-indigo-500/50 dark:text-indigo-400/40" />
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">No active projects yet</h4>
            <p className="text-sm mt-3 text-slate-500 dark:text-slate-400 font-medium max-w-[280px] mx-auto leading-relaxed">
              Your dashboard is ready and waiting. Upload your first project to begin the AI evaluation process.
            </p>
            <div className="mt-10">
              <Link to="/projects/new" className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white text-[13px] font-bold uppercase tracking-wider shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 inline-block border border-indigo-400/20">
                Initialize Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <th scope="col" className="px-5 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-16">Sr.No</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Project Overview</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Timeline</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Phase</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">AI Score</th>
                  <th scope="col" className="relative px-5 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
                {projects.slice(0, 5).map((project, index) => (
                  <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-slate-500 dark:text-slate-400 text-center">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{project.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{project.course_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {project.submitted_at ? format(new Date(project.submitted_at), 'MMM dd, yyyy') : 'Draft'}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-[11px] leading-4 font-bold rounded-md border ${statusColorMap[project.status.toLowerCase()] || statusColorMap.draft}`}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                       {project.total_score !== null && project.total_score !== undefined ? (
                         <span className={`text-sm font-extrabold ${project.total_score >= 80 ? 'text-emerald-600' : project.total_score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                           {Number(project.total_score).toFixed(1)} <span className="text-xs text-slate-400 font-medium">/ 100</span>
                         </span>
                      ) : (
                        <span className="text-sm text-slate-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="group relative overflow-hidden inline-flex items-center justify-center px-4 py-1.5 border-none shadow-[0_5px_15px_-5px_rgba(79,70,229,0.3)] text-[10px] font-black uppercase tracking-widest rounded-lg text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-[0_8px_20px_-5px_rgba(79,70,229,0.4)] transition-all duration-300"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                          <span className="relative">Inspect</span>
                        </button>
                        <button
                          onClick={() => handleEditClick(project)}
                          className="inline-flex items-center justify-center p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-bold rounded-lg text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
                          title="Edit Project"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(project)}
                          className="inline-flex items-center justify-center p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-bold rounded-lg text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-300 dark:hover:border-rose-800 transition-all"
                          title="Delete Project"
                        >
                          <TrashIcon className="w-4 h-4" />
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

      {/* Modern Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => !isDeleting && setShowConfirmModal(false)}>
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-slate-900 rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/20">
              <div className="bg-white dark:bg-slate-900 px-4 pt-5 pb-4 sm:p-8 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 sm:mx-0 sm:h-12 sm:w-12">
                    <ExclamationTriangleIcon className="h-7 w-7 text-rose-600 dark:text-rose-500" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-6 sm:text-left">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                      Permanently Delete Project?
                    </h3>
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        You are about to delete <span className="font-black text-slate-900 dark:text-white">&quot;{projectToDelete?.title}&quot;</span>. This action is catastrophic and cannot be reversed.
                      </p>
                      {['submitted', 'under_evaluation'].includes(projectToDelete?.status.toLowerCase()) && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                          <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                            Warning: Project is currently in {projectToDelete?.status.replace('_', ' ')} phase.
                          </p>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic font-medium">
                        All associated AI analysis results and source artifacts will be erased from our cloud clusters.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-900/50 px-4 py-6 sm:px-8 sm:flex sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  className="group relative overflow-hidden w-full inline-flex justify-center rounded-2xl border-none shadow-[0_10px_25px_-10px_rgba(225,29,72,0.5)] px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-500 text-xs font-black uppercase tracking-[0.2em] text-white hover:shadow-[0_15px_30px_-5px_rgba(225,29,72,0.6)] sm:ml-3 sm:w-auto transition-all duration-300 disabled:opacity-50"
                  onClick={confirmDelete}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative">
                    {isDeleting ? 'Erasing...' : 'Confirm Purge'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="mt-3 w-full inline-flex justify-center rounded-2xl border border-slate-200 dark:border-slate-700 px-6 py-3 bg-white dark:bg-slate-800 text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none sm:mt-0 sm:w-auto transition-all"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => !isSaving && setShowEditModal(false)}>
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-slate-900 rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/20">
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <PencilSquareIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Edit Project Details</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Refining Project Information</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateProject} className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Project Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      required
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      placeholder="e.g., Quantum Neural Networks v2"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
                      Project Narrative
                    </label>
                    <textarea
                      id="description"
                      rows="4"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none"
                      placeholder="Describe the core objectives and methodology..."
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 inline-flex justify-center items-center rounded-2xl border-none shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 text-xs font-black uppercase tracking-[0.2em] text-white hover:shadow-[0_15px_35px_-5px_rgba(79,70,229,0.6)] hover:-translate-y-1 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      <span className="relative flex items-center">
                        {isSaving ? (
                          <>
                            <div className="mr-3 h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                            Synchronizing...
                          </>
                        ) : (
                          'Commit Changes'
                        )}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="inline-flex justify-center items-center rounded-2xl border border-slate-200 dark:border-slate-800 px-8 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 hover:border-rose-200 transition-all duration-300 shadow-sm"
                    >
                      Discard
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
