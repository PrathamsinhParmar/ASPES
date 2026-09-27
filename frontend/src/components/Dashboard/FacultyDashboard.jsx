import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { evaluationService } from '../../services/evaluationService';
import StatCard from './StatCard';
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckBadgeIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPanel from '../Notification/NotificationPanel';
import { format } from 'date-fns';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [facultyTab, setFacultyTab] = useState('queue'); // 'queue' | 'notifications'
  const [pendingEvaluations, setPendingEvaluations] = useState([]);
  const [recentEvaluations, setRecentEvaluations] = useState([]); // Placeholder for history
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashData();
  }, []);

  const fetchDashData = async () => {
    try {
      setLoading(true);
      const pending = await evaluationService.getPendingEvaluations();
      setPendingEvaluations(pending);
      // In a real app we might fetch finalized ones separately or filter.
      // For now, let's keep it simple.
    } catch (error) {
      console.error('Failed to fetch evaluation pending list:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgScore = () => {
    if (pendingEvaluations.length === 0) return 0;
    const total = pendingEvaluations.reduce((acc, curr) => acc + (curr.total_score || 0), 0);
    return Math.round(total / pendingEvaluations.length);
  };

  const stats = {
    pending: pendingEvaluations.length,
    highRisk: pendingEvaluations.filter(e => e.plagiarism_detected || e.ai_code_detected).length,
    avgIncomingScore: calculateAvgScore(),
  };

  if (loading) {
    return <div className="p-6 flex justify-center items-center h-full"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>;
  }

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 animate-fade-in bg-slate-50/40 dark:bg-slate-950 min-h-screen font-sans max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Faculty Review Portal</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Live Queue
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400">
            Welcome, Professor {user?.full_name?.split(' ')[1] || user?.full_name || ''}. Here are your pending reviews and incoming submissions.
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Pending Reviews"
          subtitle="Submissions awaiting evaluation"
          value={stats.pending}
          icon={<ClipboardDocumentCheckIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="indigo"
          trend={stats.pending > 0 ? 'neutral' : 'up'}
          trendValue={stats.pending > 0 ? `${stats.pending} in queue` : 'Completed'}
        />
        <StatCard
          title="High Risk (AI / Plagiarism)"
          subtitle="Flagged by analysis engine"
          value={stats.highRisk}
          icon={<ExclamationCircleIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="red"
          trend={stats.highRisk > 0 ? 'alert' : 'neutral'}
          trendValue={stats.highRisk > 0 ? 'Requires Attention' : '0 Flags'}
        />
        <StatCard
          title="Avg Projected Score"
          subtitle="Across pending submissions"
          value={stats.avgIncomingScore ? `${stats.avgIncomingScore} / 100` : '—'}
          icon={<CheckBadgeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="green"
          trend={stats.avgIncomingScore >= 75 ? 'up' : null}
          trendValue={stats.avgIncomingScore >= 75 ? 'On Track' : null}
        />
      </div>

      {/* Faculty Portal Segmented Control Tab Switcher */}
      <div className="inline-flex items-center p-1 bg-slate-200/60 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs gap-1">
        <button
          onClick={() => setFacultyTab('queue')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            facultyTab === 'queue'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <ClockIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>Action Required Queue</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
            facultyTab === 'queue'
              ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40'
              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>
            {pendingEvaluations.length}
          </span>
        </button>

        <button
          onClick={() => setFacultyTab('notifications')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            facultyTab === 'notifications'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <BellIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>Submission Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {facultyTab === 'notifications' ? (
        <NotificationPanel />
      ) : (
        /* Pending Evaluations Table Container */
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_24px_rgba(0,0,0,0.35)]">
          <div className="px-5 py-3 border-b border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <ClockIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Action Required Queue
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Projects awaiting faculty scoring, validation, and qualitative feedback
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                {pendingEvaluations.length} Pending
              </span>
            </div>
          </div>

          {pendingEvaluations.length === 0 ? (
            <div className="p-8 sm:p-10 text-center text-slate-500">
              <CheckBadgeIcon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700 mb-2.5" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">All caught up!</p>
              <p className="text-xs mt-0.5 text-slate-400">There are no pending evaluations waiting for your review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/70 dark:divide-slate-800/70">
                <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800/60">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Analyzed</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Score</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flags</th>
                    <th scope="col" className="relative px-4 py-2.5"><span className="sr-only">Review</span></th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pendingEvaluations.map((evaluation) => (
                    <tr key={evaluation.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{evaluation.project?.title || 'Unknown Project'}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">ID: {evaluation.project?.id?.substring(0, 8)}...</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {evaluation.completed_at ? format(new Date(evaluation.completed_at), 'MMM dd, h:mm a') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-md border ${
                            evaluation.total_score >= 80 
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40' 
                              : evaluation.total_score >= 60 
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40' 
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40'
                          }`}>
                            {evaluation.total_score}/100
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-1.5">
                          {evaluation.ai_code_detected && (
                            <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40" title="High AI Generation Probability">AI FLAG</span>
                          )}
                          {evaluation.plagiarism_detected && (
                            <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40" title="High Similarity to prior works">PLAGIARISM</span>
                          )}
                          {!evaluation.ai_code_detected && !evaluation.plagiarism_detected && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Clean
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                        <button
                          onClick={() => navigate(`/projects/${evaluation.project_id || evaluation.project?.id}`)}
                          className="inline-flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-150"
                        >
                          Review & Finalize
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
