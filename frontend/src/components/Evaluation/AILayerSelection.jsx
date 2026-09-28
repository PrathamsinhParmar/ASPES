import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { evaluationService } from '../../services/evaluationService';
import { LAYERS } from '../AILayer/LayerNavTabs';
import { ArrowLeftIcon, CpuChipIcon } from '@heroicons/react/24/outline';

const LAYER_CONFIG = {
  'code-detector': {
    category: 'Forensics',
    colorKey: 'violet',
    iconStyle: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    badgeStyle: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    accentDot: 'bg-violet-500',
    description: 'Detect AI-generated code snippets using probabilistic forensics and perplexity analysis.',
    metricHint: 'Authorship Probability'
  },
  'code-analyzer': {
    category: 'Architecture',
    colorKey: 'blue',
    iconStyle: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    badgeStyle: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    accentDot: 'bg-blue-500',
    description: 'Evaluate code quality, modularity, cyclomatic complexity, and structural maintainability.',
    metricHint: 'Code Quality & Structure'
  },
  'doc-evaluator': {
    category: 'Documentation',
    colorKey: 'emerald',
    iconStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    accentDot: 'bg-emerald-500',
    description: 'Assess report coherence, technical completeness, methodology rigor, and formatting clarity.',
    metricHint: 'Report Rigor & Clarity'
  },
  'plagiarism': {
    category: 'Integrity',
    colorKey: 'rose',
    iconStyle: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    badgeStyle: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    accentDot: 'bg-rose-500',
    description: 'Check cross-submission integrity, semantic code vectors, and external repository similarity.',
    metricHint: 'Originality & Citations'
  },
  'report-aligner': {
    category: 'Alignment',
    colorKey: 'cyan',
    iconStyle: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    badgeStyle: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    accentDot: 'bg-cyan-500',
    description: 'Verify that implementations strictly align with claimed report objectives and deliverables.',
    metricHint: 'Spec vs Implementation'
  },
  'scorer': {
    category: 'Grading Hub',
    colorKey: 'indigo',
    iconStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    accentDot: 'bg-indigo-500',
    description: 'View comprehensive performance metrics, weighted aggregations, and final automated scoring.',
    metricHint: 'Automated Scoring'
  },
  'feedback': {
    category: 'Advisory',
    colorKey: 'amber',
    iconStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    badgeStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    accentDot: 'bg-amber-500',
    description: 'Produce actionable, natural-language feedback, technical strengths, and improvement steps.',
    metricHint: 'Actionable Insights'
  },
};

const AILayerSelection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    evaluationService.getEvaluation(id)
      .then(data => setEvaluation(data))
      .catch(err => console.error('Failed to load evaluation', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] animate-pulse">
        <CpuChipIcon className="w-10 h-10 text-indigo-500 mb-3 animate-bounce" />
        <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">Initializing AI Engine Matrix...</p>
      </div>
    );
  }

  if (!evaluation) {
    return <div className="p-8 text-center text-rose-500 font-bold text-sm">Evaluation not found.</div>;
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1.5 sm:pt-2.5 pb-20 space-y-5 animate-fade-in">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 w-fit"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
          <span>Back to Overview</span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">Target Project:</span>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl max-w-xs sm:max-w-md shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse flex-shrink-0"></span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate tracking-tight">
              {evaluation.project?.title || 'Unknown Project'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header / Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-2.5 mb-8 sm:mb-9 mt-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Select AI <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Analysis Layer</span>
        </h1>
        <p className="text-sm sm:text-[15px] font-normal text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Choose a specific AI sub-engine below to visualize the results of the evaluation for{' '}
          <strong className="text-slate-800 dark:text-slate-200 font-semibold">&quot;{evaluation.project?.title || 'this project'}&quot;</strong>.
        </p>
      </div>

      {/* Grid of Layers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
        {LAYERS.map(layer => {
          const Icon = layer.icon;
          const cfg = LAYER_CONFIG[layer.segment] || {
            category: 'Engine',
            iconStyle: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/25',
            badgeStyle: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/25',
            accentDot: 'bg-indigo-500',
            description: 'Inspect detailed analytics and insights generated by this engine.',
            metricHint: 'Evaluation Data'
          };

          return (
            <Link
              key={layer.segment}
              to={`/evaluations/${id}/${layer.segment}`}
              className="group relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-y border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-xl dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.55)] transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 flex flex-col justify-between min-h-[225px] sm:min-h-[235px]"
            >
              <div>
                {/* Header: Icon + Category Badge */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border transition-transform duration-300 ease-out shadow-xs group-hover:scale-105 ${cfg.iconStyle}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${cfg.badgeStyle}`}>
                    {cfg.category}
                  </span>
                </div>

                {/* Layer Title */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 tracking-tight">
                  {layer.label}
                </h3>

                {/* Layer Description */}
                <p className="mt-2 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {cfg.description}
                </p>
              </div>

              {/* Bottom Footer CTA */}
              <div className="mt-6 pt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.accentDot} opacity-70`}></span>
                  <span className="truncate max-w-[130px]">{cfg.metricHint}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                  <span>View Data</span>
                  <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AILayerSelection;
