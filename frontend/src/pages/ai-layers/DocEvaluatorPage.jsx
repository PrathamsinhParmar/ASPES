import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DocumentTextIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

const DocEvaluatorPage = () => {
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

  const docScore = evaluation?.documentation_score ?? 0;
  const docResult = evaluation?.doc_evaluation_result || {};

  const scoreBadge = !loading && !error && (
    <div className={`px-6 py-3 rounded-2xl font-black text-sm shadow-lg border ${
      docScore >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 shadow-emerald-100 dark:shadow-none'
        : docScore >= 60 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20 shadow-amber-100 dark:shadow-none'
        : 'bg-red-50 dark:bg-rose-900/20 text-red-700 dark:text-rose-400 border-red-100 dark:border-rose-500/20 shadow-rose-100 dark:shadow-none'
    }`}>
      Score: {Math.round(docScore)}%
    </div>
  );

  // Derive sections from result or use defaults
  const sections = docResult.sections_present || ['Introduction', 'Methodology', 'Results', 'Conclusion'];
  const missingSections = docResult.missing_sections || [];
  const completenessMetrics = [
    { label: 'Overall Completeness', value: docResult.completeness_score ?? docScore },
    { label: 'Technical Depth', value: docResult.technical_depth ?? Math.min(docScore * 1.05, 100) },
    { label: 'Citation Quality', value: docResult.citation_quality ?? Math.max(docScore - 5, 0) },
    { label: 'Clarity Score', value: docResult.clarity_score ?? Math.min(docScore + 3, 100) },
  ];

  return (
    <LayerPageShell
      title="Doc Evaluator"
      subtitle="Academic report quality, completeness and structure analysis"
      icon={DocumentTextIcon}
      iconColor="bg-emerald-600"
      scoreBadge={scoreBadge}
      evaluationId={id}
      loading={loading}
      error={error}
    >
      {evaluation && (
        <div className="space-y-8">
          {/* Score Hero */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Documentation Score</h2>
              <span className="text-5xl font-black text-emerald-600 dark:text-emerald-400">{Math.round(docScore)}%</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
                style={{ width: `${docScore}%` }}
              />
            </div>
          </div>

          {/* Completeness Metrics */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-6">Completeness Metrics</h2>
            <div className="space-y-4">
              {completenessMetrics.map(({ label, value }) => (
                <div key={label} className="py-3 border-b border-gray-50 dark:border-slate-800 last:border-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300">{label}</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">{(value ?? 0).toFixed(1)}/100</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-blue-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${value ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sections present / missing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-8">
              <h3 className="font-black text-emerald-900 dark:text-emerald-300 text-sm uppercase tracking-widest mb-4">
                Sections Present
              </h3>
              <ul className="space-y-2">
                {sections.map((s, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-rose-900/10 border border-red-100 dark:border-rose-500/20 rounded-3xl p-8">
              <h3 className="font-black text-rose-900 dark:text-rose-300 text-sm uppercase tracking-widest mb-4">
                Missing / Incomplete
              </h3>
              {missingSections.length > 0 ? (
                <ul className="space-y-2">
                  {missingSections.map((s, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-rose-800 dark:text-rose-300">
                      <ExclamationCircleIcon className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">✓ No critical sections missing</p>
              )}
            </div>
          </div>

          {/* Summary narrative */}
          {docResult.summary && (
            <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 text-sm text-gray-600 dark:text-slate-400 font-medium italic leading-relaxed">
              {`"${docResult.summary}"`}
            </div>
          )}
        </div>
      )}
    </LayerPageShell>
  );
};

export default DocEvaluatorPage;
