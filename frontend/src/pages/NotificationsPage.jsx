import React from 'react';
import NotificationPanel from '../components/Notification/NotificationPanel';
import { BellIcon } from '@heroicons/react/24/outline';

const NotificationsPage = () => {

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 min-h-screen bg-slate-50/50 dark:bg-slate-950 animate-fade-in relative font-sans">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 dark:bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10 translate-x-1/2 -translate-y-1/2" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
            <BellIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Notification Panel
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              Manage your real-time alerts, project submissions, faculty evaluations, and institutional directives.
            </p>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <NotificationPanel />
    </div>
  );
};

export default NotificationsPage;
