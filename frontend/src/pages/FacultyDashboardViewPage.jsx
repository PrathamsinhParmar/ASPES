import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { evaluationService } from '../services/evaluationService';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  UserIcon,
  EnvelopeIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const API_BASE_URL = api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:8000';

const FacultyDashboardViewPage = () => {
  const { facultyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [faculty, setFaculty] = useState(null);
  const [pendingEvaluations, setPendingEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [facultyRes, evalRes] = await Promise.all([
          api.get(`/users/${facultyId}`),
          evaluationService.getPendingEvaluations(),
        ]);
        setFaculty(facultyRes.data);
        setPendingEvaluations(evalRes);
      } catch (err) {
        setError('Failed to load faculty data. Make sure this is a valid faculty account.');
      } finally {
        setLoading(false);
      }
    };
    if (facultyId) fetchData();
  }, [facultyId]);

  const stats = {
    pending: pendingEvaluations.length,
    highRisk: pendingEvaluations.filter(
      (e) => e.plagiarism_detected || e.ai_code_detected
    ).length,
    avgScore:
      pendingEvaluations.length > 0
        ? Math.round(
            pendingEvaluations.reduce((s, e) => s + (e.total_score || 0), 0) /
              pendingEvaluations.length
          )
        : 0,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !faculty) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4 text-center min-h-screen bg-gray-50 dark:bg-slate-950">
        <ExclamationCircleIcon className="w-14 h-14 text-red-400" />
        <p className="text-gray-900 dark:text-white font-semibold">Error Loading Dashboard</p>
        <p className="text-sm text-gray-400">{error}</p>
        <button
          onClick={() => navigate('/faculty')}
          className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
        >
          ← Back to Faculty List
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in bg-gray-50 dark:bg-slate-950 min-h-screen">

      {/* Back Navigation */}
      <button
        onClick={() => navigate('/faculty')}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
      >
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Faculty List
      </button>

      {/* Read-Only Banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-700/30">
        <EyeIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <span className="font-semibold">Read-only view.</span> You are viewing this faculty dashboard as an administrator. No actions can be taken.
        </p>
      </div>

      {/* Faculty Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-5">
          {faculty.profile_photo ? (
            <img 
              src={`${API_BASE_URL}${faculty.profile_photo}?v=${new Date(faculty.updated_at || Date.now()).getTime()}`} 
              alt={faculty.full_name} 
              className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-indigo-500/10 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20 flex-shrink-0">
              {faculty.full_name?.[0]?.toUpperCase() || 'F'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{faculty.full_name}</h1>
            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
              {faculty.department || 'Faculty Member'}
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                <UserIcon className="w-4 h-4" />
                <span className="font-mono">{faculty.username}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                <EnvelopeIcon className="w-4 h-4" />
                {faculty.email}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                <AcademicCapIcon className="w-4 h-4" />
                Joined {faculty.created_at ? format(new Date(faculty.created_at), 'MMMM d, yyyy') : '—'}
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              faculty.is_active
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${faculty.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {faculty.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Reviews */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Pending Reviews</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
        </div>
        {/* High Risk */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">High Risk Items</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.highRisk}</p>
        </div>
        {/* Avg Score */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckBadgeIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Avg Projected Score</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.avgScore}</p>
        </div>
      </div>

      {/* Pending Evaluations — Read-only Table */}
      <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            System Pending Evaluations Queue
          </h3>
          <span className="ml-auto text-xs text-gray-400 italic">Read-only</span>
        </div>

        {pendingEvaluations.length === 0 ? (
          <div className="p-12 text-center">
            <CheckBadgeIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-700 mb-3" />
            <p className="text-base font-medium text-gray-900 dark:text-white">No pending evaluations</p>
            <p className="text-sm text-gray-400 mt-1">The queue is clear.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800/40">
                <tr>
                  {['Project', 'Date Analyzed', 'AI Score', 'Flags'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {pendingEvaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {evaluation.project?.title || 'Unknown Project'}
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {evaluation.project?.id?.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {evaluation.completed_at
                        ? format(new Date(evaluation.completed_at), 'MMM dd, h:mm a')
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          evaluation.total_score >= 90
                            ? 'bg-green-100 text-green-800'
                            : evaluation.total_score >= 75
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {evaluation.total_score}/100
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {evaluation.ai_code_detected && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-red-800 border border-red-200">
                            AI FLAG
                          </span>
                        )}
                        {evaluation.plagiarism_detected && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded bg-orange-100 text-orange-800 border border-orange-200">
                            PLAGIARISM
                          </span>
                        )}
                        {!evaluation.ai_code_detected && !evaluation.plagiarism_detected && (
                          <span className="text-sm text-gray-400">Clean</span>
                        )}
                      </div>
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

export default FacultyDashboardViewPage;
