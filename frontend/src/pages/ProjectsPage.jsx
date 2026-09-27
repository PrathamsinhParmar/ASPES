import React, { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import { groupService } from '../services/groupService';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FolderIcon, InboxArrowDownIcon, PlusIcon, MagnifyingGlassIcon, TrashIcon, ExclamationTriangleIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { formatLanguageName, formatStatus } from '../utils/languageFormatter';

const ProjectsPage = () => {
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
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFaculty = ['faculty', 'professor'].includes((user?.role || '').toLowerCase());
  const urlParams = new URLSearchParams(window.location.search);
  const selectionMode = urlParams.get('selectionMode') === 'true';
  const groupIdFromUrl = urlParams.get('groupId');
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = isFaculty
          ? await projectService.getAssignedProjects()
          : await projectService.getMyProjects();
        setProjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isFaculty]);

  const toggleProjectSelection = (projectId) => {
    setSelectedProjectIds(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId) 
        : [...prev, projectId]
    );
  };

  const handleCompleteSelection = async () => {
    if (selectedProjectIds.length === 0) {
      toast.warn('Please select at least one project');
      return;
    }

    try {
      setIsSaving(true);
      await groupService.addProjectsToGroup(groupIdFromUrl, selectedProjectIds);
      toast.success(`Successfully added ${selectedProjectIds.length} projects to group`);
      navigate('/groups');
    } catch (err) {
      console.error('Group addition error:', err);
      let errorMsg = err.response?.data?.detail || 'Failed to add projects to group';
      
      // If it's a validation error, try to show the specific details
      if (err.response?.data?.errors) {
        const firstError = err.response.data.errors[0];
        errorMsg = `Validation Error: ${firstError.loc.join('.')} - ${firstError.msg}`;
      }
      
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      setIsDeleting(true);
      await projectService.deleteProject(projectToDelete.id);
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      toast.success('Project permanently deleted');
      setShowConfirmModal(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  const handleEditClick = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
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

  const statusColorMap = {
    draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    submitted: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
    under_evaluation: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30',
    evaluated: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30',
    published: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30',
    returned: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30'
  };

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-5 animate-fade-in bg-slate-50/30 dark:bg-slate-950 min-h-screen relative overflow-hidden font-sans">
      
      {/* Decorative Background Glow */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-10">
        <div>
          <div className="flex items-center gap-3">
            {isFaculty && (
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <InboxArrowDownIcon className="w-5 h-5" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {selectionMode ? 'Select Projects to Group' : isFaculty ? 'All Assigned Projects' : 'Project Portfolio'}
            </h1>
          </div>
          <p className="mt-1 text-sm font-normal text-slate-500 dark:text-slate-400">
            {selectionMode ? 'Choose existing projects to add to the selected group.' : isFaculty ? 'All student projects assigned to you.' : 'Overview of all your academic project submissions.'}
          </p>
        </div>
        {!selectionMode ? (
          !isFaculty && (
            <Link 
              to="/projects/new" 
              className="inline-flex items-center px-5 py-2.5 rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-200"
            >
              <PlusIcon className="-ml-1 mr-2 h-4 w-4 stroke-[2.5px]" />
              New Project
            </Link>
          )
        ) : (
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/groups')}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleCompleteSelection}
              disabled={isSaving || selectedProjectIds.length === 0}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg shadow-sm text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all hover:-translate-y-0.5"
            >
              {isSaving ? 'Processing...' : `Add Selected (${selectedProjectIds.length})`}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Synchronizing your projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-dashed border-slate-300 dark:border-slate-700 shadow-inner group">
           <FolderIcon className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4 group-hover:text-indigo-200 dark:group-hover:text-indigo-900 transition-colors duration-300" />
           <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No projects archived yet.</p>
           <p className="text-sm mt-1 text-slate-500 dark:text-slate-500">Launch your first academic project to begin AI evaluation.</p>
           <Link to="/projects/new" className="mt-8 inline-flex items-center px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm hover:-translate-y-0.5 transition-all duration-200">
             Create Project
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
          {projects.map(p => (
            <div 
              key={p.id} 
              onClick={() => selectionMode ? toggleProjectSelection(p.id) : navigate(`/projects/${p.id}`)}
              className={`group bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 relative overflow-hidden cursor-pointer
                ${selectionMode && selectedProjectIds.includes(p.id) ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/10' : 'border-slate-200/80 dark:border-slate-800'}`}
            >
               {selectionMode && (
                 <div className="absolute top-4 left-4 z-30">
                   <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedProjectIds.includes(p.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white/50 border-slate-300'}`}>
                     {selectedProjectIds.includes(p.id) && <XMarkIcon className="w-3.5 h-3.5 text-white rotate-45" />}
                   </div>
                 </div>
               )}
                <div className="flex items-start mb-4">
                  <div className="h-12 w-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 shadow-sm group-hover:-translate-y-0.5 transition-transform duration-200">
                    <FolderIcon className="w-6 h-6" />
                  </div>
                  
                  {/* Status Badge - Pinned at Top Right */}
                  <div className="absolute top-4 right-4 z-20">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border shadow-sm backdrop-blur-md capitalize ${statusColorMap[p.status.toLowerCase()] || statusColorMap.draft}`}>
                      {formatStatus(p.status)}
                    </span>
                  </div>

                  {/* Action Buttons Stack - only for students */}
                  {!isFaculty && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
                      <button
                        onClick={(e) => handleEditClick(e, p)}
                        className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 hover:shadow-sm hover:-translate-y-0.5 transition-all"
                        title="Edit Project"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, p)}
                        className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500 hover:shadow-sm hover:-translate-y-0.5 transition-all"
                        title="Remove Project"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{p.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{p.course_name ? formatLanguageName(p.course_name) : 'Academic Project'}</p>
                  {p.team_name && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                      Team: {p.team_name}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-indigo-400"></div>
                     <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">View detailed metrics</span>
                  </div>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => !isDeleting && setShowConfirmModal(false)}>
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-slate-900 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-200 dark:border-slate-800 font-sans">
              <div className="bg-white dark:bg-slate-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 sm:mx-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-rose-600 dark:text-rose-500" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      Permanently Delete Project?
                    </h3>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-normal">
                        You are about to delete <span className="font-semibold text-slate-900 dark:text-white">&quot;{projectToDelete?.title}&quot;</span>. This action cannot be reversed.
                      </p>
                      {['submitted', 'under_evaluation'].includes(projectToDelete?.status.toLowerCase()) && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                            Warning: Project is currently undergoing {formatStatus(projectToDelete?.status)} logic.
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                        Associated AI datasets and evaluation metadata will be completely purged from our processing engine.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-900/50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-lg px-4 py-2 bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white shadow-sm sm:w-auto transition-all disabled:opacity-50 hover:-translate-y-0.5"
                  onClick={confirmDelete}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Purge'}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none sm:mt-0 sm:w-auto transition-colors"
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
              <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-slate-900 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-200 dark:border-slate-800 font-sans">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <PencilSquareIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Edit Project</h3>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mt-0.5">Metadata Configuration</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateProject} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="title" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Project Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                      placeholder="Enter project title..."
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="description" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Technical Description
                    </label>
                    <textarea
                      id="description"
                      rows="4"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm font-normal focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                      placeholder="Detail the technical scope..."
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center"
                    >
                      {isSaving ? (
                        <>
                          <div className="mr-2 h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
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

export default ProjectsPage;
