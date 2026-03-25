import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { evaluationService } from '../../services/evaluationService';
import { LAYERS } from '../AILayer/LayerNavTabs';
import { ArrowLeftIcon, CpuChipIcon } from '@heroicons/react/24/outline';

const colorStyles = {
  violet: 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-500/20 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:border-violet-600 group-hover:text-white',
  blue: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white',
  amber: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:text-white',
  rose: 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:border-rose-600 group-hover:text-white',
  cyan: 'bg-cyan-50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-600 group-hover:border-cyan-600 group-hover:text-white'
};

const layerDescriptions = {
  'code-detector': 'Detect AI-generated code snippets using probabilistic forensics.',
  'code-analyzer': 'Evaluate code quality, modularity, and structural maintainability.',
  'scorer': 'View comprehensive performance metrics and final automated grading.',
  'doc-evaluator': 'Assess documentation coherence, technical completeness, and clarity.',
  'feedback': 'Produce actionable, natural-language feedback and improvements.',
  'plagiarism': 'Check cross-submission integrity to ensure full originality.',
  'report-aligner': 'Verify that implementations strictly align with report objectives.',
};

const AILayerSelection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    evaluationService.getEvaluation(id)
      .then(data => setEvaluation(data))
      .catch(err => console.error('Failed to load evaluation', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] animate-pulse">
        <CpuChipIcon className="w-12 h-12 text-indigo-500 mb-4 animate-bounce" />
        <p className="mt-4 text-gray-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">Initializing AI Engine Matrix...</p>
      </div>
    );
  }

  if (!evaluation) {
    return <div className="p-10 text-center text-rose-500 font-bold">Evaluation not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10 space-y-10 animate-fade-in pb-20">
      
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors"
        >
          <ArrowLeftIcon className="w-3 h-3 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
          Select AI <span className="text-indigo-600 dark:text-indigo-400">Analysis Layer</span>
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 leading-relaxed px-4">
          Your project <strong className="text-gray-700 dark:text-slate-300">&quot;{evaluation.project?.title || 'Unknown Project'}&quot;</strong> has been successfully processed. 
          Choose a specific AI sub-engine below to visualize the results of the evaluation.
        </p>
      </div>

      {/* Grid of Layers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
        {LAYERS.map(layer => {
          const Icon = layer.icon;
          return (
            <Link
              key={layer.segment}
              to={`/evaluations/${id}/${layer.segment}`}
              className="group bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all hover:-translate-y-1 flex flex-col justify-between min-h-[220px] overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors duration-300 drop-shadow-sm mb-6 ${colorStyles[layer.color]}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">
                  {layer.label}
                </h3>
                <p className="mt-3 text-xs font-medium text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {layerDescriptions[layer.segment]}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-gray-50 dark:border-slate-800/50 pt-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">View Data</span>
                <div className="w-6 h-6 rounded-full bg-gray-50 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 flex items-center justify-center transition-colors">
                  <svg className="w-3 h-3 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
    </div>
  );
};

export default AILayerSelection;
