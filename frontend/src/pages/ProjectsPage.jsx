import React, { useState, useEffect, useMemo } from 'react';
import { projectService } from '../services/projectService';
import { groupService } from '../services/groupService';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Users,
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  Search,
  X,
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  ExternalLink,
  Check
} from 'lucide-react';
import { InboxArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatLanguageName, formatStatus } from '../utils/languageFormatter';

// Helper to determine language-specific brand styling
const getLanguageStyle = (lang) => {
  const l = (lang || '').toLowerCase();
  if (l.includes('python')) {
    return {
      name: 'Python',
      bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/60',
      iconGradient: 'from-blue-600 to-indigo-600',
      glow: 'shadow-blue-500/15',
    };
  }
  if (l.includes('javascript') || l.includes('js') || l.includes('node')) {
    return {
      name: 'JavaScript',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60',
      iconGradient: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/15',
    };
  }
  if (l.includes('typescript') || l.includes('ts') || l.includes('react')) {
    return {
      name: l.includes('react') ? 'React' : 'TypeScript',
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-200/80 dark:border-cyan-800/60',
      iconGradient: 'from-cyan-500 to-blue-600',
      glow: 'shadow-cyan-500/15',
    };
  }
  if (l.includes('java') || l.includes('c++') || l.includes('cpp')) {
    return {
      name: l.includes('java') ? 'Java' : 'C++',
      bg: 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-200/80 dark:border-orange-800/60',
      iconGradient: 'from-orange-500 to-rose-600',
      glow: 'shadow-orange-500/15',
    };
  }
  return {
    name: lang ? formatLanguageName(lang) : 'Codebase',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/60',
    iconGradient: 'from-indigo-600 to-violet-600',
    glow: 'shadow-indigo-500/15',
  };
};

// Helper for status badge styling
const getStatusBadge = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'evaluated') {
    return {
      label: 'Evaluated',
      badgeClass: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-700/70',
      dotClass: 'bg-emerald-500',
      pingClass: 'bg-emerald-400'
    };
  }
  if (s === 'submitted' || s === 'under_evaluation') {
    return {
      label: s === 'under_evaluation' ? 'Evaluating' : 'Submitted',
      badgeClass: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/70',
      dotClass: 'bg-amber-500',
      pingClass: 'bg-amber-400'
    };
  }
  if (s === 'published') {
    return {
      label: 'Published',
      badgeClass: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-700/70',
      dotClass: 'bg-indigo-500',
      pingClass: 'bg-indigo-400'
    };
  }
  if (s === 'returned') {
    return {
      label: 'Returned',
      badgeClass: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300/80 dark:border-rose-700/70',
      dotClass: 'bg-rose-500',
      pingClass: 'bg-rose-400'
    };
  }
  return {
    label: formatStatus(status) || 'Draft',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dotClass: 'bg-slate-400',
    pingClass: 'bg-slate-300'
  };
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'evaluated' | 'submitted' | 'draft'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'score' | 'alpha'

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
        setLoading(true);
        const data = isFaculty
          ? await projectService.getAssignedProjects()
          : await projectService.getMyProjects();
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load projects:', err);
        toast.error('Failed to load projects portfolio');
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

  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const isEvaluatedProject = (p) => {
    const s = (p.status || '').toLowerCase();
    return s === 'evaluated' || s === 'published';
  };

  const isInQueueProject = (p) => {
    const s = (p.status || '').toLowerCase();
    return s === 'submitted' || s === 'under_evaluation';
  };

  const isDraftProject = (p) => {
    const s = (p.status || '').toLowerCase();
    return s === 'draft' || s === 'returned';
  };

  // Portfolio Overview Telemetry Calculations
  const stats = useMemo(() => {
    const total = projects.length;
    const evaluated = projects.filter(isEvaluatedProject);
    const inQueue = projects.filter(isInQueueProject);
    const scoredProjects = evaluated.filter(p => p.total_score != null && !isNaN(p.total_score));
    const avgScore = scoredProjects.length > 0 
      ? Math.round(scoredProjects.reduce((acc, curr) => acc + curr.total_score, 0) / scoredProjects.length)
      : null;
    return { total, evaluated: evaluated.length, inQueue: inQueue.length, avgScore };
  }, [projects]);

  // Filtered and Sorted Projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (p.title || '').toLowerCase().includes(q) ||
        (p.course_name || '').toLowerCase().includes(q) ||
        (p.team_name || '').toLowerCase().includes(q)
      );

      if (!matchesSearch) return false;

      if (statusFilter === 'evaluated') {
        return isEvaluatedProject(p);
      }
      if (statusFilter === 'submitted') {
        return isInQueueProject(p);
      }
      if (statusFilter === 'draft') {
        return isDraftProject(p);
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'score') {
        return (b.total_score || 0) - (a.total_score || 0);
      }
      if (sortBy === 'alpha') {
        return (a.title || '').localeCompare(b.title || '');
      }
      // default: newest
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [projects, searchQuery, statusFilter, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans relative overflow-x-hidden">
      
      {/* Antigravity Spatial Depth Ambient Glows */}
      <div className="absolute top-0 right-1/4 -translate-y-24 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/10 to-violet-500/5 dark:from-indigo-600/15 dark:to-purple-600/5 rounded-full blur-[110px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-0 -translate-x-1/2 w-[420px] h-[420px] bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 font-sans">
        
        {/* Modern Compact Hero Header */}
        <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
          
          {/* Subtle Top Accent Sheen */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                <Layers className="w-3 h-3" />
                <span>{isFaculty ? 'Academic Supervision' : 'AI Academic Repository'}</span>
              </div>
              
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {selectionMode ? 'Select Projects to Group' : isFaculty ? 'Assigned Student Projects' : 'My Projects Portfolio'}
              </h1>
              
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl font-normal leading-normal">
                {selectionMode 
                  ? 'Select project submissions to assign them to your target student group.'
                  : isFaculty 
                    ? 'Review, inspect telemetry, and conduct automated AI evaluations across assigned student projects.'
                    : 'Manage your submissions, track multi-layer AI diagnostic evaluations, code quality metrics, and plagiarism reports in real-time.'}
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {selectionMode ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate('/groups')}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCompleteSelection}
                    disabled={isSaving || selectedProjectIds.length === 0}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm text-xs font-semibold disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {isSaving ? 'Processing...' : `Confirm (${selectedProjectIds.length})`}
                  </button>
                </div>
              ) : (
                !isFaculty && (
                  <Link 
                    to="/projects/new" 
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5px]" />
                    <span>Create Project</span>
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Quick Stats Telemetry Ribbon - Compact */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Projects</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">{stats.total}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Evaluated</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">{stats.evaluated}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">In Pipeline</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">{stats.inQueue}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/60">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Avg Overall Score</span>
                <span className="text-lg sm:text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                  {stats.avgScore !== null ? `${stats.avgScore}%` : '—'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-900/60">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

          </div>

        </div>

        {/* Live Filter & Search Control Center - Compact */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title, language, or team..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50/60 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All', count: stats.total },
              { id: 'evaluated', label: 'Evaluated', count: stats.evaluated },
              { id: 'submitted', label: 'In Queue', count: stats.inQueue },
            ].map(tab => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterPill"
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-xs shadow-indigo-600/30"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span className={`relative z-10 px-1.5 py-0.2 rounded-md text-[10px] font-mono transition-colors ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}

            {/* Sort Dropdown */}
            <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800 ml-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="newest">Latest First</option>
                <option value="score">Highest Score</option>
                <option value="alpha">Title (A-Z)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-950 border-t-indigo-600 animate-spin" />
              <Sparkles className="w-5 h-5 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
              Synchronizing academic project portfolio...
            </p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 shadow-xs max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-900/40 shadow-sm">
              <Code2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">No projects archived yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Launch your first academic project submission to trigger automated AI multi-layer code analysis, plagiarism detection, and performance telemetry.
            </p>
            {!isFaculty && (
              <Link 
                to="/projects/new" 
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5px]" />
                <span>Create First Project</span>
              </Link>
            )}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">No matching projects found</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try adjusting your search terms or filter selection.</p>
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
              className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 relative z-10">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((p) => {
                const langStyle = getLanguageStyle(p.course_name);
                const statusBadge = getStatusBadge(p.status);
                const isSelected = selectedProjectIds.includes(p.id);
                const hasScore = p.total_score != null && !isNaN(p.total_score);

                return (
                  <motion.div
                    layout="position"
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{
                      layout: { type: "spring", stiffness: 380, damping: 32, mass: 0.8 },
                      opacity: { duration: 0.2, ease: "easeOut" },
                      scale: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
                    style={{ willChange: 'transform, opacity' }}
                    onMouseMove={handleCardMouseMove}
                    onClick={() => selectionMode ? toggleProjectSelection(p.id) : navigate(`/projects/${p.id}`)}
                    className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border transition-[border-color,background-color,box-shadow] duration-300 flex flex-col justify-between cursor-pointer overflow-hidden ${
                      selectionMode && isSelected
                        ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30 shadow-lg'
                        : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300/90 dark:hover:border-slate-700/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_18px_38px_-12px_rgba(15,23,42,0.08),0_4px_12px_-2px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_18px_38px_-12px_rgba(0,0,0,0.4)]'
                    }`}
                  >
                    {/* Dynamic Mouse-Tracking Spotlight Glow - Ultra Subtle */}
                    <div
                      className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: 'radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99, 102, 241, 0.018), transparent 70%)',
                      }}
                    />

                    {/* Luminous Top Accent Beam */}
                    <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/0 group-hover:via-indigo-400/30 dark:group-hover:via-indigo-300/30 to-transparent transition-all duration-500 pointer-events-none" />

                    {/* Selection Mode Checkmark Indicator */}
                    {selectionMode && (
                      <div className="absolute top-4 left-4 z-30">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-600 shadow-xs' 
                            : 'bg-white/80 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                        </div>
                      </div>
                    )}

                    {/* Card Content Top Zone */}
                    <div>
                      {/* Header Row: Language Pill (Top-Left) + Actions & Evaluation Tag (Top-Right) */}
                      <div className="flex items-center justify-between gap-3">
                        
                        {/* Top-Left: Tech Language Badge */}
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border capitalize tracking-wide shadow-2xs group-hover:border-indigo-400/50 group-hover:shadow-xs transition-all duration-300 ${langStyle.bg}`}>
                          {langStyle.name}
                        </span>

                        {/* Top-Right: Edit/Delete Actions + Status Tag at the Far Corner */}
                        <div className="flex items-center gap-2">
                          
                          {/* Edit / Delete Hover Action Icons (Only for students) */}
                          {!isFaculty && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all duration-200">
                              <button
                                onClick={(e) => handleEditClick(e, p)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                                title="Edit Project Metadata"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(e, p)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                title="Delete Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Evaluation Status Tag Adjusted at the Top-Right Corner */}
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-2xs ${statusBadge.badgeClass}`}>
                            <span className="relative flex h-2 w-2 mr-1.5">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusBadge.pingClass}`} />
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${statusBadge.dotClass}`} />
                            </span>
                            {statusBadge.label}
                          </span>

                        </div>

                      </div>

                      {/* Project Title (Line clamped with balanced height) */}
                      <h3 
                        title={p.title}
                        className="mt-4 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2 min-h-[2.85rem] leading-snug"
                      >
                        {p.title}
                      </h3>

                      {/* Metadata Row: Team & Creation Date */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                        {p.team_name ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 font-medium">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>Team: <strong className="font-semibold text-slate-800 dark:text-slate-200">{p.team_name}</strong></span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100/60 dark:bg-slate-800/50 text-slate-500 text-[11px]">
                            Individual Submission
                          </div>
                        )}

                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy') : 'Recently'}</span>
                        </div>
                      </div>

                    </div>

                    {/* Middle Telemetry: Overall Score or Pipeline Status */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                      {hasScore ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[10px]">
                              Overall Score
                            </span>
                            <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                              {Math.round(p.total_score)}/100
                            </span>
                          </div>
                          
                          {/* Gradient Score Track with Glow on Card Hover */}
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                              style={{ width: `${Math.min(100, Math.max(8, p.total_score))}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-200/60 dark:border-amber-900/40 text-xs">
                          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium text-[11px]">
                            <Sparkles className="w-3 h-3 animate-spin text-amber-600 dark:text-amber-400" />
                            <span>Evaluation In Queue</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">
                            Pending Review
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Bottom Dock: Actionable Metrics CTA */}
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 group-hover:scale-125 transition-transform duration-300" />
                        </span>
                        <span className="font-semibold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          View detailed metrics
                        </span>
                      </div>
                      
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 flex items-center justify-center text-slate-400 group-hover:text-white transition-all duration-300 group-hover:translate-x-1 group-hover:scale-105 shadow-2xs group-hover:shadow-md group-hover:shadow-indigo-500/30">
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* Modern Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => !isDeleting && setShowConfirmModal(false)}>
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-slate-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-200/80 dark:border-slate-800 font-sans">
              <div className="p-6 sm:p-7">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 sm:mx-0 border border-rose-200/80 dark:border-rose-900/60">
                    <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      Permanently Delete Project?
                    </h3>
                    <div className="mt-2 space-y-2.5">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        You are about to delete <span className="font-semibold text-slate-900 dark:text-white">&quot;{projectToDelete?.title}&quot;</span>. This action cannot be reversed.
                      </p>
                      {['submitted', 'under_evaluation'].includes(projectToDelete?.status.toLowerCase()) && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/40">
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                            Warning: Project is currently undergoing {formatStatus(projectToDelete?.status)} logic.
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                        Associated AI datasets, AST cache, and evaluation reports will be permanently purged from the processing engine.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/70 dark:bg-slate-800/40 px-6 py-4 sm:flex sm:flex-row-reverse gap-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  disabled={isDeleting}
                  className="w-full inline-flex justify-center rounded-xl px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-sm font-semibold text-white shadow-md shadow-rose-600/20 sm:w-auto transition-all disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
                  onClick={confirmDelete}
                >
                  {isDeleting ? 'Purging Project...' : 'Confirm Purge'}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none sm:mt-0 sm:w-auto transition-colors"
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
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-slate-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-200/80 dark:border-slate-800 font-sans">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
                      <Edit3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Edit Project</h3>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mt-0.5">Metadata Configuration</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
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
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-normal focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                      placeholder="Detail the technical scope..."
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center"
                    >
                      {isSaving ? (
                        <>
                          <div className="mr-2 h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
