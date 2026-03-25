import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { ChartBarSquareIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    evaluationService.getEvaluation(id)
      .then(setEvaluation)
      .catch(err => setError(err.response?.data?.detail || 'Failed to load evaluation'))
      .finally(() => setLoading(false));
  }, [id]);

  const totalScore = evaluation?.total_score ?? 0;
  const stats = getDerivedStats(totalScore);

  const radarData = evaluation ? [
    { subject: 'Code Quality', score: evaluation.code_quality_score || 0 },
    { subject: 'Documentation', score: evaluation.documentation_score || 0 },
    { subject: 'Alignment', score: evaluation.report_alignment_score || 0 },
    { subject: 'Originality', score: evaluation.plagiarism_score || 0 },
    { subject: 'Authenticity', score: evaluation.ai_code_score || 0 },
  ] : [];

  const barData = evaluation ? [
    { name: 'Code', score: evaluation.code_quality_score || 0, fill: '#3b82f6' },
    { name: 'Docs', score: evaluation.documentation_score || 0, fill: '#10b981' },
    { name: 'Align', score: evaluation.report_alignment_score || 0, fill: '#f59e0b' },
    { name: 'Plag', score: evaluation.plagiarism_score || 0, fill: '#ef4444' },
    { name: 'Auth', score: evaluation.ai_code_score || 0, fill: '#8b5cf6' },
  ] : [];

  const scoreBadge = !loading && !error && (
    <div className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
      Grade: {stats.grade} — {stats.interpretation}
    </div>
  );

  return (
    <LayerPageShell
      title="Comprehensive Scorer"
      subtitle="Aggregate performance index across all evaluation dimensions"
      icon={ChartBarSquareIcon}
      iconColor="bg-indigo-600"
      scoreBadge={scoreBadge}
      evaluationId={id}
      loading={loading}
      error={error}
    >
      {evaluation && (
        <div className="space-y-8">
          {/* Hero Score Card */}
          <div className="bg-gray-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-4">Aggregate Performance Index</p>
                <div className="flex items-baseline gap-4">
                  <span className="text-[8rem] font-black leading-none tracking-tighter text-blue-500">
                    {Math.round(totalScore)}
                  </span>
                  <span className="text-3xl font-bold text-gray-600">/100</span>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-3xl rounded-[2rem] p-8 border border-white/10 flex flex-col items-center justify-center min-w-[130px]">
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Grade</span>
                <span className="text-5xl font-black text-white">{stats.grade}</span>
              </div>
            </div>
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-white/5 mt-8">
              {[
                { label: 'Interpretation', value: stats.interpretation, color: 'text-gray-300' },
                { label: 'Global Rank', value: stats.rank, color: 'text-blue-400' },
                { label: 'Integrity', value: evaluation.plagiarism_detected ? 'High Risk' : 'Secure', color: evaluation.plagiarism_detected ? 'text-red-500' : 'text-green-500' },
                { label: 'Model', value: 'ASPES-v2.0', color: 'text-gray-500' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{label}</p>
                  <p className={`text-base font-bold mt-1 ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="absolute -right-20 -bottom-20 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -left-20 -top-20 w-[250px] h-[250px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Radar */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-2">Logical Footprint</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 font-medium mb-6">Multi-modal mapping across structural dimensions</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke={isDark ? '#334155' : '#E5E7EB'} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 10, fontWeight: 900 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} axisLine={false} tick={false} />
                    <Radar name="Score" dataKey="score" stroke="#6366f1" strokeWidth={3} fill="#6366f1" fillOpacity={0.15} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderRadius: '12px', border: isDark ? '1px solid #1E293B' : 'none' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-2">Weighted Contributions</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 font-medium mb-6">How each sub-engine impacted the final score</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="10 10" vertical={false} stroke={isDark ? '#334155' : '#F1F5F9'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: isDark ? '#94A3B8' : '#64748B' }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderRadius: '12px', border: isDark ? '1px solid #1E293B' : 'none' }} />
                    <Bar dataKey="score" radius={[10, 10, 10, 10]} barSize={36}>
                      {barData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sub-score cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Source Integrity', score: evaluation.plagiarism_score, color: 'rose' },
              { label: 'Code Craft', score: evaluation.code_quality_score, color: 'blue' },
              { label: 'Documentation', score: evaluation.documentation_score, color: 'emerald' },
              { label: 'AI Discretion', score: evaluation.ai_code_score, color: 'indigo' },
            ].map((m, i) => (
              <div key={i} className={`bg-${m.color}-50 dark:bg-${m.color}-900/10 border border-${m.color}-100 dark:border-${m.color}-500/20 rounded-2xl p-5 text-center`}>
                <p className={`text-[10px] font-black uppercase tracking-widest text-${m.color}-400 mb-2`}>{m.label}</p>
                <p className={`text-2xl font-black text-${m.color}-600 dark:text-${m.color}-400`}>{Math.round(m.score || 0)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </LayerPageShell>
  );
};

export default ComprehensiveScorerPage;
