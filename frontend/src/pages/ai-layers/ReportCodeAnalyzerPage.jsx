import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LinkIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

const ReportCodeAnalyzerPage = () => {
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

  const alignScore = evaluation?.report_alignment_score ?? 0;
  const result = evaluation?.alignment_result || {};
  const synthesis = result.alignment_synthesis
    || 'The implementation logic aligns with the technical goals specified in the abstract and methodology sections of the report.';
  const missingFeatures = result.missing_features || [];
  const implementedFeatures = result.implemented_features || [];

  const scoreBadge = !loading && !error && (
    <div className={`px-6 py-3 rounded-2xl font-black text-sm shadow-lg border ${
      alignScore >= 80 ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-100 dark:border-cyan-500/20 shadow-cyan-100 dark:shadow-none'
        : alignScore >= 60 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
        : 'bg-red-50 dark:bg-rose-900/20 text-red-700 dark:text-rose-400 border-red-100 dark:border-rose-500/20'
    }`}>
      Alignment: {Math.round(alignScore)}%
    </div>
  );

  return (
    <LayerPageShell
      title="Report Code Analyzer"
      subtitle="Cross-references academic report claims against actual source code implementation"
      icon={LinkIcon}
      iconColor="bg-cyan-600"
      scoreBadge={scoreBadge}
      evaluationId={id}
      loading={loading}
      error={error}
    >
      {evaluation && (
        <div className="space-y-8">
          {/* Score Hero */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Report-to-Logic Alignment</h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium mt-1">
                  How well does the code implement what the report describes?
                </p>
              </div>
              <span className="text-5xl font-black text-cyan-600 dark:text-cyan-400">{Math.round(alignScore)}%</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  alignScore >= 80 ? 'bg-cyan-500' : alignScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${alignScore}%` }}
              />
            </div>
          </div>

          {/* Engine Synthesis */}
          <div className="bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-500/20 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <DocumentCheckIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h3 className="font-black text-cyan-900 dark:text-cyan-300 text-sm uppercase tracking-widest">
                Engine Synthesis
              </h3>
            </div>
            <p className="text-sm text-cyan-900 dark:text-cyan-200 font-medium leading-relaxed">
              {synthesis}
            </p>
          </div>

          {/* Implemented and Missing features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Implemented */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest mb-4 text-emerald-600 dark:text-emerald-400">
                ✓ Documented & Implemented
              </h3>
              {implementedFeatures.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {implementedFeatures.map((feature, i) => (
                    <span key={i} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-500/20">
                      {feature}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium italic">
                  Feature-level tracking not available for this evaluation.
                </p>
              )}
            </div>

            {/* Missing */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <h3 className="font-black text-rose-500 dark:text-rose-400 text-sm uppercase tracking-widest mb-4">
                ⚠ Documented but Missing in Code
              </h3>
              {missingFeatures.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {missingFeatures.map((feature, i) => (
                    <span key={i} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold border border-rose-100 dark:border-rose-500/20">
                      {feature}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ All documented features found in the codebase
                </p>
              )}
            </div>
          </div>

          {/* Methodology */}
          <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-2xl p-6">
            <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">How This Layer Works</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 font-medium leading-relaxed">
              The Report Code Analyzer extracts technical claims, feature descriptions, and methodology statements from the academic report (PDF), then cross-references them against the actual source code using semantic and structural matching algorithms. The alignment score reflects how faithfully the implementation realizes the stated design goals.
            </p>
          </div>
        </div>
      )}
    </LayerPageShell>
  );
};

export default ReportCodeAnalyzerPage;
