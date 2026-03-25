import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

const PriorityBadge = ({ priority }) => {
  const colors = {
    CRITICAL: 'bg-rose-600',
    HIGH: 'bg-amber-500',
    MEDIUM: 'bg-blue-500',
    LOW: 'bg-gray-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg ${colors[priority] || colors.LOW} text-white text-[8px] font-black uppercase tracking-widest`}>
      {priority}
    </span>
  );
};

const FeedbackGeneratorPage = () => {
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

  const feedback = evaluation?.ai_feedback || 'Synthesizing descriptive feedback…';
  const feedResult = evaluation?.feedback_result || {};

  const strengths = feedResult.strengths || ['Modular Design', 'Error Handling', 'Type Safety'];
  const improvements = feedResult.improvements || ['Expand PDF Documentation', 'Refactor Helper Logic', 'Security Hardening'];
  const actions = feedResult.action_items || [
    { act: 'Fix similarity overlap', priority: 'CRITICAL' },
    { act: 'Correct Alignment', priority: 'HIGH' },
  ];

  return (
    <LayerPageShell
      title="Feedback Generator"
      subtitle="AI-generated actionable narrative feedback and improvement roadmap"
      icon={ChatBubbleLeftRightIcon}
      iconColor="bg-amber-500"
      evaluationId={id}
      loading={loading}
      error={error}
    >
      {evaluation && (
        <div className="space-y-8">
          {/* Narrative */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-4">AI Narrative</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 font-medium leading-relaxed">{feedback}</p>
          </div>

          {/* Strengths + Improvements grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-8">
              <h3 className="font-black text-emerald-900 dark:text-emerald-300 text-xs uppercase tracking-[0.2em] mb-5">
                Core Strengths
              </h3>
              <ul className="space-y-3">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-emerald-800 dark:text-emerald-300 bg-white/60 dark:bg-slate-900/40 p-3 rounded-2xl">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-3xl p-8">
              <h3 className="font-black text-blue-900 dark:text-blue-300 text-xs uppercase tracking-[0.2em] mb-5">
                Optimization Required
              </h3>
              <div className="space-y-3">
                {improvements.map((imp, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-blue-100 dark:border-blue-500/20 rounded-2xl bg-white/60 dark:bg-slate-900/40 hover:border-blue-300 dark:hover:border-blue-400/40 transition-colors">
                    <input type="checkbox" readOnly className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 bg-transparent" />
                    <span className="text-sm font-bold text-blue-800 dark:text-blue-300">{imp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-6">Immediate Actions</h2>
            <div className="space-y-3">
              {actions.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl group">
                  <PriorityBadge priority={item.priority || 'MEDIUM'} />
                  <span className="text-sm font-bold text-gray-800 dark:text-slate-300 flex-1">{item.act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Faculty Override Note */}
          {evaluation.is_finalized && evaluation.professor_feedback && (
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
              <h3 className="text-base font-black mb-4 uppercase tracking-widest opacity-80">Faculty Addendum</h3>
              <p className="text-sm font-medium leading-relaxed italic bg-white/10 rounded-2xl p-5 border border-white/10">
                &quot;{evaluation.professor_feedback}&quot;
              </p>
            </div>
          )}
        </div>
      )}
    </LayerPageShell>
  );
};

export default FeedbackGeneratorPage;
