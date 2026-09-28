import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { evaluationService } from '../../services/evaluationService';
import { projectService } from '../../services/projectService';
import StatCard from './StatCard';
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckBadgeIcon,
  BellIcon,
  PaperClipIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPanel from '../Notification/NotificationPanel';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [facultyTab, setFacultyTab] = useState('queue'); // 'queue' | 'evaluated' | 'notifications'
  const [pendingEvaluations, setPendingEvaluations] = useState([]);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Faculty Evaluation Section / Modal State
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evaluatingRecord, setEvaluatingRecord] = useState(null);
  const [evalScore, setEvalScore] = useState('');
  const [evalStatus, setEvalStatus] = useState('reviewed');
  const [evalComments, setEvalComments] = useState('');
  const [evalFile, setEvalFile] = useState(null);
  const [isSubmittingEval, setIsSubmittingEval] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDashData();
  }, []);

  const fetchDashData = async () => {
    try {
      setLoading(true);
      const [pending, assigned] = await Promise.all([
        evaluationService.getPendingEvaluations().catch(err => {
          console.error('Failed to fetch evaluation pending list:', err);
          return [];
        }),
        projectService.getAssignedProjects().catch(err => {
          console.error('Failed to fetch assigned projects:', err);
          return [];
        })
      ]);
      setPendingEvaluations(pending || []);
      setAssignedProjects(assigned || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Projects that have already been evaluated by faculty
  const evaluatedProjects = assignedProjects.filter(p =>
    p.status === 'evaluated' ||
    p.status === 'published' ||
    (p.has_evaluation && !pendingEvaluations.some(pe => (pe.project_id || pe.project?.id) === p.id))
  );

  const calculateAvgScore = () => {
    if (pendingEvaluations.length === 0 && evaluatedProjects.length === 0) return 0;
    const combined = [...pendingEvaluations, ...evaluatedProjects];
    const scored = combined.filter(x => (x.total_score != null && !isNaN(x.total_score)));
    if (scored.length === 0) return 0;
    const total = scored.reduce((acc, curr) => acc + (curr.total_score || 0), 0);
    return Math.round(total / scored.length);
  };

  const stats = {
    pending: pendingEvaluations.length,
    alreadyEvaluated: evaluatedProjects.length,
    highRisk: pendingEvaluations.filter(e => e.plagiarism_detected || e.ai_code_detected).length,
    avgIncomingScore: calculateAvgScore(),
  };

  // Open Evaluation Section / Modal for a selected project
  const handleOpenEvaluationModal = async (record) => {
    setEvaluatingRecord(record);
    const initialScore = record.professor_score_override ?? record.total_score ?? '';
    setEvalScore(initialScore);
    setEvalStatus(record.status_label || (record.status === 'evaluated' ? 'reviewed' : 'reviewed'));
    setEvalComments(record.professor_feedback || '');
    setEvalFile(null);
    setEvalModalOpen(true);

    // Fetch full project data from API to load previous evaluation details if available
    const projectId = record.project_id || record.project?.id || record.id;
    if (projectId) {
      try {
        const fullProj = await projectService.getProject(projectId);
        if (fullProj) {
          setEvaluatingRecord(prev => ({
            ...prev,
            ...fullProj,
            project: fullProj,
            evaluation: fullProj.evaluation || prev?.evaluation,
          }));
          if (fullProj.evaluation) {
            if (fullProj.evaluation.professor_score_override != null) {
              setEvalScore(fullProj.evaluation.professor_score_override);
            } else if (fullProj.evaluation.total_score != null) {
              setEvalScore(fullProj.evaluation.total_score);
            }
            if (fullProj.evaluation.professor_feedback) {
              setEvalComments(fullProj.evaluation.professor_feedback);
            }
            if (fullProj.evaluation.status_label) {
              setEvalStatus(fullProj.evaluation.status_label);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch full project details for evaluation modal:', err);
      }
    }
  };

  const handleCloseEvaluationModal = () => {
    if (isSubmittingEval) return;
    setEvalModalOpen(false);
    setEvaluatingRecord(null);
    setEvalFile(null);
    setEvalComments('');
    setEvalScore('');
  };

  // Drag and drop file handling
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    // 50MB size limit check
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds the 50 MB maximum limit.');
      return;
    }
    setEvalFile(file);
    toast.success(`Attached "${file.name}" to evaluation.`);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Download existing evaluation file
  const handleDownloadExistingFile = async () => {
    const projectId = evaluatingRecord?.project_id || evaluatingRecord?.project?.id || evaluatingRecord?.id;
    if (!projectId) return;
    try {
      const blob = await projectService.downloadEvaluationFile(projectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = evaluatingRecord?.evaluation?.evaluation_file_name || evaluatingRecord?.evaluation_file_name || `evaluation_document_${projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Downloaded evaluation document.');
    } catch (err) {
      console.error('Failed to download evaluation file:', err);
      toast.error('Failed to download evaluation document.');
    }
  };

  // Submit Evaluation with Attached File
  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!evaluatingRecord) return;

    const projectId = evaluatingRecord.project_id || evaluatingRecord.project?.id || evaluatingRecord.id;
    if (!projectId) {
      toast.error('Project ID not found for evaluation.');
      return;
    }

    try {
      setIsSubmittingEval(true);
      const formData = new FormData();

      if (evalComments.trim()) {
        formData.append('faculty_comments', evalComments.trim());
      }
      if (evalScore !== '' && evalScore !== null && !isNaN(Number(evalScore))) {
        formData.append('faculty_score', Number(evalScore));
      }
      formData.append('status_label', evalStatus);

      if (evalFile) {
        formData.append('evaluation_file', evalFile);
      }

      await projectService.evaluateProject(projectId, formData);

      toast.success(
        isAlreadyEvaluated
          ? (evalFile ? '🎉 Evaluation updated & new document attached!' : '🎉 Evaluation updated successfully!')
          : (evalFile ? '🎉 Evaluation submitted & file uploaded successfully! Student notified in real-time.' : '🎉 Project marked as evaluated successfully! Student notified in real-time.')
      );

      handleCloseEvaluationModal();
      await fetchDashData();
    } catch (err) {
      console.error('Failed to submit evaluation:', err);
      toast.error(err.response?.data?.detail || 'Failed to submit evaluation. Please try again.');
    } finally {
      setIsSubmittingEval(false);
    }
  };

  // Check if evaluating record is already evaluated
  const isAlreadyEvaluated = Boolean(
    evaluatingRecord?.project?.status === 'evaluated' ||
    evaluatingRecord?.project?.status === 'published' ||
    evaluatingRecord?.status === 'evaluated' ||
    evaluatingRecord?.status === 'published' ||
    evaluatingRecord?.has_evaluation === true ||
    evaluatingRecord?.evaluation?.professor_feedback ||
    evaluatingRecord?.evaluation?.professor_score_override != null ||
    evaluatingRecord?.evaluation?.evaluation_file_url ||
    evaluatingRecord?.professor_feedback ||
    evaluatingRecord?.professor_score_override != null ||
    evaluatingRecord?.evaluation_file_url
  );

  const existingFileUrl = evaluatingRecord?.evaluation?.evaluation_file_url || evaluatingRecord?.evaluation_file_url;
  const existingFileName = evaluatingRecord?.evaluation?.evaluation_file_name || evaluatingRecord?.evaluation_file_name;

  if (loading) {
    return <div className="p-6 flex justify-center items-center h-full"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>;
  }

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 animate-fade-in bg-slate-50/40 dark:bg-slate-950 min-h-screen font-sans max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Faculty Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Review Portal
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400">
            Welcome, Professor {user?.full_name?.split(' ')[1] || user?.full_name || ''}. Here are your pending reviews and incoming submissions.
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
          title="Already Evaluated"
          subtitle="Projects reviewed & graded"
          value={stats.alreadyEvaluated}
          icon={<CheckBadgeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="green"
          trend={stats.alreadyEvaluated > 0 ? 'up' : 'neutral'}
          trendValue={stats.alreadyEvaluated > 0 ? `${stats.alreadyEvaluated} Evaluated` : '0 Evaluated'}
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
          subtitle="Across project submissions"
          value={stats.avgIncomingScore ? `${stats.avgIncomingScore} / 100` : '—'}
          icon={<CheckBadgeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          color="purple"
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

        {/* Dedicated "Already Evaluated" Tab */}
        <button
          onClick={() => setFacultyTab('evaluated')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
            facultyTab === 'evaluated'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
          <span>Already Evaluated</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
            facultyTab === 'evaluated'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60'
              : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>
            {evaluatedProjects.length}
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
      ) : facultyTab === 'evaluated' ? (
        /* ========================================================================= */
        /* ── ALREADY EVALUATED PROJECTS VIEW ────────────────────────────────────── */
        /* ========================================================================= */
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_24px_rgba(0,0,0,0.35)]">
          <div className="px-5 py-3 border-b border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/50 dark:bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Already Evaluated Projects
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Projects previously reviewed, marked, and graded. Click to review or update feedback, scores, and evaluation documents.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                {evaluatedProjects.length} Evaluated
              </span>
            </div>
          </div>

          {evaluatedProjects.length === 0 ? (
            <div className="p-8 sm:p-10 text-center text-slate-500">
              <CheckBadgeIcon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700 mb-2.5" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">No evaluated projects yet</p>
              <p className="text-xs mt-0.5 text-slate-400">When you evaluate submissions from your Action Required Queue, they will appear here marked with the "Already Evaluated" tag.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/70 dark:divide-slate-800/70">
                <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800/60">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project & Details</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Evaluation Status</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Given Score</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Course / Batch</th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-slate-100 dark:divide-slate-800/60">
                  {evaluatedProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{project.title || 'Unknown Project'}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">ID: {project.id?.substring(0, 8)}...</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {/* Prominent "Already Evaluated" Tag */}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                          Already Evaluated
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 inline-flex text-xs leading-4 font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                          {project.total_score != null ? `${project.total_score} / 100` : 'Graded'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        <div>{project.course_name || 'General Project'}</div>
                        <div className="text-[11px] text-slate-400">{project.batch_year ? `Batch: ${project.batch_year}` : (project.team_name ? `Team: ${project.team_name}` : '—')}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium space-x-2">
                        {/* Review / Edit Evaluation */}
                        <button
                          onClick={() => handleOpenEvaluationModal(project)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-700/60 transition-colors"
                        >
                          <ClipboardDocumentCheckIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Review & Update</span>
                        </button>

                        {/* View full project workspace */}
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                          title="View project workspace"
                        >
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                          <span>Workspace</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* ── ACTION REQUIRED QUEUE TABLE CONTAINER ──────────────────────────────── */
        /* ========================================================================= */
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
                  Projects awaiting faculty scoring, validation, qualitative feedback, and review document uploads
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
                    <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flags / Status</th>
                    <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Evaluation Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pendingEvaluations.map((evaluation) => {
                    const rowIsEvaluated = Boolean(
                      evaluation.project?.status === 'evaluated' ||
                      evaluation.project?.status === 'published' ||
                      evaluation.status === 'evaluated' ||
                      evaluation.has_evaluation
                    );
                    return (
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
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {rowIsEvaluated && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                                <CheckCircleIcon className="w-3 h-3 text-emerald-500" /> Already Evaluated
                              </span>
                            )}
                            {evaluation.ai_code_detected && (
                              <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40" title="High AI Generation Probability">AI FLAG</span>
                            )}
                            {evaluation.plagiarism_detected && (
                              <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40" title="High Similarity to prior works">PLAGIARISM</span>
                            )}
                            {!rowIsEvaluated && !evaluation.ai_code_detected && !evaluation.plagiarism_detected && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Clean
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium space-x-2">
                          {/* Primary Action: Open Faculty Evaluation Section / Modal */}
                          <button
                            onClick={() => handleOpenEvaluationModal(evaluation)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-150"
                          >
                            <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
                            <span>{rowIsEvaluated ? 'Review / Update' : 'Evaluate & Upload'}</span>
                          </button>

                          {/* Secondary Action: Go to full project details */}
                          <button
                            onClick={() => navigate(`/projects/${evaluation.project_id || evaluation.project?.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                            title="View project workspace"
                          >
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                            <span>Workspace</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ── FACULTY EVALUATION SECTION (MODAL WITH FILE UPLOAD) ────────────────── */}
      {/* ========================================================================= */}
      {evalModalOpen && evaluatingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <ClipboardDocumentCheckIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Faculty Evaluation & Document Upload
                    </h3>
                    {/* Explicit "Already Evaluated" TAG in Modal Header */}
                    {isAlreadyEvaluated && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Already Evaluated
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Evaluating: <span className="font-semibold text-slate-700 dark:text-slate-300">{evaluatingRecord.project?.title || evaluatingRecord.title || 'Selected Project'}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseEvaluationModal}
                disabled={isSubmittingEval}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSubmitEvaluation} className="p-6 space-y-5 overflow-y-auto">
              
              {/* "Already Evaluated by Faculty" Guidance Banner */}
              {isAlreadyEvaluated && (
                <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200 shadow-2xs">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                        Already Evaluated by Faculty
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200">
                        Saved Record
                      </span>
                    </div>
                    <p className="text-xs mt-1 text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                      This project has already been evaluated. Your previous marks, comments, and uploaded files are loaded below. You can make adjustments and re-submit updates if necessary.
                    </p>
                  </div>
                </div>
              )}

              {/* Project Quick Overview Banner */}
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">AI Preliminary Score</span>
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {evaluatingRecord.total_score != null ? `${evaluatingRecord.total_score} / 100` : 'Pending'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Code Analysis</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {evaluatingRecord.code_quality_score != null ? `${evaluatingRecord.code_quality_score}%` : 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Plagiarism Status</span>
                  <span className={`font-semibold ${evaluatingRecord.plagiarism_detected ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {evaluatingRecord.plagiarism_detected ? 'Similarity Flagged' : 'Clean'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">AI Code Detection</span>
                  <span className={`font-semibold ${evaluatingRecord.ai_code_detected ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {evaluatingRecord.ai_code_detected ? 'AI Detected' : 'Human Author'}
                  </span>
                </div>
              </div>

              {/* Status Verdict & Score Override in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Evaluation Verdict / Status
                  </label>
                  <select
                    value={evalStatus}
                    onChange={(e) => setEvalStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  >
                    <option value="reviewed">Reviewed (Default)</option>
                    <option value="approved">Approved & Finalized</option>
                    <option value="revision requested">Revision Requested</option>
                    <option value="rejected">Rejected</option>
                    <option value="feedback provided">Feedback Provided</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Faculty Score Override (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={evalScore}
                    onChange={(e) => setEvalScore(e.target.value)}
                    placeholder={evaluatingRecord.total_score ? String(evaluatingRecord.total_score) : "85.0"}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Faculty Qualitative Feedback Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Qualitative Feedback & Remarks
                </label>
                <textarea
                  rows="3"
                  value={evalComments}
                  onChange={(e) => setEvalComments(e.target.value)}
                  placeholder="Provide concrete evaluation remarks, critique of implementation, strengths, and areas requiring revisions..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors resize-y min-h-[90px]"
                ></textarea>
              </div>

              {/* ── FILE UPLOAD SECTION ── */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Upload Evaluation Document / File
                  </label>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Shown in Student Notification Panel
                  </span>
                </div>

                {/* Previously Uploaded File Card (if already evaluated) */}
                {existingFileUrl && (
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <PaperClipIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {existingFileName || 'Attached Evaluation File'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                            Current File
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Available to student in their notification center
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadExistingFile}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors shadow-2xs flex-shrink-0"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 text-emerald-500" />
                      <span>Download File</span>
                    </button>
                  </div>
                )}

                {/* Dropzone Area */}
                {!evalFile ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-150 ${
                      dragActive
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[1.01]'
                        : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/40 dark:bg-slate-800/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.doc,.txt,.zip,.py,.java,.cpp,.c,.js"
                    />
                    <ArrowUpTrayIcon className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {existingFileUrl ? 'Upload new file to replace current document' : 'Drag & drop your evaluation file here, or '}
                      <span className="text-indigo-600 dark:text-indigo-400 underline">{existingFileUrl ? 'browse files' : 'browse'}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Supports PDF, DOCX, ZIP, TXT, Code files (up to 50 MB)
                    </p>
                  </div>
                ) : (
                  /* Uploaded File Selected Card */
                  <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                        <PaperClipIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {evalFile.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{formatFileSize(evalFile.size)}</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                            <CheckCircleIcon className="w-3.5 h-3.5" /> Ready to upload
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEvalFile(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      title="Remove attached file"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Helper notice explaining notification delivery */}
                <div className="p-2.5 bg-slate-100/70 dark:bg-slate-800/60 rounded-lg flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <SparklesIcon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span>
                    When submitted, this file is attached to the project evaluation. The student will instantly receive a notification with a direct download button in their dashboard.
                  </span>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCloseEvaluationModal}
                  disabled={isSubmittingEval}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingEval}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingEval ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting Evaluation...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>{isAlreadyEvaluated ? 'Update Evaluation & File' : 'Submit Evaluation & Attach File'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
