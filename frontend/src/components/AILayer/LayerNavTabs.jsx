import React, { useRef } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  ShieldExclamationIcon,
  CommandLineIcon,
  ChartBarSquareIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

const LAYERS = [
  {
    segment: 'code-detector',
    label: 'AI Code Detector',
    shortLabel: 'AI Detect',
    icon: ShieldExclamationIcon,
    color: 'violet',
  },
  {
    segment: 'code-analyzer',
    label: 'Code Analyzer',
    shortLabel: 'Code',
    icon: CommandLineIcon,
    color: 'blue',
  },
  {
    segment: 'doc-evaluator',
    label: 'Doc Evaluator',
    shortLabel: 'Docs',
    icon: DocumentTextIcon,
    color: 'emerald',
  },
  {
    segment: 'plagiarism',
    label: 'Plagiarism Detector',
    shortLabel: 'Plagiarism',
    icon: MagnifyingGlassIcon,
    color: 'rose',
  },
  {
    segment: 'report-aligner',
    label: 'Report Aligner',
    shortLabel: 'Alignment',
    icon: LinkIcon,
    color: 'cyan',
  },
  {
    segment: 'scorer',
    label: 'Comprehensive Scorer',
    shortLabel: 'Scorer',
    icon: ChartBarSquareIcon,
    color: 'indigo',
  },
  {
    segment: 'feedback',
    label: 'Feedback Generator',
    shortLabel: 'Feedback',
    icon: ChatBubbleLeftRightIcon,
    color: 'amber',
  },
];

const colorMap = {
  violet: {
    active: 'bg-violet-600 text-white shadow-violet-200 dark:shadow-violet-900/30',
    dot: 'bg-violet-500',
  },
  blue: {
    active: 'bg-blue-600 text-white shadow-blue-200 dark:shadow-blue-900/30',
    dot: 'bg-blue-500',
  },
  indigo: {
    active: 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-900/30',
    dot: 'bg-indigo-500',
  },
  emerald: {
    active: 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-900/30',
    dot: 'bg-emerald-500',
  },
  amber: {
    active: 'bg-amber-500 text-white shadow-amber-200 dark:shadow-amber-900/30',
    dot: 'bg-amber-500',
  },
  rose: {
    active: 'bg-rose-600 text-white shadow-rose-200 dark:shadow-rose-900/30',
    dot: 'bg-rose-500',
  },
  cyan: {
    active: 'bg-cyan-600 text-white shadow-cyan-200 dark:shadow-cyan-900/30',
    dot: 'bg-cyan-500',
  },
};

/**
 * LayerNavTabs
 * Renders a horizontally scrollable pill-tab navigation bar linking to each
 * of the 7 AI layer sub-pages under /evaluations/:id/<segment>.
 *
 * Props:
 *  - evaluationId (string) — optionally pass id directly; falls back to useParams
 */
const LayerNavTabs = ({ evaluationId }) => {
  const { id: paramId } = useParams();
  const id = evaluationId || paramId;
  const scrollRef = useRef(null);

  return (
    <div className="relative">
      {/* Fade-edge scroll indicators */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none rounded-l-xl" />
      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none rounded-r-xl" />

      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto scrollbar-hide p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-xs dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_2px_8px_rgba(0,0,0,0.2)]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {LAYERS.map((layer) => {
          const Icon = layer.icon;
          const colors = colorMap[layer.color];

          return (
            <NavLink
              key={layer.segment}
              to={`/evaluations/${id}/${layer.segment}`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 flex-shrink-0 ${
                  isActive
                    ? `${colors.active} shadow-sm`
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{layer.shortLabel}</span>
                  {isActive && (
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} opacity-90`} />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export { LAYERS };
export default LayerNavTabs;
