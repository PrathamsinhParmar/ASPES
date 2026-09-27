import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';
import ThemeToggle from './ThemeToggle';
import {
  HomeIcon,
  FolderIcon,
  ChartBarIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentCheckIcon,
  ServerIcon,
  UserGroupIcon,
  InboxArrowDownIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import NotificationBell from '../Notification/NotificationBell';

const API_BASE_URL = api.defaults.baseURL?.replace('/api/v1', '') ?? '';

const getNavItems = (role) => {
  const normRole = (role || '').toString().trim().toUpperCase();
  const common = [
    { path: '/notifications', label: 'Notifications', icon: BellIcon },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  if (normRole === 'ADMIN') {
    return [
      { path: '/dashboard', label: 'Admin Dashboard', icon: ServerIcon },
      { path: '/faculty', label: 'Faculty Members', icon: AcademicCapIcon },
      ...common
    ];
  } else if (normRole === 'FACULTY' || normRole === 'PROFESSOR') {
    return [
      { path: '/assigned', label: 'Assigned Projects', icon: InboxArrowDownIcon },
      { path: '/review-portal', label: 'Review Portal', icon: ClipboardDocumentCheckIcon },
      { path: '/projects', label: 'All Projects', icon: FolderIcon },
      { path: '/groups', label: 'Groups', icon: UserGroupIcon },
      ...common
    ];
  } else {
    // Default to student
    return [
      { path: '/dashboard', label: 'My Dashboard', icon: HomeIcon },
      { path: '/projects', label: 'My Projects', icon: FolderIcon },
      ...common
    ];
  }
};

function SidebarLink({ path, label, icon: Icon, badge }) {
  const location = useLocation();
  const isActive = location.pathname === path || (location.pathname.startsWith(path + '/') && path !== '/dashboard');

  return (
    <Link
      to={path}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500/20'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-extrabold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-full shadow-sm">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}

function DashboardLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const navItems = getNavItems(user?.role);

  return (
    <div className="min-h-screen bg-transparent dark:bg-slate-950 flex text-gray-900 dark:text-gray-100">
      {/* ---- Sidebar ---- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 flex flex-col
        bg-[#FAF9F6] dark:bg-slate-900 border-r border-[#EBE3D5] dark:border-slate-800
        transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)]
        shadow-2xl md:shadow-none
        ${sidebarOpen 
          ? 'w-72 translate-x-0 opacity-100' 
          : 'w-0 -translate-x-full opacity-0 overflow-hidden pointer-events-none'
        }
      `}>
        {/* Logo Section */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-gray-100 dark:border-slate-800/50">
          <div className="flex items-center">
            {/* Light Mode Logo (Visible when not in dark mode) */}
            <img 
              src="/ASPESLight.png" 
              alt="ASPES Light" 
              className="h-10 sm:h-20 w-auto max-w-[210px] object-contain block dark:hidden"
            />
            {/* Dark Mode Logo (Visible only in dark mode) */}
            <img 
              src="/ASPESDark.png" 
              alt="ASPES Dark" 
              className="h-10 sm:h-20 w-auto max-w-[202px] object-contain hidden dark:block"
            />
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <SidebarLink
              key={item.path}
              {...item}
              badge={item.path === '/notifications' ? unreadCount : 0}
            />
          ))}
        </nav>

        {/* Theme Toggle + User info + logout */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Theme</span>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-white/50 dark:bg-slate-800/50 rounded-xl">
            {user?.profile_photo ? (
              <img 
                src={`${API_BASE_URL}${user.profile_photo}?v=${new Date(user.updated_at || Date.now()).getTime()}`} 
                alt={user.full_name} 
                className="w-8 h-8 rounded-full object-cover shadow-sm bg-white dark:bg-slate-800 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-sm font-semibold flex-shrink-0">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.full_name}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ---- Main Content ---- */}
      <div className={`
        flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)]
        ${sidebarOpen ? 'md:ml-72' : 'ml-0'}
      `}>
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              title="Toggle Sidebar"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                {user?.role === 'professor' ? 'Faculty Portal' : user?.role === 'admin' ? 'Admin Center' : 'Student Portal'}
              </span>
            </div>
          </div>

          {/* Right Header Utilities: Notification Bell, Theme, Profile */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default DashboardLayout;
