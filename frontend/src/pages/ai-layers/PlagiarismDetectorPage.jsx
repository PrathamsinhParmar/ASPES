import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MagnifyingGlassIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

const PlagiarismDetectorPage = () => {
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

  const plagScore = evaluation?.plagiarism_score ?? 0;
  const isDetected = evaluation?.plagiarism_detected;
  const result = evaluation?.plagiarism_result || {};
  const maxSimilarity = result.max_similarity_percent ?? 0;
  const similarSections = result.similar_sections || [];

  const verdict = isDetected ? 'RISK DETECTED' : 'ORIGINAL CONTENT';

  const scoreBadge = !loading && !error && (
    <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm shadow-lg border ${
      isDetected ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-500/20 shadow-rose-100 dark:shadow-none'
                 : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 shadow-emerald-100 dark:shadow-none'
    }`}>
      {isDetected
        ? <ExclamationTriangleIcon className="w-5 h-5" />
        : <ShieldCheckIcon className="w-5 h-5" />
      }
      {verdict}
    </div>
  );

  return (
    <LayerPageShell
      title="Plagiarism Detector"
      subtitle="Cross-submission source integrity and similarity analysis"
      icon={MagnifyingGlassIcon}
      iconColor="bg-rose-600"
      scoreBadge={scoreBadge}
      evaluationId={id}
      loading={loading}
      error={error}
    >
      {evaluation && (
        <div className="space-y-8">
          {/* Key Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Source Integrity Score', value: `${Math.round(plagScore)}%`, colorClass: plagScore >= 80 ? 'text-emerald-500' : 'text-rose-500' },
              { label: 'Max Similarity', value: `${maxSimilarity}%`, colorClass: maxSimilarity > 30 ? 'text-rose-500' : 'text-emerald-500' },
              { label: 'Sections Flagged', value: similarSections.length },
              { label: 'Overall Verdict', value: isDetected ? 'Flagged' : 'Clear', colorClass: isDetected ? 'text-rose-500' : 'text-emerald-500' },
            ].map(({ label, value, colorClass }) => (
              <div key={label} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 text-center shadow-sm">
                <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">{label}</p>
                <p className={`text-2xl font-black ${colorClass || 'text-gray-900 dark:text-white'}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Similarity Gauge */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-6">
              Cross-Submission Similarity
            </h2>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-black text-gray-400 dark:text-slate-500 mb-2 uppercase tracking-widest">
                  <span>0% — Original</span><span>100% — Copied</span>
                </div>
                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      maxSimilarity > 60 ? 'bg-red-500' : maxSimilarity > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(maxSimilarity, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mt-2 font-medium">
                  <span>Safe zone (&lt;15%)</span>
                  <span>Warning zone (15–30%)</span>
                  <span>Risk zone (&gt;30%)</span>
                </div>
              </div>
              <span className="text-4xl font-black text-gray-900 dark:text-white min-w-[80px] text-right">{maxSimilarity}%</span>
            </div>
          </div>

          {/* Flagged Sections */}
          {similarSections.length > 0 ? (
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-500/20 rounded-3xl p-8">
              <h2 className="text-lg font-black text-rose-900 dark:text-rose-300 tracking-tight mb-6">
                Matching Logic Blocks ({similarSections.length})
              </h2>
              <div className="space-y-4">
                {similarSections.map((section, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-rose-100 dark:border-rose-500/20 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-rose-700 dark:text-rose-400">Module Partition {idx + 1}</p>
                      {section.description && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{section.description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-2xl font-black ${section.similarity_score > 50 ? 'text-red-600' : 'text-amber-600'}`}>
                        {section.similarity_score}%
                      </p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">overlap</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-8 text-center">
              <ShieldCheckIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-300">No Matching Sections Found</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium mt-2">
                The submitted code shows no significant overlap with other submissions in the database.
              </p>
            </div>
          )}

          {/* Interpretation */}
          <div className={`rounded-2xl p-6 text-sm font-medium leading-relaxed border ${
            isDetected
              ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-500/20 text-rose-800 dark:text-rose-300'
              : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700 text-gray-600 dark:text-slate-400'
          }`}>
            {isDetected
              ? 'The plagiarism detection engine has identified sections with significant similarity to other submissions. Faculty review is strongly recommended before finalizing the grade.'
              : 'The submission demonstrates strong source originality. No significant cross-submission similarities were detected within the indexed project database.'}
          </div>
        </div>
      )}
    </LayerPageShell>
  );
};

export default PlagiarismDetectorPage;
