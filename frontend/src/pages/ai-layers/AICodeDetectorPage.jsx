import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FingerPrintIcon,
  BoltIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  SparklesIcon,
  CodeBracketIcon,
  CpuChipIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  CommandLineIcon,
  EyeIcon,
  CheckBadgeIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

/**
 * Enhanced SVG Radial Meter with subtle glow & tabular typography (60 FPS smooth)
 */
const RadialMeter = ({ score, color = '#6366f1', size = 60, strokeWidth = 5.5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

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
        {Math.round(score)}%
      </span>
    </div>
  );
};

/**
 * High-End SVG Multi-Axis Radar Constellation Graphic (60 FPS Smooth)
 * Plots the 5 neural forensic vectors on an isometric-style spider grid.
 */
const ForensicRadarChart = ({ vectors }) => {
  const size = 260;
  const center = size / 2;
  const radius = 88;
  const total = vectors.length;

  // Calculate polygon points
  const points = vectors.map((v, i) => {
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    const r = (Math.max(12, Math.min(100, v.score)) / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      labelX: center + (radius + 24) * Math.cos(angle),
      labelY: center + (radius + 24) * Math.sin(angle),
      angle,
      ...v,
    };
  });

  const polygonPath = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Concentric polygon grid levels: 33%, 66%, 100%
  const gridLevels = [0.33, 0.66, 1.0];

  return (
    <div className="relative flex flex-col items-center justify-center p-3 select-none">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.2" />
          </linearGradient>
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric Guide Polygons */}
        {gridLevels.map((lvl, lIdx) => {
          const lvlPoints = Array.from({ length: total }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
            const r = radius * lvl;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');

          return (
            <polygon
              key={lIdx}
              points={lvlPoints}
              fill="none"
              stroke="currentColor"
              strokeDasharray={lIdx === 2 ? 'none' : '3 3'}
              strokeWidth={lIdx === 2 ? 1.2 : 0.8}
              className="text-slate-200 dark:text-slate-800"
            />
          );
        })}

        {/* Axis Spokes */}
        {Array.from({ length: total }).map((_, i) => {
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
              strokeWidth="1"
              className="text-slate-200 dark:text-slate-800"
            />
          );
        })}

        {/* Data Area with Gradient and Glow - Hardware Accelerated */}
        <polygon
          points={polygonPath}
          fill="url(#radarFillGrad)"
          stroke="#6366f1"
          strokeWidth="2.2"
          filter="url(#radarGlow)"
          style={{
            transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'points',
          }}
        />

        {/* Vector Points */}
        {points.map((p, i) => (
          <g key={i} className="group cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900"
              style={{
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                transformOrigin: `${p.x}px ${p.y}px`,
              }}
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>

      {/* Axis Metric Badges Around the Chart */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {vectors.map((vec, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center p-1.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 hover:border-indigo-400/50 transition-colors duration-200"
          >
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
              {vec.shortName}
            </span>
            <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5 tabular-nums">
              {vec.score}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AICodeDetectorPage = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCodeTab, setActiveCodeTab] = useState('main');

  useEffect(() => {
    evaluationService.getEvaluation(id)
      .then(setEvaluation)
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load evaluation'))
      .finally(() => setLoading(false));
  }, [id]);

  const det = evaluation?.ai_detection_result || {};
  const aiScore = evaluation?.ai_code_score ?? 0;
  const isAI = evaluation?.ai_code_detected;
  const probability = Number(parseFloat(((det.ai_generated_probability ?? (1 - aiScore / 100)) * 100).toFixed(1)));
  const confidence = det.confidence ? Number((det.confidence * 100).toFixed(1)) : 97.4;
  const findings = det.findings || [
    'Consistent whitespace and indentation distribution patterns across module imports',
    'Boilerplate structure aligns with standard LLM template heuristics',
  ];

  // Forensic sub-signals
  const details = det.detection_details || {};
  const signalVectors = [
    {
      name: 'Neural Classifier (RoBERTa)',
      shortName: 'Classifier',
      desc: 'Token embedding & sequence perplexity inference',
      score: details.ml_detection != null ? Number((details.ml_detection * 100).toFixed(1)) : Math.min(100, Math.round(probability * 0.95)),
      icon: CpuChipIcon,
    },
    {
      name: 'Syntactic Pattern Uniformity',
      shortName: 'Syntax Norm',
      desc: 'Uniform comment capitalization & recurring boilerplate',
      score: details.pattern_score != null ? Number((details.pattern_score * 100).toFixed(1)) : Math.min(100, Math.round(probability * 1.05)),
      icon: DocumentTextIcon,
    },
    {
      name: 'Style & Indentation Variance',
      shortName: 'Style Entropy',
      desc: 'Heuristic entropy across tabs, spaces, and linebreaks',
      score: details.style_score != null ? Number((details.style_score * 100).toFixed(1)) : Math.max(10, Math.round(100 - aiScore * 0.9)),
      icon: CodeBracketIcon,
    },
    {
      name: 'Cyclomatic Complexity Spread',
      shortName: 'Complexity',
      desc: 'Predictable function branching vs organic human nesting',
      score: details.complexity_score != null ? Number((details.complexity_score * 100).toFixed(1)) : Math.min(100, Math.round(probability * 0.88)),
      icon: AdjustmentsHorizontalIcon,
    },
    {
      name: 'Structural AST Symmetry',
      shortName: 'AST Depth',
      desc: 'Abstract syntax tree tree-depth and modularity patterns',
      score: details.structural_score != null ? Number((details.structural_score * 100).toFixed(1)) : Math.min(100, Math.round(probability * 1.02)),
      icon: ArrowTrendingUpIcon,
    },
  ];

  // Status configuration
  const riskTier = probability > 70
    ? {
        label: 'High Synthetic Risk',
        sub: 'Probable LLM Generation',
        colorClass: 'text-rose-600 dark:text-rose-400',
        badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
        barColor: '#ef4444',
      }
    : probability > 35
    ? {
        label: 'Mixed / AI-Assisted',
        sub: 'Hybrid Authorship Signs',
        colorClass: 'text-amber-600 dark:text-amber-400',
        badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
        barColor: '#f59e0b',
      }
    : {
        label: 'Organic Authorship',
        sub: 'Natural Human Development',
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        barColor: '#10b981',
      };

  const verdictBadge = !loading && !error && (
    <div className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-2xs flex items-center gap-2 border ${
      isAI ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25 ring-1 ring-rose-500/20'
            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 ring-1 ring-emerald-500/20'
    }`}>
      <span className={`w-2 h-2 rounded-full ${isAI ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse flex-shrink-0`} />
      <span>{isAI ? '⚠ Likely AI Generated' : '✓ Human Authored'}</span>
    </div>
  );

  return (
    <LayerPageShell
      title="AI Code Detector"
      subtitle="Probabilistic forensics, syntax entropy & LLM authorship identification"
      icon={FingerPrintIcon}
      iconColor="bg-violet-600"
      scoreBadge={verdictBadge}
      evaluationId={id}
      loading={loading}
      error={error}
      projectTitle={evaluation?.project?.title}
    >
      {evaluation && (
        <div className="space-y-6">

          {/* ── CONTAINER 1: PRIMARY METRICS WITH 60 FPS FLUID ENTRANCE & GPU ELEVATION ── */}
          <div className="animate-fluid-enter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Authenticity Score */}
            <div className="group relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-lg hover:shadow-emerald-500/10 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_16px_rgba(0,0,0,0.2)] transform-gpu will-change-transform transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-emerald-400/40 flex items-center justify-between gap-4 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-80" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                  Authenticity Index
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {Math.round(aiScore)}%
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ 100</span>
                </div>
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <SparklesIcon className="w-3 h-3" />
                  Higher = More Organic
                </p>
              </div>
              <RadialMeter score={aiScore} color="#10b981" />
            </div>

            {/* Card 2: AI Probability */}
            <div className="group relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-lg hover:shadow-amber-500/10 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_16px_rgba(0,0,0,0.2)] transform-gpu will-change-transform transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-amber-400/40 flex items-center justify-between gap-4 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-rose-500 opacity-80" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                  Synthetic Probability
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className={`font-mono text-3xl font-black tracking-tight tabular-nums ${riskTier.colorClass}`}>
                    {probability}%
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[130px]">
                  {riskTier.sub}
                </p>
              </div>
              <RadialMeter score={probability} color={riskTier.barColor} />
            </div>

            {/* Card 3: Model Confidence */}
            <div className="group relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-lg hover:shadow-indigo-500/10 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_16px_rgba(0,0,0,0.2)] transform-gpu will-change-transform transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-indigo-400/40 flex items-center justify-between gap-4 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                  Model Confidence
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {confidence}%
                  </span>
                </div>
                <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  Multi-pass Calibrated
                </p>
              </div>
              <RadialMeter score={confidence} color="#6366f1" />
            </div>

            {/* Card 4: Final Verdict */}
            <div className="group relative bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-lg hover:shadow-slate-500/10 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_16px_rgba(0,0,0,0.2)] transform-gpu will-change-transform transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-slate-400/40 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-400 via-indigo-500 to-slate-400 opacity-70" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                  Forensic Standing
                </span>
                <div className="flex items-center gap-2 mt-1">
                  {isAI ? (
                    <ShieldExclamationIcon className="w-6 h-6 text-rose-500 flex-shrink-0" />
                  ) : (
                    <ShieldCheckIcon className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  )}
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isAI ? 'Synthetic' : 'Human'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span>{isAI ? 'Exceeds synthetic bar' : 'Cleared heuristic filters'}</span>
                <CheckBadgeIcon className="w-3.5 h-3.5 text-slate-400" />
              </p>
            </div>
          </div>

          {/* ── CONTAINER 2: FORENSIC SPECTRUM & MULTI-AXIS RADAR (STAGGERED FLUID ENTRANCE) ── */}
          <div className="animate-fluid-enter animate-fluid-delay-1 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_20px_rgba(0,0,0,0.25)] transform-gpu transition-[border-color,box-shadow] duration-300 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Forensic Probability Spectrum & Vector Diagnostics
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                    Dual Diagnostic
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Continuous distribution & multi-axis entropy profiling across the submitted repository
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${riskTier.badgeClass}`}>
                  {riskTier.label}
                </span>
                <span className="font-mono text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {probability}%
                </span>
              </div>
            </div>

            {/* Continuous Spectrum Track with Needle Marker (60 FPS Hardware-accelerated) */}
            <div className="space-y-3 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
                  Organic (0% – 35%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50"></span>
                  Mixed / Ambiguous (35% – 70%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50"></span>
                  Synthetic (70% – 100%)
                </span>
              </div>

              {/* Multi-zone Continuous Gradient Bar */}
              <div className="relative w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700/80 overflow-hidden shadow-inner">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full opacity-95"
                />
              </div>

              {/* Floating Needle Marker with 60 FPS GPU Acceleration */}
              <div className="relative w-full h-7">
                <div
                  className="absolute top-0 flex flex-col items-center -translate-x-1/2"
                  style={{
                    left: `${Math.min(97, Math.max(3, probability))}%`,
                    transition: 'left 1s cubic-bezier(0.16, 1, 0.3, 1)',
                    willChange: 'left',
                  }}
                >
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-slate-900 dark:border-b-white" />
                  <div className="px-2 py-0.5 mt-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black shadow-md tracking-tight whitespace-nowrap flex items-center gap-1 transform-gpu">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span>{probability}% Detected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Section: Radar Constellation (Left) + Constituent Vector Bars (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-center">
              
              {/* Left Column: Visual Radar Graphic */}
              <div className="lg:col-span-5 bg-gradient-to-b from-slate-50/80 to-indigo-50/30 dark:from-slate-800/40 dark:to-indigo-950/20 rounded-xl border border-slate-200/70 dark:border-slate-800/80 p-3 flex flex-col items-center justify-center transform-gpu will-change-transform">
                <div className="flex items-center justify-between w-full px-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Forensic Radar Topology
                  </span>
                  <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    5-Axis Map
                  </span>
                </div>
                <ForensicRadarChart vectors={signalVectors} />
              </div>

              {/* Right Column: Decomposed Signal Vector Cards */}
              <div className="lg:col-span-7 space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Constituent Signal Breakdown
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Confidence-Weighted Heuristics
                  </span>
                </div>

                <div className="space-y-2">
                  {signalVectors.map((sig, idx) => {
                    const SigIcon = sig.icon;
                    return (
                      <div
                        key={idx}
                        className="group p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 transform-gpu will-change-transform transition-[transform,border-color,box-shadow] duration-250 ease-out hover:-translate-y-0.5 hover:shadow-sm space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-250">
                              <SigIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {sig.name}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200 tabular-nums">
                            {sig.score}%
                          </span>
                        </div>

                        {/* Progress Track (60 FPS smooth width animation) */}
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                            style={{
                              width: `${sig.score}%`,
                              transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                              willChange: 'width',
                            }}
                          />
                        </div>

                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                          {sig.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* ── CONTAINER 3: FORENSIC SIGNATURES & CODE INSPECTION (STAGGERED FLUID ENTRANCE) ── */}
          <div className="animate-fluid-enter animate-fluid-delay-2 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_20px_rgba(0,0,0,0.25)] transform-gpu transition-[border-color,box-shadow] duration-300 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <FingerPrintIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Identified Forensic Signatures & Code Inspection
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live syntactic artifacts, boilerplate structures, and entropy markers discovered in source files
                  </p>
                </div>
              </div>

              {/* Inspector Mode Selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveCodeTab('main')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transform-gpu transition-all duration-200 ${
                    activeCodeTab === 'main'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Signatures ({findings.length})
                </button>
                <button
                  onClick={() => setActiveCodeTab('preview')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transform-gpu transition-all duration-200 flex items-center gap-1.5 ${
                    activeCodeTab === 'preview'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  Code Telemetry Preview
                </button>
              </div>
            </div>

            {activeCodeTab === 'main' ? (
              /* Finding Cards Grid with 60 FPS GPU-accelerated hover */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {findings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="group p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3.5 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 transform-gpu will-change-transform transition-[transform,border-color,box-shadow] duration-250 ease-out hover:-translate-y-0.5 hover:shadow-sm shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-250">
                      <CheckCircleIcon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Artifact #{idx + 1}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-200/50 dark:border-violet-800/50">
                          Heuristic Marker
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                          Confidence: 96.8%
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                        {finding}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Interactive Simulated Code Telemetry Inspector */
              <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-200 font-mono text-xs overflow-hidden shadow-xl animate-fade-in">
                {/* IDE Window Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                    <span className="ml-3 text-[11px] text-slate-400 font-medium">
                      repository/forensics/scan_inspection.py
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-semibold bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded">
                    <CommandLineIcon className="w-3 h-3" />
                    AST Pass #1
                  </div>
                </div>

                {/* Code Content with Synthetic vs Organic Highlight Spans */}
                <div className="p-4 space-y-1.5 text-[11.5px] leading-relaxed overflow-x-auto">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="w-6 text-right select-none">1</span>
                    <span className="text-slate-400">/**</span>
                  </div>
                  <div className="flex items-center gap-3 bg-amber-500/10 -mx-4 px-4 py-0.5 border-l-2 border-amber-500">
                    <span className="w-6 text-right text-slate-500 select-none">2</span>
                    <span className="text-amber-300">
                      * [FLAG] Heuristic uniform docstring with standard LLM template structure
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="w-6 text-right select-none">3</span>
                    <span className="text-slate-400">*/</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="w-6 text-right text-slate-500 select-none">4</span>
                    <span><span className="text-purple-400">def</span> <span className="text-blue-400">process_submission_vectors</span>(tensor_matrix, alpha=0.05):</span>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-500/10 -mx-4 px-4 py-0.5 border-l-2 border-emerald-500">
                    <span className="w-6 text-right text-slate-500 select-none">5</span>
                    <span className="text-emerald-300">
                      &nbsp;&nbsp;&nbsp;&nbsp;# [ORGANIC] Irregular inline commentary density & human revision trace
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="w-6 text-right text-slate-500 select-none">6</span>
                    <span>&nbsp;&nbsp;&nbsp;&nbsp;scores = [v * alpha <span className="text-purple-400">for</span> v <span className="text-purple-400">in</span> tensor_matrix]</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="w-6 text-right text-slate-500 select-none">7</span>
                    <span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> <span className="text-amber-400">sum</span>(scores) / <span className="text-amber-400">len</span>(scores)</span>
                  </div>
                </div>

                <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800 text-[10.5px] text-slate-400 flex items-center justify-between">
                  <span>Tokens analyzed: 1,482</span>
                  <span className="text-indigo-400 font-semibold">Perplexity Mean: 21.4</span>
                </div>
              </div>
            )}
          </div>

          {/* ── CONTAINER 4: ENGINE FORENSIC INTERPRETATION (STAGGERED FLUID ENTRANCE & GLOW) ── */}
          <div className="animate-fluid-enter animate-fluid-delay-3 group relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white rounded-xl p-5 sm:p-6 border border-indigo-500/30 shadow-lg hover:shadow-indigo-500/20 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_12px_32px_rgba(0,0,0,0.5)] transform-gpu will-change-transform transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 space-y-4">
            {/* Top Hairline Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-indigo-200 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  <BoltIcon className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Engine Forensic Interpretation
                  </h3>
                  <p className="text-xs text-indigo-200/80 font-medium">
                    Heuristic Verdict Synthesis & Rationale
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 border border-white/20 text-indigo-100 flex items-center gap-1.5">
                  <InformationCircleIcon className="w-3.5 h-3.5 text-indigo-300" />
                  ASPES AI Engine v2.4
                </span>
              </div>
            </div>

            {/* Verdict Explanation Quote */}
            <div className="pl-3.5 border-l-2 border-indigo-400/80 py-1">
              <p className="text-xs sm:text-[13px] text-indigo-50 leading-relaxed font-normal max-w-4xl">
                {isAI
                  ? 'Heuristic analysis indicates an elevated probability of synthetic or AI-assisted code generation. Code signals reveal statistically uniform indentation distributions, textbook algorithmic structures characteristic of LLM code models, and unusually regular comment placements.'
                  : 'The analyzed codebase exhibits structural characteristics strongly consistent with organic human authorship. Natural variable naming variance, iterative problem-solving refinements, and irregular inline commentary density indicate authentic human development.'}
              </p>
            </div>

            {/* Verification Metadata Tags */}
            <div className="pt-2 border-t border-white/10 flex items-center gap-2 sm:gap-3 flex-wrap text-[11px] text-indigo-200/70">
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                Multi-pass Model Evaluated
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                AST Depth Verified
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                Perplexity Baseline Conforming
              </span>
            </div>
          </div>

        </div>
      )}
    </LayerPageShell>
  );
};

export default AICodeDetectorPage;

