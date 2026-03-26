import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { toast } from 'react-toastify';
import { 
  UserGroupIcon, 
  FolderIcon, 
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  DocumentPlusIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline';

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showAddOptions, setShowAddOptions] = useState(false);
  
  const [showProjectRemoveModal, setShowProjectRemoveModal] = useState(false);
  const [projectToRemove, setProjectToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (err) {
      toast.error('Failed to load groups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      const newGroup = await groupService.createGroup({ name: newGroupName });
      setGroups([newGroup, ...groups]);
      setNewGroupName('');
      setShowCreateModal(false);
      toast.success('Group created successfully');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create group');
    } finally {
      setIsSaving(false);
    }
  };

  const loadGroupDetails = async (groupId) => {
    try {
      setLoading(true);
      const data = await groupService.getGroupDetails(groupId);
      setSelectedGroup(data);
    } catch (err) {
      toast.error('Failed to load group details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this group? Projects inside will NOT be deleted, but they will be untethered from this group.")) return;
    try {
      await groupService.deleteGroup(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
      setSelectedGroup(null);
      toast.success('Group deleted successfully');
    } catch (err) {
      toast.error('Failed to delete group');
    }
  };

  const openRemoveProjectModal = (project) => {
    setProjectToRemove(project);
    setShowProjectRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!selectedGroup || !projectToRemove) return;
    try {
      setIsRemoving(true);
      await groupService.removeProjectFromGroup(selectedGroup.id, projectToRemove.id);
      setSelectedGroup({
        ...selectedGroup,
        projects: selectedGroup.projects.filter(p => p.id !== projectToRemove.id)
      });
      fetchGroups();
      toast.success('Project untethered from group');
      setShowProjectRemoveModal(false);
    } catch (err) {
      toast.error('Failed to remove project');
    } finally {
      setIsRemoving(false);
      setProjectToRemove(null);
    }
  };

  if (loading && !groups.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent mb-4"></div>
        <p className="text-slate-500 font-medium">Loading groups...</p>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-8 animate-fade-in bg-slate-50/30 dark:bg-slate-950 min-h-screen relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-10">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Faculty Groups</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Manage student project associations and team rosters.</p>
        </div>
        {!selectedGroup && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="group relative overflow-hidden inline-flex items-center px-6 py-3 rounded-2xl shadow-[0_5px_15px_-5px_rgba(79,70,229,0.4)] text-sm font-black uppercase tracking-widest text-white bg-indigo-600 hover:shadow-[0_10px_20px_-5px_rgba(79,70,229,0.5)] transition-all duration-300 shadow-md"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Create Group
          </button>
        )}
        {selectedGroup && (
          <button 
            onClick={() => { setSelectedGroup(null); fetchGroups(); }}
            className="px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all"
          >
            Back to Groups
          </button>
        )}
      </div>

      {!selectedGroup ? (
        <>
          {groups.length === 0 ? (
            <div className="text-center py-24 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-inner group">
               <UserGroupIcon className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
               <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No Groups Found.</p>
               <p className="text-sm mt-1 text-slate-500">Create a group to organize student portfolios.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {groups.map(g => (
                <div 
                  key={g.id} 
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col justify-between h-48"
                  onClick={() => loadGroupDetails(g.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                      <UserGroupIcon className="w-6 h-6" />
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-xl leading-tight truncate">{g.name}</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{g.project_count} Assigned Projects</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200 dark:border-slate-800">
             <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
               <UserGroupIcon className="w-6 h-6 text-indigo-500" />
               {selectedGroup.name} Configuration
             </h2>
             <button 
               onClick={() => setShowAddOptions(true)}
               className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400 hover:bg-indigo-100 transition-colors flex items-center gap-2"
             >
               <PlusIcon className="w-4 h-4" /> Add Active Projects
             </button>
          </div>

          {selectedGroup.projects && selectedGroup.projects.length === 0 ? (
            <p className="text-slate-500 text-sm italic py-4">No projects have been assigned to this group yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedGroup.projects?.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                   <div className="flex justify-between items-start mb-4">
                     <FolderIcon className="w-8 h-8 text-emerald-500" />
                     <button onClick={() => openRemoveProjectModal(p)} className="text-rose-500 p-1 bg-rose-50 rounded-lg border border-rose-100 hover:bg-rose-100">
                       <XMarkIcon className="w-4 h-4" />
                     </button>
                   </div>
                   <h4 className="font-bold text-slate-800 dark:text-white truncate" title={p.title}>{p.title}</h4>
                   {p.team_name && <p className="text-xs text-slate-500 font-bold mt-1">Team: {p.team_name}</p>}
                   <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                     <span className="text-[10px] font-bold uppercase text-slate-400">{p.status.replace('_', ' ')}</span>
                     <div className="flex gap-4">
                        <Link to={`/projects/${p.id}`} className="text-xs font-bold text-indigo-500 border-b border-indigo-500 pb-0.5">View Details</Link>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setShowCreateModal(false)}></div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl relative z-10 w-full max-w-md border border-slate-200 dark:border-slate-800 animate-slide-up">
            <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Initialize Custom Group</h3>
            <form onSubmit={handleCreateGroup}>
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Group Designation</label>
                <input 
                  type="text" 
                  value={newGroupName} 
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Capstone 2026 Alpha"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-800 dark:text-white focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-500/20">{isSaving ? 'Processing' : 'Create Group'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROJECT OPTIONS MODAL */}
      {showAddOptions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddOptions(false)}></div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl relative z-10 w-full max-w-md border border-slate-200 dark:border-slate-800 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Project to Group</h3>
              <button onClick={() => setShowAddOptions(false)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => navigate(`/projects/new?groupId=${selectedGroup.id}`)}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <DocumentPlusIcon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 dark:text-white">New Project</p>
                  <p className="text-xs text-slate-500">Create and upload a brand new active project</p>
                </div>
              </button>

              <button 
                onClick={() => navigate(`/projects?selectionMode=true&groupId=${selectedGroup.id}`)}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <RectangleStackIcon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 dark:text-white">Select Existing Project</p>
                  <p className="text-xs text-slate-500">Choose from your existing project archive</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* REMOVE PROJECT MODAL */}
      {showProjectRemoveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isRemoving && setShowProjectRemoveModal(false)}></div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl relative z-10 w-full max-w-md border border-slate-200 dark:border-slate-800 animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                <TrashIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Untether Project</h3>
            </div>
            
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-white">&quot;{projectToRemove?.title}&quot;</span> from this group? 
              The project data and evaluations will remain safe in the portfolio, but it will no longer be part of this group.
            </p>
            
            <div className="flex justify-end gap-3 mt-8">
              <button 
                type="button" 
                onClick={() => setShowProjectRemoveModal(false)} 
                className="px-5 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmRemove} 
                disabled={isRemoving} 
                className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50 shadow-md shadow-rose-500/20 transition-all"
              >
                {isRemoving ? 'Removing...' : 'Untether Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
