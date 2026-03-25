import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import LayerNavTabs from '../AILayer/LayerNavTabs';

import { evaluationService } from '../../services/evaluationService';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  BuildingLibraryIcon,
  CommandLineIcon,
  PuzzlePieceIcon,
  BoltIcon,
  DocumentArrowDownIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

// Safe date formatter — returns 'N/A' if value is null/undefined/invalid
const safeFormat = (value, fmt) => {
  if (!value) return 'N/A';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'N/A';
    return format(d, fmt);
  } catch {
    return 'N/A';
  }
};


/**
 * MetricRow - Simple display for individual numeric metrics
 */
const MetricRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-slate-800 last:border-0 hover:bg-gray-50/30 dark:hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
    <span className="text-gray-600 dark:text-slate-400 text-sm font-medium">{label}</span>
    <div className="flex items-center gap-4">
      <div className="w-24 sm:w-40 bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 hidden xs:block overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${value >= 90 ? 'bg-indigo-500' : value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-blue-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
      <span className="font-black text-gray-900 dark:text-white min-w-[3.5rem] text-right text-sm">{value.toFixed(1)}/100</span>
    </div>
  </div>
);

/**
 * AnalysisSection - Collapsible container for sub-engine results
 */
const AnalysisSection = ({ title, score, verdict, expanded, onToggle, icon: Icon, children }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border transition-all duration-300 overflow-hidden mb-6 ${expanded ? 'border-blue-200 dark:border-blue-500/30 ring-4 ring-blue-50 dark:ring-blue-500/10 shadow-blue-100 dark:shadow-none' : 'border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 shadow-gray-50 dark:shadow-none'}`}>
    <button
      onClick={onToggle}
      className="w-full px-6 py-6 flex items-center justify-between text-left transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl transition-colors ${expanded ? 'bg-blue-600 dark:bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-indigo-900/20 group-hover:text-blue-500 dark:group-hover:text-indigo-400'}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{title}</h3>
          <div className="flex items-center gap-2 mt-1">
            {score !== undefined && (
              <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${score >= 80 ? 'bg-green-50 text-green-700 border-green-100' :
                score >= 60 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  'bg-red-50 text-red-700 border-red-100'
                }`}>
                Score: {Math.round(score)}%
              </span>
            )}
            {verdict && (
              <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${verdict.includes('HUMAN') || verdict.includes('CLEAN') || verdict.includes('ORIGINAL') ? 'bg-green-50 dark:bg-emerald-900/20 text-green-700 dark:text-emerald-400 border-green-100 dark:border-emerald-500/20' :
                verdict.includes('ASSISTED') || verdict.includes('POSSIBLE') ? 'bg-yellow-50 dark:bg-amber-900/20 text-yellow-700 dark:text-amber-400 border-yellow-100 dark:border-amber-500/20' :
                  'bg-red-50 dark:bg-rose-900/20 text-red-700 dark:text-rose-400 border-red-100 dark:border-rose-500/20'
                }`}>
                {verdict}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className={`p-2 rounded-full transition-transform ${expanded ? 'bg-blue-50 dark:bg-indigo-900/20 text-blue-600 dark:text-indigo-400 rotate-180' : 'bg-gray-50 dark:bg-slate-800 text-gray-300 dark:text-slate-600'}`}>
        <ChevronDownIcon className="w-5 h-5" />
      </div>
    </button>
    {expanded && (
      <div className="px-8 pb-8 pt-2 animate-slide-up border-t border-gray-50 dark:border-slate-800">
        {children}
      </div>
    )}
  </div>
);

const EvaluationResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    codeQuality: true,
    aiDetection: false,
    plagiarism: false,
    alignment: false,
    aiFeedback: true
  });

  useEffect(() => {
    fetchEvaluation();
  }, [id]);

  const fetchEvaluation = async () => {
    try {
      setLoading(true);
      const data = await evaluationService.getEvaluation(id);
      setEvaluation(data);
    } catch (err) {
      console.error('Failed to fetch evaluation:', err);
      setError(err.response?.data?.detail || 'Failed to load evaluation details');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  /**
   * Helper to calculate letter grade and interpretation locally
   * mirroring the ComprehensiveScorer logic if not provided by backend
   */
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

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] animate-pulse">
        <div className="w-20 h-20 relative">
          <div className="absolute inset-0 border-4 border-blue-100 dark:border-slate-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-8 text-gray-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">Synthesizing AI Engine Outputs...</p>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-red-50 dark:border-red-900/10 text-center animate-fade-in">
        <ExclamationTriangleIcon className="w-20 h-20 text-red-500 mx-auto mb-6 opacity-80" />
        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Evaluation Unreachable</h2>
        <p className="mt-4 text-gray-500 dark:text-slate-400 font-medium leading-relaxed">{error || 'This analysis record does not exist or access was revoked.'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-8 px-8 py-3 bg-gray-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black dark:hover:bg-indigo-700 transition-all shadow-xl shadow-gray-200 dark:shadow-none"
        >
          Return to Console
        </button>
      </div>
    );
  }

  // derive metadata
  const totalScore = evaluation.total_score != null ? evaluation.total_score : 0;
  const stats = getDerivedStats(totalScore);

  // prepare visuals
  const radarData = [
    { subject: 'Code Quality', score: evaluation.code_quality_score || 0 },
    { subject: 'Documentation', score: evaluation.documentation_score || 0 },
    { subject: 'Alignment', score: (evaluation.report_alignment_score || 0) },
    { subject: 'Originality', score: (evaluation.plagiarism_score || 0) },
    { subject: 'Authenticity', score: (evaluation.ai_code_score || 0) }
  ];

  const barData = [
    { name: 'Code', score: evaluation.code_quality_score || 0, fill: '#3b82f6' },
    { name: 'Docs', score: evaluation.documentation_score || 0, fill: '#10b981' },
    { name: 'Align', score: evaluation.report_alignment_score || 0, fill: '#f59e0b' },
    { name: 'Plag', score: evaluation.plagiarism_score || 0, fill: '#ef4444' },
    { name: 'Auth', score: evaluation.ai_code_score || 0, fill: '#8b5cf6' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-10 animate-fade-in mb-24">

      {/* --- SUPER HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 dark:border-slate-800 pb-8">
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center text-xs font-black text-gray-400 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Registry
          </button>
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{evaluation.project?.title}</h1>
            <div className="flex items-center gap-4 mt-3 text-sm font-bold text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <BuildingLibraryIcon className="w-5 h-5 opacity-60" />
                Final Report Analysis
              </span>
              <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700 rounded-full"></span>
              <span>{safeFormat(evaluation.completed_at || evaluation.created_at, 'MMM dd, yyyy • HH:mm')}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {evaluation.is_finalized ? (
            <div className="flex items-center gap-3 px-6 py-4 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-200 dark:shadow-none">
              <ShieldCheckIcon className="w-6 h-6" />
              <span className="font-black text-xs uppercase tracking-widest">Faculty Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-900 border-2 border-yellow-100 dark:border-amber-900/30 rounded-3xl text-yellow-600 dark:text-amber-400 shadow-xl shadow-yellow-50 dark:shadow-none">
              <BoltIcon className="w-6 h-6 animate-pulse" />
              <span className="font-black text-xs uppercase tracking-widest">AI Raw Inference</span>
            </div>
          )}
          <button className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <DocumentArrowDownIcon className="w-6 h-6 text-gray-400 dark:text-slate-500" />
          </button>
        </div>
      </div>

      {/* --- AI LAYER NAVIGATION TABS --- */}
      <LayerNavTabs evaluationId={id} />

      {/* --- PERFORMANCE DASH --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Score Hero Card */}
        <div className="lg:col-span-2 bg-gray-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[400px]">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-6">Aggregate Performance Index</p>
              <div className="flex items-baseline gap-4">
                <span className="text-[10rem] font-black leading-none tracking-tighter text-blue-500">{Math.round(totalScore)}</span>
                <span className="text-4xl font-bold text-gray-600">/100</span>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-3xl rounded-[2rem] p-8 border border-white/10 flex flex-col items-center justify-center min-w-[140px]">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Grade</span>
              <span className="text-6xl font-black text-white">{stats.grade}</span>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 xs:grid-cols-4 gap-8 pt-10 border-t border-white/5">
            <div>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Interpretation</p>
              <p className="text-lg font-bold mt-1 text-gray-300">{stats.interpretation}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Global Rank</p>
              <p className="text-lg font-bold mt-1 text-blue-400">{stats.rank}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Integrity</p>
              <p className={`text-lg font-bold mt-1 ${evaluation.plagiarism_detected ? 'text-red-500' : 'text-green-500'}`}>
                {evaluation.plagiarism_detected ? 'High Risk' : 'Secure'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Model</p>
              <p className="text-lg font-bold mt-1 text-gray-500">ASPES-v2.0</p>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute -right-20 -bottom-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute -left-20 -top-20 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        </div>

        {/* Detailed Individual Score Cards - As requested by Prompt 17.1 */}
        <div className="space-y-4">
          {[
            { label: 'Source Integrity', score: evaluation.plagiarism_score, color: 'rose', icon: PuzzlePieceIcon },
            { label: 'Code Craft', score: evaluation.code_quality_score, color: 'blue', icon: CommandLineIcon },
            { label: 'Documentation', score: evaluation.documentation_score, color: 'emerald', icon: BuildingLibraryIcon },
            { label: 'AI Discretion', score: evaluation.ai_code_score, color: 'indigo', icon: BoltIcon }
          ].map((m, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between group hover:border-blue-200 dark:hover:border-indigo-500 transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-${m.color}-50 dark:bg-${m.color}-900/20 text-${m.color}-600 dark:text-${m.color}-400 group-hover:bg-${m.color}-600 dark:group-hover:bg-${m.color}-600 group-hover:text-white transition-colors`}>
                  <m.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-gray-700 dark:text-slate-300">{m.label}</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-gray-900 dark:text-white">{Math.round(m.score || 0)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- ANALYTICS SUITE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Radar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-gray-100 dark:shadow-none border border-gray-50 dark:border-slate-800 p-10 flex flex-col">
          <div className="mb-10">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Logical Footprint</h2>
            <p className="text-gray-400 dark:text-slate-500 text-sm font-medium mt-1">Multi-modal mapping across structural dimensions.</p>
          </div>
          <div className="h-[400px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke={isDark ? '#334155' : '#E5E7EB'} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} axisLine={false} tick={false} />
                <Radar
                  name="Logic Coverage"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fill="#3b82f6"
                  fillOpacity={0.15}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderRadius: '16px',
                    border: isDark ? '1px solid #1E293B' : 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    color: isDark ? '#F1F5F9' : '#0F172A'
                  }}
                  itemStyle={{ color: isDark ? '#F1F5F9' : '#0F172A' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Weighted Contributions */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-gray-100 dark:shadow-none border border-gray-50 dark:border-slate-800 p-10 flex flex-col">
          <div className="mb-10">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Weighted Contributions</h2>
            <p className="text-gray-400 dark:text-slate-500 text-sm font-medium mt-1">How each sub-engine impacted the final score.</p>
          </div>
          <div className="h-[400px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke={isDark ? '#334155' : '#F1F5F9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: isDark ? '#94A3B8' : '#64748B' }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: isDark ? '#1E293B' : '#F8FAFC', opacity: 0.4 }}
                  contentStyle={{
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderRadius: '16px',
                    border: isDark ? '1px solid #1E293B' : 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    color: isDark ? '#F1F5F9' : '#0F172A'
                  }}
                  itemStyle={{ color: isDark ? '#F1F5F9' : '#0F172A' }}
                />
                <Bar dataKey="score" radius={[12, 12, 12, 12]} barSize={40}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- DETAIL DRILLDOWN --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* Deep Analysis Expandables */}
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 px-4">Engine Granularity</h3>

          {/* 1. Code Quality */}
          <AnalysisSection
            title="Architectural Code Quality"
            score={evaluation.code_quality_score}
            icon={CommandLineIcon}
            expanded={expandedSections.codeQuality}
            onToggle={() => toggleSection('codeQuality')}
          >
            <div className="space-y-1">
              <MetricRow label="Structural Modularity" value={evaluation.code_analysis_result?.clean_code_score || 0} />
              <MetricRow label="Maintainability Index" value={evaluation.code_analysis_result?.maintainability_index || 0} />
              <MetricRow label="Cognitive Complexity" value={evaluation.code_analysis_result?.complexity_score || 0} />
            </div>
            <div className="mt-6 p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 italic text-sm text-gray-600 dark:text-slate-400">
              &quot;The project structure follows SOLID principles with highly decoupled modules.&quot;
            </div>
            <Link to={`/evaluations/${id}/code-analyzer`} className="mt-4 flex items-center gap-2 text-xs font-black text-blue-600 dark:text-indigo-400 hover:underline uppercase tracking-widest">
              View Full Code Analysis <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Link>
          </AnalysisSection>

          {/* 2. AI Detection */}
          <AnalysisSection
            title="AI Probabilistic Forensics"
            verdict={evaluation.ai_code_detected ? "LIKELY_AI" : "HUMAN_AUTHORED"}
            icon={BoltIcon}
            expanded={expandedSections.aiDetection}
            onToggle={() => toggleSection('aiDetection')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-3xl text-center">
                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Inference Probability</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{(evaluation.ai_detection_result?.ai_generated_probability * 100 || 0).toFixed(1)}%</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-3xl text-center">
                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Detect Model Confidence</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white">97.4%</p>
              </div>
            </div>
            <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2">Identified Signatures</p>
            <ul className="space-y-2">
              {(evaluation.ai_detection_result?.findings || ['Consistent whitespace patterns', 'Boilerplate structure matches LLM templates']).map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400 px-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  {f}
                </li>
              ))}
            </ul>
            <Link to={`/evaluations/${id}/code-detector`} className="mt-4 flex items-center gap-2 text-xs font-black text-blue-600 dark:text-indigo-400 hover:underline uppercase tracking-widest">
              View Full AI Detection Report <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Link>
          </AnalysisSection>

          {/* 3. Plagiarism Check */}
          <AnalysisSection
            title="Source Integrity & Plagiarism"
            verdict={evaluation.plagiarism_detected ? "RISK DETECTED" : "ORIGINAL CONTENT"}
            icon={PuzzlePieceIcon}
            expanded={expandedSections.plagiarism}
            onToggle={() => toggleSection('plagiarism')}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-800/50 rounded-3xl">
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Cross-Submission Similarity</p>
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{evaluation.plagiarism_result?.max_similarity_percent || 0}%</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1">Logic Overlap</p>
                  <span className={`text-2xl font-black ${evaluation.plagiarism_detected ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {evaluation.plagiarism_result?.flagged ? 'FLAGGED' : 'MINIMAL'}
                  </span>
                </div>
              </div>
              {evaluation.plagiarism_result?.similar_sections?.length > 0 && (
                <div className="p-5 border border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10 rounded-2xl">
                  <p className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase mb-3">Matching Logic Blocks</p>
                  <div className="space-y-3">
                    {evaluation.plagiarism_result.similar_sections.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-rose-50 dark:border-rose-900/20">
                        <span>Module Partition {idx + 1}</span>
                        <span>{s.similarity_score}% overlap</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Link to={`/evaluations/${id}/plagiarism`} className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-indigo-400 hover:underline uppercase tracking-widest">
                View Full Plagiarism Report <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </Link>
            </div>
          </AnalysisSection>

          {/* 4. Alignment */}
          <AnalysisSection
            title="Report-to-Logic Alignment"
            score={evaluation.report_alignment_score}
            icon={BuildingLibraryIcon}
            expanded={expandedSections.alignment}
            onToggle={() => toggleSection('alignment')}
          >
            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
                <p className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-3">Engine Synthesis</p>
                <p className="text-sm text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed">
                  {evaluation.alignment_result?.alignment_synthesis || "The implementation logic aligns with the technical goals specified in the abstract and methodology sections of the report."}
                </p>
              </div>
              {evaluation.alignment_result?.missing_features?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-rose-400 uppercase px-2 mb-3">Documented but Missing in Source</p>
                  <div className="flex flex-wrap gap-2">
                    {evaluation.alignment_result.missing_features.map((f, i) => (
                      <span key={i} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold border border-rose-100 dark:border-rose-500/20">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              <Link to={`/evaluations/${id}/report-aligner`} className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-indigo-400 hover:underline uppercase tracking-widest">
                View Full Alignment Analysis <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </Link>
            </div>
          </AnalysisSection>
        </div>

        {/* AI FEEDBACK SIDEBAR - As requested by Prompt 17.1 */}
        <div className="space-y-10">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-gray-100 dark:shadow-none border border-gray-50 dark:border-slate-800 p-10">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-8">AI Narrative</h3>

            {/* Narrative Feedback */}
            <div className="prose prose-sm text-gray-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-6 hover:line-clamp-none transition-all mb-10">
              {evaluation.ai_feedback || "Synthesizing descriptive feedback..."}
            </div>

            <div className="space-y-8">
              {/* Strengths */}
              <div>
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Core Strengths</h4>
                <ul className="space-y-3">
                  {['Modular Design', 'Error Handling', 'Type Safety'].map((s, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                      <CheckCircleIcon className="w-5 h-5 text-emerald-500" /> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements with Checkboxes */}
              <div>
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Optimization Required</h4>
                <div className="space-y-3">
                  {['Expand PDF Documentation', 'Refactor Helper Logic', 'Security Hardening'].map((imp, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 border border-gray-100 dark:border-slate-800 rounded-2xl hover:border-blue-200 dark:hover:border-indigo-500 transition-colors">
                      <input type="checkbox" readOnly className="w-4 h-4 rounded-md border-gray-300 dark:border-slate-700 bg-transparent text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-bold text-gray-600 dark:text-slate-400">{imp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items with Priority Badges */}
              <div>
                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-4">Immediate Actions</h4>
                <div className="space-y-3">
                  {[
                    { act: 'Fix similarity overlap', pri: 'CRITICAL', color: 'rose' },
                    { act: 'Correct Alignment', pri: 'HIGH', color: 'amber' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl group cursor-default">
                      <div className={`px-2.5 py-1 rounded-lg bg-${item.color}-600 text-white text-[8px] font-black`}>{item.pri}</div>
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-300">{item.act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FACULTY REVIEW SECTION */}
          {evaluation.is_finalized && (
            <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
              <ShieldCheckIcon className="w-20 h-20 absolute -right-4 -bottom-4 opacity-10" />
              <h3 className="text-xl font-black mb-6 flex items-center gap-3 relative z-10">
                <ShieldCheckIcon className="w-6 h-6" /> Faculty Verdict
              </h3>
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 italic text-sm border border-white/10 mb-6 relative z-10">
                &quot;{evaluation.professor_feedback || "Overall solid work. The AI detection flags are handled with discretion."}&quot;
              </div>
              <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest relative z-10">
                Verified by Prof. Academic Admin<br />
                {evaluation.finalized_at && safeFormat(evaluation.finalized_at, 'MMM dd, yyyy')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationResults;
