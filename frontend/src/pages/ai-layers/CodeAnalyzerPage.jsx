import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CommandLineIcon } from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

const MetricBar = ({ label, value }) => (
  <div className="py-4 border-b border-gray-50 dark:border-slate-800 last:border-0">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-bold text-gray-700 dark:text-slate-300">{label}</span>
      <span className="text-sm font-black text-gray-900 dark:text-white">{value?.toFixed(1) ?? '—'}/100</span>
    </div>
    <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${
          value >= 90 ? 'bg-indigo-500' : value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-blue-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500'
        }`}
        style={{ width: `${value ?? 0}%` }}
      />
    </div>
  </div>
);

const InfoCard = ({ label, value, colorClass }) => (
  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-5 text-center">
    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-2xl font-black ${colorClass || 'text-gray-900 dark:text-white'}`}>{value}</p>
  </div>
);

const CodeAnalyzerPage = () => {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    evaluationService.getEvaluation(id)
      .then(setEvaluation)
      .catch(err => setError(err.response?.data?.detail || 'Failed to load evaluation'))
      .finally(() => setLoading(false));
  }, [id]);

  const result = evaluation?.code_analysis_result || {};
  const qualityScore = evaluation?.code_quality_score ?? 0;

  const scoreBadge = !loading && !error && (
    <div className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
      <CommandLineIcon className="w-5 h-5" />
      <span className="font-black text-sm">{Math.round(qualityScore)}% Quality</span>
    </div>
  );

  return (
    <LayerPageShell
      title="Code Analyzer"
      subtitle="Structural quality, maintainability and complexity assessment"
      icon={CommandLineIcon}
      iconColor="bg-blue-600"
      scoreBadge={scoreBadge}
      evaluationId={id}
      loading={loading}
      error={error}
    >
      {evaluation && (
        <div className="space-y-8">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoCard label="Code Quality Score" value={`${Math.round(qualityScore)}%`} colorClass="text-blue-600 dark:text-blue-400" />
            <InfoCard label="Modularity" value={`${(result.clean_code_score ?? 0).toFixed(1)}`} />
            <InfoCard label="Maintainability" value={`${(result.maintainability_index ?? 0).toFixed(1)}`} />
            <InfoCard label="Complexity" value={`${(result.complexity_score ?? 0).toFixed(1)}`} />
          </div>

          {/* Detailed Metric Bars */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-6">
              Metric Breakdown
            </h2>
            <div className="space-y-1">
              <MetricBar label="Structural Modularity (Clean Code)" value={result.clean_code_score} />
              <MetricBar label="Maintainability Index" value={result.maintainability_index} />
              <MetricBar label="Cognitive Complexity (inverse)" value={result.complexity_score} />
            </div>
          </div>

          {/* What each metric means */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Structural Modularity',
                color: 'blue',
                desc: 'Measures how well the code is broken into independent, reusable modules following clean code principles such as single responsibility and DRY.',
              },
              {
                title: 'Maintainability Index',
                color: 'emerald',
                desc: 'A composite metric evaluating how easy the codebase is to understand, modify, and extend over time. Higher values indicate more maintainable code.',
              },
              {
                title: 'Cognitive Complexity',
                color: 'amber',
                desc: 'Measures the mental effort required to understand the control flow. Score shown here is inversed — higher means lower actual complexity.',
              },
            ].map((card) => (
              <div key={card.title} className={`bg-${card.color}-50 dark:bg-${card.color}-900/10 border border-${card.color}-100 dark:border-${card.color}-500/20 rounded-2xl p-6`}>
                <h3 className={`font-black text-${card.color}-900 dark:text-${card.color}-300 text-sm mb-3`}>{card.title}</h3>
                <p className={`text-xs text-${card.color}-800 dark:text-${card.color}-300/70 font-medium leading-relaxed`}>{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 italic text-sm text-gray-600 dark:text-slate-400 font-medium">
            &quot;The project structure follows SOLID principles with highly decoupled modules.&quot;
          </div>
        </div>
      )}
    </LayerPageShell>
  );
};

export default CodeAnalyzerPage;
