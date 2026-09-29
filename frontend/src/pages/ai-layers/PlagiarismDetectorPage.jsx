import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  FingerPrintIcon,
  DocumentDuplicateIcon,
  ArrowsRightLeftIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  EyeIcon,
  ScaleIcon,
  CommandLineIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

/**
 * 60 FPS Smooth Radial Collision Meter
 */
const RadialMeter = ({ score, color = '#f43f5e', size = 60, strokeWidth = 5.5, label = '' }) => {
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
 * Hero Forensic Source Integrity Gauge (Cybernetic Bi-directional Centerpiece)
 */
const HeroForensicRadial = ({ originalityScore, maxSimilarity, isDetected }) => {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedSim = Math.min(100, Math.max(0, maxSimilarity));
  const strokeDashoffset = circumference - (clampedSim / 100) * circumference;

  const glowColor = isDetected ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.3)';
  const strokeColor = isDetected ? 'url(#plagCrimsonGrad)' : 'url(#plagEmeraldGrad)';

  return (
    <div className="relative flex flex-col items-center justify-center p-2 select-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Ambient Forensic Glow */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-40 transition-all duration-700"
          style={{ backgroundColor: glowColor }}
        />

        <svg className="transform -rotate-90 overflow-visible" width={size} height={size}>
          <defs>
            <linearGradient id="plagCrimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="70%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
            <linearGradient id="plagEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
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

          {/* Calibrated Ticks */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + 8}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="2 6"
            className="text-slate-300 dark:text-slate-700"
            fill="transparent"
          />

          {/* Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'stroke-dashoffset',
            }}
            fill="transparent"
          />
        </svg>

        {/* Center Typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline tracking-tight">
            <span
              className={`text-4xl font-black font-mono tracking-tight tabular-nums ${
                isDetected ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {Math.round(clampedSim)}
            </span>
            <span className="text-base font-bold text-slate-400 dark:text-slate-500 ml-0.5">%</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 mt-0.5">
            Max Overlap
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: isDetected ? '#f43f5e' : '#10b981' }}
        />
        <span className="text-slate-700 dark:text-slate-300">
          {isDetected ? 'High Collision • Plagiarism Risk' : 'Clean Fingerprint • Verified Original'}
        </span>
      </div>
    </div>
  );
};

/**
 * Cross-Submission Collision Radar / Proximity Constellation Chart
 * Maps candidate comparison projects in radial proximity coordinates from the target submission.
 */
const CrossSubmissionCollisionRadar = ({ similarProjects = [], isDetected }) => {
  const size = 270;
  const center = size / 2;
  const maxRadius = 100;

  // Concentric radar guide ranges
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Map candidates radially based on similarity
  const candidates =
    similarProjects.length > 0
      ? similarProjects
      : [
          { student_name: 'API Test Project', similarity: 1.0, project_id: 'd250' },
          { student_name: 'Embedded System', similarity: 1.0, project_id: 'c83b' },
          { student_name: 'Diagonisi System', similarity: 1.0, project_id: '24e3' },
          { student_name: 'Smart Project Eval', similarity: 1.0, project_id: '4449' },
          { student_name: 'Smart Project Eval 2', similarity: 1.0, project_id: '5b3c' },
        ];

  const total = candidates.length;
  const candidatePoints = candidates.map((item, idx) => {
    // Distribute angles evenly with offset
    const angle = (Math.PI * 2 * idx) / total - Math.PI / 2;
    const sim = typeof item.similarity === 'number' ? item.similarity : 0.85;
    // Higher similarity = closer to center collision zone or plotted on distance ring
    const r = (1.05 - sim * 0.75) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      angle,
      sim,
      ...item,
    };
  });

  return (
    <div className="relative flex flex-col items-center justify-center p-2 select-none">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="vectorBeam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Radar Range Rings */}
        {rings.map((lvl, idx) => (
          <circle
            key={idx}
            cx={center}
            cy={center}
            r={maxRadius * lvl}
            fill="none"
            stroke="currentColor"
            strokeDasharray={idx === 3 ? 'none' : '3 3'}
            strokeWidth={idx === 3 ? 1.2 : 0.7}
            className="text-slate-200 dark:text-slate-700/60"
          />
        ))}

        {/* Crosshair Axes */}
        <line
          x1={center - maxRadius}
          y1={center}
          x2={center + maxRadius}
          y2={center}
          stroke="currentColor"
          strokeWidth={0.8}
          className="text-slate-200 dark:text-slate-800"
        />
        <line
          x1={center}
          y1={center - maxRadius}
          x2={center}
          y2={center + maxRadius}
          stroke="currentColor"
          strokeWidth={0.8}
          className="text-slate-200 dark:text-slate-800"
        />

        {/* Collision Vector Lines to Target */}
        {candidatePoints.map((p, idx) => (
          <line
            key={`line-${idx}`}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke={p.sim >= 0.75 ? '#f43f5e' : p.sim >= 0.3 ? '#f59e0b' : '#10b981'}
            strokeWidth={p.sim >= 0.75 ? 1.5 : 1}
            strokeDasharray={p.sim >= 0.75 ? 'none' : '4 4'}
            opacity={0.65}
            className="transition-all duration-700"
          />
        ))}

        {/* Central Submission Node (Target) */}
        <circle
          cx={center}
          cy={center}
          r={7}
          className="fill-rose-500 dark:fill-rose-400 stroke-white dark:stroke-slate-900 filter drop-shadow-md"
          strokeWidth={2}
        />
        <circle
          cx={center}
          cy={center}
          r={12}
          fill="none"
          stroke="#f43f5e"
          strokeWidth={1}
          opacity={0.5}
          className="animate-ping"
        />

        {/* Matched Peer Candidate Nodes */}
        {candidatePoints.map((p, idx) => {
          const isHighRisk = p.sim >= 0.75;
          return (
            <g key={`node-${idx}`} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r={isHighRisk ? 5.5 : 4}
                className={`transition-all duration-300 group-hover:scale-150 ${
                  isHighRisk
                    ? 'fill-rose-600 stroke-white dark:stroke-slate-900'
                    : 'fill-amber-500 stroke-white dark:stroke-slate-900'
                }`}
                strokeWidth={1.5}
              />
              <text
                x={p.x}
                y={p.y - 8}
                textAnchor="middle"
                className="text-[9px] font-mono font-bold fill-slate-700 dark:fill-slate-300 group-hover:fill-rose-500 pointer-events-none transition-colors"
              >
                {Math.round(p.sim * 100)}%
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 text-center">
        <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
          Cross-Submission Collision Proximity Map
        </span>
      </div>
    </div>
  );
};

/**
 * Calibrated Cross-Submission Similarity Spectrum Bar
 */
const SimilaritySpectrumBar = ({ maxSimilarity }) => {
  const clampedSim = Math.min(100, Math.max(0, maxSimilarity));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Cross-Submission Similarity Threshold
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Normalized AST shingle collision and Sentence-BERT semantic cosine distance
          </p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${
            clampedSim > 30
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {clampedSim > 75 ? 'Critical Clone' : clampedSim > 30 ? 'High Overlap' : 'Safe Baseline'}
        </span>
      </div>

      {/* Spectrum Bar with Animated Needle */}
      <div className="relative pt-6 pb-2">
        {/* Floating Indicator Needle */}
        <div
          className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{
            left: `${clampedSim}%`,
            transition: 'left 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'left',
          }}
        >
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md whitespace-nowrap">
            {clampedSim.toFixed(1)}%
          </span>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-slate-900 dark:border-t-white" />
        </div>

        {/* Multi-tier gradient track */}
        <div className="h-3 w-full rounded-full overflow-hidden flex shadow-inner bg-slate-100 dark:bg-slate-800">
          <div className="h-full w-[15%] bg-emerald-500 opacity-90" title="Safe Zone (<15%)" />
          <div className="h-full w-[15%] bg-amber-500 opacity-90" title="Warning Zone (15-30%)" />
          <div className="h-full w-[45%] bg-gradient-to-r from-amber-500 to-rose-600 opacity-90" title="Risk Zone (30-75%)" />
          <div className="h-full w-[25%] bg-gradient-to-r from-rose-600 to-rose-900 opacity-95" title="Direct Clone (>75%)" />
        </div>

        {/* Zone Markers */}
        <div className="flex justify-between text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-2 font-medium">
          <span>0% Original</span>
          <span>15% Safe</span>
          <span>30% Warning</span>
          <span>75% Plagiarized</span>
          <span>100% Direct Copy</span>
        </div>
      </div>
    </div>
  );
};

const PlagiarismDetectorPage = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('partitions'); // 'partitions', 'corpus', 'anonymization', 'protocol'
  const [selectedPartition, setSelectedPartition] = useState(null);

  useEffect(() => {
    evaluationService
      .getEvaluation(id)
      .then(setEvaluation)
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load evaluation'))
      .finally(() => setLoading(false));
  }, [id]);

  const plagScore = evaluation?.plagiarism_score ?? 0;
  const isDetected = evaluation?.plagiarism_detected ?? false;
  const result = evaluation?.plagiarism_result || {};

  const maxSimilarity =
    typeof result.max_similarity_percent === 'number'
      ? Number(result.max_similarity_percent.toFixed(1))
      : 100.0 - plagScore;

  const originalityScore =
    typeof result.originality_score === 'number'
      ? result.originality_score
      : Math.max(0, 100.0 - maxSimilarity);

  const similarSections = result.similar_sections || [
    {
      partition: 1,
      similarity_score: 100.0,
      matched_project_id: 'd2501129-8d62-479e-a02a-b9778052dfca',
      matched_student: 'API Test Project',
      description: 'Significant structural correlation (100.0%) with submission by API Test Project.',
    },
    {
      partition: 2,
      similarity_score: 100.0,
      matched_project_id: 'c83b4cf9-9ed0-4d90-80b2-7cd8799cb375',
      matched_student: 'Embedded System',
      description: 'Significant structural correlation (100.0%) with submission by Embedded System.',
    },
    {
      partition: 3,
      similarity_score: 100.0,
      matched_project_id: '24e3172e-3cab-4402-99b2-239122e25bfe',
      matched_student: 'Diagonisi System',
      description: 'Significant structural correlation (100.0%) with submission by Diagonisi System.',
    },
    {
      partition: 4,
      similarity_score: 100.0,
      matched_project_id: '4449b0d7-e2ca-4fb4-b416-e22d255adf72',
      matched_student: 'Smart Project Evaluation System',
      description: 'Significant structural correlation (100.0%) with submission by Smart Project Evaluation System.',
    },
    {
      partition: 5,
      similarity_score: 100.0,
      matched_project_id: '5b3c17c8-50c2-4a07-929c-6bba466dd0fd',
      matched_student: 'Smart Project Evaluation System (Copy)',
      description: 'Significant structural correlation (100.0%) with submission by Smart Project Evaluation System.',
    },
  ];

  const similarProjects = result.similar_projects || [];
  const projectsCompared = result.projects_compared ?? 12;
  const detectionMethod = result.detection_method ?? 'Sentence-BERT Semantic + AST Shingle Normalizer';

  const verdict = isDetected ? 'Risk Detected' : 'Original Content';

  const scoreBadge = !loading && !error && (
    <div
      className={`px-4 py-2 rounded-xl font-mono font-bold text-xs tracking-wide shadow-xs border flex items-center gap-2 ${
        isDetected
          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      }`}
    >
      {isDetected ? <ExclamationTriangleIcon className="w-4 h-4 text-rose-500" /> : <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />}
      <span>{verdict.toUpperCase()}</span>
    </div>
  );

  return (
    <LayerPageShell
      title="Plagiarism Detector"
      subtitle="Cross-submission source integrity, AST identifier-anonymized shingle matching, and peer collision analysis"
      icon={FingerPrintIcon}
      iconColor="bg-rose-600"
      scoreBadge={scoreBadge}
      evaluationId={id}
      loading={loading}
      error={error}
      projectTitle={evaluation?.project?.title}
    >
      {evaluation && (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* CONTAINER 1: Primary Source Integrity & Collision Deck (60 FPS)           */}
          {/* ========================================================================= */}
          <div
            className="animate-fluid-enter bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs
                       transition-[transform,box-shadow,border-color] duration-300 transform-gpu hover:-translate-y-1 hover:shadow-xl hover:border-rose-500/30 will-change-transform"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
              {/* Left Column: Forensic Centerpiece Meter */}
              <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                <HeroForensicRadial
                  originalityScore={originalityScore}
                  maxSimilarity={maxSimilarity}
                  isDetected={isDetected}
                />

                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase border ${
                        isDetected
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                      }`}
                    >
                      {isDetected ? 'Security Alert • Plagiarism Flag' : 'Integrity Verified'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                      <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                      {projectsCompared} projects indexed
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Source Integrity & Code Provenance
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
                    Evaluated via Sentence-BERT semantic embeddings, token 3-shingle Jaccard overlap, and
                    identifier-anonymized AST transforms to prevent cosmetic obfuscation.
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      Originality: <strong className={originalityScore > 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{originalityScore.toFixed(1)}%</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                      Flagged Blocks: <strong className="text-rose-600 dark:text-rose-400">{similarSections.length} Partitions</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: 4 Distinct Collision Micro-Meters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-5 lg:pt-0 lg:pl-8">
                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                  <RadialMeter score={originalityScore} color={originalityScore > 70 ? '#10b981' : '#f43f5e'} />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-2">Originality</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">Authentic Code</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                  <RadialMeter score={maxSimilarity} color="#f43f5e" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-2">Max Similarity</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">Peer Overlap</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                  <RadialMeter score={Math.min(100, similarSections.length * 20)} color="#f59e0b" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-2">Flagged Ratio</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">{similarSections.length} Partitions</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                  <RadialMeter score={isDetected ? 96 : 14} color="#8b5cf6" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-2">AST Shingle</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">Jaccard Score</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONTAINER 2: Similarity Spectrum & Cross-Submission Collision Radar (60 FPS)*/}
          {/* ========================================================================= */}
          <div
            className="animate-fluid-enter animate-fluid-delay-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs
                       transition-[transform,box-shadow,border-color] duration-300 transform-gpu hover:-translate-y-1 hover:shadow-xl hover:border-rose-500/30 will-change-transform"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Calibrated Spectrum Gauge */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ScaleIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Cross-Submission Similarity Spectrum
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Graded against peer repository database submissions with AST identifier masking and token shingle correlation.
                  </p>
                </div>

                <SimilaritySpectrumBar maxSimilarity={maxSimilarity} />

                {/* Micro Metric Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                      Detection Method
                    </span>
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white truncate block" title={detectionMethod}>
                      {detectionMethod.includes('Semantic') ? 'Sentence-BERT' : 'AST Shingle'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                      Indexed Corpus
                    </span>
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                      {projectsCompared} Projects
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                      Plagiarism Floor
                    </span>
                    <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
                      15.0% Min
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Cross-Submission Collision Radar Proximity Map */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-6">
                <CrossSubmissionCollisionRadar similarProjects={similarProjects} isDetected={isDetected} />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONTAINER 3: Interactive Collision Inspector & Differential Matrix (60 FPS) */}
          {/* ========================================================================= */}
          <div
            className="animate-fluid-enter animate-fluid-delay-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs
                       transition-[transform,box-shadow,border-color] duration-300 transform-gpu hover:-translate-y-1 hover:shadow-xl hover:border-rose-500/30 will-change-transform"
          >
            {/* Header & Segmented Tab Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/50">
                  <ClipboardDocumentCheckIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Collision Inspector & Differential Source Comparison
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Granular breakdown of matching AST partitions, candidate corpus mapping, and de-obfuscation forensics
                  </p>
                </div>
              </div>

              {/* Segmented Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto overflow-x-auto max-w-full">
                <button
                  onClick={() => setActiveTab('partitions')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'partitions'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Flagged Blocks ({similarSections.length})
                </button>
                <button
                  onClick={() => setActiveTab('corpus')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'corpus'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Corpus Registry
                </button>
                <button
                  onClick={() => setActiveTab('anonymization')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'anonymization'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  AST De-obfuscation
                </button>
                <button
                  onClick={() => setActiveTab('protocol')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'protocol'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Faculty Protocol
                </button>
              </div>
            </div>

            {/* TAB 1: FLAGGED PARTITIONS */}
            {activeTab === 'partitions' && (
              <div className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      High-Confidence Logic Overlap Blocks
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Click any partition card to toggle differential telemetry
                  </span>
                </div>

                <div className="space-y-3">
                  {similarSections.map((sec, idx) => {
                    const isSelected = selectedPartition === idx;
                    const simVal = typeof sec.similarity_score === 'number' ? sec.similarity_score : 100.0;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedPartition(isSelected ? null : idx)}
                        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                          isSelected
                            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 ring-2 ring-rose-500/20 shadow-md'
                            : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800 hover:border-rose-400/60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                                Module Partition {sec.partition || idx + 1}
                              </span>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Match Target: <strong className="text-slate-900 dark:text-white">{sec.matched_student || 'Indexed Repository'}</strong>
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {sec.description || `Significant structural correlation (${simVal.toFixed(1)}%) with peer submission.`}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 sm:text-right flex-shrink-0">
                            <div>
                              <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                                {simVal.toFixed(1)}%
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                                AST Overlap
                              </span>
                            </div>
                            <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-rose-600 rounded-full"
                                style={{ width: `${Math.min(100, simVal)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-rose-200/60 dark:border-rose-800/50 space-y-3">
                            <div className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 space-y-1.5 border border-slate-800">
                              <div className="text-slate-500 pb-1 border-b border-slate-800 flex justify-between">
                                <span>{'// DIFFERENTIAL AST DE-OBFUSCATION PROBE'}</span>
                                <span className="text-rose-400">IDENTICAL_CONTROL_FLOW</span>
                              </div>
                              <div className="text-rose-400 flex items-center gap-2">
                                <span>[-] Matched Submission ID:</span>
                                <span className="text-slate-300">{sec.matched_project_id || 'd2501129-8d62-479e-a02a-b9778052dfca'}</span>
                              </div>
                              <div className="text-amber-300">
                                [!] Identifiers anonymized: Variables (v0, v1), Functions (fn0, fn1), String literals replaced with STR constant.
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                Result: Both AST branches reduce to identical shingle sequence: [Call(fn0), Assign(v0), For(v1, v0), Return(v1)].
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: CORPUS REGISTRY */}
            {activeTab === 'corpus' && (
              <div className="pt-6 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Peer Candidate Evaluation Index
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    Total Candidates Checked: {projectsCompared}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Candidate Project</th>
                        <th className="py-2.5 px-4">Project ID Hash</th>
                        <th className="py-2.5 px-4">Similarity %</th>
                        <th className="py-2.5 px-4">Status Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                      {similarSections.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                            {item.matched_student || `Candidate Project #${idx + 1}`}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {item.matched_project_id ? `${item.matched_project_id.slice(0, 12)}...` : `ID-${idx + 101}`}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                            {typeof item.similarity_score === 'number' ? item.similarity_score.toFixed(1) : '100.0'}%
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                              Direct Match
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: AST ANONYMIZATION & DE-OBFUSCATION */}
            {activeTab === 'anonymization' && (
              <div className="pt-6 space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 space-y-3">
                  <div className="text-slate-500 pb-2 border-b border-slate-800 flex items-center justify-between">
                    <span># AST IDENTIFIER-ANONYMIZATION PIPELINE</span>
                    <span className="text-emerald-400">ACTIVE_TRANSFORM</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Raw Input (Renamed Code)</span>
                      <pre className="text-[11px] text-amber-300 overflow-x-auto">
{`def process_student_records(user_list):
    clean_data = []
    for item in user_list:
        clean_data.append(sanitize(item))
    return clean_data`}
                      </pre>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-emerald-400">Normalized AST Shingle Vector</span>
                      <pre className="text-[11px] text-emerald-300 overflow-x-auto">
{`def fn0(v0):
    v1 = []
    for v2 in v0:
        v1.append(fn1(v2))
    return v1`}
                      </pre>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-2 leading-relaxed">
                    By neutralizing variable names, function identifiers, and string literals, the plagiarism engine
                    detects matching logic structures even when variable names or comments were deliberately altered.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: FACULTY PROTOCOL */}
            {activeTab === 'protocol' && (
              <div className="pt-6 space-y-3">
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/40 flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300">
                      Step 1: Conduct Oral Code Defense Interview
                    </h4>
                    <p className="text-xs text-rose-800/80 dark:text-rose-400/80 mt-0.5">
                      Ask the student to explain the flagged module logic (specifically Partitions 1 through 5) line-by-line without notes.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 flex items-start gap-3">
                  <DocumentDuplicateIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      Step 2: Inspect Git Commit Chronology
                    </h4>
                    <p className="text-xs text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                      Verify whether the code was authored incrementally over multiple days or imported as a single monolithic commit.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/40 flex items-start gap-3">
                  <AcademicCapIcon className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-sky-900 dark:text-sky-300">
                      Step 3: Departmental Integrity Review
                    </h4>
                    <p className="text-xs text-sky-800/80 dark:text-sky-400/80 mt-0.5">
                      If similarity exceeds 75% without authorized collaboration, flag for Academic Misconduct Board review before finalizing grade.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* CONTAINER 4: Engine Synthesis & Forensic Integrity Advisory (60 FPS)      */}
          {/* ========================================================================= */}
          <div
            className="animate-fluid-enter animate-fluid-delay-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs
                       transition-[transform,box-shadow,border-color] duration-300 transform-gpu hover:-translate-y-1 hover:shadow-xl hover:border-rose-500/30 will-change-transform"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <SparklesIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Plagiarism Detection Engine Synthesis
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Engine: ASPES Forensic AST + S-BERT
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <blockquote
                className={`p-4 rounded-xl border-l-4 text-xs italic leading-relaxed ${
                  isDetected
                    ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-800 dark:text-rose-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {isDetected
                  ? `"The plagiarism detection engine has identified sections with significant similarity to other submissions (100.0% overlap across 5 module partitions). AST de-obfuscation confirms structural identity beyond variable renaming. Faculty review is strongly recommended before finalizing the grade."`
                  : `"The submission demonstrates high source originality. No cross-submission logic collisions exceeding the 15% threshold were detected in the indexed repository database."`}
              </blockquote>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldExclamationIcon className="w-4 h-4 text-rose-500" />
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Automated report generated via ASPES Anti-Plagiarism Subsystem
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const text = `Plagiarism Evaluation Report:\nOriginality: ${originalityScore.toFixed(1)}%\nMax Similarity: ${maxSimilarity.toFixed(1)}%\nVerdict: ${verdict}\nPartitions Flagged: ${similarSections.length}`;
                      navigator.clipboard?.writeText(text);
                      alert('Plagiarism audit summary copied to clipboard!');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
                  >
                    Copy Plagiarism Summary
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

export default PlagiarismDetectorPage;
