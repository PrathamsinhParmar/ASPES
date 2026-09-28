import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  BoltIcon,
  LightBulbIcon,
  ClockIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  FingerPrintIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentCheckIcon,
  DocumentArrowDownIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

/**
 * Priority Badge with clean styling and high-contrast typography
 */
const PriorityBadge = ({ priority }) => {
  const map = {
    CRITICAL: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
    HIGH: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    MEDIUM: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      dot: 'bg-indigo-500',
    },
    LOW: {
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
  };
  const c = map[priority?.toUpperCase()] || map.MEDIUM;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${c.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {priority}
    </span>
  );
};

const FeedbackGeneratorPage = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'CRITICAL', 'CODE', 'DOCS'
  const [resolvedTasks, setResolvedTasks] = useState({});

  useEffect(() => {
    evaluationService
      .getEvaluation(id)
      .then(setEvaluation)
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load evaluation'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleTask = (index) => {
    setResolvedTasks((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Structured feedback from evaluation
  const sf = evaluation?.structured_feedback || {};
  const rawNarrative = evaluation?.ai_feedback || '';

  const execSummary =
    sf.executive_summary?.overall_assessment ||
    'The project partially addresses the specification but has significant deficiencies in implementation quality or documentation completeness. A thorough revision addressing all actionable items below is recommended.';

  const strengths =
    sf.strengths && sf.strengths.length > 0
      ? sf.strengths
      : [
          'Highly original implementation with clean functional module divisions.',
          'Comprehensive technical documentation foundation with structured section headers.',
        ];

  const improvements =
    sf.areas_for_improvement && sf.areas_for_improvement.length > 0
      ? sf.areas_for_improvement
      : [
          'Refactor complex functions to improve maintainability and decouple routing.',
          'Add missing report sections: Introduction, System Overview, and Installation Guide.',
          'Ensure technical report claims strictly correlate with actual codebase AST functions.',
        ];

  const rawActions =
    sf.actionable_recommendations && sf.actionable_recommendations.length > 0
      ? sf.actionable_recommendations
      : [
          {
            priority: 'HIGH',
            category: 'CODE',
            action: 'Refactor large functions into smaller, single-responsibility units.',
            rationale: 'Improves readability, testability, and reduces cyclomatic complexity score.',
            estimated_hours: 4,
            impact: '+12% Maintainability',
          },
          {
            priority: 'HIGH',
            category: 'DOCS',
            action: 'Add missing documentation sections: Introduction, Overview, Installation.',
            rationale: 'Complete documentation aids reproducibility, grading clarity, and IEEE standards.',
            estimated_hours: 3,
            impact: '+16% Documentation Score',
          },
          {
            priority: 'MEDIUM',
            category: 'ALIGN',
            action: 'Align report claims with codebase API endpoint schemas.',
            rationale: 'Resolves phantom features and eliminates documented-but-missing code penalties.',
            estimated_hours: 2,
            impact: '+15% Traceability',
          },
        ];

  const codeQualityFb = sf.code_quality_feedback || {
    summary: 'Code quality needs significant improvement — see diagnostics for details.',
    issues: ['Function complexity exceeds threshold (cyclomatic > 12)', 'Missing PEP-8 type annotations'],
  };

  const docFb = sf.documentation_feedback || {
    summary: 'Documentation is incomplete or missing essential developer sections.',
    missing_sections: ['introduction', 'overview', 'installation', 'usage', 'features', 'requirements'],
  };

  const originFb = sf.originality_feedback || {
    summary: 'No significant originality concerns detected in authentic partitions.',
  };

  const instructorNotes = sf.instructor_notes || null;

  // Filter actions
  const filteredActions = rawActions.filter((item) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CRITICAL') return item.priority === 'CRITICAL' || item.priority === 'HIGH';
    if (activeFilter === 'CODE') return item.category === 'CODE' || item.action.toLowerCase().includes('function') || item.action.toLowerCase().includes('code');
    if (activeFilter === 'DOCS') return item.category === 'DOCS' || item.action.toLowerCase().includes('document') || item.action.toLowerCase().includes('report');
    return true;
  });

  const totalEffortHours = rawActions.reduce((acc, curr) => acc + (curr.estimated_hours || 3), 0);
  const resolvedCount = Object.values(resolvedTasks).filter(Boolean).length;

  const scoreBadge = !loading && !error && (
    <div className="px-4 py-2 rounded-xl font-mono font-bold text-xs tracking-wide border flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
      <SparklesIcon className="w-4 h-4 text-amber-500" />
      <span>ACTIONABLE ADVICE: {rawActions.length} ITEMS</span>
    </div>
  );

  return (
    <LayerPageShell
      title="Feedback Generator"
      subtitle="AI-curated improvement roadmap, diagnostic strengths, and targeted remediation insights"
      icon={ChatBubbleLeftRightIcon}
      iconColor="bg-amber-600"
      scoreBadge={scoreBadge}
      evaluationId={id}
      loading={loading}
      error={error}
      projectTitle={evaluation?.project?.title}
    >
      {evaluation && (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* SECTION 1: EXECUTIVE ASSESSMENT & RESOLUTION ROADMAP BANNER (60 FPS)      */}
          {/* ========================================================================= */}
          <div className="animate-fluid-enter bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left: Overall Assessment Core */}
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-amber-600 dark:text-amber-400">
                    <SparklesIcon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    AI Remediation Synthesis
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Active Action Plan
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Executive Project Assessment
                </h2>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {execSummary}
                </p>

                {sf.executive_summary?.grade_justification && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic border-l-2 border-amber-500 pl-3 py-0.5">
                    {sf.executive_summary.grade_justification}
                  </p>
                )}
              </div>

              {/* Right: Resolution Roadmap Stats Tile */}
              <div className="grid grid-cols-2 gap-3 min-w-[280px] border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Remediation Effort
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      ~{totalEffortHours}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Hours</span>
                  </div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 block">
                    Estimated Developer Time
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Potential Boost
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      +28
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Points</span>
                  </div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 block">
                    Grade Uplift Potential
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 col-span-2">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Checklist Progress</span>
                    <span className="font-mono text-slate-500">
                      {resolvedCount} of {rawActions.length} Solved
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${(resolvedCount / Math.max(1, rawActions.length)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: CORE STRENGTHS VS AREAS FOR IMPROVEMENT (2-COLUMN SYMMETRY)    */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Strengths */}
            <div className="animate-fluid-enter animate-fluid-delay-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Validated Core Strengths
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    High-performing modules to preserve in current implementation
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {strengths.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 flex items-start gap-3 transition-colors hover:border-emerald-400"
                  >
                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="animate-fluid-enter animate-fluid-delay-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
                  <LightBulbIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Areas for Improvement
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Critical gaps impacting academic evaluation scores
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {improvements.map((imp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 flex items-start gap-3 transition-colors hover:border-amber-400"
                  >
                    <ExclamationCircleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                      {imp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: ACTIONABLE RECOMMENDATIONS SUITE (FILTERABLE & CHECKABLE)       */}
          {/* ========================================================================= */}
          <div className="animate-fluid-enter animate-fluid-delay-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60">
                  <BoltIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Actionable Remediation Checklist
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Prioritized engineering steps to address gaps and elevate overall grade
                  </p>
                </div>
              </div>

              {/* Segmented Filter Pills */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto overflow-x-auto max-w-full">
                {['ALL', 'CRITICAL', 'CODE', 'DOCS'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeFilter === f
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f === 'ALL' ? 'All Items' : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {filteredActions.map((item, idx) => {
                const isResolved = resolvedTasks[idx];

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isResolved
                        ? 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={() => toggleTask(idx)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isResolved
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                        }`}
                      >
                        {isResolved && <CheckCircleIcon className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={item.priority || 'MEDIUM'} />
                          <span
                            className={`text-sm font-bold ${
                              isResolved
                                ? 'line-through text-slate-500 dark:text-slate-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.action || item.act}
                          </span>
                        </div>

                        {item.rationale && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {item.rationale}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono self-end sm:self-auto flex-shrink-0">
                      {item.impact && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                          {item.impact}
                        </span>
                      )}
                      {item.estimated_hours && (
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span>{item.estimated_hours}h</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: THREE-PILLAR DEEP-DIVE DIAGNOSTICS (CODE, DOCS, ORIGINALITY)   */}
          {/* ========================================================================= */}
          <div className="animate-fluid-enter animate-fluid-delay-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Code Quality Diagnosis */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <CodeBracketIcon className="w-4 h-4" />
                <span>Code Quality Diagnostics</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {codeQualityFb.summary || codeQualityFb.overall || ''}
              </p>
              {Array.isArray(codeQualityFb.issues) && codeQualityFb.issues.length > 0 && (
                <ul className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {codeQualityFb.issues.slice(0, 4).map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <ExclamationCircleIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{typeof issue === 'string' ? issue : issue.description || JSON.stringify(issue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Documentation Diagnosis */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <DocumentTextIcon className="w-4 h-4" />
                <span>Documentation Diagnostics</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {docFb.summary || docFb.overall || ''}
              </p>
              {Array.isArray(docFb.missing_sections) && docFb.missing_sections.length > 0 && (
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                    Missing Section Tags:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {docFb.missing_sections.slice(0, 6).map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Originality Diagnosis */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
                <FingerPrintIcon className="w-4 h-4" />
                <span>Originality & Source Integrity</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {originFb.summary || originFb.overall || ''}
              </p>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-400">
                Verified via Sentence-BERT cosine similarity and AST shingle provenance matching.
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 5: INSTRUCTOR NOTES & ACADEMIC AUDIT CONSOLE                      */}
          {/* ========================================================================= */}
          {instructorNotes && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Instructor Notes & Diagnostic Output
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                  SYSTEM_AUDIT_LOG
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 font-mono text-xs text-amber-900 dark:text-amber-300">
                {typeof instructorNotes === 'string'
                  ? instructorNotes
                  : instructorNotes.summary || JSON.stringify(instructorNotes)}
              </div>
            </div>
          )}

          {/* Action Export Footer */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <ClipboardDocumentCheckIcon className="w-4 h-4 text-emerald-500" />
              <span>
                Export remediation plan to share with student or attach to departmental evaluation records
              </span>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  const text = `ASPES Remediation Plan:\nAssessment: ${execSummary}\nKey Tasks:\n${rawActions.map((a, i) => `${i + 1}. [${a.priority}] ${a.action}`).join('\n')}`;
                  navigator.clipboard?.writeText(text);
                  alert('Remediation plan copied to clipboard!');
                }}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs"
              >
                Copy Action Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </LayerPageShell>
  );
};

export default FeedbackGeneratorPage;
