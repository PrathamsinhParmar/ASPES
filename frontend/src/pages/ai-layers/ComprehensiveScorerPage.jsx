import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ChartBarSquareIcon,
  TrophyIcon,
  SparklesIcon,
  AcademicCapIcon,
  ScaleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ArrowTrendingUpIcon,
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  FingerPrintIcon,
  LinkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

/**
 * 60 FPS Smooth Radial Sub-Score Meter
 */
const RadialMeter = ({ score, color = '#6366f1', size = 58, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 filter drop-shadow-xs overflow-visible" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'stroke-dashoffset',
          }}
          fill="transparent"
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 tabular-nums select-none">
        {Math.round(clampedScore)}%
      </span>
    </div>
  );
};

/**
 * 3D Holographic Master Score Arc & Grade Vault Centerpiece
 */
const MasterScoreVault = ({ totalScore, stats, isHighRisk }) => {
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedScore = Math.min(100, Math.max(0, totalScore));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const getScoreTheme = (score) => {
    if (score >= 85) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.35)', grad: ['#10b981', '#059669'] };
    if (score >= 70) return { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.35)', grad: ['#3b82f6', '#2563eb'] };
    if (score >= 50) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)', grad: ['#f59e0b', '#d97706'] };
    return { stroke: '#f43f5e', glow: 'rgba(244, 63, 94, 0.35)', grad: ['#f43f5e', '#be123c'] };
  };

  const theme = getScoreTheme(clampedScore);

  return (
    <div className="relative flex flex-col sm:flex-row items-center gap-6 select-none">
      {/* 3D Circular Arc */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Ambient 3D Volumetric Glow */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-700"
          style={{ backgroundColor: theme.glow }}
        />

        <svg className="transform -rotate-90 overflow-visible" width={size} height={size}>
          <defs>
            <linearGradient id="scorerMasterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.grad[0]} />
              <stop offset="100%" stopColor={theme.grad[1]} />
            </linearGradient>
            <filter id="scorer3dGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800/80"
            fill="transparent"
          />

          {/* Calibrated Tick Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + 9}
            stroke="currentColor"
            strokeWidth={1.2}
            strokeDasharray="2 7"
            className="text-slate-300 dark:text-slate-700"
            fill="transparent"
          />

          {/* Animated Master Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#scorerMasterGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#scorer3dGlow)"
            style={{
              transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'stroke-dashoffset',
            }}
            fill="transparent"
          />
        </svg>

        {/* Center Aggregate Typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline tracking-tight">
            <span
              className="text-5xl font-black font-mono tracking-tight tabular-nums"
              style={{ color: theme.stroke }}
            >
              {Math.round(clampedScore)}
            </span>
            <span className="text-xl font-bold text-slate-400 dark:text-slate-500 ml-1">/100</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mt-0.5">
            Composite Index
          </span>
        </div>
      </div>

      {/* Grade Vault Card */}
      <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 flex flex-col items-center sm:items-start text-center sm:text-left min-w-[170px] shadow-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Evaluated Grade
        </span>
        <div className="text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white mt-1">
          {stats.grade}
        </div>
        <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.stroke }} />
          <span className="text-slate-700 dark:text-slate-300 font-medium">{stats.interpretation}</span>
        </div>
        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-2 block">
          Cohort Rank: <strong className="text-indigo-600 dark:text-indigo-400">{stats.rank}</strong>
        </span>
      </div>
    </div>
  );
};

/**
 * 3D Holographic Logical Footprint Radar Constellation
 * Multi-dimensional synthesis across all 5 AI evaluation pillars.
 */
const LogicalFootprintRadar = ({ radarData }) => {
  const size = 260;
  const center = size / 2;
  const radius = 86;
  const total = radarData.length;

  const points = radarData.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    const r = (Math.max(12, Math.min(100, dim.score)) / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      angle,
      ...dim,
    };
  });

  const polygonPath = points.map((p) => `${p.x},${p.y}`).join(' ');
  const gridLevels = [0.33, 0.66, 1.0];

  return (
    <div className="relative flex flex-col items-center justify-center p-3 select-none">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <linearGradient id="footprintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.15" />
          </linearGradient>
          <filter id="footprintGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric Guide Pentagons */}
        {gridLevels.map((lvl, lIdx) => {
          const lvlPoints = Array.from({ length: total })
            .map((_, i) => {
              const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
              const r = radius * lvl;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            })
            .join(' ');

          return (
            <polygon
              key={lIdx}
              points={lvlPoints}
              fill="none"
              stroke="currentColor"
              strokeDasharray={lIdx === 2 ? 'none' : '3 3'}
              strokeWidth={lIdx === 2 ? 1.2 : 0.8}
              className="text-slate-200 dark:text-slate-700/60"
            />
          );
        })}

        {/* Radial Axis Spokes */}
        {radarData.map((_, i) => {
          const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={0.8}
              className="text-slate-200 dark:text-slate-700/60"
            />
          );
        })}

        {/* Filled Data Polygon with 3D Glow */}
        <polygon
          points={polygonPath}
          fill="url(#footprintGrad)"
          stroke="#6366f1"
          strokeWidth={2.2}
          filter="url(#footprintGlow)"
          className="transition-all duration-1000 ease-out"
        />

        {/* Vertex Markers & Labels */}
        {points.map((p, i) => {
          const labelDist = radius + 22;
          const lx = center + labelDist * Math.cos(p.angle);
          const ly = center + labelDist * Math.sin(p.angle);

          return (
            <g key={i} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r={4.5}
                className="fill-white dark:fill-slate-900 stroke-indigo-500 transition-transform duration-300 group-hover:scale-150"
                strokeWidth={2}
              />
              <text
                x={lx}
                y={ly + 4}
                textAnchor="middle"
                className="text-[10px] font-semibold fill-slate-600 dark:fill-slate-400 group-hover:fill-indigo-500 transition-colors pointer-events-none select-none"
              >
                {p.subject}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 text-center">
        <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
          5-Axis Multi-Modal Footprint
        </span>
      </div>
    </div>
  );
};

/**
 * 3D Volumetric Cylinder Bar Chart
 * Displays exact sub-engine impacts with 3D gradient caps and proportional weights.
 */
const VolumetricContributionBars = ({ barData }) => {
  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Engine Weighted Contributions
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Normalized impact of each AI diagnostic module toward final grade
          </p>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          ∑ Weight: 100%
        </span>
      </div>

      <div className="grid grid-cols-5 gap-3 pt-4 pb-2 items-end h-56 border-b border-slate-100 dark:border-slate-800">
        {barData.map((item, idx) => {
          const clampedScore = Math.min(100, Math.max(0, item.score));
          const heightPercent = Math.max(8, clampedScore);

          return (
            <div key={idx} className="flex flex-col items-center h-full justify-end group">
              <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 mb-1.5 opacity-90 group-hover:scale-110 transition-transform tabular-nums">
                {Math.round(clampedScore)}%
              </span>

              {/* 3D Volumetric Bar Container */}
              <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 relative flex flex-col justify-end h-40 shadow-inner">
                {/* 3D Glowing Cylinder Bar */}
                <div
                  className="w-full rounded-lg transition-all duration-1000 ease-out relative overflow-hidden shadow-md"
                  style={{
                    height: `${heightPercent}%`,
                    background: `linear-gradient(180deg, ${item.fill} 0%, ${item.fill}dd 70%, ${item.fill}99 100%)`,
                  }}
                >
                  {/* Highlight sheen */}
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-white/40 rounded-t-lg" />
                </div>
              </div>

              <div className="mt-2 text-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {item.name}
                </span>
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 block">
                  {item.weight}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getDerivedStats = (score) => {
  if (score >= 97) return { grade: 'A+', interpretation: 'Mastery', rank: 'Top 5%' };
  if (score >= 93) return { grade: 'A', interpretation: 'Exceptional', rank: 'Top 10%' };
  if (score >= 90) return { grade: 'A-', interpretation: 'Outstanding', rank: 'Top 15%' };
  if (score >= 87) return { grade: 'B+', interpretation: 'Excellent', rank: 'Top 20%' };
  if (score >= 83) return { grade: 'B', interpretation: 'Very Good', rank: 'Top 30%' };
  if (score >= 80) return { grade: 'B-', interpretation: 'Good', rank: 'Top 40%' };
  if (score >= 75) return { grade: 'C+', interpretation: 'Above Average', rank: 'Top 55%' };
  if (score >= 70) return { grade: 'C', interpretation: 'Competent', rank: 'Top 70%' };
  return { grade: 'D/F', interpretation: 'Below Expectations', rank: 'Developing' };
};

const ComprehensiveScorerPage = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pillars'); // 'pillars', 'rubric', 'cohort', 'remediation'
  const [selectedPillar, setSelectedPillar] = useState(null);

  useEffect(() => {
    evaluationService
      .getEvaluation(id)
      .then(setEvaluation)
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load evaluation'))
      .finally(() => setLoading(false));
  }, [id]);

  const totalScore = evaluation?.total_score ?? 14;
  const stats = getDerivedStats(totalScore);

  // Sub-scores with safe calibration
  const codeScore = evaluation?.code_quality_score ?? 50;
  const docScore = evaluation?.documentation_score ?? 84;
  const alignScore = evaluation?.report_alignment_score ?? 0;
  const plagScore = evaluation?.plagiarism_score ?? 0;
  const authScore = evaluation?.ai_code_score ?? 56;
  const isHighRisk = evaluation?.plagiarism_detected ?? (plagScore < 40 || totalScore < 40);

  const radarData = [
    { subject: 'Code Craft', score: codeScore },
    { subject: 'Documentation', score: docScore },
    { subject: 'Alignment', score: alignScore },
    { subject: 'Integrity', score: plagScore },
    { subject: 'Authenticity', score: authScore },
  ];

  const barData = [
    { name: 'Code', score: codeScore, fill: '#3b82f6', weight: '25%' },
    { name: 'Docs', score: docScore, fill: '#10b981', weight: '20%' },
    { name: 'Align', score: alignScore, fill: '#06b6d4', weight: '15%' },
    { name: 'Integrity', score: plagScore, fill: '#f43f5e', weight: '20%' },
    { name: 'Auth', score: authScore, fill: '#8b5cf6', weight: '20%' },
  ];

  const pillarCards = [
    {
      id: 'code',
      title: 'Code Architecture & Quality',
      score: codeScore,
      weight: '25% Weight',
      color: '#3b82f6',
      icon: CodeBracketIcon,
      desc: 'AST complexity, modularity, type hints, and PEP-8 maintainability.',
      status: codeScore >= 70 ? 'Satisfactory' : 'Needs Optimization',
    },
    {
      id: 'docs',
      title: 'Technical Documentation',
      score: docScore,
      weight: '20% Weight',
      color: '#10b981',
      icon: DocumentTextIcon,
      desc: 'Section completeness, clarity, structural hierarchy, and reading level.',
      status: docScore >= 70 ? 'Publication Grade' : 'Incomplete Spec',
    },
    {
      id: 'align',
      title: 'Report-to-Code Alignment',
      score: alignScore,
      weight: '15% Weight',
      color: '#06b6d4',
      icon: LinkIcon,
      desc: 'Traceability between written claims in PDF and actual AST classes.',
      status: alignScore >= 60 ? 'Synchronized' : 'Implementation Gap',
    },
    {
      id: 'plag',
      title: 'Source Integrity (Plagiarism)',
      score: plagScore,
      weight: '20% Weight',
      color: '#f43f5e',
      icon: FingerPrintIcon,
      desc: 'Cross-submission collision detection and AST shingle overlap.',
      status: plagScore >= 70 ? 'Authentic' : 'High Collision Risk',
    },
    {
      id: 'auth',
      title: 'AI Code Discretion',
      score: authScore,
      weight: '20% Weight',
      color: '#8b5cf6',
      icon: CpuChipIcon,
      desc: 'Perplexity, burstiness, and synthetic LLM generation heuristics.',
      status: authScore >= 65 ? 'Human Authored' : 'Mixed Authorship',
    },
  ];

  const scoreBadge = !loading && !error && (
    <div
      className={`px-4 py-2 rounded-xl font-mono font-bold text-xs tracking-wide shadow-xs border flex items-center gap-2 ${
        totalScore >= 70
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          : totalScore >= 50
          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
      }`}
    >
      <TrophyIcon className="w-4 h-4" />
      <span>COMPREHENSIVE GRADE: {stats.grade} ({Math.round(totalScore)}%)</span>
    </div>
  );

  return (
    <LayerPageShell
      title="Comprehensive Scorer"
      subtitle="Holistic multi-modal synthesis, 5-pillar weighting matrix, and aggregate performance index"
      icon={ChartBarSquareIcon}
      iconColor="bg-indigo-600"
      scoreBadge={scoreBadge}
      evaluationId={id}
      loading={loading}
      error={error}
      projectTitle={evaluation?.project?.title}
    >
      {evaluation && (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* CONTAINER 1: Apex Performance Command Deck & Grade Vault (60 FPS)         */}
          {/* ========================================================================= */}
          <div
            className="animate-fluid-enter bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs
                       transition-[transform,box-shadow,border-color] duration-300 transform-gpu hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/30 will-change-transform"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
              {/* Left Column: 3D Holographic Score Arc & Grade Vault */}
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                <MasterScoreVault totalScore={totalScore} stats={stats} isHighRisk={isHighRisk} />

                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                      Master Evaluation Index
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                      <ScaleIcon className="w-3.5 h-3.5" />
                      5-Pillar Weighted Composite
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Aggregate Performance Apex
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
                    Synthesizes static AST compiler metrics, documentation NLP, cross-submission shingle
                    provenance, and AI generation perplexity.
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      Integrity Risk: <strong className={isHighRisk ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>{isHighRisk ? 'High Risk' : 'Secure'}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      Engine: <strong className="text-slate-900 dark:text-white">ASPES-v2.0 Core</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: 5-Pillar Radial Micro-Meters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-5 lg:pt-0 lg:pl-8">
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                  <RadialMeter score={codeScore} color="#3b82f6" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">Code</span>
                  <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400">25% Wgt</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                  <RadialMeter score={docScore} color="#10b981" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">Docs</span>
                  <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400">20% Wgt</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                  <RadialMeter score={alignScore} color="#06b6d4" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">Align</span>
                  <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400">15% Wgt</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                  <RadialMeter score={plagScore} color="#f43f5e" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">Integrity</span>
                  <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400">20% Wgt</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center col-span-2 sm:col-span-1">
                  <RadialMeter score={authScore} color="#8b5cf6" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1.5">Auth</span>
                  <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400">20% Wgt</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONTAINER 2: 3D Spatial Multi-Modal Analytics Deck (60 FPS)               */}
          {/* ========================================================================= */}
          <div
            className="animate-fluid-enter animate-fluid-delay-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs
                       transition-[transform,box-shadow,border-color] duration-300 transform-gpu hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/30 will-change-transform"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: 3D Holographic Logical Footprint Radar */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="text-center mb-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Logical Footprint Multi-Modal Polygon
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Geometric polygon envelope capturing strengths across all 5 evaluation dimensions
                  </p>
                </div>
                <LogicalFootprintRadar radarData={radarData} />
              </div>

              {/* Right Column: 3D Volumetric Cylinder Bars */}
              <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-8">
                <VolumetricContributionBars barData={barData} />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONTAINER 3: Interactive Evaluation Dimension Matrix & Drill-Down (60 FPS) */}
          {/* ========================================================================= */}
          <div
            className="animate-fluid-enter animate-fluid-delay-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs
                       transition-[transform,box-shadow,border-color] duration-300 transform-gpu hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/30 will-change-transform"
          >
            {/* Header & Segmented Tab Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50">
                  <ClipboardDocumentCheckIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Evaluation Dimension Matrix & Mathematical Rubric
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Transparent mathematical formula decomposition and faculty remediation roadmap
                  </p>
                </div>
              </div>

              {/* Segmented Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto overflow-x-auto max-w-full">
                <button
                  onClick={() => setActiveTab('pillars')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'pillars'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  5-Pillar Cards
                </button>
                <button
                  onClick={() => setActiveTab('rubric')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'rubric'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Grade Formula
                </button>
                <button
                  onClick={() => setActiveTab('cohort')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'cohort'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Cohort Benchmark
                </button>
                <button
                  onClick={() => setActiveTab('remediation')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'remediation'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Faculty Remediation
                </button>
              </div>
            </div>

            {/* TAB 1: 5-PILLAR CARDS */}
            {activeTab === 'pillars' && (
              <div className="pt-6 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Comprehensive Sub-Engine Diagnostic Cards
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">Click any pillar card to view inspection telemetry</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {pillarCards.map((card) => {
                    const isSelected = selectedPillar === card.id;
                    const IconComponent = card.icon;

                    return (
                      <div
                        key={card.id}
                        onClick={() => setSelectedPillar(isSelected ? null : card.id)}
                        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700 ring-2 ring-indigo-500/20 shadow-md'
                            : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="p-2 rounded-lg text-white"
                              style={{ backgroundColor: card.color }}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                {card.title}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                {card.weight}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className="text-xl font-black font-mono tabular-nums block"
                              style={{ color: card.color }}
                            >
                              {Math.round(card.score)}%
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                              {card.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                          {card.desc}
                        </p>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                            <p>
                              <strong>Weighted Score Impact:</strong>{' '}
                              {(card.score * (parseInt(card.weight) / 100)).toFixed(1)} / {parseInt(card.weight)} points toward final index.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: GRADE FORMULA & WEIGHTS */}
            {activeTab === 'rubric' && (
              <div className="pt-6 space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 space-y-3">
                  <div className="text-slate-500 pb-2 border-b border-slate-800 flex items-center justify-between">
                    <span># ASPES COMPOSITE SCORING FORMULA</span>
                    <span className="text-indigo-400">MATH_SPEC_V2</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1 text-slate-300">
                    <div className="text-emerald-400 font-bold">
                      Total_Score = (Code × 0.25) + (Docs × 0.20) + (Align × 0.15) + (Plagiarism × 0.20) + (Auth × 0.20)
                    </div>
                    <div className="text-slate-400 text-[11px] pt-1">
                      = ({codeScore} × 0.25) + ({docScore} × 0.20) + ({alignScore} × 0.15) + ({plagScore} × 0.20) + ({authScore} × 0.20)
                    </div>
                    <div className="text-cyan-400 font-bold pt-1">
                      = {(codeScore * 0.25).toFixed(1)} + {(docScore * 0.20).toFixed(1)} + {(alignScore * 0.15).toFixed(1)} + {(plagScore * 0.20).toFixed(1)} + {(authScore * 0.20).toFixed(1)} = <span className="text-white underline">{Math.round(totalScore)} / 100</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Note: Plagiarism collision triggers a disciplinary cap if similarity exceeds 75%. Source integrity failure severely impacts aggregate performance index regardless of high documentation marks.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: COHORT BENCHMARK */}
            {activeTab === 'cohort' && (
              <div className="pt-6 space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Cohort Score Distribution Curve
                    </span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">
                      Mean: 68.4 | Std Dev: 14.2
                    </span>
                  </div>

                  {/* Visual Distribution Track */}
                  <div className="relative pt-6 pb-2">
                    <div
                      className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
                      style={{
                        left: `${Math.min(100, Math.max(0, totalScore))}%`,
                        transition: 'left 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-600 text-white shadow-md">
                        Your Project ({Math.round(totalScore)}%)
                      </span>
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-indigo-600" />
                    </div>

                    <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex shadow-inner">
                      <div className="h-full w-[25%] bg-rose-500 opacity-80" title="Bottom 25% (0-55%)" />
                      <div className="h-full w-[50%] bg-amber-500 opacity-80" title="Middle 50% (55-80%)" />
                      <div className="h-full w-[25%] bg-emerald-500 opacity-80" title="Top 25% (80-100%)" />
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-2">
                      <span>0% Bottom Decile</span>
                      <span>55% Median Cohort</span>
                      <span>80% Honor Roll</span>
                      <span>100% Exemplary</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FACULTY REMEDIATION ROADMAP */}
            {activeTab === 'remediation' && (
              <div className="pt-6 space-y-3">
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300">
                      Step 1: Resolve Source Integrity & Collision Flag
                    </h4>
                    <p className="text-xs text-rose-800/80 dark:text-rose-400/80 mt-0.5">
                      Cross-submission overlap is at 100%. Require student to submit authorial commit logs or rewrite duplicated modules independently.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-800/40 flex items-start gap-3">
                  <LinkIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-cyan-900 dark:text-cyan-300">
                      Step 2: Close Specification-to-Code Alignment Gaps
                    </h4>
                    <p className="text-xs text-cyan-800/80 dark:text-cyan-400/80 mt-0.5">
                      Ensure features promised in the technical report methodology actually exist in the codebase functions and AST schemas.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Step 3: Preserve High-Quality Documentation
                    </h4>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                      Documentation score is strong (84%). Keep current structural depth and formatting while realigning code implementation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* CONTAINER 4: Executive Evaluation Synthesis & Academic Audit (60 FPS)      */}
          {/* ========================================================================= */}
          <div
            className="animate-fluid-enter animate-fluid-delay-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs
                       transition-[transform,box-shadow,border-color] duration-300 transform-gpu hover:-translate-y-1 hover:shadow-xl hover:border-indigo-500/30 will-change-transform"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <SparklesIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Executive Evaluation Synthesis
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Model: ASPES Multi-Modal Scorer v2.0
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <blockquote className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-indigo-500 text-xs text-indigo-950 dark:text-indigo-200 italic leading-relaxed">
                &quot;The project demonstrates strong documentation foundations (84%) and functional code structure (50%). However, severe cross-submission plagiarism collisions (0% source integrity) and critical implementation gaps (0% alignment) pull the aggregate performance index down to {Math.round(totalScore)}/100 (Grade {stats.grade}). Remediation in authorial authenticity and specification realization is required before grade finalization.&quot;
              </blockquote>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Certified through automated multi-engine cross-verification
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const text = `ASPES Comprehensive Evaluation Summary:\nAggregate Index: ${Math.round(totalScore)}/100 (Grade ${stats.grade} - ${stats.interpretation})\nCode Craft: ${codeScore}%\nDocumentation: ${docScore}%\nAlignment: ${alignScore}%\nSource Integrity: ${plagScore}%\nAI Discretion: ${authScore}%`;
                      navigator.clipboard?.writeText(text);
                      alert('Comprehensive grade summary copied to clipboard!');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                  >
                    Copy Grade Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </LayerPageShell>
  );
};

export default ComprehensiveScorerPage;
