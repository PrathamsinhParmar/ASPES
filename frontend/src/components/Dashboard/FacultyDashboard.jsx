import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { evaluationService } from '../../services/evaluationService';
import StatCard from './StatCard';
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Faculty Review Portal</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Welcome, Professor {user?.full_name?.split(' ')[1] || user?.full_name || ''}. Here are your pending reviews.</p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Pending Reviews"
          value={stats.pending}
          icon={<ClipboardDocumentCheckIcon className="w-8 h-8" />}
          color="indigo"
        />
        <StatCard
          title="High Risk (AI/Plagiarism)"
          value={stats.highRisk}
          icon={<ExclamationCircleIcon className="w-8 h-8" />}
          color="red"
          trend="up"
          trendValue="Requires Attention"
        />
        <StatCard
          title="Avg Projected Score"
          value={stats.avgIncomingScore}
          icon={<CheckBadgeIcon className="w-8 h-8" />}
          color="green"
        />
      </div>

      {/* Pending Evaluations Table */}
      <div className="bg-white dark:bg-slate-900 shadow rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-slate-800 sm:px-6 flex justify-between items-center bg-white dark:bg-slate-900">
          <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-indigo-500" /> Action Required Queue
          </h3>
        </div>

        {pendingEvaluations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CheckBadgeIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-lg font-medium text-gray-900">All caught up!</p>
            <p className="text-sm mt-1">There are no pending evaluations waiting for your review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Project</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date Analyzed</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">AI Score</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Flags</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Review</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                {pendingEvaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{evaluation.project?.title || 'Unknown Project'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">ID: {evaluation.project?.id?.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {evaluation.completed_at ? format(new Date(evaluation.completed_at), 'MMM dd, h:mm a') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${evaluation.total_score >= 90 ? 'bg-green-100 text-green-800' : evaluation.total_score >= 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {evaluation.total_score}/100
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {evaluation.ai_code_detected && (
                          <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-800 border border-red-200" title="High AI Generation Probability">AI FLAG</span>
                        )}
                        {evaluation.plagiarism_detected && (
                          <span className="px-2 py-1 text-xs font-bold rounded bg-orange-100 text-orange-800 border border-orange-200" title="High Similarity to prior works">PLAGIARISM</span>
                        )}
                        {!evaluation.ai_code_detected && !evaluation.plagiarism_detected && (
                          <span className="text-sm text-gray-400">Clean</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/evaluations/${evaluation.id}/review`)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
    </div>
  );
};

export default FacultyDashboard;
