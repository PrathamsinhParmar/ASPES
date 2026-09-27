import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

const statusBadgeStyles = {
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  reviewed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'revision requested': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  rejected: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  'feedback provided': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
};

const EvaluationAlertModal = () => {
  const { activeEvaluationAlert, dismissEvaluationAlert } = useNotifications();
  const navigate = useNavigate();

  if (!activeEvaluationAlert) return null;

  const notif = activeEvaluationAlert;
  const meta = notif.metadata_json || {};
  const statusKey = (meta.evaluation_status || 'reviewed').toLowerCase();
  const badgeClass = statusBadgeStyles[statusKey] || statusBadgeStyles.reviewed;

  const handleViewEvaluation = () => {
    dismissEvaluationAlert();
    if (notif.related_project_id) {
      navigate(`/projects/${notif.related_project_id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300 font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
          <button
            onClick={dismissEvaluationAlert}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <ClipboardDocumentCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-blue-100 bg-white/10 px-2.5 py-0.5 rounded-full">
                Instant Faculty Alert
              </span>
              <h3 className="text-xl font-bold mt-1 text-white">Project Evaluation Updated</h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status & Project Title */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project</p>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {meta.project_title || notif.title}
              </h4>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border capitalize ${badgeClass}`}>
              {meta.evaluation_status || 'Reviewed'}
            </span>
          </div>

          {/* Evaluator & Timestamp */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Faculty: </span>
              {meta.faculty_name || notif.sender_name || 'Assigned Professor'}
            </div>
            <div>{meta.reviewed_at_str || new Date(notif.created_at).toLocaleString()}</div>
          </div>

          {/* Score metrics if available */}
          {meta.score !== null && meta.score !== undefined && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Total Assessment Score
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {meta.score} <span className="text-sm font-semibold text-slate-400">/ 100</span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shadow-indigo-500/20">
                  {meta.score >= 90 ? 'A+' : meta.score >= 80 ? 'A' : meta.score >= 70 ? 'B' : meta.score >= 60 ? 'C' : 'D'}
                </div>
              </div>

              {/* Sub metrics breakdown */}
              {meta.metrics && (
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-indigo-200/50 dark:border-indigo-800/40 text-xs">
                  {meta.metrics.code_quality !== null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Code Quality:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{meta.metrics.code_quality}%</span>
                    </div>
                  )}
                  {meta.metrics.documentation !== null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Documentation:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{meta.metrics.documentation}%</span>
                    </div>
                  )}
                  {meta.metrics.plagiarism !== null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Originality:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{meta.metrics.plagiarism}%</span>
                    </div>
                  )}
                  {meta.metrics.report_alignment !== null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Report Alignment:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{meta.metrics.report_alignment}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Detailed Faculty Feedback */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <SparklesIcon className="w-4 h-4 text-indigo-500" /> Faculty Feedback & Remarks
            </h5>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed">
              &ldquo;{meta.feedback || notif.message}&rdquo;
            </div>
          </div>

          {/* Admin Notation / Platform update note */}
          {meta.admin_notation && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <InformationCircleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Institutional Note: </span>
                {meta.admin_notation}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={dismissEvaluationAlert}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Acknowledge & Close
          </button>
          <button
            onClick={handleViewEvaluation}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 hover:-translate-y-0.5 transition-all"
          >
            <span>View Full Project</span>
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationAlertModal;

