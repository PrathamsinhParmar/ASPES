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
}) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8 animate-fade-in mb-20">

      {/* ── HEADER ── */}
      <div className="space-y-6">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(`/evaluations/${evaluationId}`)}
          className="group flex items-center text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] hover:text-blue-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Overview
        </button>

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${iconColor} shadow-lg shadow-current/20`}>
              {Icon && <Icon className="w-7 h-7 text-white" />}
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm font-medium text-gray-400 dark:text-slate-500 mt-1">
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
          <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
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
