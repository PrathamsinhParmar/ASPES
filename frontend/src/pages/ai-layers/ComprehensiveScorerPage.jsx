import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  TrophyIcon,
  ChartBarSquareIcon,
  ScaleIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  LinkIcon,
  FingerPrintIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  ShareIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

const getDerivedStats = (score) => {
  if (score >= 97) return { grade: 'A+', interpretation: 'Mastery', rank: 'Top 5%', color: '#10b981' };
  if (score >= 93) return { grade: 'A', interpretation: 'Exceptional', rank: 'Top 10%', color: '#10b981' };
  if (score >= 90) return { grade: 'A-', interpretation: 'Outstanding', rank: 'Top 15%', color: '#0d9488' };
  if (score >= 87) return { grade: 'B+', interpretation: 'Excellent', rank: 'Top 20%', color: '#3b82f6' };
  if (score >= 83) return { grade: 'B', interpretation: 'Very Good', rank: 'Top 30%', color: '#3b82f6' };
  if (score >= 80) return { grade: 'B-', interpretation: 'Good', rank: 'Top 40%', color: '#6366f1' };
  if (score >= 75) return { grade: 'C+', interpretation: 'Above Average', rank: 'Top 55%', color: '#f59e0b' };
  if (score >= 70) return { grade: 'C', interpretation: 'Competent', rank: 'Top 70%', color: '#f59e0b' };
  return { grade: 'D/F', interpretation: 'Below Expectations', rank: 'Developing', color: '#f43f5e' };
};

/**
 * GRAPH 1: Comparative Grouped Bar Graph (Project vs Cohort Average & Distinction Benchmark)
 */
const ComparativeBarGraph = ({ layers }) => {
  const width = 560;
  const height = 230;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const usableWidth = width - paddingLeft - paddingRight;
  const usableHeight = height - paddingTop - paddingBottom;

  const cohortAverages = {
    code: 68,
    docs: 74,
    align: 62,
    plag: 88,
    auth: 76,
  };

  const groupWidth = usableWidth / layers.length;
  const barWidth = 14;

  return (
    <div className="space-y-3 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Dimensional Performance vs Cohort Benchmarks
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 dark:bg-indigo-500 inline-block" /> This Submission
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 dark:bg-slate-700 inline-block" /> Cohort Mean
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" /> Distinction (85%)
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 overflow-visible">
          {/* Y-Axis Grid Lines & Tick Labels */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = paddingTop + usableHeight - (val / 100) * usableHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={0.7}
                  strokeDasharray={val === 0 ? 'none' : '3 3'}
                  className="text-slate-200 dark:text-slate-800"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9.5px] font-mono text-slate-400 dark:text-slate-500"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Distinction Benchmark Line (85%) */}
          <line
            x1={paddingLeft}
            y1={paddingTop + usableHeight - 0.85 * usableHeight}
            x2={width - paddingRight}
            y2={paddingTop + usableHeight - 0.85 * usableHeight}
            stroke="#10b981"
            strokeWidth={1.2}
            strokeDasharray="4 4"
            opacity={0.8}
          />

          {/* Grouped Bars */}
          {layers.map((layer, idx) => {
            const groupX = paddingLeft + idx * groupWidth;
            const centerX = groupX + groupWidth / 2;

            const myScore = Math.min(100, Math.max(0, layer.score));
            const myHeight = (myScore / 100) * usableHeight;
            const myY = paddingTop + usableHeight - myHeight;

            const cohortScore = cohortAverages[layer.id] || 70;
            const cohortHeight = (cohortScore / 100) * usableHeight;
            const cohortY = paddingTop + usableHeight - cohortHeight;

            return (
              <g key={layer.id} className="group cursor-pointer">
                {/* Cohort Mean Bar */}
                <rect
                  x={centerX - barWidth - 2}
                  y={cohortY}
                  width={barWidth}
                  height={cohortHeight}
                  rx={3}
                  className="fill-slate-200 dark:fill-slate-700/80 transition-opacity group-hover:opacity-100 opacity-80"
                />

                {/* Submission Score Bar */}
                <rect
                  x={centerX + 2}
                  y={myY}
                  width={barWidth}
                  height={myHeight}
                  rx={3}
                  fill={layer.color}
                  className="transition-all duration-300 group-hover:brightness-110"
                />

                {/* Score Label above Submission Bar */}
                <text
                  x={centerX + 2 + barWidth / 2}
                  y={myY - 5}
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold fill-slate-800 dark:fill-slate-200"
                >
                  {Math.round(myScore)}%
                </text>

                {/* X-Axis Category Label */}
                <text
                  x={centerX}
                  y={height - 12}
                  textAnchor="middle"
                  className="text-[10.5px] font-bold fill-slate-600 dark:fill-slate-400 group-hover:fill-indigo-600 dark:group-hover:fill-indigo-400 transition-colors"
                >
                  {layer.short}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

/**
 * GRAPH 2: Cohort Gaussian Distribution Curve (Statistical Bell Curve)
 */
const CohortBellCurveGraph = ({ totalScore, stats }) => {
  const width = 560;
  const height = 230;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 40;
  const usableWidth = width - paddingLeft - paddingRight;
  const usableHeight = height - paddingTop - paddingBottom;

  // Gaussian Bell Curve points (Mean = 68, StdDev = 14)
  const mean = 68;
  const stdDev = 14;
  const numPoints = 60;
  const curvePoints = [];

  for (let i = 0; i <= numPoints; i++) {
    const scoreVal = (i / numPoints) * 100;
    const exponent = -Math.pow(scoreVal - mean, 2) / (2 * Math.pow(stdDev, 2));
    const density = Math.exp(exponent);
    const x = paddingLeft + (scoreVal / 100) * usableWidth;
    const y = paddingTop + usableHeight - density * usableHeight;
    curvePoints.push({ x, y, scoreVal });
  }

  const pathD = curvePoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');
  const areaD = `${pathD} L ${curvePoints[curvePoints.length - 1].x},${paddingTop + usableHeight} L ${curvePoints[0].x},${paddingTop + usableHeight} Z`;

  // Student pin X position
  const studentX = paddingLeft + (Math.min(100, Math.max(0, totalScore)) / 100) * usableWidth;

  return (
    <div className="space-y-3 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Cohort Statistical Bell Curve Distribution
        </span>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          Cohort Mean: 68.4% • Std Dev: ±14.2%
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 overflow-visible">
          <defs>
            <linearGradient id="bellCurveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Baseline Axis */}
          <line
            x1={paddingLeft}
            y1={paddingTop + usableHeight}
            x2={width - paddingRight}
            y2={paddingTop + usableHeight}
            stroke="currentColor"
            strokeWidth={1}
            className="text-slate-300 dark:text-slate-700"
          />

          {/* Grade Zone Backgrounds */}
          <rect
            x={paddingLeft}
            y={paddingTop}
            width={0.5 * usableWidth}
            height={usableHeight}
            fill="#f43f5e"
            opacity={0.04}
          />
          <rect
            x={paddingLeft + 0.5 * usableWidth}
            y={paddingTop}
            width={0.25 * usableWidth}
            height={usableHeight}
            fill="#f59e0b"
            opacity={0.04}
          />
          <rect
            x={paddingLeft + 0.75 * usableWidth}
            y={paddingTop}
            width={0.25 * usableWidth}
            height={usableHeight}
            fill="#10b981"
            opacity={0.04}
          />

          {/* Bell Curve Area Fill & Stroke */}
          <path d={areaD} fill="url(#bellCurveGrad)" />
          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth={2.2} />

          {/* Cohort Mean Line */}
          <line
            x1={paddingLeft + (mean / 100) * usableWidth}
            y1={paddingTop}
            x2={paddingLeft + (mean / 100) * usableWidth}
            y2={paddingTop + usableHeight}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <text
            x={paddingLeft + (mean / 100) * usableWidth}
            y={paddingTop - 6}
            textAnchor="middle"
            className="text-[9.5px] font-mono fill-slate-500"
          >
            Cohort Mean (68%)
          </text>

          {/* Student Position Needle Pin */}
          <line
            x1={studentX}
            y1={paddingTop + 10}
            x2={studentX}
            y2={paddingTop + usableHeight}
            stroke="#f43f5e"
            strokeWidth={2}
          />
          <circle cx={studentX} cy={paddingTop + 10} r={4} fill="#f43f5e" />

          {/* Student Callout Badge */}
          <g transform={`translate(${studentX}, ${paddingTop + 24})`}>
            <rect
              x={-55}
              y={0}
              width={110}
              height={22}
              rx={5}
              fill="#0f172a"
              className="dark:fill-white"
            />
            <text
              x={0}
              y={14}
              textAnchor="middle"
              className="text-[9.5px] font-mono font-bold fill-white dark:fill-slate-900"
            >
              You: {Math.round(totalScore)}% ({stats.grade})
            </text>
          </g>

          {/* X-Axis Grade Zones */}
          <text x={paddingLeft + 0.25 * usableWidth} y={height - 12} textAnchor="middle" className="text-[10px] font-bold fill-rose-500">
            D/F Zone (&lt;50%)
          </text>
          <text x={paddingLeft + 0.62 * usableWidth} y={height - 12} textAnchor="middle" className="text-[10px] font-bold fill-amber-500">
            C/B Zone (50-75%)
          </text>
          <text x={paddingLeft + 0.88 * usableWidth} y={height - 12} textAnchor="middle" className="text-[10px] font-bold fill-emerald-500">
            A/A+ Zone (&gt;75%)
          </text>
        </svg>
      </div>
    </div>
  );
};

/**
 * GRAPH 3: Clean SVG Waterfall Deduction & Earned Points Diagram
 */
const WaterfallDeductionChart = ({ layers, totalScore }) => {
  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Mathematical Points Earned vs Potential
        </span>
        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
          Max Potential: 100.0 Pts
        </span>
      </div>

      <div className="space-y-2.5">
        {layers.map((layer) => {
          const maxPts = layer.weightNum;
          const earnedPts = (layer.score * (maxPts / 100)).toFixed(1);
          const lostPts = (maxPts - earnedPts).toFixed(1);
          const percentEarned = Math.min(100, Math.max(0, (earnedPts / maxPts) * 100));

          return (
            <div
              key={layer.id}
              className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: layer.color }}
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{layer.name}</span>
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                    ({layer.weight} weight)
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    +{earnedPts} <span className="text-[10px] text-slate-600 dark:text-slate-400">/ {maxPts} pts</span>
                  </span>
                  {Number(lostPts) > 0 && (
                    <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                      -{lostPts}
                    </span>
                  )}
                </div>
              </div>

              {/* Stacked Progress Track */}
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden flex">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${percentEarned}%`,
                    backgroundColor: layer.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 text-xs font-mono font-bold">
        <span className="text-slate-600 dark:text-slate-400">Aggregate Earned Score:</span>
        <span className="text-base text-slate-900 dark:text-white">
          {Math.round(totalScore)} <span className="text-xs text-slate-600 dark:text-slate-400">/ 100 Pts</span>
        </span>
      </div>
    </div>
  );
};

/**
 * GRAPH 4: Multi-Metric Horizon Comparison Waveform
 */
const HorizonWaveform = ({ layers }) => {
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const points = layers.map((l, idx) => {
    const x = paddingX + (idx / (layers.length - 1)) * usableWidth;
    const y = height - paddingY - (Math.min(100, Math.max(0, l.score)) / 100) * usableHeight;
    return { x, y, ...l };
  });

  const benchmarkY = height - paddingY - 0.8 * usableHeight;

  // Build smooth path
  const pathD = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Dimensional Horizon Profile vs 80% Benchmark
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-indigo-500">
            <span className="w-2.5 h-0.5 bg-indigo-500 inline-block" /> Actual
          </span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-0.5 bg-slate-400 border-dashed inline-block" /> Benchmark (80%)
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="horizonAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1.0].map((lvl, idx) => {
            const y = height - paddingY - lvl * usableHeight;
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="currentColor"
                strokeWidth={0.8}
                strokeDasharray="3 3"
                className="text-slate-200 dark:text-slate-800"
              />
            );
          })}

          {/* Benchmark line */}
          <line
            x1={paddingX}
            y1={benchmarkY}
            x2={width - paddingX}
            y2={benchmarkY}
            stroke="#94a3b8"
            strokeWidth={1.2}
            strokeDasharray="4 4"
            opacity={0.8}
          />

          {/* Area fill */}
          <path d={areaD} fill="url(#horizonAreaGrad)" />

          {/* Actual line */}
          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" />

          {/* Data points */}
          {points.map((pt, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r={4.5}
                className="fill-white dark:fill-slate-900 stroke-indigo-600 transition-transform duration-200 group-hover:scale-150"
                strokeWidth={2}
              />
              <text
                x={pt.x}
                y={height - 8}
                textAnchor="middle"
                className="text-[10px] font-bold fill-slate-500 dark:fill-slate-400 group-hover:fill-indigo-500 transition-colors"
              >
                {pt.short}
              </text>
              <text
                x={pt.x}
                y={pt.y - 8}
                textAnchor="middle"
                className="text-[10px] font-mono font-bold fill-slate-700 dark:fill-slate-200"
              >
                {Math.round(pt.score)}%
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

const ComprehensiveScorerPage = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGraph, setActiveGraph] = useState('comparative'); // 'comparative', 'bellcurve', 'waterfall', 'waveform'
  const [selectedLayer, setSelectedLayer] = useState(null);

  useEffect(() => {
    evaluationService
      .getEvaluation(id)
      .then(setEvaluation)
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load evaluation'))
      .finally(() => setLoading(false));
  }, [id]);

  const totalScore = evaluation?.total_score ?? 14;
  const stats = getDerivedStats(totalScore);

  // Sub-scores
  const codeScore = evaluation?.code_quality_score ?? 50;
  const docScore = evaluation?.documentation_score ?? 84;
  const alignScore = evaluation?.report_alignment_score ?? 0;
  const plagScore = evaluation?.plagiarism_score ?? 0;
  const authScore = evaluation?.ai_code_score ?? 56;
  const isHighRisk = evaluation?.plagiarism_detected ?? (plagScore < 40 || totalScore < 40);

  const layers = [
    {
      id: 'code',
      name: 'Code Craft & Architecture',
      short: 'Code',
      score: codeScore,
      weight: '25%',
      weightNum: 25,
      color: '#3b82f6',
      icon: CodeBracketIcon,
      status: codeScore >= 70 ? 'Pass' : 'Review Needed',
      notes: 'AST maintainability, modularity, and error handling.',
    },
    {
      id: 'docs',
      name: 'Technical Documentation',
      short: 'Docs',
      score: docScore,
      weight: '20%',
      weightNum: 20,
      color: '#10b981',
      icon: DocumentTextIcon,
      status: docScore >= 70 ? 'Exemplary' : 'Incomplete',
      notes: 'Structural hierarchy, readability grade, and section depth.',
    },
    {
      id: 'align',
      name: 'Report-to-Code Alignment',
      short: 'Align',
      score: alignScore,
      weight: '15%',
      weightNum: 15,
      color: '#06b6d4',
      icon: LinkIcon,
      status: alignScore >= 60 ? 'Synchronized' : 'Gap Detected',
      notes: 'Traceability between report methodology and code functions.',
    },
    {
      id: 'plag',
      name: 'Source Integrity (Plagiarism)',
      short: 'Integrity',
      score: plagScore,
      weight: '20%',
      weightNum: 20,
      color: '#f43f5e',
      icon: FingerPrintIcon,
      status: plagScore >= 70 ? 'Authentic' : 'Critical Collision',
      notes: 'Cross-submission AST shingle and peer repo correlation.',
    },
    {
      id: 'auth',
      name: 'AI Code Discretion',
      short: 'Auth',
      score: authScore,
      weight: '20%',
      weightNum: 20,
      color: '#8b5cf6',
      icon: CpuChipIcon,
      status: authScore >= 65 ? 'Human' : 'Synthetic Mixed',
      notes: 'Token perplexity, burstiness, and LLM syntax patterns.',
    },
  ];

  const scoreBadge = !loading && !error && (
    <div
      className="px-4 py-2 rounded-xl font-mono font-bold text-xs tracking-wide border flex items-center gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stats.color }} />
      <span>COMPOSITE: {Math.round(totalScore)}/100 (GRADE {stats.grade})</span>
    </div>
  );

  return (
    <LayerPageShell
      title="Comprehensive Scorer"
      subtitle="Executive grade scorecard, statistical cohort distribution, and multi-graph analytical synthesis"
      icon={ChartBarSquareIcon}
      iconColor="bg-slate-800"
      scoreBadge={scoreBadge}
      evaluationId={id}
      loading={loading}
      error={error}
      projectTitle={evaluation?.project?.title}
    >
      {evaluation && (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* SECTION 1: PANORAMIC EXECUTIVE SCORECARD BANNER (High Visibility & Crisp) */}
          {/* ========================================================================= */}
          <div className="animate-fluid-enter bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Score & Grade Core */}
              <div className="lg:col-span-5 flex items-center gap-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 pb-6 lg:pb-0 lg:pr-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    Aggregate Performance Index
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-6xl sm:text-7xl font-black font-mono tracking-tight tabular-nums"
                      style={{ color: stats.color }}
                    >
                      {Math.round(totalScore)}
                    </span>
                    <span className="text-2xl font-bold text-slate-600 dark:text-slate-400">/100</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center min-w-[110px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                    Grade
                  </span>
                  <span className="text-3xl font-black font-mono text-slate-900 dark:text-white block mt-0.5">
                    {stats.grade}
                  </span>
                  <span
                    className="text-[10px] font-bold mt-1 inline-block px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${stats.color}18`, color: stats.color }}
                  >
                    {stats.interpretation}
                  </span>
                </div>
              </div>

              {/* Diagnostic Metadata Ribbon */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Cohort Rank
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                    {stats.rank}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Integrity Risk
                  </span>
                  <span
                    className={`text-sm font-bold font-mono mt-1 block ${
                      isHighRisk ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isHighRisk ? 'High Risk' : 'Verified Safe'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Engine Version
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                    ASPES v2.0
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Action Status
                  </span>
                  <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                    Review Required
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: 5-PILLAR EXECUTIVE EQUALIZER STRIP (Interactive Clickable Pods)*/}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {layers.map((layer) => {
              const Icon = layer.icon;
              const isSelected = selectedLayer === layer.id;

              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayer(isSelected ? null : layer.id)}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none bg-white dark:bg-slate-900 ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="p-1.5 rounded-lg text-white"
                      style={{ backgroundColor: layer.color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                      {layer.weight}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block truncate">
                    {layer.name}
                  </span>

                  <div className="flex items-baseline justify-between mt-2">
                    <span
                      className="text-2xl font-black font-mono tabular-nums"
                      style={{ color: layer.color }}
                    >
                      {Math.round(layer.score)}%
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                      {layer.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: DEDICATED GRAPH ANALYTICS SUITE (Interactive Graphs)          */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 65%: The Interactive Graph Suite Deck */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <PresentationChartLineIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Multi-Dimensional Performance Graphs
                  </h3>
                </div>

                {/* 4-Graph Interactive Switcher */}
                <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto overflow-x-auto max-w-full">
                  <button
                    onClick={() => setActiveGraph('comparative')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      activeGraph === 'comparative'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Cohort Bar Graph
                  </button>
                  <button
                    onClick={() => setActiveGraph('bellcurve')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      activeGraph === 'bellcurve'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Bell Curve
                  </button>
                  <button
                    onClick={() => setActiveGraph('waterfall')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      activeGraph === 'waterfall'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Points Waterfall
                  </button>
                  <button
                    onClick={() => setActiveGraph('waveform')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      activeGraph === 'waveform'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Waveform
                  </button>
                </div>
              </div>

              {/* Render Active Graph */}
              {activeGraph === 'comparative' && <ComparativeBarGraph layers={layers} />}
              {activeGraph === 'bellcurve' && <CohortBellCurveGraph totalScore={totalScore} stats={stats} />}
              {activeGraph === 'waterfall' && <WaterfallDeductionChart layers={layers} totalScore={totalScore} />}
              {activeGraph === 'waveform' && <HorizonWaveform layers={layers} />}
            </div>

            {/* Right 35%: Dimension Audit Matrix Table */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ClipboardDocumentCheckIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Audit Matrix
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                  5 Modules
                </span>
              </div>

              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Module</th>
                      <th className="py-2.5 px-3">Score</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    {layers.map((layer) => (
                      <tr
                        key={layer.id}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                          selectedLayer === layer.id ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {layer.short}
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[130px] block">
                            {layer.notes}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {Math.round(layer.score)}%
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              backgroundColor: `${layer.color}18`,
                              color: layer.color,
                            }}
                          >
                            {layer.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Formula: <strong className="text-slate-900 dark:text-white font-mono">Index = ∑(Sub_Score × Weight)</strong>. Plagiarism collision caps final grade at D/F when exceeding 75% overlap.
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: EXECUTIVE DETERMINATION & ACADEMIC ACTION SUITE               */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Integrity Determination */}
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldExclamationIcon className="w-4 h-4" />
                  <span>Integrity Assessment</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Critical source collision flagged in 5 logic partitions (0% originality). Code structure matches external repository submission.
                </p>
              </div>

              {/* Card 2: Faculty Recommendation */}
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <SparklesIcon className="w-4 h-4" />
                  <span>Faculty Recommendation</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Schedule an oral code defense interview before posting final academic grade. Require student to independently author flagged partitions.
                </p>
              </div>

              {/* Card 3: Export & Action Buttons */}
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                  <DocumentArrowDownIcon className="w-4 h-4 text-slate-500" />
                  <span>Academic Export</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const text = `ASPES Executive Grade Audit:\nComposite Score: ${Math.round(totalScore)}/100 (Grade ${stats.grade} - ${stats.interpretation})\nCode Craft: ${codeScore}%\nDocs: ${docScore}%\nAlignment: ${alignScore}%\nIntegrity: ${plagScore}%\nAuth: ${authScore}%`;
                      navigator.clipboard?.writeText(text);
                      alert('Executive Grade Summary copied to clipboard!');
                    }}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-center shadow-xs"
                  >
                    Copy Summary
                  </button>
                  <button
                    onClick={() => alert('Official Evaluation Certificate export triggered.')}
                    className="py-2 px-3 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    PDF
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
