import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { 
  DocumentTextIcon, 
  DocumentIcon, 
  CodeBracketIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  UserGroupIcon, 
  IdentificationIcon, 
  ClipboardDocumentCheckIcon, 
  ArrowDownTrayIcon, 
  EyeIcon, 
  XMarkIcon, 
  DocumentChartBarIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  ArrowTopRightOnSquareIcon,
  PaperClipIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckBadgeIcon,
  AcademicCapIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import ReportModal from '../components/Report/ReportModal';
import { formatLanguageName, formatStatus } from '../utils/languageFormatter';

const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingSource, setDownloadingSource] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const pollingRef = useRef(null);
  const { user } = useAuth();
  
  const [reportBlobUrl, setReportBlobUrl] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [evalNotes, setEvalNotes] = useState('');
  const [evalFile, setEvalFile] = useState(null);
  const [evalScore, setEvalScore] = useState('');
  const [evalStatus, setEvalStatus] = useState('reviewed');
  const evalFileInputRef = useRef(null);
  const [evaluating, setEvaluating] = useState(false);
  const [downloadingEvaluationDoc, setDownloadingEvaluationDoc] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // File URL Helper
  const getUploadUrl = (path) => {
    if (!path) return '';
    const normalizedPath = path.replace(/\\/g, '/');
    const baseUrl = process.env.REACT_APP_API_URL 
      ? process.env.REACT_APP_API_URL.replace('/api/v1', '') 
      : '';
    const finalPath = normalizedPath.startsWith('uploads/') ? normalizedPath : `uploads/${normalizedPath}`;
    return `${baseUrl}/${finalPath}`;
  };

  const handleDownloadSource = async () => {
    const path = project?.code_file_path;
    if (!path) {
      toast.error('Source bundle not available.');
      return;
    }
    setDownloadingSource(true);
    toast.info('Starting download...', { autoClose: 2000 });
    try {
      const url = getUploadUrl(path);
      const response = await fetch(url);
      if (!response.ok) throw new Error('File not found');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const fileName = path.split(/[/\\]/).pop() || 'source_bundle.zip';
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      toast.error('Failed to download source file. It might be missing or corrupted.');
    } finally {
      setDownloadingSource(false);
    }
  };

  const handleViewReport = async () => {
    if (!project?.report_file_path) {
      toast.error('Technical report not available.');
      return;
    }
    setViewerOpen(true);
    if (!reportBlobUrl) {
      try {
        setReportLoading(true);
        const url = getUploadUrl(project.report_file_path);
        const response = await fetch(url);
        if (!response.ok) throw new Error('File not found');
        const blob = await response.blob();
        setReportBlobUrl(window.URL.createObjectURL(blob));
      } catch (err) {
        toast.error('Failed to load report document.');
        setViewerOpen(false);
      } finally {
        setReportLoading(false);
      }
    }
  };

  const handleDownloadEvaluationFile = async () => {
    try {
      setDownloadingEvaluationDoc(true);
      const blob = await projectService.downloadEvaluationFile(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = project?.evaluation?.evaluation_file_name || 'evaluation_document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Official evaluation file downloaded successfully!');
    } catch (err) {
      console.warn('Endpoint download failed, trying direct URL:', err);
      if (project?.evaluation?.evaluation_file_url) {
        window.open(getUploadUrl(project.evaluation.evaluation_file_url), '_blank');
      } else {
        toast.error('Unable to download evaluation file.');
      }
    } finally {
      setDownloadingEvaluationDoc(false);
    }
  };

  const handleEvaluate = async () => {
    if (!window.confirm("Are you sure you want to confirm your evaluation? This will mark the project as 'Evaluated'.")) return;
    try {
      setEvaluating(true);
      const formData = new FormData();
      if (evalNotes) formData.append('faculty_comments', evalNotes);
      if (evalScore !== '' && evalScore !== null && !isNaN(Number(evalScore))) {
        formData.append('faculty_score', Number(evalScore));
      }
      if (evalStatus) formData.append('status_label', evalStatus);
      if (evalFile) formData.append('evaluation_file', evalFile);
      
      await projectService.evaluateProject(id, formData);
      toast.success(evalFile ? "Project evaluated and file uploaded successfully!" : "Project marked as Evaluated successfully!");
      setEvalFile(null);
      fetchProject();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to evaluate project. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const fetchProject = async () => {
    try {
      const data = await projectService.getProject(id);
      setProject(data);

      // If evaluation is complete, stop polling
      if (data.evaluation && data.evaluation.status === 'completed') {
        clearInterval(pollingRef.current);
      }

      // If evaluation has failed, stop polling
      if (data.evaluation && data.evaluation.status === 'failed') {
        clearInterval(pollingRef.current);
      }
    } catch (err) {
      console.error(err);
      clearInterval(pollingRef.current);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchProject();

    // Start polling while evaluation is pending/processing
    pollingRef.current = setInterval(() => {
      fetchProject();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-500 font-medium">Loading project...</p>
      </div>
    </div>
  );

  if (!project) return <div className="p-10 text-red-500">Project not found</div>;

  const isProcessing = !project.evaluation || 
    project.evaluation.status === 'pending' || 
    project.evaluation.status === 'processing';

  const score = project?.evaluation?.total_score != null ? Math.round(project.evaluation.total_score) : null;
  const scoreTier = score != null 
    ? score >= 80 
      ? { label: 'Distinction', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
      : score >= 50 
        ? { label: 'Passing', bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' }
        : { label: 'Needs Review', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' }
    : null;

  return (
    <div className="font-sans p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-white">
      {/* Top Navigation & Header Banner */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_24px_rgba(0,0,0,0.35)]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-3 group"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Projects</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {project.title}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                project.status === 'published' || project.status === 'evaluated'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : project.status === 'under_evaluation'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}>
                {formatStatus(project.status)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              {project.course_name && (
                <span className="inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {formatLanguageName(project.course_name)}
                </span>
              )}
              {project.created_at && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-400" />
                  Submitted {format(new Date(project.created_at), 'MMM dd, yyyy')}
                </span>
              )}
            </div>
          </div>

          {project.team_name && (
            <div className="flex-shrink-0 inline-flex items-center gap-3 px-3.5 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <UserGroupIcon className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 block">Team</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-indigo-200">{project.team_name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Project Description */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_24px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/60">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <DocumentTextIcon className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Project Description
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {project.description || "No description provided."}
            </p>
          </div>

          {/* Project Links Section */}
          {(project.live_link || project.github_repo_link) && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_24px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Project Links
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.live_link && (
                  <a
                    href={project.live_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 hover:border-pink-500/30 hover:bg-pink-500/5 hover:-translate-y-0.5 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">Live Project</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{project.live_link.replace(/^https?:\/\//, '')}</p>
                      </div>
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-slate-400 group-hover:text-pink-500 transition-colors flex-shrink-0" />
                  </a>
                )}
                {project.github_repo_link && (
                  <a
                    href={project.github_repo_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 hover:border-violet-500/30 hover:bg-violet-500/5 hover:-translate-y-0.5 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">GitHub Repo</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{project.github_repo_link.replace(/^https?:\/\//, '')}</p>
                      </div>
                    </div>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 text-slate-400 group-hover:text-violet-500 transition-colors flex-shrink-0" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Collaborators Section */}
          {project.team_members && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_24px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UserGroupIcon className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Collaborators
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(() => {
                  try {
                    const members = typeof project.team_members === 'string' ? JSON.parse(project.team_members) : project.team_members;
                    return members?.map((member, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                          <IdentificationIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{member.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{member.enrollment}</p>
                        </div>
                      </div>
                    ));
                  } catch (e) {
                    return <p className="text-xs text-slate-400 italic">Unable to parse collaborator details</p>;
                  }
                })()}
              </div>
            </div>
          )}

          {/* Enhanced Faculty Evaluation Section (for Students / Viewers) */}
          {(project.status === 'evaluated' || project.status === 'published' || project.evaluation?.status_label || project.evaluation?.professor_score_override != null || project.evaluation?.professor_feedback || project.evaluation?.evaluation_file_url) && user?.role !== 'faculty' && user?.role !== 'professor' && (() => {
            const rawLabel = project.evaluation?.status_label || (project.status === 'published' ? 'Approved & Finalized' : 'Reviewed');
            const lowerLabel = rawLabel.toLowerCase();

            let statusConfig;
            if (lowerLabel.includes('revision') || lowerLabel.includes('request')) {
              statusConfig = {
                tag: 'Revision Requested',
                badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 ring-1 ring-amber-500/20',
                dotClass: 'bg-amber-500',
                bannerClass: 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-200',
                title: 'Action Required: Revision Requested',
                description: 'The faculty evaluator has completed their review and requested specific revisions or updates. Please review the detailed comments and attached review document below.',
                icon: ExclamationTriangleIcon,
              };
            } else if (lowerLabel.includes('approved') || lowerLabel.includes('finalized') || project.status === 'published') {
              statusConfig = {
                tag: 'Approved & Finalized',
                badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/20',
                dotClass: 'bg-emerald-500',
                bannerClass: 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200',
                title: 'Project Approved & Finalized',
                description: 'Congratulations! Your academic project evaluation has been reviewed, graded, and officially marked as approved.',
                icon: CheckBadgeIcon,
              };
            } else if (lowerLabel.includes('rejected')) {
              statusConfig = {
                tag: 'Revision Required / Rejected',
                badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 ring-1 ring-rose-500/20',
                dotClass: 'bg-rose-500',
                bannerClass: 'bg-rose-50/80 dark:bg-rose-950/25 border-rose-200/80 dark:border-rose-900/40 text-rose-900 dark:text-rose-200',
                title: 'Submission Requires Resubmission',
                description: 'The current submission does not meet passing criteria. Please examine the feedback below and coordinate with your faculty advisor.',
                icon: XCircleIcon,
              };
            } else if (lowerLabel.includes('feedback')) {
              statusConfig = {
                tag: 'Feedback Provided',
                badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30 ring-1 ring-sky-500/20',
                dotClass: 'bg-sky-500',
                bannerClass: 'bg-sky-50/80 dark:bg-sky-950/25 border-sky-200/80 dark:border-sky-900/40 text-sky-900 dark:text-sky-200',
                title: 'Detailed Feedback Provided',
                description: 'Faculty remarks, academic grading, and advisory suggestions have been recorded for your project.',
                icon: ChatBubbleBottomCenterTextIcon,
              };
            } else {
              statusConfig = {
                tag: rawLabel || 'Evaluation Completed',
                badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30 ring-1 ring-indigo-500/20',
                dotClass: 'bg-indigo-500',
                bannerClass: 'bg-indigo-50/80 dark:bg-indigo-950/25 border-indigo-200/80 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-200',
                title: 'Official Evaluation Recorded',
                description: 'Your project has been evaluated and official marks with remarks are recorded in your project record.',
                icon: ClipboardDocumentCheckIcon,
              };
            }

            const facultyMarks = project.evaluation?.professor_score_override ?? project.evaluation?.total_score;
            const hasMarks = facultyMarks !== null && facultyMarks !== undefined && !isNaN(Number(facultyMarks));
            const numericMarks = hasMarks ? Number(facultyMarks) : null;

            let scoreTier = null;
            if (hasMarks) {
              if (numericMarks >= 85) {
                scoreTier = {
                  label: 'Outstanding (A+)',
                  badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
                  progressGradient: 'from-emerald-500 to-teal-400',
                };
              } else if (numericMarks >= 70) {
                scoreTier = {
                  label: 'First Class (A)',
                  badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25',
                  progressGradient: 'from-blue-500 to-indigo-500',
                };
              } else if (numericMarks >= 50) {
                scoreTier = {
                  label: 'Satisfactory (B)',
                  badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25',
                  progressGradient: 'from-amber-500 to-yellow-400',
                };
              } else {
                scoreTier = {
                  label: 'Needs Improvement',
                  badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25',
                  progressGradient: 'from-rose-500 to-red-500',
                };
              }
            }

            const fileName = project.evaluation?.evaluation_file_name || '';
            const fileExt = fileName.split('.').pop()?.toLowerCase();
            let fileConfig = {
              extLabel: (fileExt || 'FILE').toUpperCase(),
              chipClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
              iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20',
            };
            if (fileExt === 'pdf') {
              fileConfig = {
                extLabel: 'PDF',
                chipClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
                iconBg: 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/20',
              };
            } else if (['doc', 'docx'].includes(fileExt)) {
              fileConfig = {
                extLabel: 'DOCX',
                chipClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
                iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20',
              };
            } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExt)) {
              fileConfig = {
                extLabel: 'ZIP',
                chipClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
                iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20',
              };
            }

            const StatusIcon = statusConfig.icon;

            return (
              <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-5 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xl dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_32px_rgba(0,0,0,0.4)] space-y-6">
                {/* Decorative Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-600"></div>

                {/* Section Header with Tags */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/15 via-purple-500/15 to-emerald-500/15 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs flex-shrink-0">
                      <ClipboardDocumentCheckIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                          Faculty Evaluation & Academic Review
                        </h2>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          Official
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Verified academic evaluation, given marks, remarks, and official feedback attachments
                      </p>
                    </div>
                  </div>

                  {/* Top Status & Timestamp TAGS */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Evaluation Status Tag */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${statusConfig.badgeClass}`}>
                      <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass} animate-pulse`}></span>
                      <StatusIcon className="w-4 h-4 flex-shrink-0" />
                      <span>{statusConfig.tag}</span>
                    </span>

                    {/* Timestamp Tag */}
                    {project.evaluation?.completed_at && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                        <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{format(new Date(project.evaluation.completed_at), 'dd MMM yyyy')}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Notice Banner */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed transition-all ${statusConfig.bannerClass}`}>
                  <StatusIcon className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-90" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm tracking-tight">{statusConfig.title}</p>
                    <p className="opacity-90">{statusConfig.description}</p>
                  </div>
                </div>

                {/* Key Metrics Grid: Given Marks, Decision, Reviewer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {/* Card 1: Given Marks (Optional / Highlighted) */}
                  {hasMarks ? (
                    <div className="p-4 sm:p-4.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" />
                            Given Marks
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${scoreTier.badgeClass}`}>
                            {scoreTier.label}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            {numericMarks.toFixed(2).replace(/\.00$/, '')}
                          </span>
                          <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">/ 100</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3.5 space-y-1">
                        <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${scoreTier.progressGradient} transition-all duration-700`}
                            style={{ width: `${Math.min(Math.max(numericMarks, 0), 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                          <span>Grade Percentage</span>
                          <span>{Math.min(Math.max(numericMarks, 0), 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-4.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                          Given Marks
                        </span>
                        <span className="text-lg font-bold text-slate-700 dark:text-slate-300">Marks Pending</span>
                        <p className="text-xs text-slate-400 mt-1">Numerical score will appear once finalized by faculty.</p>
                      </div>
                    </div>
                  )}

                  {/* Card 2: Academic Status Tag Highlight */}
                  <div className="p-4 sm:p-4.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                        Evaluation Tag
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="w-5 h-5 text-indigo-500" />
                        <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {statusConfig.tag}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                      Official standing assigned by faculty committee
                    </p>
                  </div>

                  {/* Card 3: Evaluator Reference */}
                  <div className="p-4 sm:p-4.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                        Evaluator & Release
                      </span>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <AcademicCapIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Faculty Reviewer</p>
                          <p className="text-[11px] text-slate-400">Academic Project Committee</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-1.5">
                      <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                      {project.evaluation?.completed_at 
                        ? format(new Date(project.evaluation.completed_at), 'dd MMM yyyy, hh:mm a') 
                        : 'Evaluation recorded'}
                    </p>
                  </div>
                </div>

                {/* Actual Message: Evaluator Remarks & Feedback */}
                <div className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-indigo-500" />
                    <span>Evaluator Notes & Feedback Message</span>
                  </div>
                  {project.evaluation?.professor_feedback ? (
                    <div className="relative pl-3.5 border-l-2 border-indigo-500/60 py-0.5">
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                        {project.evaluation.professor_feedback}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No written evaluator comments were provided.
                    </p>
                  )}
                </div>

                {/* Uploaded Evaluation Document Card */}
                {project.evaluation?.evaluation_file_url && (
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-indigo-50/80 dark:from-indigo-950/40 dark:via-purple-950/25 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${fileConfig.iconBg}`}>
                        <PaperClipIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {project.evaluation.evaluation_file_name || 'Evaluation_Review_File'}
                          </p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${fileConfig.chipClass}`}>
                            {fileConfig.extLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Official marked report & rubric document uploaded by faculty evaluator
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Secondary Preview / Open */}
                      <button
                        type="button"
                        onClick={() => window.open(getUploadUrl(project.evaluation.evaluation_file_url), '_blank')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors"
                        title="Open in new browser tab"
                      >
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Open</span>
                      </button>

                      {/* Primary Download Button */}
                      <button
                        type="button"
                        onClick={handleDownloadEvaluationFile}
                        disabled={downloadingEvaluationDoc}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:from-indigo-700 active:to-purple-700 rounded-lg shadow-sm hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-60"
                      >
                        {downloadingEvaluationDoc ? (
                          <>
                            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                            <span>Download File</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Faculty Evaluation Form (for Faculty / Professors) */}
          {(user?.role === 'faculty' || user?.role === 'professor') && project.status !== 'published' && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_24px_rgba(0,0,0,0.35)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ClipboardDocumentCheckIcon className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Faculty Evaluation & Document Upload
                  </h2>
                </div>
                {project.status === 'evaluated' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    Evaluated
                  </span>
                )}
              </div>

              {project.status === 'evaluated' && (
                <div className="p-3.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2.5">
                  <CheckCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Evaluation Recorded</span>
                    <span>You have previously submitted an evaluation. You may update your feedback, score, or attached review file below.</span>
                  </div>
                </div>
              )}

              {/* Status and Score inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Evaluation Status
                  </label>
                  <select
                    value={evalStatus}
                    onChange={(e) => setEvalStatus(e.target.value)}
                    className="w-full bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="reviewed">Reviewed (Default)</option>
                    <option value="approved">Approved & Finalized</option>
                    <option value="revision requested">Revision Requested</option>
                    <option value="rejected">Rejected</option>
                    <option value="feedback provided">Feedback Provided</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Faculty Score Override (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={evalScore}
                    onChange={(e) => setEvalScore(e.target.value)}
                    placeholder={project.evaluation?.total_score ? String(project.evaluation.total_score) : "e.g. 88.0"}
                    className="w-full bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Feedback textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Evaluation Notes & Feedback
                </label>
                <textarea 
                  className="w-full bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none text-slate-900 dark:text-white min-h-[90px] resize-y placeholder:text-slate-400 transition-colors"
                  placeholder="Provide concrete evaluation remarks, areas of strength, or required revisions..."
                  value={project.status === 'evaluated' && !evalNotes && project.evaluation?.professor_feedback ? project.evaluation.professor_feedback : evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                ></textarea>
              </div>

              {/* File Upload in Project Evaluation */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Attach Evaluation File
                  </label>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Delivered to Student Notification Panel
                  </span>
                </div>

                {/* Show currently attached file if exists */}
                {project.evaluation?.evaluation_file_url && !evalFile && (
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PaperClipIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                          Current: {project.evaluation.evaluation_file_name || 'Evaluation Attachment'}
                        </span>
                        <span className="text-[10px] text-slate-400">Attached to evaluation</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadEvaluationFile}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 rounded border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                    >
                      <ArrowDownTrayIcon className="w-3 h-3" /> Download
                    </button>
                  </div>
                )}

                {/* Selected new file or file picker */}
                {!evalFile ? (
                  <div
                    onClick={() => evalFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/40 dark:bg-slate-800/40 transition-colors"
                  >
                    <input
                      ref={evalFileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setEvalFile(e.target.files[0]);
                          toast.success(`Attached "${e.target.files[0].name}"`);
                        }
                      }}
                      accept=".pdf,.docx,.doc,.txt,.zip,.py,.java,.cpp,.c,.js"
                    />
                    <ArrowUpTrayIcon className="w-6 h-6 text-indigo-500 mx-auto mb-1.5 opacity-80" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {project.evaluation?.evaluation_file_url ? 'Click to replace attached evaluation file' : 'Click to upload evaluation file (PDF, DOCX, ZIP, Code)'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Maximum file size: 50 MB</p>
                  </div>
                ) : (
                  <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PaperClipIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">{evalFile.name}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">New file ready to upload</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEvalFile(null)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleEvaluate}
                  disabled={evaluating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  {evaluating ? 'Submitting...' : project.status === 'evaluated' ? 'Update Evaluation & File' : 'Submit Evaluation & File'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Final Score / AI Evaluation Summary Card */}
          {project.evaluation && project.evaluation.status === 'completed' ? (
            <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden">
              {/* Subtle ambient glow backdrop */}
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Final Score
                  </span>
                  {scoreTier && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${scoreTier.bg}`}>
                      {scoreTier.label}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight text-white">
                    {score != null ? score : '—'}
                  </span>
                  <span className="text-base font-semibold text-slate-400">/ 100</span>
                </div>

                {/* Metric Progress Bar Track */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, score || 0))}%` }}
                  ></div>
                </div>

                {/* Primary & Secondary Actions */}
                <div className="pt-2 space-y-2.5">
                  <Link 
                    to={`/evaluations/${project.evaluation.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 group"
                  >
                    <span>View Detailed Analysis</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>

                  <button 
                    id="generate-report-btn"
                    onClick={() => setReportModalOpen(true)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold rounded-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
                  >
                    <DocumentChartBarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Generate Report</span>
                  </button>
                </div>
              </div>
            </div>
          ) : project.evaluation && project.evaluation.status === 'failed' ? (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-rose-500/30 shadow-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Analysis Incomplete</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px] mx-auto">
                  The AI engine encountered an error while processing the project files.
                </p>
              </div>
              <Link 
                to="/projects/new" 
                className="inline-flex items-center justify-center w-full py-2 px-3 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-all"
              >
                Restart Analysis
              </Link>
            </div>
          ) : (
            <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Evaluation Running</h3>
                  <p className="text-[11px] text-slate-400">Processing repository and documentation...</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                {['Core Code Analysis', 'Plagiarism & Quality Checks', 'Document & Alignment Verification'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`}></span>
                    <span className={i === 0 ? 'text-indigo-300 font-medium' : 'text-slate-500'}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources Card */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-5 sm:p-6 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_24px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/60">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <DocumentIcon className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Resources
              </h2>
            </div>

            <div className="space-y-2.5">
              <button 
                onClick={handleDownloadSource}
                disabled={downloadingSource}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:-translate-y-0.5 transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <CodeBracketIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Download Source
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">ZIP Archive</span>
                  </div>
                </div>
                {downloadingSource ? (
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ArrowDownTrayIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                )}
              </button>

              <button 
                onClick={handleViewReport}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 hover:border-purple-500/30 hover:bg-purple-500/5 hover:-translate-y-0.5 transition-all duration-150 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <DocumentIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      View Technical Report
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">PDF Document</span>
                  </div>
                </div>
                <EyeIcon className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 lg:p-10">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl h-full pb-0 sm:h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex flex-wrap items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 w-full sm:w-auto mb-4 sm:mb-0">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                  <DocumentIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Technical Report Viewer</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate max-w-[200px] sm:max-w-md">
                    {project?.report_file_path?.split(/[/\\]/).pop() || "Document"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = reportBlobUrl || getUploadUrl(project?.report_file_path);
                    a.download = project?.report_file_path?.split(/[/\\]/).pop() || 'technical_report.pdf';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Download File</span>
                </button>
                <button 
                  onClick={() => setViewerOpen(false)}
                  className="p-2.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100/50 dark:bg-[#0d1117] p-2 sm:p-4 overflow-hidden relative rounded-b-xl flex flex-col justify-center items-center">
              {reportLoading ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-500 font-semibold uppercase tracking-widest">Loading Report...</p>
                </div>
              ) : (
                <iframe 
                  src={reportBlobUrl || ''} 
                  title="Document Viewer" 
                  className="w-full h-full rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner bg-white dark:bg-slate-900"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Report Modal */}
      <ReportModal
        projectId={id}
        projectTitle={project?.title}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
};

export default ProjectDetailPage;

