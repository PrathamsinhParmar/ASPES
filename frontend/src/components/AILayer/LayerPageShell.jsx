import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import LayerNavTabs from './LayerNavTabs';

/**
 * LayerPageShell
 * Reusable wrapper for every AI layer page.
 *
 * Props:
 *  - title         (string)    — e.g. "AI Code Detector"
 *  - subtitle      (string)    — e.g. "Probabilistic AI authorship analysis"
 *  - icon          (Component) — Heroicon component
 *  - iconColor     (string)    — Tailwind bg class, e.g. "bg-violet-600"
 *  - scoreBadge    (node)      — optional JSX: score pill or verdict badge shown in header
 *  - evaluationId  (string)    — passed to LayerNavTabs
 *  - loading       (boolean)
 *  - error         (string)
 *  - children      (node)      — main content
 */
const LayerPageShell = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'bg-blue-600',
  scoreBadge,
  evaluationId,
  loading,
  error,
  children,
  projectTitle,
}) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1.5 sm:pt-2.5 pb-16 space-y-4 animate-fade-in">

      {/* ── HEADER ── */}
      <div className="space-y-4">
        {/* Breadcrumb row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => navigate(`/evaluations/${evaluationId}`)}
            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150 w-fit"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            <span>Back to Layers Overview</span>
          </button>

          {projectTitle && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">Target Project:</span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg max-w-xs sm:max-w-md shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse flex-shrink-0"></span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate tracking-tight">
                  {projectTitle}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl ${iconColor} shadow-md flex items-center justify-center flex-shrink-0`}>
              {Icon && <Icon className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {scoreBadge && <div className="flex-shrink-0">{scoreBadge}</div>}
        </div>

        {/* Layer navigation tabs */}
        <LayerNavTabs evaluationId={evaluationId} />
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-100 dark:border-slate-800 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 animate-pulse">
            Loading Layer Data…
          </p>
        </div>
      ) : error ? (
        <div className="p-10 bg-red-50 dark:bg-rose-900/10 border border-red-100 dark:border-rose-900/30 rounded-3xl text-center">
          <p className="text-red-600 dark:text-rose-400 font-bold">{error}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default LayerPageShell;
