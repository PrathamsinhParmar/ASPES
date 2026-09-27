import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  InboxArrowDownIcon,
  ClipboardDocumentCheckIcon,
  MegaphoneIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';

const NotificationBell = ({ onOpenFullPanel }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeIcon = (type, priority) => {
    switch (type) {
      case 'project_submission':
        return <InboxArrowDownIcon className="w-4 h-4 text-blue-500" />;
      case 'faculty_evaluation':
        return <ClipboardDocumentCheckIcon className="w-4 h-4 text-emerald-500" />;
      case 'admin_broadcast':
        return <MegaphoneIcon className="w-4 h-4 text-purple-500" />;
      default:
        return <BellIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    setIsOpen(false);

    if (notif.related_project_id) {
      navigate(`/projects/${notif.related_project_id}`);
    } else if (onOpenFullPanel) {
      onOpenFullPanel(notif);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        className={`relative p-2.5 rounded-xl border transition-all duration-200 group
          ${
            isOpen
              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
              : 'bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          } shadow-sm`}
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-wiggle" />
        ) : (
          <BellIcon className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
        )}

        {/* Live WS connection status tiny dot */}
        <span
          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
            isConnected ? 'bg-emerald-500' : 'bg-amber-400'
          }`}
          title={isConnected ? 'Real-Time Connected' : 'Polling Sync'}
        />

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-extrabold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-full shadow-md shadow-red-500/30 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden transform animate-in fade-in slide-in-from-top-2 duration-200 font-sans">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h4>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                {unreadCount} unread
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <CheckIcon className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List of Recent Notifications */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <BellIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2 stroke-1" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">We&apos;ll alert you as soon as updates arrive.</p>
              </div>
            ) : (
              notifications.slice(0, 6).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors relative flex items-start gap-3 ${
                    !notif.is_read ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Icon badge */}
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 mt-0.5">
                    {getTypeIcon(notif.type, notif.priority)}
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${!notif.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {formatTimeAgo(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>

                    {/* Meta tags */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {notif.priority === 'urgent' && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                          Urgent
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">
                        By {notif.sender_name || 'System'}
                      </span>
                    </div>
                  </div>

                  {/* Unread Blue Dot */}
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onOpenFullPanel) {
                  onOpenFullPanel();
                } else {
                  navigate('/notifications');
                }
              }}
              className="w-full py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
            >
              <span>View All in Notification Panel</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
