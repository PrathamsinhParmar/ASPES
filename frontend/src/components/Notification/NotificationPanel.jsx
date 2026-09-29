import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import notificationService from '../../services/notificationService';
import { projectService } from '../../services/projectService';
import { useNavigate } from 'react-router-dom';
import { formatLanguageName } from '../../utils/languageFormatter';
import {
  BellIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  TrashIcon,
  InboxArrowDownIcon,
  ClipboardDocumentCheckIcon,
  MegaphoneIcon,
  PaperClipIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckIcon,
  ArrowPathIcon,
  SparklesIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  UserIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');

const priorityColors = {
  urgent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  normal: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  informational: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
};

const typeLabels = {
  project_submission: 'Project Submission',
  faculty_evaluation: 'Faculty Feedback',
  admin_broadcast: 'Admin Update',
  system_alert: 'System Alert',
};

const NotificationPanel = ({ defaultTab = 'all', compact = false }) => {
  const { user } = useAuth();
  const { unreadCount, markAsRead, markAllAsRead, archiveNotification, deleteNotification, refreshNotifications } = useNotifications();
  const navigate = useNavigate();

  const role = (user?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isFaculty = role === 'professor' || role === 'faculty';
  const isStudent = role === 'student';

  // State
  const [activeTab, setActiveTab] = useState(defaultTab); // all, unread, archived, composer, tracking, audit
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Admin Broadcast Composer State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    target_audience: 'all',
    priority: 'normal',
    scheduled_for: '',
    target_user_ids: [],
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [recipientsList, setRecipientsList] = useState([]);
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);

  // Admin Broadcast Receipts State
  const [broadcastsList, setBroadcastsList] = useState([]);
  const [selectedReceiptBroadcast, setSelectedReceiptBroadcast] = useState(null);

  // Admin Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditFilter, setAuditFilter] = useState('');

  // Download file attachment helper
  const handleDownloadAttachment = async (e, notifItem) => {
    e?.stopPropagation();
    const attachUrl = notifItem.attachment_url || notifItem.metadata_json?.attachment_url;
    const attachName = notifItem.attachment_name || notifItem.metadata_json?.attachment_name || 'evaluation_file';
    
    // Try downloading via project evaluation download endpoint if it's a faculty_evaluation with related_project_id
    if (notifItem.type === 'faculty_evaluation' && notifItem.related_project_id) {
      try {
        const blob = await projectService.downloadEvaluationFile(notifItem.related_project_id);
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.download = attachName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success(`Downloaded "${attachName}" successfully!`);
        return;
      } catch (err) {
        console.warn('API file download fallback to direct URL:', err);
      }
    }

    if (attachUrl) {
      const cleanPath = attachUrl.replace(/\\/g, '/').replace(/^\.?\//, '');
      const fullUrl = `${API_BASE_URL}/${cleanPath}`;
      window.open(fullUrl, '_blank');
    } else {
      toast.error('Attachment link unavailable.');
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const isArchived = activeTab === 'archived';
      const params = {
        is_archived: isArchived,
        limit: 100,
      };
      if (activeTab === 'unread') {
        params.is_read = false;
      }
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      if (priorityFilter !== 'all') {
        params.priority = priorityFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await notificationService.getMyNotifications(params);
      setItems(res);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Admin Data
  const fetchAdminBroadcasts = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const data = await notificationService.getAdminBroadcasts();
      setBroadcastsList(data);
    } catch (err) {
      console.error('Failed to fetch broadcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const data = await notificationService.getAuditLogs({ action: auditFilter || undefined, limit: 100 });
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    if (!isAdmin) return;
    try {
      const data = await notificationService.getRecipientsList();
      setRecipientsList(data);
    } catch (err) {
      console.error('Failed to load recipients list:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'tracking') {
      fetchAdminBroadcasts();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'composer') {
      fetchRecipients();
    } else {
      fetchNotifications();
    }
  }, [activeTab, typeFilter, priorityFilter, searchQuery, auditFilter]);

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      toast.error('Please enter both title and message');
      return;
    }

    try {
      setIsSubmittingBroadcast(true);
      const formData = new FormData();
      formData.append('title', broadcastForm.title);
      formData.append('message', broadcastForm.message);
      formData.append('target_audience', broadcastForm.target_audience);
      formData.append('priority', broadcastForm.priority);
      if (broadcastForm.scheduled_for) {
        formData.append('scheduled_for', broadcastForm.scheduled_for);
      }
      if (broadcastForm.target_user_ids.length > 0) {
        formData.append('target_user_ids', broadcastForm.target_user_ids.join(','));
      }
      if (attachmentFile) {
        formData.append('attachment_file', attachmentFile);
      }

      await notificationService.sendAdminBroadcast(formData);
      toast.success('📢 Broadcast sent and dispatched in real time!');
      setBroadcastForm({
        title: '',
        message: '',
        target_audience: 'all',
        priority: 'normal',
        scheduled_for: '',
        target_user_ids: [],
      });
      setAttachmentFile(null);
      setActiveTab('tracking');
      fetchAdminBroadcasts();
      refreshNotifications();
    } catch (err) {
      console.error('Broadcast failed:', err);
      toast.error(err.response?.data?.detail || 'Failed to dispatch broadcast');
    } finally {
      setIsSubmittingBroadcast(false);
    }
  };

  const toggleExpand = (id, notif) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!notif.is_read) {
        markAsRead(id);
      }
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden font-sans">
      {/* Top Banner / Tabs Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/40">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <BellIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Notification Center
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                    {unreadCount} unread
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                {isFaculty
                  ? 'Real-time student submissions, evaluations, and administrative notices.'
                  : isStudent
                  ? 'Faculty evaluation reviews, scoring assessments, and institutional updates.'
                  : 'System-wide announcement dispatching, read receipts, and activity audit.'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Quick Action */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && activeTab !== 'composer' && activeTab !== 'tracking' && activeTab !== 'audit' && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors border border-indigo-200/50 dark:border-indigo-800/50 shadow-2xs"
            >
              <CheckIcon className="w-4 h-4" />
              <span>Mark all read</span>
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9, rotate: 180 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={() => {
              if (activeTab === 'tracking') fetchAdminBroadcasts();
              else if (activeTab === 'audit') fetchAuditLogs();
              else fetchNotifications();
            }}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Main Tab Navigation with Fluid Sliding Underline */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 overflow-x-auto gap-4 scrollbar-none relative">
        {[
          { id: 'all', label: 'All Inbox', count: items.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          { id: 'archived', label: 'Archived', icon: ArchiveBoxIcon },
          ...(isAdmin
            ? [
                { id: 'composer', label: 'Compose Broadcast', icon: PaperAirplaneIcon },
                { id: 'tracking', label: 'Read Receipts & Tracking', icon: EyeIcon },
                { id: 'audit', label: 'Audit Trail', icon: ShieldCheckIcon },
              ]
            : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-3.5 px-1 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (tab.id === 'all' || tab.count > 0) && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    tab.id === 'unread' && unreadCount > 0
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="activeNotificationTab"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB: INBOX / UNREAD / ARCHIVED
      ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'unread' || activeTab === 'archived') && (
        <div className="p-5 sm:p-6 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, student, remarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Types</option>
                {isFaculty && <option value="project_submission">Student Submissions</option>}
                {isStudent && <option value="faculty_evaluation">Faculty Feedback</option>}
                <option value="admin_broadcast">Admin Updates</option>
                <option value="system_alert">System Alerts</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
                <option value="informational">Informational</option>
              </select>
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-xs text-slate-400 mt-2">Loading notifications...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/50 dark:bg-slate-950/20 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
              <BellIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-2 stroke-1" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No notifications found</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {activeTab === 'unread'
                  ? "You're all caught up! No unread notifications."
                  : activeTab === 'archived'
                  ? 'No archived items.'
                  : 'New submissions, evaluations, and admin announcements will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((notif, index) => {
                const isExpanded = expandedId === notif.id;
                const meta = notif.metadata_json || {};
                const priorityClass = priorityColors[notif.priority] || priorityColors.normal;

                return (
                  <div
                    key={notif.id}
                    className={`rounded-xl border transition-[border-color,box-shadow,background-color] duration-200 overflow-hidden ${
                      isExpanded
                        ? 'ring-1 ring-indigo-500/30 border-indigo-300/80 dark:border-indigo-700/60 shadow-md bg-white dark:bg-slate-900'
                        : !notif.is_read
                        ? 'bg-indigo-50/25 dark:bg-indigo-950/15 border-indigo-200/80 dark:border-indigo-800/40 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                    }`}
                  >
                    {/* Item Main Row with ultra-smooth 60FPS click feedback */}
                    <div
                      onClick={() => toggleExpand(notif.id, notif)}
                      className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none transition-colors duration-150 active:bg-slate-50/80 dark:active:bg-slate-800/60"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 mt-0.5">
                          {notif.type === 'project_submission' ? (
                            <InboxArrowDownIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          ) : notif.type === 'faculty_evaluation' ? (
                            <ClipboardDocumentCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : notif.type === 'admin_broadcast' ? (
                            <MegaphoneIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <BellIcon className="w-5 h-5 text-slate-500" />
                          )}
                        </div>

                        {/* Title, message teaser, sender */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {typeLabels[notif.type] || notif.type}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${priorityClass}`}>
                              {notif.priority}
                            </span>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-400/30 animate-pulse" />
                            )}
                          </div>

                          <h4 className={`text-sm sm:text-base mt-1 truncate ${!notif.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-800 dark:text-slate-200'}`}>
                            {notif.title}
                          </h4>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-normal">
                            {notif.message}
                          </p>
                        </div>
                      </div>

                      {/* Right Meta & Actions */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right text-[11px] text-slate-400 flex items-center gap-1 font-normal">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span>{new Date(notif.created_at).toLocaleString()}</span>
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {!notif.is_read ? (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 rounded-lg transition-all duration-150"
                              title="Mark as read"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          ) : (
                            <span title="Read" className="text-emerald-500 p-1.5">
                              <CheckCircleIcon className="w-4 h-4" />
                            </span>
                          )}

                          <button
                            onClick={() => archiveNotification(notif.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 rounded-lg transition-all duration-150"
                            title="Archive"
                          >
                            <ArchiveBoxIcon className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:scale-90 rounded-lg transition-all duration-150"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Smooth Rotating Chevron Drop List Indicator */}
                        <div className="pl-1">
                          <ChevronDownIcon
                            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                              isExpanded ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Drop Down List Type Accordion (60FPS Native CSS Grid Unfolding) */}
                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div
                          className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                            isExpanded
                              ? 'opacity-100 translate-y-0'
                              : 'opacity-0 -translate-y-2 pointer-events-none'
                          }`}
                        >
                          <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 space-y-4">
                            {/* Full Message Body */}
                            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line shadow-2xs">
                              {notif.message}
                            </div>

                            {/* ── Faculty Specific: Student Submission Details ── */}
                            {notif.type === 'project_submission' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs">
                                  <h5 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <UserIcon className="w-4 h-4 text-blue-500" /> Submitting Student Information
                                  </h5>
                                  <div className="space-y-1 text-slate-600 dark:text-slate-300">
                                    <div><span className="font-semibold text-slate-400">Name: </span>{meta.student_name || notif.sender_name}</div>
                                    <div><span className="font-semibold text-slate-400">Email: </span>{meta.student_email || 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-400">Department: </span>{meta.student_department || 'General'}</div>
                                    {meta.team_name && <div><span className="font-semibold text-slate-400">Team: </span>{meta.team_name}</div>}
                                  </div>
                                </div>

                                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs">
                                  <h5 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <ClipboardDocumentCheckIcon className="w-4 h-4 text-indigo-500" /> Submission Metadata
                                  </h5>
                                  <div className="space-y-1 text-slate-600 dark:text-slate-300">
                                    <div><span className="font-semibold text-slate-400">Submission ID: </span>#{meta.submission_id || notif.related_project_id}</div>
                                    <div><span className="font-semibold text-slate-400">Course / Language: </span>{meta.course_name ? formatLanguageName(meta.course_name) : 'N/A'}</div>
                                    <div><span className="font-semibold text-slate-400">Submitted At: </span>{meta.submitted_at_str || new Date(notif.created_at).toLocaleString()}</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ── Student Specific: Faculty Evaluation Assessment Details ── */}
                            {notif.type === 'faculty_evaluation' && (
                              <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg space-y-3 text-xs">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                      Evaluation Verdict: {meta.evaluation_status || 'Reviewed'}
                                    </span>
                                  </div>
                                  {meta.score !== null && meta.score !== undefined && (
                                    <div className="text-right">
                                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                        {meta.score} / 100
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Sub scores if available */}
                                {meta.metrics && (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-indigo-200/50 dark:border-indigo-800/40">
                                    <div className="bg-white/70 dark:bg-slate-900/70 p-2 rounded-md text-center">
                                      <span className="text-[10px] text-slate-400">Code Quality</span>
                                      <p className="font-semibold text-slate-800 dark:text-slate-200">{meta.metrics.code_quality ?? 'N/A'}%</p>
                                    </div>
                                    <div className="bg-white/70 dark:bg-slate-900/70 p-2 rounded-md text-center">
                                      <span className="text-[10px] text-slate-400">Documentation</span>
                                      <p className="font-semibold text-slate-800 dark:text-slate-200">{meta.metrics.documentation ?? 'N/A'}%</p>
                                    </div>
                                    <div className="bg-white/70 dark:bg-slate-900/70 p-2 rounded-md text-center">
                                      <span className="text-[10px] text-slate-400">Originality</span>
                                      <p className="font-semibold text-slate-800 dark:text-slate-200">{meta.metrics.plagiarism ?? 'N/A'}%</p>
                                    </div>
                                    <div className="bg-white/70 dark:bg-slate-900/70 p-2 rounded-md text-center">
                                      <span className="text-[10px] text-slate-400">Alignment</span>
                                      <p className="font-semibold text-slate-800 dark:text-slate-200">{meta.metrics.report_alignment ?? 'N/A'}%</p>
                                    </div>
                                  </div>
                                )}

                                {meta.feedback && (
                                  <div className="pt-2 text-slate-700 dark:text-slate-300 italic">
                                    &ldquo;{meta.feedback}&rdquo;
                                  </div>
                                )}

                                {/* ── Student Evaluation File Attachment Card ── */}
                                {(notif.attachment_url || meta.attachment_url) && (
                                  <div className="mt-3 p-3.5 bg-white dark:bg-slate-900/90 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-3 shadow-xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                        <PaperClipIcon className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs truncate">
                                          {notif.attachment_name || meta.attachment_name || 'Faculty Evaluation Attachment'}
                                        </span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                          Attached evaluation review & feedback file
                                        </span>
                                      </div>
                                    </div>
                                    <motion.button
                                      type="button"
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={(e) => handleDownloadAttachment(e, notif)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-all flex-shrink-0"
                                    >
                                      <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                      <span>Download</span>
                                    </motion.button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Admin Platform Notation note */}
                            {meta.admin_notation && (
                              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                                <InformationCircleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold">Institutional Instruction: </span>
                                  {meta.admin_notation}
                                </div>
                              </div>
                            )}

                            {/* Attachments / Direct Action Link */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                              <div className="flex items-center gap-2">
                                {(notif.attachment_url || meta.attachment_url) && (
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={(e) => handleDownloadAttachment(e, notif)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
                                  >
                                    <PaperClipIcon className="w-3.5 h-3.5" />
                                    <span>{notif.attachment_name || meta.attachment_name || 'Download Attachment'}</span>
                                    <ArrowDownTrayIcon className="w-3.5 h-3.5 opacity-70" />
                                  </motion.button>
                                )}
                              </div>

                              {notif.related_project_id && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => navigate(`/projects/${notif.related_project_id}`)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                                >
                                  <span>Open Project Workspace</span>
                                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: ADMIN COMPOSE BROADCAST
      ───────────────────────────────────────────────────────────── */}
      {isAdmin && activeTab === 'composer' && (
        <div className="p-6 max-w-3xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compose Institutional Broadcast</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Broadcast announcements, evaluation guidelines, policy changes, or submission instructions simultaneously to student and faculty dashboards.
            </p>
          </div>

          <form onSubmit={handleBroadcastSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Broadcast Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Final Project Submission Rubric & Deadline Extension"
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Target Audience & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Target Audience <span className="text-rose-500">*</span>
                </label>
                <select
                  value={broadcastForm.target_audience}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, target_audience: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Roles (Students & Faculty)</option>
                  <option value="students">All Students</option>
                  <option value="faculty">All Faculty Members</option>
                  <option value="individual">Specific Individuals</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Priority Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={broadcastForm.priority}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="normal">Normal Announcement</option>
                  <option value="urgent">Urgent / Deadline Notice</option>
                  <option value="informational">Informational / Tip</option>
                </select>
              </div>
            </div>

            {/* Individual Recipients Multi-select (if Target Audience == individual) */}
            {broadcastForm.target_audience === 'individual' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Specific Individuals ({broadcastForm.target_user_ids.length} selected)
                </label>
                <div className="max-h-44 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                  {recipientsList.map((r) => {
                    const isSelected = broadcastForm.target_user_ids.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBroadcastForm({
                                ...broadcastForm,
                                target_user_ids: [...broadcastForm.target_user_ids, r.id],
                              });
                            } else {
                              setBroadcastForm({
                                ...broadcastForm,
                                target_user_ids: broadcastForm.target_user_ids.filter((id) => id !== r.id),
                              });
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{r.full_name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{r.email} ({r.role})</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message Body (Rich instructions) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Announcement Body / Guidelines <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={6}
                placeholder="Write structured guidelines, policy notifications, evaluation rubrics, or platform instructions..."
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
              />
            </div>

            {/* Attachment and Scheduling Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Attach Document (PDF, Rubric, Guidelines)
                </label>
                <input
                  type="file"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Schedule Delivery (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={broadcastForm.scheduled_for}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, scheduled_for: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                disabled={isSubmittingBroadcast}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                <span>{isSubmittingBroadcast ? 'Dispatching...' : 'Dispatch Real-Time Broadcast'}</span>
              </motion.button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: ADMIN READ RECEIPTS & TRACKING
      ───────────────────────────────────────────────────────────── */}
      {isAdmin && activeTab === 'tracking' && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Broadcast Delivery & Read Receipts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track real-time delivery confirmation and see which faculty or students have opened and read each broadcast.
              </p>
            </div>
            <button
              onClick={fetchAdminBroadcasts}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh tracking
            </button>
          </div>

          {broadcastsList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg">
              <EyeIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2 stroke-1" />
              <p className="text-sm font-medium">No broadcasts created yet.</p>
              <button
                onClick={() => setActiveTab('composer')}
                className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
              >
                + Compose First Broadcast
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {broadcastsList.map((b) => (
                <div
                  key={b.broadcast_id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                        Audience: {b.target_audience}
                      </span>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white mt-1">{b.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-normal">{b.message}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReceiptBroadcast(b);
                        }}
                        className="mt-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 active:scale-95 rounded-md transition-all inline-flex items-center gap-1 shadow-2xs cursor-pointer select-none"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        <span>View Read Receipts</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Delivered to: <strong className="text-slate-800 dark:text-slate-200">{b.total_delivered} recipients</strong>
                      </span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {b.total_read} Read ({b.read_percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${b.read_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Receipt Modal Portal with Smooth Spring Backdrop & Content */}
          {typeof document !== 'undefined' &&
            createPortal(
              <AnimatePresence>
                {selectedReceiptBroadcast && (
                  <motion.div
                    key="read-receipt-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setSelectedReceiptBroadcast(null);
                    }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm"
                  >
                    <motion.div
                      key="read-receipt-modal-card"
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: 6 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col font-sans"
                    >
                      {/* Modal Header */}
                      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                            <EyeIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                Recipient Read Receipts
                              </h4>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                                {selectedReceiptBroadcast.total_read} / {selectedReceiptBroadcast.total_delivered} Read
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-sm">
                              {selectedReceiptBroadcast.title}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptBroadcast(null)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all"
                          title="Close"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Recipients List */}
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs pr-1 scrollbar-none no-scrollbar">
                        {selectedReceiptBroadcast.recipients && selectedReceiptBroadcast.recipients.length > 0 ? (
                          selectedReceiptBroadcast.recipients.map((r, rIdx) => {
                            const initials = (r.recipient_name || 'U')
                              .trim()
                              .split(/\s+/)
                              .filter(Boolean)
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase();
                            return (
                              <div key={`${r.recipient_id || rIdx}-${rIdx}`} className="py-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-semibold text-xs uppercase flex-shrink-0">
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                                      {r.recipient_name}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate">
                                      {r.recipient_email} • <span className="capitalize">{r.recipient_role}</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  {r.is_read ? (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200/50 dark:border-emerald-800/50">
                                      <CheckCircleIcon className="w-4 h-4" />
                                      <span>
                                        Read {r.read_at ? new Date(r.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                                      Delivered (Unread)
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-8 text-center text-slate-400">
                            No recipient receipts found for this broadcast.
                          </div>
                        )}
                      </div>

                      {/* Modal Footer */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">
                          Audience: <strong className="text-slate-700 dark:text-slate-300 capitalize">{selectedReceiptBroadcast.target_audience || 'All'}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptBroadcast(null)}
                          className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-lg transition-all"
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: ADMIN AUDIT TRAIL
      ───────────────────────────────────────────────────────────── */}
      {isAdmin && activeTab === 'audit' && (
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notification Audit Trail</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete forensic record of creation, real-time pushes, reads, and archival across all user roles.
              </p>
            </div>
            <input
              type="text"
              placeholder="Filter by action (e.g. READ, CREATED)..."
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              className="px-3.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {log.actor_name || 'System'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 capitalize">{log.actor_role || 'System'}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-xs">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
