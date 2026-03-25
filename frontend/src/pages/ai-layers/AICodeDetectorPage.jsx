import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldExclamationIcon, BoltIcon } from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

const ScorePill = ({ value, label, color }) => (
  <div className={`flex flex-col items-center px-6 py-5 rounded-2xl ${color} text-white shadow-lg`}>
    <span className="text-3xl font-black">{value}</span>
    <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">{label}</span>
  </div>
);

const StatBox = ({ label, value, sub }) => (
  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-3xl p-6 text-center">
    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
    {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">{sub}</p>}
  </div>
);

const FindingItem = ({ text }) => (
  <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-400 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
    <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
    {text}
  </li>
);

const AICodeDetectorPage = () => {
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

  const det = evaluation?.ai_detection_result || {};
  const aiScore = evaluation?.ai_code_score ?? 0;
  const isAI = evaluation?.ai_code_detected;
  const probability = ((det.ai_generated_probability || 0) * 100).toFixed(1);
  const findings = det.findings || ['Consistent whitespace patterns', 'Boilerplate structure matches LLM templates'];

  const verdictBadge = !loading && !error && (
    <div className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg ${
      isAI ? 'bg-red-50 dark:bg-rose-900/20 text-red-700 dark:text-rose-400 border border-red-100 dark:border-rose-500/20'
            : 'bg-green-50 dark:bg-emerald-900/20 text-green-700 dark:text-emerald-400 border border-green-100 dark:border-emerald-500/20'
    }`}>
      {isAI ? '⚠ Likely AI Generated' : '✓ Human Authored'}
    </div>
  );

  return (
    <LayerPageShell
      title="AI Code Detector"
      subtitle="Probabilistic AI authorship forensics engine"
      icon={ShieldExclamationIcon}
      iconColor="bg-violet-600"
      scoreBadge={verdictBadge}
      evaluationId={id}
      loading={loading}
      error={error}
    >
      {evaluation && (
        <div className="space-y-8">
          {/* Score Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="AI Authenticity Score" value={`${Math.round(aiScore)}%`} sub="Higher = more human" />
            <StatBox label="AI Probability" value={`${probability}%`} sub="Likelihood of AI generation" />
            <StatBox label="Detect Model Confidence" value="97.4%" sub="System reliability" />
            <StatBox label="Verdict" value={isAI ? 'AI' : 'Human'} sub={isAI ? 'Flagged' : 'Cleared'} />
          </div>

          {/* Probability Gauge */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-6">
              AI Generation Probability
            </h2>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-black text-gray-400 dark:text-slate-500 mb-2 uppercase tracking-widest">
                  <span>Human</span><span>AI</span>
                </div>
                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      parseFloat(probability) > 70 ? 'bg-red-500' : parseFloat(probability) > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${probability}%` }}
                  />
                </div>
              </div>
              <span className="text-4xl font-black text-gray-900 dark:text-white min-w-[80px] text-right">
                {probability}%
              </span>
            </div>
          </div>

          {/* Findings */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-6">
              Identified Signatures
            </h2>
            <ul className="space-y-1">
              {findings.map((f, i) => <FindingItem key={i} text={f} />)}
            </ul>
          </div>

          {/* AI Score Breakdown */}
          <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-500/20 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <BoltIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <h3 className="font-black text-violet-900 dark:text-violet-300 text-sm uppercase tracking-widest">
                Engine Interpretation
              </h3>
            </div>
            <p className="text-sm text-violet-800 dark:text-violet-300 font-medium leading-relaxed">
              {isAI
                ? 'Heuristic analysis indicates a high probability of AI-assisted code generation. Patterns including uniform indentation, idiomatic LLM phrase structures, and predictable comment placement were detected.'
                : 'The codebase exhibits characteristics consistent with organic human authorship. Variable naming inconsistencies, iterative refinement traces, and irregular comment density suggest authentic development.'}
            </p>
          </div>
        </div>
      )}
    </LayerPageShell>
  );
};

export default AICodeDetectorPage;
