import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { toast } from 'react-toastify';
import { formatStatus } from '../utils/languageFormatter';
import { 
  UserGroupIcon, 
  FolderIcon, 
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  DocumentPlusIcon,
  RectangleStackIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
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

  const totalProjectsInGroups = groups.reduce((acc, g) => acc + (g.project_count || 0), 0);
  const activeCohortsCount = groups.filter(g => (g.project_count || 0) > 0).length;
  const avgProjectsPerGroup = groups.length ? (totalProjectsInGroups / groups.length).toFixed(1) : '0';

  if (loading && !groups.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <div className="animate-spin h-9 w-9 border-3 border-indigo-500 rounded-full border-t-transparent mb-3"></div>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Loading faculty groups...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans relative overflow-x-hidden animate-fade-in">
      {/* Antigravity Spatial Depth Ambient Glows */}
      <div className="absolute top-0 right-1/4 -translate-y-24 w-[480px] h-[480px] bg-gradient-to-br from-indigo-500/10 to-violet-500/5 dark:from-indigo-600/15 dark:to-purple-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-0 -translate-x-1/2 w-[380px] h-[380px] bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/5 rounded-full blur-[90px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-4.5 font-sans relative z-10">
        
        {/* Modern Compact Hero Header & Telemetry Ribbon */}
        <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
          {/* Subtle Top Accent Sheen */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          {/* Header Row: Badge, Title, Subtitle & Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                <UserGroupIcon className="w-3 h-3" />
                <span>Cohort & Team Organization</span>
              </div>
              
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Faculty Groups
              </h1>
              
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-normal leading-normal">
                Organize student project submissions into cohorts, track evaluations, and manage team rosters.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {!selectedGroup ? (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
                >
                  <PlusIcon className="w-4 h-4 stroke-[2.5px]" />
                  <span>Create Group</span>
                </button>
              ) : (
                <button 
                  onClick={() => { setSelectedGroup(null); fetchGroups(); }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:-translate-y-0.5 transition-all shadow-xs"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                  <span>Back to All Groups</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Telemetry Ribbon - Compact */}
          {!selectedGroup && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              {/* Total Groups */}
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Groups</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">{groups.length}</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60 flex-shrink-0">
                  <UserGroupIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Assigned Projects */}
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Assigned Projects</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 block">{totalProjectsInGroups}</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/60 flex-shrink-0">
                  <RectangleStackIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Active Cohorts */}
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Active Cohorts</span>
                    {activeCohortsCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 leading-none">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">{activeCohortsCount}</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60 flex-shrink-0">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Avg Projects / Group */}
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Avg / Group</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-violet-600 dark:text-violet-400 mt-0.5 block">{avgProjectsPerGroup}</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-900/60 flex-shrink-0">
                  <FolderIcon className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Groups Grid / Detail Views */}
        {!selectedGroup ? (
          <>
            {groups.length === 0 ? (
              <div className="text-center py-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 shadow-xs">
                <UserGroupIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-800 dark:text-white">No Faculty Groups Created</p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Create custom groups to organize and monitor student project portfolios by semester, section, or subject.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-xs"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Create First Group</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5 relative z-10">
                {groups.map(g => (
                  <div 
                    key={g.id} 
                    className="group relative rounded-xl sm:rounded-2xl p-4 sm:p-4.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-300/80 dark:hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
                    onClick={() => loadGroupDetails(g.id)}
                  >
                    {/* Subtle Top Hover Glow Accent */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-indigo-500/40 group-hover:via-violet-500/60 group-hover:to-indigo-500/40 transition-all duration-300" />

                    <div>
                      {/* Top Row: Icon + Badge + Delete Button */}
                      <div className="flex justify-between items-center">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                          <UserGroupIcon className="w-4.5 h-4.5" />
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                            <RectangleStackIcon className="w-3 h-3 text-slate-400" />
                            {g.project_count || 0} {g.project_count === 1 ? 'Project' : 'Projects'}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }} 
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200/60 dark:hover:border-rose-800/40 transition-all"
                            title="Delete Group"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle: Title & Subtitle */}
                      <div className="mt-3">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {g.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-normal">
                          Curated academic cohort & student project roster
                        </p>
                      </div>
                    </div>

                    {/* Footer Row: Status & Manage link */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${(g.project_count || 0) > 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        {(g.project_count || 0) > 0 ? 'Active Cohort' : 'Empty Roster'}
                      </span>
                      
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform duration-150">
                        <span>Inspect Cohort</span>
                        <ArrowRightIcon className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4 sm:space-y-4.5">
            {/* Selected Group Action Bar */}
            <div className="relative rounded-xl p-3.5 sm:p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60 flex-shrink-0">
                  <UserGroupIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    {selectedGroup.name} Configuration
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedGroup.projects?.length || 0} projects enrolled in this cohort
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowAddOptions(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-xs hover:-translate-y-0.5 transition-all"
              >
                <PlusIcon className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span>Add Active Projects</span>
              </button>
            </div>

            {selectedGroup.projects && selectedGroup.projects.length === 0 ? (
              <div className="text-center py-16 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
                <FolderIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700 dark:text-white">No Projects Assigned to this Group</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Click &quot;Add Active Projects&quot; above to link student project submissions to this cohort.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {selectedGroup.projects?.map(p => (
                  <div key={p.id} className="group relative rounded-xl p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
                          <FolderIcon className="w-4 h-4" />
                        </div>
                        <button 
                          onClick={() => openRemoveProjectModal(p)} 
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200/60 dark:hover:border-rose-800/40 transition-all"
                          title="Untether Project"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight" title={p.title}>{p.title}</h4>
                      {p.team_name && <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">Team: {p.team_name}</p>}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{formatStatus(p.status)}</span>
                      <Link to={`/projects/${p.id}`} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Details</span>
                        <ArrowRightIcon className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSaving && setShowCreateModal(false)}></div>
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl relative z-10 w-full max-w-md border border-slate-200 dark:border-slate-800 animate-slide-up">
            <h3 className="text-base sm:text-lg font-bold mb-4 text-slate-900 dark:text-white tracking-tight">Create Faculty Group</h3>
            <form onSubmit={handleCreateGroup}>
              <div className="space-y-3">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Group Designation</label>
                <input 
                  type="text" 
                  value={newGroupName} 
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Capstone 2026 Alpha"
                  className="w-full px-3.5 py-2 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-lg outline-none font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs sm:text-sm"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2.5 mt-5">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 shadow-xs hover:-translate-y-0.5 transition-all">
                  {isSaving ? 'Processing...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROJECT OPTIONS MODAL */}
      {showAddOptions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddOptions(false)}></div>
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl relative z-10 w-full max-w-md border border-slate-200 dark:border-slate-800 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Add Project to Group</h3>
              <button onClick={() => setShowAddOptions(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
              <button 
                onClick={() => navigate(`/projects/new?groupId=${selectedGroup.id}`)}
                className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-700/50 hover:-translate-y-0.5 transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <DocumentPlusIcon className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">New Project</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Create and upload a brand new active project</p>
                </div>
              </button>

              <button 
                onClick={() => navigate(`/projects?selectionMode=true&groupId=${selectedGroup.id}`)}
                className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-700/50 hover:-translate-y-0.5 transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <RectangleStackIcon className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">Select Existing Project</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Choose from your existing project archive</p>
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
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl relative z-10 w-full max-w-md border border-slate-200 dark:border-slate-800 animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
                <TrashIcon className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">Untether Project</h3>
            </div>
            
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-5 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-slate-800 dark:text-white">&quot;{projectToRemove?.title}&quot;</span> from this group? 
              The project data and evaluations will remain safe in the portfolio, but it will no longer be part of this group.
            </p>
            
            <div className="flex justify-end gap-2.5">
              <button 
                type="button" 
                onClick={() => setShowProjectRemoveModal(false)} 
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmRemove} 
                disabled={isRemoving} 
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-500 disabled:opacity-50 shadow-xs hover:-translate-y-0.5 transition-all"
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
