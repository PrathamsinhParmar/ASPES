import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BoltIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import LayerPageShell from '../../components/AILayer/LayerPageShell';
import { evaluationService } from '../../services/evaluationService';

// ── Priority badge ────────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const map = {
    CRITICAL: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
    HIGH: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    MEDIUM: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
    LOW: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
  };
  const c = map[priority] || map.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {priority}
    </span>
  );
};

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, color = 'text-gray-900 dark:text-white', iconBg = 'bg-gray-100 dark:bg-slate-800' }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className={`p-2 rounded-xl ${iconBg}`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <h2 className={`text-base font-bold uppercase tracking-[0.15em] ${color}`}>{title}</h2>
  </div>
);

// ── Card wrapper ──────────────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm ${className}`}>
    {children}
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
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

  // Pull data from structured_feedback (LLM output) or fall back to ai_feedback (narrative string)
  const sf = evaluation?.structured_feedback || {};
  const rawNarrative = evaluation?.ai_feedback || '';

  const execSummary = sf.executive_summary?.overall_assessment || null;
  const strengths = sf.strengths || [];
  const improvements = sf.areas_for_improvement || [];
  const actions = sf.actionable_recommendations || [];
  const codeQualityFb = sf.code_quality_feedback || null;
  const docFb = sf.documentation_feedback || null;
  const originFb = sf.originality_feedback || null;
  const instructorNotes = sf.instructor_notes || null;

  // If we have structured data, prefer it; otherwise fall back to raw markdown narrative
  const hasStructured = sf && Object.keys(sf).length > 0 && (strengths.length || improvements.length || execSummary);

  return (
    <LayerPageShell
      title="Feedback Generator"
      subtitle="AI-curated improvement suggestions and technical insights"
      icon={ChatBubbleLeftRightIcon}
      iconColor="bg-teal-600"
      evaluationId={id}
      loading={loading}
      error={error}
      projectTitle={evaluation?.project?.title}
    >
      {evaluation && (
        <div className="space-y-8">

          {hasStructured ? (
            /* ──────────── STRUCTURED LLM FEEDBACK ──────────── */
            <>
              {/* 1. Executive Summary */}
              {execSummary && (
                <Card>
                  <SectionHeader
                    icon={SparklesIcon}
                    title="Overall Assessment"
                    color="text-indigo-600 dark:text-indigo-400"
                    iconBg="bg-indigo-50 dark:bg-indigo-900/30"
                  />
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed font-medium">
                    {execSummary}
                  </p>
                  {sf.executive_summary?.grade_justification && (
                    <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 leading-relaxed italic border-l-4 border-indigo-200 dark:border-indigo-700 pl-4">
                      {sf.executive_summary.grade_justification}
                    </p>
                  )}
                </Card>
              )}

              {/* 2. Strengths + Improvements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card className="border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-900/10 dark:to-slate-900">
                  <SectionHeader
                    icon={CheckCircleIcon}
                    title="Core Strengths"
                    color="text-emerald-700 dark:text-emerald-400"
                    iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                  />
                  {strengths.length > 0 ? (
                    <ul className="space-y-3">
                      {strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                          <CheckCircleIcon className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm italic text-gray-400 dark:text-slate-500">No core strengths identified.</p>
                  )}
                </Card>

                {/* Areas for Improvement */}
                <Card className="border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/60 to-white dark:from-blue-900/10 dark:to-slate-900">
                  <SectionHeader
                    icon={LightBulbIcon}
                    title="Areas for Improvement"
                    color="text-blue-700 dark:text-blue-400"
                    iconBg="bg-blue-100 dark:bg-blue-900/30"
                  />
                  {improvements.length > 0 ? (
                    <ul className="space-y-3">
                      {improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                          <div className="w-4 h-4 rounded-full border-2 border-blue-400 dark:border-blue-500 flex-shrink-0 mt-0.5" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm italic text-gray-400 dark:text-slate-500">No improvements flagged.</p>
                  )}
                </Card>
              </div>

              {/* 3. Actionable Recommendations */}
              {actions.length > 0 && (
                <Card>
                  <SectionHeader
                    icon={BoltIcon}
                    title="Actionable Recommendations"
                    color="text-rose-600 dark:text-rose-400"
                    iconBg="bg-rose-50 dark:bg-rose-900/30"
                  />
                  <div className="space-y-4">
                    {actions.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <PriorityBadge priority={item.priority || 'MEDIUM'} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 leading-snug">
                            {item.action || item.act}
                          </p>
                          {item.rationale && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{item.rationale}</p>
                          )}
                        </div>
                        {item.estimated_hours && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 flex-shrink-0">
                            <ClockIcon className="w-3.5 h-3.5" />
                            <span>{item.estimated_hours}h</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 4. Section-wise deep feedback row */}
              {(codeQualityFb || docFb || originFb) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {codeQualityFb && (
                    <Card className="col-span-1">
                      <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-3">Code Quality</h3>
                      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{codeQualityFb.summary || codeQualityFb.overall || ''}</p>
                      {Array.isArray(codeQualityFb.issues) && codeQualityFb.issues.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {codeQualityFb.issues.slice(0, 5).map((issue, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-500 dark:text-slate-400">
                              <ExclamationCircleIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                              {typeof issue === 'string' ? issue : issue.description || JSON.stringify(issue)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  )}
                  {docFb && (
                    <Card className="col-span-1">
                      <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-3">Documentation</h3>
                      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{docFb.summary || docFb.overall || ''}</p>
                      {Array.isArray(docFb.missing_sections) && docFb.missing_sections.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {docFb.missing_sections.slice(0, 6).map((s, i) => (
                            <span key={i} className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </Card>
                  )}
                  {originFb && (
                    <Card className="col-span-1">
                      <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-3">Originality</h3>
                      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{originFb.summary || originFb.overall || ''}</p>
                    </Card>
                  )}
                </div>
              )}

              {/* 5. Instructor Notes (faculty only) */}
              {instructorNotes && (
                <Card className="border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-900/10">
                  <SectionHeader
                    icon={ShieldCheckIcon}
                    title="Instructor Notes"
                    color="text-amber-700 dark:text-amber-400"
                    iconBg="bg-amber-100 dark:bg-amber-900/30"
                  />
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    {typeof instructorNotes === 'string' ? instructorNotes : instructorNotes.summary || JSON.stringify(instructorNotes)}
                  </p>
                </Card>
              )}
            </>
          ) : (
            /* ──────────── RAW MARKDOWN NARRATIVE FALLBACK ──────────── */
            <Card>
              <SectionHeader
                icon={SparklesIcon}
                title="AI-Generated Feedback"
                color="text-indigo-600 dark:text-indigo-400"
                iconBg="bg-indigo-50 dark:bg-indigo-900/30"
              />
              {rawNarrative ? (
                <div className="prose prose-sm max-w-none
                  prose-headings:font-bold prose-headings:text-gray-800 dark:prose-headings:text-slate-100
                  prose-h2:text-base prose-h2:mt-6 prose-h2:mb-2 prose-h2:border-b prose-h2:border-gray-100 dark:prose-h2:border-slate-800 prose-h2:pb-1
                  prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-1 prose-h3:text-gray-700 dark:prose-h3:text-slate-300
                  prose-p:text-gray-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed prose-p:my-1.5
                  prose-li:text-gray-600 dark:prose-li:text-slate-400 prose-li:my-0.5
                  prose-ul:my-2 prose-ol:my-2 prose-ul:space-y-1
                  prose-strong:text-gray-800 dark:prose-strong:text-slate-200 prose-strong:font-semibold
                  prose-em:not-italic prose-em:text-gray-500
                  prose-blockquote:border-indigo-300 prose-blockquote:not-italic prose-blockquote:text-gray-500 dark:prose-blockquote:text-slate-400 prose-blockquote:bg-indigo-50/50 dark:prose-blockquote:bg-indigo-900/10 prose-blockquote:py-2 prose-blockquote:rounded-r-lg
                  prose-table:text-xs prose-th:text-gray-700 dark:prose-th:text-slate-300 prose-th:bg-gray-50 dark:prose-th:bg-slate-800 prose-th:font-semibold
                  prose-td:text-gray-600 dark:prose-td:text-slate-400
                  prose-hr:border-gray-100 dark:prose-hr:border-slate-800
                ">
                  <ReactMarkdown>{rawNarrative}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm italic text-gray-400 dark:text-slate-500">No feedback available yet. Re-run the evaluation to generate AI feedback.</p>
              )}
            </Card>
          )}

          {/* Faculty Override Note */}
          {evaluation.is_finalized && evaluation.professor_feedback && (
            <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheckIcon className="w-5 h-5" />
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] opacity-80">Faculty Addendum</h2>
              </div>
              <p className="text-sm font-medium leading-relaxed italic bg-white/10 rounded-2xl p-5 border border-white/10">
                &quot;{evaluation.professor_feedback}&quot;
              </p>
            </Card>
          )}

        </div>
      )}
    </LayerPageShell>
  );
};

export default FeedbackGeneratorPage;
