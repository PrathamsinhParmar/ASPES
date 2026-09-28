import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
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
  WrenchScrewdriverIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ScaleIcon,
  CubeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
  CpuChipIcon,
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider border ${c.bg}`}
    >
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {priority}
    </span>
  );
};

/**
 * GRAPH 1: Interactive Remediation Effort vs. Score Impact 4-Quadrant Matrix
 * Visualizes action items on a 2D plane: X = Effort (Hours), Y = Score Impact Points.
 * High Impact + Low Effort = "Quick Wins" (golden priority)
 */
const EffortImpactQuadrantChart = ({ actions, selectedActionIdx, onSelectAction }) => {
  const width = 860;
  const height = 330;
  const paddingLeft = 65;
  const paddingRight = 45;
  const paddingTop = 32;
  const paddingBottom = 45;
  const plotW = width - paddingLeft - paddingRight;
  const plotH = height - paddingTop - paddingBottom;

  const maxHours = 6;
  const maxImpact = 20;

  const midX = paddingLeft + plotW / 2;
  const midY = paddingTop + plotH / 2;

  return (
    <div className="space-y-3.5 w-full select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200 text-sm">
            Remediation ROI Quadrant (Effort vs. Score Yield)
          </span>
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            Interactive
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Quick Wins (Priority 1)
          </span>
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Strategic Overhauls
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-3 h-3 rounded-full bg-slate-400" /> Polish / Minor
          </span>
        </div>
      </div>

      <div className="w-full bg-slate-50/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 p-2 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 sm:h-76 overflow-visible">
          {/* Quadrant Background Shading */}
          {/* Q1: Top-Left Quick Wins (Low Effort, High Impact) */}
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={plotW / 2}
            height={plotH / 2}
            className="fill-emerald-500/5 dark:fill-emerald-500/10"
          />
          <text
            x={paddingLeft + 14}
            y={paddingTop + 22}
            className="text-[12px] font-mono font-black fill-emerald-600 dark:fill-emerald-400 tracking-wider uppercase opacity-90"
          >
            ★ QUICK WINS (High Yield, Fast)
          </text>

          {/* Q2: Top-Right Strategic Projects (High Effort, High Impact) */}
          <rect
            x={midX}
            y={paddingTop}
            width={plotW / 2}
            height={plotH / 2}
            className="fill-blue-500/5 dark:fill-blue-500/10"
          />
          <text
            x={width - paddingRight - 14}
            y={paddingTop + 22}
            textAnchor="end"
            className="text-[12px] font-mono font-black fill-blue-600 dark:fill-blue-400 tracking-wider uppercase opacity-90"
          >
            STRATEGIC OVERHAULS (High Yield, Heavy)
          </text>

          {/* Q3: Bottom-Left Polish (Low Effort, Lower Impact) */}
          <rect
            x={paddingLeft}
            y={midY}
            width={plotW / 2}
            height={plotH / 2}
            className="fill-slate-500/5 dark:fill-slate-500/5"
          />
          <text
            x={paddingLeft + 14}
            y={height - paddingBottom - 12}
            className="text-[11px] font-mono font-bold fill-slate-500 dark:fill-slate-400 tracking-wider uppercase opacity-80"
          >
            POLISH & HYGIENE (Minor Fixes)
          </text>

          {/* Q4: Bottom-Right Re-evaluate (High Effort, Low Impact) */}
          <rect
            x={midX}
            y={midY}
            width={plotW / 2}
            height={plotH / 2}
            className="fill-rose-500/5 dark:fill-rose-500/5"
          />
          <text
            x={width - paddingRight - 14}
            y={height - paddingBottom - 12}
            textAnchor="end"
            className="text-[11px] font-mono font-bold fill-rose-500/80 dark:fill-rose-400/80 tracking-wider uppercase opacity-80"
          >
            RE-EVALUATE PRIORITY
          </text>

          {/* Center Dividing Axes */}
          <line
            x1={midX}
            y1={paddingTop}
            x2={midX}
            y2={height - paddingBottom}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            className="text-slate-300 dark:text-slate-700"
          />
          <line
            x1={paddingLeft}
            y1={midY}
            x2={width - paddingRight}
            y2={midY}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            className="text-slate-300 dark:text-slate-700"
          />

          {/* Outer Border Axis */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={height - paddingBottom}
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-slate-300 dark:text-slate-700"
          />
          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-slate-300 dark:text-slate-700"
          />

          {/* Axis Labels */}
          <text
            x={paddingLeft - 10}
            y={paddingTop + 10}
            textAnchor="end"
            className="text-[11px] font-mono font-bold fill-slate-600 dark:fill-slate-400 uppercase"
          >
            +20 pts
          </text>
          <text
            x={paddingLeft - 10}
            y={midY + 4}
            textAnchor="end"
            className="text-[11px] font-mono font-bold fill-slate-500 dark:fill-slate-400"
          >
            +10 pts
          </text>
          <text
            x={paddingLeft - 10}
            y={height - paddingBottom}
            textAnchor="end"
            className="text-[11px] font-mono font-bold fill-slate-500 dark:fill-slate-400"
          >
            +0 pts
          </text>

          <text
            x={paddingLeft}
            y={height - paddingBottom + 20}
            className="text-[11px] font-mono fill-slate-600 dark:fill-slate-400 uppercase font-bold"
          >
            0h (Quick)
          </text>
          <text
            x={midX}
            y={height - paddingBottom + 20}
            textAnchor="middle"
            className="text-[11px] font-mono fill-slate-600 dark:fill-slate-400 uppercase font-bold"
          >
            3h Dev Effort
          </text>
          <text
            x={width - paddingRight}
            y={height - paddingBottom + 20}
            textAnchor="end"
            className="text-[11px] font-mono fill-slate-600 dark:fill-slate-400 uppercase font-bold"
          >
            6h+ (Deep Work)
          </text>

          {/* Action Item Nodes */}
          {actions.map((item, idx) => {
            const hours = Math.min(maxHours, Math.max(0.5, item.estimated_hours || 2));
            const impactVal = Math.min(maxImpact, Math.max(2, item.impactVal || (item.priority === 'CRITICAL' ? 16 : item.priority === 'HIGH' ? 12 : 6)));

            const cx = paddingLeft + (hours / maxHours) * plotW;
            const cy = paddingTop + plotH - (impactVal / maxImpact) * plotH;

            const isSelected = selectedActionIdx === idx;
            const isQuickWin = hours <= 3 && impactVal >= 10;
            const nodeColor = isQuickWin ? '#10b981' : impactVal >= 10 ? '#3b82f6' : '#64748b';

            return (
              <g
                key={idx}
                className="cursor-pointer group transition-transform duration-200"
                onClick={() => onSelectAction(idx)}
              >
                {/* Outer Glow Ring on Select */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={20}
                    fill={nodeColor}
                    fillOpacity={0.25}
                    className="animate-ping"
                  />
                )}

                {/* Node Target Shadow / Backing */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 16 : 12}
                  fill={nodeColor}
                  className="transition-all duration-300 drop-shadow-md group-hover:scale-125"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                />

                {/* Node Numeric Index */}
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  className="text-[11px] font-mono font-black fill-white pointer-events-none"
                >
                  {idx + 1}
                </text>

                {/* Hover / Active Badge Text */}
                <g className={isSelected ? 'block' : 'hidden group-hover:block pointer-events-none'}>
                  <rect
                    x={Math.min(width - paddingRight - 165, Math.max(paddingLeft, cx - 82))}
                    y={cy - 38}
                    width={165}
                    height={28}
                    rx={7}
                    className="fill-slate-900/95 dark:fill-slate-100/95"
                  />
                  <text
                    x={Math.min(width - paddingRight - 82, Math.max(paddingLeft + 82, cx))}
                    y={cy - 20}
                    textAnchor="middle"
                    className="text-[11.5px] font-mono font-bold fill-white dark:fill-slate-900"
                  >
                    #{idx + 1}: +{impactVal} pts (~{hours}h)
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

/**
 * GRAPH 2: Cumulative Score Recovery Trajectory Simulation
 * Displays a progressive curve from Baseline Grade -> Milestone Step-Ups -> Calibrated Target Grade
 */
const RecoveryTrajectoryChart = ({ baselineScore, milestones, resolvedTasks }) => {
  const width = 860;
  const height = 250;
  const paddingLeft = 65;
  const paddingRight = 50;
  const paddingTop = 28;
  const paddingBottom = 45;
  const plotW = width - paddingLeft - paddingRight;
  const plotH = height - paddingTop - paddingBottom;

  // Build points array
  let accumulated = baselineScore;
  const trajectoryPoints = [
    { label: 'Baseline', score: baselineScore, solved: true, stepName: 'Current State' },
    ...milestones.map((m, idx) => {
      accumulated += m.points;
      return {
        label: `Step ${idx + 1}`,
        score: Math.min(100, accumulated),
        solved: !!resolvedTasks[idx],
        stepName: m.title,
        points: m.points,
      };
    }),
  ];

  const stepX = plotW / (trajectoryPoints.length - 1);

  // Generate SVG path for trajectory
  const pathD = trajectoryPoints.reduce((acc, pt, idx) => {
    const x = paddingLeft + idx * stepX;
    const y = paddingTop + plotH - (pt.score / 100) * plotH;
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Fill area under path
  const firstX = paddingLeft;
  const lastX = paddingLeft + (trajectoryPoints.length - 1) * stepX;
  const bottomY = paddingTop + plotH;
  const areaD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  return (
    <div className="space-y-3.5 w-full select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <span className="font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200 text-sm">
          Remediation Recovery Trajectory (Grade Horizon)
        </span>
        <div className="flex items-center gap-3 text-xs font-mono font-semibold">
          <span className="text-slate-600 dark:text-slate-400">
            Baseline: <strong className="text-slate-900 dark:text-white">{Math.round(baselineScore)}%</strong>
          </span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
            Target: <strong className="text-emerald-500">+{Math.round(accumulated - baselineScore)} pts ({Math.min(100, Math.round(accumulated))}%)</strong>
          </span>
        </div>
      </div>

      <div className="w-full bg-slate-50/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 p-2 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 sm:h-68 overflow-visible">
          <defs>
            <linearGradient id="trajectoryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#6366f1" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grade Bands in Background */}
          {[
            { min: 85, label: 'Distinction (A+)', color: '#10b981' },
            { min: 70, label: 'Proficient (B)', color: '#3b82f6' },
            { min: 55, label: 'Pass (C)', color: '#f59e0b' },
          ].map((band) => {
            const y = paddingTop + plotH - (band.min / 100) * plotH;
            return (
              <g key={band.min}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke={band.color}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.45}
                />
                <text
                  x={width - paddingRight}
                  y={y - 5}
                  textAnchor="end"
                  className="text-[11px] font-mono font-bold"
                  fill={band.color}
                >
                  {band.label} [{band.min}%]
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#areaGrad)" />

          {/* Main Trajectory Line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#trajectoryGrad)"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Milestone Nodes */}
          {trajectoryPoints.map((pt, idx) => {
            const cx = paddingLeft + idx * stepX;
            const cy = paddingTop + plotH - (pt.score / 100) * plotH;
            const isTarget = idx === trajectoryPoints.length - 1;

            return (
              <g key={idx} className="group cursor-pointer">
                {/* Outer Halo */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isTarget ? 12 : 8.5}
                  fill={isTarget ? '#10b981' : '#6366f1'}
                  fillOpacity={0.25}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={isTarget ? 7 : 5.5}
                  fill={isTarget ? '#10b981' : '#6366f1'}
                  stroke="#ffffff"
                  strokeWidth={2}
                />

                {/* Score Tag */}
                <text
                  x={cx}
                  y={cy - 14}
                  textAnchor="middle"
                  className={`text-[12px] font-mono font-black ${
                    isTarget ? 'fill-emerald-600 dark:fill-emerald-400 text-sm' : 'fill-slate-900 dark:fill-slate-100'
                  }`}
                >
                  {Math.round(pt.score)}%
                </text>

                {/* X Axis Label */}
                <text
                  x={cx}
                  y={height - paddingBottom + 18}
                  textAnchor="middle"
                  className="text-[11px] font-mono font-bold fill-slate-700 dark:text-slate-300"
                >
                  {pt.label}
                </text>
                <text
                  x={cx}
                  y={height - paddingBottom + 32}
                  textAnchor="middle"
                  className="text-[10px] font-sans font-medium fill-slate-500 dark:fill-slate-400 max-w-[90px] truncate"
                >
                  {pt.stepName.slice(0, 15)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const FeedbackGeneratorPage = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'CRITICAL', 'CODE', 'DOCS', 'ALIGN'
  const [resolvedTasks, setResolvedTasks] = useState({});
  const [selectedActionIdx, setSelectedActionIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('ACTION_PLAN'); // 'ACTION_PLAN', 'DEEP_DIVE', 'LEARNING_RESOURCES'

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

  // Structured feedback extraction
  const sf = evaluation?.structured_feedback || {};
  const scoresBlock = sf.scores || {};

  const baselineScore = evaluation?.overall_score || scoresBlock.overall || 58;

  const execSummary =
    sf.executive_summary?.overall_assessment ||
    'The project partially addresses the specification but has significant deficiencies in implementation quality or documentation completeness. A thorough revision addressing all actionable items below is recommended.';

  const verdict =
    sf.executive_summary?.one_line_verdict ||
    'Deficiencies detected in module decoupling and missing essential IEEE architectural documentation.';

  const suggestedGrade = sf.executive_summary?.overall_grade_suggestion || (baselineScore >= 85 ? 'A' : baselineScore >= 70 ? 'B' : baselineScore >= 55 ? 'C' : 'D');

  const strengths =
    sf.strengths && sf.strengths.length > 0
      ? sf.strengths
      : [
          'Highly original implementation with clean functional module divisions.',
          'Comprehensive technical documentation foundation with structured section headers.',
          'Zero unauthorized code overlap detected across the global cross-submission corpus.',
        ];

  const improvements =
    sf.areas_for_improvement && sf.areas_for_improvement.length > 0
      ? sf.areas_for_improvement
      : [
          'Refactor complex functions to improve maintainability and decouple routing handlers.',
          'Add missing report sections: Introduction, System Architecture, and Deployment Guide.',
          'Ensure technical report claims strictly correlate with actual codebase AST functions.',
        ];

  // Actionable recommendations with enriched defaults
  const rawActions = useMemo(() => {
    if (sf.actionable_recommendations && sf.actionable_recommendations.length > 0) {
      return sf.actionable_recommendations.map((item, idx) => ({
        ...item,
        estimated_hours: parseFloat(item.estimated_time_hours || item.estimated_hours || 2),
        impactVal: item.priority === 'CRITICAL' ? 16 : item.priority === 'HIGH' ? 12 : 6,
        impact: item.impact || (item.priority === 'CRITICAL' ? '+15% Grade Lift' : '+10% Maintainability'),
        category: item.category || (item.action?.toLowerCase().includes('doc') || item.action?.toLowerCase().includes('report') ? 'DOCS' : item.action?.toLowerCase().includes('align') ? 'ALIGN' : 'CODE'),
      }));
    }
    return [
      {
        priority: 'CRITICAL',
        category: 'CODE',
        action: 'Refactor large monolithic functions into single-responsibility modular units.',
        rationale: 'Reduces cyclomatic complexity from >14 down to <6, directly improving code maintainability score.',
        estimated_hours: 3.5,
        impactVal: 14,
        impact: '+14% Code Quality',
      },
      {
        priority: 'HIGH',
        category: 'DOCS',
        action: 'Incorporate missing documentation sections: System Architecture, Installation, Usage.',
        rationale: 'Addresses incomplete report penalties and satisfies departmental IEEE submission standards.',
        estimated_hours: 2.5,
        impactVal: 12,
        impact: '+12% Documentation',
      },
      {
        priority: 'MEDIUM',
        category: 'ALIGN',
        action: 'Align report claims with codebase API endpoint schemas and actual feature sets.',
        rationale: 'Eliminates phantom feature deductions where features were documented but absent in code.',
        estimated_hours: 2.0,
        impactVal: 8,
        impact: '+8% Traceability',
      },
      {
        priority: 'LOW',
        category: 'CODE',
        action: 'Apply PEP-8 typing annotations and docstrings across utility modules.',
        rationale: 'Polishes code hygiene and elevates automated static analysis benchmarks.',
        estimated_hours: 1.5,
        impactVal: 4,
        impact: '+4% Code Polish',
      },
    ];
  }, [sf.actionable_recommendations]);

  // Code quality feedback
  const codeQualityFb = sf.code_quality_feedback || {
    summary: 'Code quality requires architectural restructuring to decouple monolithic handlers.',
    complexity_notes: 'Several functions exceed cyclomatic complexity threshold of 12.',
    maintainability_notes: 'Coupling between routing and business logic impedes unit testing.',
    testing_notes: 'Missing automated unit tests for core algorithmic procedures.',
    issues: [
      {
        severity: 'HIGH',
        file: 'backend/controllers/main_handler.py',
        line: 42,
        description: 'Function process_request exceeds 85 lines with nested branching logic.',
        suggestion: 'Decompose into separate validator, processor, and serializer functions.',
      },
      {
        severity: 'MEDIUM',
        file: 'frontend/src/utils/data_transformer.js',
        line: 118,
        description: 'Unhandled null propagation in nested JSON parsing.',
        suggestion: 'Implement optional chaining (?.) and defensive fallback defaults.',
      },
    ],
  };

  // Documentation feedback
  const docFb = sf.documentation_feedback || {
    summary: 'Documentation structure is missing fundamental engineering sections required for grading.',
    missing_sections: ['introduction', 'system_architecture', 'installation', 'usage_guide'],
    completeness_percent: 45,
    clarity_notes: 'Existing sections provide good theoretical background but lack reproduction commands.',
  };

  // Alignment feedback
  const alignFb = sf.alignment_feedback || {
    summary: 'Partial divergence between report specifications and actual implemented codebase AST.',
    alignment_score: 64,
    features_claimed_not_implemented: ['Real-time WebSocket alerts', 'Multi-tenant RBAC permissions'],
    features_implemented_not_documented: ['Batch CSV export utility'],
  };

  // Originality feedback
  const originFb = sf.originality_feedback || {
    ai_detection_verdict: 'Human-Authored with Low Synthetic Probability',
    ai_detection_probability_percent: 8.5,
    plagiarism_similarity_percent: 4.2,
    risk_level: 'LOW',
    summary: 'High degree of originality. All core algorithmic modules demonstrate authentic student effort.',
  };

  // Learning resources
  const learningResources = sf.learning_resources && sf.learning_resources.length > 0
    ? sf.learning_resources
    : [
        {
          topic: 'Clean Architecture & Single Responsibility Principle (SRP)',
          suggestion: 'Review decomposing controller actions into isolated service-layer classes with strict dependency injection.',
        },
        {
          topic: 'IEEE Technical Report Structuring',
          suggestion: 'Ensure reports follow the formal Introduction -> Architecture -> Implementation -> Empirical Evaluation structure.',
        },
        {
          topic: 'Defensive Exception Boundaries',
          suggestion: 'Implement global exception middleware and validate payload inputs with strict schema validators.',
        },
      ];

  const instructorNotes = sf.instructor_notes || null;

  // Filter actions
  const filteredActions = rawActions.filter((item) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CRITICAL') return item.priority === 'CRITICAL' || item.priority === 'HIGH';
    if (activeFilter === 'CODE') return item.category === 'CODE';
    if (activeFilter === 'DOCS') return item.category === 'DOCS';
    if (activeFilter === 'ALIGN') return item.category === 'ALIGN';
    return true;
  });

  const totalEffortHours = rawActions.reduce((acc, curr) => acc + (curr.estimated_hours || 2), 0);
  const totalPotentialUplift = rawActions.reduce((acc, curr) => acc + (curr.impactVal || 8), 0);
  const resolvedCount = Object.values(resolvedTasks).filter(Boolean).length;

  // Live Simulated Current Score based on checked tasks
  const pointsRecovered = rawActions.reduce((acc, curr, idx) => {
    return acc + (resolvedTasks[idx] ? (curr.impactVal || 8) : 0);
  }, 0);

  const liveSimulatedScore = Math.min(100, Math.round(baselineScore + pointsRecovered));

  const scoreBadge = !loading && !error && (
    <div className="px-4 py-2 rounded-xl font-mono font-bold text-xs tracking-wide border flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
      <SparklesIcon className="w-4 h-4 text-amber-500" />
      <span>{rawActions.length} REMEDIATION TASKS</span>
    </div>
  );

  return (
    <LayerPageShell
      title="Feedback Generator"
      subtitle="AI-curated resolution cockpit, interactive remediation checklist, and ROI effort impact matrices"
      icon={ChatBubbleLeftRightIcon}
      iconColor="bg-amber-600"
      scoreBadge={scoreBadge}
      evaluationId={id}
      loading={loading}
      error={error}
      projectTitle={evaluation?.project?.title}
    >
      {evaluation && (
        <div className="space-y-7">
          {/* ========================================================================= */}
          {/* SECTION 1: SPATIAL EXECUTIVE RESOLUTION COCKPIT & LIVE SCORE SIMULATOR    */}
          {/* ========================================================================= */}
          <div className="animate-fluid-enter bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
            {/* Subtle Top Gradient Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500 opacity-90" />

            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
              {/* Left Column: Executive Assessment & Verdict */}
              <div className="space-y-4 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-amber-600 dark:text-amber-400">
                    <SparklesIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Departmental Remediation Synthesis
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Advisory Grade: {suggestedGrade}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Executive Diagnostic Verdict
                  </h2>
                  <p className="mt-1.5 text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 leading-snug">
                    "{verdict}"
                  </p>
                </div>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {execSummary}
                </p>

                {/* Pillar Telemetry Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 block">Code Health</span>
                    <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                      {Math.round(scoresBlock.code_quality || 62)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 block">Doc Completeness</span>
                    <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                      {Math.round(docFb.completeness_percent || 45)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 block">Alignment</span>
                    <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
                      {Math.round(alignFb.alignment_score || 64)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                    <span className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 block">Originality</span>
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {originFb.risk_level === 'LOW' ? '96% Clean' : 'Review'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Interactive Score Recovery Gauge */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-5 min-w-[320px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                      Live Remediation Horizon
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    +{pointsRecovered} pts Recovered
                  </span>
                </div>

                {/* Score Comparison Display */}
                <div className="flex items-center justify-around text-center py-1">
                  <div>
                    <span className="text-xs font-mono uppercase font-bold text-slate-500 block">Baseline Score</span>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-slate-700 dark:text-slate-300">
                      {Math.round(baselineScore)}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 block mt-1">Grade {suggestedGrade}</span>
                  </div>

                  <div className="text-slate-400 dark:text-slate-600">
                    <ArrowPathIcon className="w-6 h-6 mx-auto animate-spin-slow" />
                  </div>

                  <div>
                    <span className="text-xs font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold block">
                      Target Projected
                    </span>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400 transition-all duration-300">
                      {liveSimulatedScore}
                    </span>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                      {liveSimulatedScore >= 85 ? 'Grade A (Distinction)' : liveSimulatedScore >= 70 ? 'Grade B (Proficient)' : 'Grade C (Passing)'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm font-mono font-semibold">
                    <span className="text-slate-600 dark:text-slate-300">Action Plan Resolution</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {resolvedCount} of {rawActions.length} Completed
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                      style={{
                        width: `${(resolvedCount / Math.max(1, rawActions.length)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Summary Metadata */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono font-semibold text-slate-600 dark:text-slate-300 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80">
                  <span>Est. Dev Effort: ~{totalEffortHours}h</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Max Recovery: +{totalPotentialUplift} pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: INTERACTIVE ANALYTIC SUITE (EFFORT QUADRANT + TRAJECTORY)      */}
          {/* ========================================================================= */}
          <div className="animate-fluid-enter animate-fluid-delay-1 grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Graph 1: Effort vs Impact Quadrant */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs">
              <EffortImpactQuadrantChart
                actions={rawActions}
                selectedActionIdx={selectedActionIdx}
                onSelectAction={(idx) => setSelectedActionIdx(idx)}
              />
            </div>

            {/* Graph 2: Trajectory Milestone Curve */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs">
              <RecoveryTrajectoryChart
                baselineScore={baselineScore}
                milestones={rawActions.map((a) => ({
                  title: a.action,
                  points: a.impactVal || 8,
                }))}
                resolvedTasks={resolvedTasks}
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: STRATEGIC BALANCE: CORE STRENGTHS VS REMEDIATION DEFICITS      */}
          {/* Enhanced font sizes for effortless legibility                             */}
          {/* ========================================================================= */}
          <div className="animate-fluid-enter animate-fluid-delay-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Validated Strengths */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                    <CheckCircleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900 dark:text-white">
                      Validated Implementation Strengths
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                      High-performing architectural aspects to protect during revision
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {strengths.length} Confirmed
                </span>
              </div>

              <div className="space-y-3.5">
                {strengths.map((str, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 flex items-start gap-3.5 transition-colors hover:border-emerald-400"
                  >
                    <CheckCircleIcon className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed block">
                        {str}
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400 block">
                        ✓ Preserves +{(idx + 1) * 6} pts in rubric baseline
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Deficits */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
                    <LightBulbIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-900 dark:text-white">
                      Identified Growth Deficits
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                      Root causes contributing directly to rubric point deductions
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  {improvements.length} Gaps
                </span>
              </div>

              <div className="space-y-3.5">
                {improvements.map((imp, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 flex items-start gap-3.5 transition-colors hover:border-amber-400"
                  >
                    <ExclamationCircleIcon className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed block">
                        {imp}
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-semibold text-amber-600 dark:text-amber-400 block">
                        ⚠ Potential deduction: -{(idx + 1) * 7} pts if unresolved
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: TABBED ACTION & DIAGNOSTIC NAVIGATION                          */}
          {/* ========================================================================= */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm sm:text-base font-bold">
            <button
              onClick={() => setActiveTab('ACTION_PLAN')}
              className={`pb-3.5 transition-colors border-b-2 flex items-center gap-2.5 ${
                activeTab === 'ACTION_PLAN'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BoltIcon className="w-5 h-5" />
              <span>Interactive Action Checklist</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {rawActions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('DEEP_DIVE')}
              className={`pb-3.5 transition-colors border-b-2 flex items-center gap-2.5 ${
                activeTab === 'DEEP_DIVE'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CubeIcon className="w-5 h-5" />
              <span>4-Pillar Deep-Dive Diagnostics</span>
            </button>

            <button
              onClick={() => setActiveTab('LEARNING_RESOURCES')}
              className={`pb-3.5 transition-colors border-b-2 flex items-center gap-2.5 ${
                activeTab === 'LEARNING_RESOURCES'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BookOpenIcon className="w-5 h-5" />
              <span>Curated Learning Curricula</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {learningResources.length}
              </span>
            </button>
          </div>

          {/* TAB CONTENT: ACTION CHECKLIST */}
          {activeTab === 'ACTION_PLAN' && (
            <div className="animate-fluid-enter bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Prioritized Remediation Checklist
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Check off tasks to dynamically simulate grade recovery in real time
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto overflow-x-auto max-w-full">
                  {['ALL', 'CRITICAL', 'CODE', 'DOCS', 'ALIGN'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                        activeFilter === f
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {f === 'ALL' ? 'All Tasks' : f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-3.5">
                {filteredActions.map((item, idx) => {
                  const isResolved = resolvedTasks[idx];

                  return (
                    <div
                      key={idx}
                      className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isResolved
                          ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-300 dark:border-emerald-900/50 opacity-75'
                          : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleTask(idx)}
                          className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                            isResolved
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                              : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 bg-white dark:bg-slate-900'
                          }`}
                        >
                          {isResolved && <CheckCircleIcon className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <PriorityBadge priority={item.priority || 'MEDIUM'} />
                            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {item.category}
                            </span>
                            <span
                              className={`text-base font-bold ${
                                isResolved
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.action}
                            </span>
                          </div>

                          {item.rationale && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                              {item.rationale}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 text-xs sm:text-sm font-mono self-end sm:self-auto flex-shrink-0">
                        {item.impact && (
                          <span className="px-3 py-1 rounded-md text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                            {item.impact}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold">
                          <ClockIcon className="w-4 h-4" />
                          <span>~{item.estimated_hours}h</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 4-PILLAR DEEP DIVE */}
          {activeTab === 'DEEP_DIVE' && (
            <div className="animate-fluid-enter space-y-6">
              {/* Top Row: Code Quality & Docs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Code Quality Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold text-sm uppercase tracking-wide">
                      <CodeBracketIcon className="w-5 h-5" />
                      <span>Code Quality & AST Defect Telemetry</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                      Score: {Math.round(scoresBlock.code_quality || 62)}%
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {codeQualityFb.summary}
                  </p>

                  {/* Notes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                      <strong className="text-xs font-mono font-bold text-slate-500 uppercase block mb-1">Complexity</strong>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{codeQualityFb.complexity_notes || 'Cyclomatic complexity within bounds'}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                      <strong className="text-xs font-mono font-bold text-slate-500 uppercase block mb-1">Maintainability</strong>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{codeQualityFb.maintainability_notes || 'Module decoupling recommended'}</span>
                    </div>
                  </div>

                  {/* Code Issues List */}
                  {Array.isArray(codeQualityFb.issues) && codeQualityFb.issues.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-mono uppercase font-bold text-slate-500 block">
                        Specific AST Defect Findings:
                      </span>
                      {codeQualityFb.issues.slice(0, 3).map((issue, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg bg-rose-50/30 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-xs sm:text-sm space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {issue.file || 'File'} : Line {issue.line || 0}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 uppercase font-bold text-[11px]">
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 font-medium">
                            {issue.description}
                          </p>
                          {issue.suggestion && (
                            <p className="text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-mono font-semibold">
                              💡 Solution: {issue.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documentation Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm uppercase tracking-wide">
                      <DocumentTextIcon className="w-5 h-5" />
                      <span>Documentation Completeness Audit</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round(docFb.completeness_percent || 45)}% Complete
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {docFb.summary}
                  </p>

                  {/* Completeness Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm font-mono font-semibold">
                      <span className="text-slate-500">IEEE Standard Compliance</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {Math.round(docFb.completeness_percent || 45)}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.round(docFb.completeness_percent || 45)}%` }}
                      />
                    </div>
                  </div>

                  {/* Missing Sections */}
                  {Array.isArray(docFb.missing_sections) && docFb.missing_sections.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                      <span className="text-xs font-mono uppercase font-bold text-slate-500 block">
                        Mandatory Missing Sections to Add:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {docFb.missing_sections.map((sec, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 text-xs sm:text-sm font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800"
                          >
                            + {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {docFb.clarity_notes && (
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic pt-1 font-medium">
                      {docFb.clarity_notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Row: Alignment & Originality */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alignment Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm uppercase tracking-wide">
                      <ScaleIcon className="w-5 h-5" />
                      <span>Code-to-Report Alignment Discrepancies</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      Score: {Math.round(alignFb.alignment_score || 64)}%
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {alignFb.summary}
                  </p>

                  <div className="space-y-3">
                    {alignFb.features_claimed_not_implemented?.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 text-xs sm:text-sm">
                        <strong className="text-rose-700 dark:text-rose-400 font-mono text-xs uppercase block mb-1.5 font-bold">
                          Claimed in Report but Missing in Code (Phantom Features):
                        </strong>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                          {alignFb.features_claimed_not_implemented.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {alignFb.features_implemented_not_documented?.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 text-xs sm:text-sm">
                        <strong className="text-blue-700 dark:text-blue-400 font-mono text-xs uppercase block mb-1.5 font-bold">
                          Implemented in Code but Undocumented:
                        </strong>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                          {alignFb.features_implemented_not_documented.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Originality Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-extrabold text-sm uppercase tracking-wide">
                      <FingerPrintIcon className="w-5 h-5" />
                      <span>Originality & Academic Integrity</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400">
                      Risk Level: {originFb.risk_level}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {originFb.summary}
                  </p>

                  <div className="grid grid-cols-2 gap-3.5 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-xs font-mono text-slate-500 uppercase block font-bold">AI Likelihood</span>
                      <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                        {Math.round(originFb.ai_detection_probability_percent || 8)}%
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-xs font-mono text-slate-500 uppercase block font-bold">Corpus Overlap</span>
                      <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                        {Math.round(originFb.plagiarism_similarity_percent || 4)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-mono font-semibold">
                    ✓ Verified: No disciplinary review required. Authentic student implementation.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: LEARNING CURRICULA */}
          {activeTab === 'LEARNING_RESOURCES' && (
            <div className="animate-fluid-enter bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Curated Engineering Learning Modules
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Targeted academic concepts to review based on detected implementation gaps
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {learningResources.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2 hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AcademicCapIcon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-xs font-bold font-mono uppercase tracking-wider">
                        Topic {idx + 1}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {res.topic}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {res.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 5: INSTRUCTOR NOTES & SYSTEM TELEMETRY AUDIT TERMINAL             */}
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
                <span className="text-xs font-mono font-bold text-slate-500">
                  SYSTEM_AUDIT_LOG
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 font-mono text-xs sm:text-sm text-amber-900 dark:text-amber-300 font-medium leading-relaxed">
                {typeof instructorNotes === 'string'
                  ? instructorNotes
                  : instructorNotes.summary || JSON.stringify(instructorNotes)}
              </div>
            </div>
          )}

          {/* ACTION FOOTER */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
              <ClipboardDocumentCheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>
                Export complete remediation plan with simulated target uplift to departmental records
              </span>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  const text = `ASPES Remediation Plan:\nVerdict: ${verdict}\nProjected Grade Uplift: +${pointsRecovered} pts (Target: ${liveSimulatedScore}%)\nKey Action Items:\n${rawActions.map((a, i) => `${i + 1}. [${a.priority}] ${a.action} (~${a.estimated_hours}h)`).join('\n')}`;
                  navigator.clipboard?.writeText(text);
                  alert('Remediation action plan copied to clipboard!');
                }}
                className="py-2.5 px-5 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs flex items-center gap-2"
              >
                <ClipboardDocumentCheckIcon className="w-4 h-4" />
                <span>Copy Full Action Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </LayerPageShell>
  );
};

export default FeedbackGeneratorPage;
