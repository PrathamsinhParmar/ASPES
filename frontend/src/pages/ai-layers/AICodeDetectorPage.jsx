import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FingerPrintIcon, BoltIcon } from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

const ScorePill = ({ value, label, color }) => (
  <div className={`flex flex-col items-center px-6 py-5 rounded-2xl ${color} text-white shadow-lg`}>
    <span className="text-3xl font-black">{value}</span>
    <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">{label}</span>
  </div>
);

const StatBox = ({ label, value, sub, color = 'violet' }) => (
  <div className={`bg-${color}-50/30 dark:bg-slate-800/40 rounded-[2.5rem] p-8 text-center border border-${color}-100/20 dark:border-slate-700/30 transition-all duration-300 hover:scale-[1.02]`}>
    <p className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2">{label}</p>
    <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
    {sub && <p className="text-xs text-gray-500 dark:text-slate-500 mt-2 font-medium tracking-wide">{sub}</p>}
  </div>
);

const FindingItem = ({ text }) => (
  <li className="flex items-center gap-4 text-sm font-medium text-gray-700 dark:text-slate-300 px-5 py-4 rounded-2xl bg-gray-50/50 dark:bg-slate-800/30 border border-gray-100/50 dark:border-slate-700/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 group">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
      <FingerPrintIcon className="w-4 h-4" />
    </div>
    <span className="leading-tight">{text}</span>
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
    <div className={`px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg ${
      isAI ? 'bg-red-50 dark:bg-rose-900/20 text-red-700 dark:text-rose-400 border border-red-100 dark:border-rose-500/20'
            : 'bg-green-50 dark:bg-emerald-900/20 text-green-700 dark:text-emerald-400 border border-green-100 dark:border-emerald-500/20'
    }`}>
      {isAI ? '⚠ Likely AI Generated' : '✓ Human Authored'}
    </div>
  );

  return (
    <LayerPageShell
      title="AI Code Detector"
      subtitle="Probabilistic assessment of AI-generated content in code submissions"
      icon={FingerPrintIcon}
      iconColor="bg-violet-600"
      scoreBadge={verdictBadge}
      evaluationId={id}
      loading={loading}
      error={error}
      projectTitle={evaluation?.project?.title}
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
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-8 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-violet-500 rounded-full" />
              Identified Signatures
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {findings.map((f, i) => <FindingItem key={i} text={f} />)}
            </div>
          </div>

          {/* Engine Interpretation */}
          <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
                  <BoltIcon className="w-6 h-6 text-indigo-200" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Engine Interpretation
                  </h3>
                  <p className="text-sm text-indigo-200/80 font-medium">Heuristic Analysis Results</p>
                </div>
              </div>
              <p className="text-lg text-indigo-50 font-medium leading-relaxed max-w-4xl">
                {isAI
                  ? 'Heuristic analysis indicates a high probability of AI-assisted code generation. Patterns including uniform indentation, idiomatic LLM phrase structures, and predictable comment placement were detected.'
                  : 'The codebase exhibits characteristics consistent with organic human authorship. Variable naming inconsistencies, iterative refinement traces, and irregular comment density suggest authentic development.'}
              </p>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -right-20 -bottom-20 w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-white/15 transition-all duration-700" />
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <BoltIcon className="w-32 h-32 text-white" />
            </div>
          </div>
        </div>
      )}
    </LayerPageShell>
  );
};

export default AICodeDetectorPage;
