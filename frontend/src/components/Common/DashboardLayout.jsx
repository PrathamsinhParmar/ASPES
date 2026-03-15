import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  ServerIcon
} from '@heroicons/react/24/outline';

const getNavItems = (role) => {
  const common = [
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  if (role === 'admin') {
    return [
      { path: '/dashboard', label: 'Admin Dashboard', icon: ServerIcon },
      { path: '/projects', label: 'All Projects', icon: FolderIcon },
      ...common
    ];
  } else if (role === 'faculty') {
    return [
      { path: '/dashboard', label: 'Review Portal', icon: ClipboardDocumentCheckIcon },
      { path: '/projects', label: 'All Projects', icon: FolderIcon },
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

function SidebarLink({ path, label, icon: Icon }) {
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
      {label}
    </Link>
  );
}

function DashboardLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = getNavItems(user?.role);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex text-gray-900 dark:text-gray-100">
      {/* ---- Sidebar ---- */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 flex flex-col
        w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <AcademicCapIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">ASPES KPGU</p>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider leading-none">AI Evaluation System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <SidebarLink key={item.path} {...item} />
          ))}
        </nav>

        {/* Theme Toggle + User info + logout */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Theme</span>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-sm font-semibold">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.full_name}</p>
              <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tight truncate capitalize">{user?.role}</p>
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (Mobile only) */}
        <header className="md:hidden sticky top-0 z-20 h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">ASPES</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {sidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default DashboardLayout;
