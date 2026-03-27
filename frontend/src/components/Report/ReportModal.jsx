import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, DocumentChartBarIcon, ShieldCheckIcon, CodeBracketIcon, DocumentTextIcon, MagnifyingGlassIcon, ClipboardDocumentListIcon, StarIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon, CheckBadgeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { reportService } from '../../services/reportService';
import { toast } from 'react-toastify';

// ─── Utility helpers ────────────────────────────────────────────────────────

const getGradeColor = (grade) => {
  if (!grade || grade === 'N/A') return 'text-gray-400';
  if (grade.startsWith('A')) return 'text-emerald-500';
  if (grade.startsWith('B')) return 'text-blue-500';
  if (grade.startsWith('C')) return 'text-amber-500';
  return 'text-red-500';
};

const getScoreColor = (score) => {
  if (score == null) return 'text-gray-400';
  if (score >= 75) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
};

const getScoreBg = (score) => {
  if (score == null) return 'bg-gray-100 dark:bg-gray-800';
  if (score >= 75) return 'bg-emerald-50 dark:bg-emerald-900/20';
  if (score >= 60) return 'bg-amber-50 dark:bg-amber-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
};

const getRiskBadge = (level) => {
  if (!level) return null;
  const map = {
    'Low Risk': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    'Moderate Risk': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    'High Risk': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };
  return map[level] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
};

// ─── Score Ring ──────────────────────────────────────────────────────────────

const ScoreRing = ({ score, label, size = 80 }) => {
  const s = score ?? 0;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (s / 100) * circ;
  const color = s >= 75 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={6} className="text-gray-200 dark:text-gray-700" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className="text-xl font-black" style={{ color, marginTop: -size * 0.6 - 2, position: 'relative', zIndex: 1, rotate: '0deg' }} >
        <span style={{ display: 'block', transform: 'rotate(90deg)' }}>{Math.round(s)}</span>
      </span>
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
};

// ─── Mini Score Bar ──────────────────────────────────────────────────────────

const ScoreBar = ({ label, score, weight }) => {
  const s = score ?? 0;
  const color = s >= 75 ? 'bg-emerald-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}{weight && <span className="text-slate-400 font-normal ml-1">({weight})</span>}</span>
        <span className={`text-xs font-black ${getScoreColor(score)}`}>{Math.round(s)}/100</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${color} transition-all duration-1000`} style={{ width: `${s}%` }} />
      </div>
    </div>
  );
};

// ─── Section Card ────────────────────────────────────────────────────────────

const SectionCard = ({ icon: Icon, iconColor, title, score, grade, riskLevel, summary, children }) => (
  <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
    <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="flex items-center gap-2">
        {riskLevel && (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRiskBadge(riskLevel)}`}>
            {riskLevel}
          </span>
        )}
        {score != null && (
          <span className={`text-lg font-black ${getScoreColor(score)}`}>{Math.round(score)}<span className="text-xs font-normal text-gray-400">/100</span></span>
        )}
        {grade && (
          <span className={`text-base font-black ${getGradeColor(grade)}`}>{grade}</span>
        )}
      </div>
    </div>
    <div className="p-5">
      {summary && <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{summary}</p>}
      {children}
    </div>
  </div>
);

// ─── Flag Badge ──────────────────────────────────────────────────────────────

const FlagBadge = ({ detected, trueLabel, falseLabel }) => (
  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-bold text-sm ${
    detected
      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
      : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
  }`}>
    {detected ? <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" /> : <CheckBadgeIcon className="w-5 h-5 flex-shrink-0" />}
    {detected ? trueLabel : falseLabel}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const ReportModal = ({ projectId, projectTitle, isOpen, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchReport = useCallback(async () => {
    if (!projectId || !isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getReportData(projectId);
      setReport(data);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load report data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchReport();
      setActiveTab('overview');
    } else {
      setReport(null);
      setError(null);
    }
  }, [isOpen, fetchReport]);

  const handleDownload = async () => {
    if (!projectId) return;
    setDownloading(true);
    try {
      const safeTitle = (projectTitle || 'Project').replace(/\s+/g, '_').slice(0, 40);
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `${safeTitle}_AI_Report_${date}.pdf`;
      await reportService.downloadReportPdf(projectId, fileName);
      toast.success('Report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DocumentChartBarIcon },
    { id: 'code', label: 'Code & AI', icon: CodeBracketIcon },
    { id: 'docs', label: 'Docs & Report', icon: DocumentTextIcon },
    { id: 'plagiarism', label: 'Originality', icon: MagnifyingGlassIcon },
    { id: 'feedback', label: 'Feedback', icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-slate-50 dark:bg-[#0d1117] w-full max-w-5xl max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#161B22] border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
              <DocumentChartBarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">AI Analysis Report</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[300px]">{projectTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="report-download-pdf-btn"
              onClick={handleDownload}
              disabled={downloading || loading || !!error || !report}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowDownTrayIcon className="w-4 h-4" />
              )}
              {downloading ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              id="report-modal-close-btn"
              onClick={onClose}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 px-6 pt-4 pb-0 bg-white dark:bg-[#161B22] border-b border-slate-100 dark:border-slate-800 flex-shrink-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`report-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-6 custom-scroll">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 dark:text-slate-400 font-semibold">Compiling AI Analysis Report...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500">
                <ExclamationTriangleIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Unable to Load Report</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{error}</p>
              </div>
              <button
                onClick={fetchReport}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all"
              >
                <ArrowPathIcon className="w-4 h-4" /> Retry
              </button>
            </div>
          )}

          {report && !loading && !error && (
            <>
              {/* ── OVERVIEW TAB ── */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Project meta */}
                  <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                    <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4">Project Information</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        ['Project', report.project.title],
                        ['Course', report.project.course_name || '—'],
                        ['Team', report.team.team_name],
                        ['Faculty', report.team.faculty_name],
                        ['Student', report.team.student_name],
                        ['Submitted', report.project.submitted_at ? report.project.submitted_at.slice(0, 10) : '—'],
                        ['Status', report.project.status?.replace(/_/g, ' ').toUpperCase()],
                        ['Generated', report.meta.generated_at.slice(0, 10)],
                      ].map(([k, v]) => (
                        <div key={k} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{v}</p>
                        </div>
                      ))}
                    </div>
                    {/* Team members */}
                    {report.team.members?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Team Members</p>
                        <div className="flex flex-wrap gap-2">
                          {report.team.members.map((m, i) => (
                            <span key={i} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold">
                              {m.name}{m.enrollment ? ` · ${m.enrollment}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Score rings */}
                  <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70 mb-1">Overall Result</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-6xl font-black">{Math.round(report.scores.total ?? 0)}</span>
                          <span className="text-xl opacity-50">/100</span>
                          <span className="text-3xl font-black opacity-90 ml-2">{report.scores.grade}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block opacity-10 text-[120px] font-black leading-none select-none">{report.scores.grade}</div>
                    </div>
                    {/* Score bars */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ScoreBar label="Code Quality" score={report.scores.code_quality} weight="35%" />
                      <ScoreBar label="Documentation" score={report.scores.documentation} weight="25%" />
                      <ScoreBar label="Originality" score={report.scores.plagiarism_originality} weight="15%" />
                      <ScoreBar label="Report Alignment" score={report.scores.report_alignment} weight="15%" />
                    </div>
                  </div>

                  {/* Flags */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FlagBadge
                      detected={report.flags.ai_code_detected}
                      trueLabel="AI-Generated Code Detected"
                      falseLabel="No AI Code Detected"
                    />
                    <FlagBadge
                      detected={report.flags.plagiarism_detected}
                      trueLabel="Plagiarism Detected"
                      falseLabel="No Plagiarism Detected"
                    />
                  </div>

                  {/* Score breakdown table */}
                  <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ClipboardDocumentListIcon className="w-4 h-4 text-indigo-500" /> Score Breakdown
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {Object.entries(report.comprehensive_scorer.breakdown).map(([cat, pts]) => (
                        <div key={cat} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{cat}</span>
                          <span className={`text-sm font-black ${getScoreColor(pts * 3)}`}>{pts} pts</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-5 py-3 bg-indigo-50 dark:bg-indigo-900/20">
                        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Total Score</span>
                        <span className="text-sm font-black text-indigo-700 dark:text-indigo-300">{Math.round(report.scores.total ?? 0)} / 100 &nbsp;({report.scores.grade})</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CODE & AI TAB ── */}
              {activeTab === 'code' && (
                <div className="space-y-6">
                  <SectionCard
                    icon={ShieldCheckIcon}
                    iconColor="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                    title="AI Code Detector"
                    score={report.ai_code_detector.score}
                    riskLevel={report.ai_code_detector.risk_level}
                    summary={report.ai_code_detector.summary}
                  >
                    <FlagBadge
                      detected={report.ai_code_detector.detected}
                      trueLabel="AI-Generated Code Patterns Found"
                      falseLabel="Code Appears Human-Authored"
                    />
                    {report.ai_code_detector.score != null && (
                      <div className="mt-4">
                        <ScoreBar label="AI Detection Score (higher = more likely human)" score={report.ai_code_detector.score} />
                      </div>
                    )}
                    {Object.keys(report.ai_code_detector.details || {}).length > 0 && (
                      <DetailTable data={report.ai_code_detector.details} />
                    )}
                  </SectionCard>

                  <SectionCard
                    icon={CodeBracketIcon}
                    iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    title="Code Analysis"
                    score={report.code_analysis.score}
                    grade={report.code_analysis.grade}
                    summary={report.code_analysis.summary}
                  >
                    <ScoreBar label="Code Quality Score" score={report.code_analysis.score} />
                    {Object.keys(report.code_analysis.details || {}).length > 0 && (
                      <DetailTable data={report.code_analysis.details} />
                    )}
                  </SectionCard>
                </div>
              )}

              {/* ── DOCS & REPORT TAB ── */}
              {activeTab === 'docs' && (
                <div className="space-y-6">
                  <SectionCard
                    icon={DocumentTextIcon}
                    iconColor="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    title="Documentation Evaluator"
                    score={report.doc_evaluator.score}
                    grade={report.doc_evaluator.grade}
                    summary={report.doc_evaluator.summary}
                  >
                    <ScoreBar label="Documentation Score" score={report.doc_evaluator.score} />
                    {Object.keys(report.doc_evaluator.details || {}).length > 0 && (
                      <DetailTable data={report.doc_evaluator.details} />
                    )}
                  </SectionCard>

                  <SectionCard
                    icon={ClipboardDocumentListIcon}
                    iconColor="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    title="Report Aligner"
                    score={report.report_aligner.score}
                    grade={report.report_aligner.grade}
                    summary={report.report_aligner.summary}
                  >
                    <ScoreBar label="Report Alignment Score" score={report.report_aligner.score} />
                    {Object.keys(report.report_aligner.details || {}).length > 0 && (
                      <DetailTable data={report.report_aligner.details} />
                    )}
                  </SectionCard>
                </div>
              )}

              {/* ── ORIGINALITY TAB ── */}
              {activeTab === 'plagiarism' && (
                <div className="space-y-6">
                  <SectionCard
                    icon={MagnifyingGlassIcon}
                    iconColor="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                    title="Plagiarism Detector"
                    score={report.plagiarism_detector.originality_score}
                    riskLevel={report.plagiarism_detector.risk_level}
                    summary={report.plagiarism_detector.summary}
                  >
                    <FlagBadge
                      detected={report.plagiarism_detector.detected}
                      trueLabel="Potential Plagiarism Detected — Manual Review Required"
                      falseLabel="Submission Is Substantially Original"
                    />
                    <div className="mt-4">
                      <ScoreBar label="Originality Score (higher = more original)" score={report.plagiarism_detector.originality_score} />
                    </div>
                    {Object.keys(report.plagiarism_detector.details || {}).length > 0 && (
                      <DetailTable data={report.plagiarism_detector.details} />
                    )}
                  </SectionCard>
                </div>
              )}

              {/* ── FEEDBACK TAB ── */}
              {activeTab === 'feedback' && (
                <div className="space-y-6">
                  {/* AI Feedback */}
                  <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-500">
                        <StarIcon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white">AI-Generated Feedback</h3>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {report.feedback_generator.ai_feedback}
                      </p>
                    </div>
                  </div>

                  {/* Faculty feedback */}
                  {report.feedback_generator.professor_feedback && (
                    <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-emerald-100 dark:border-emerald-900/30 overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-100 dark:border-emerald-900/30">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                          <ChatBubbleLeftRightIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Faculty Comments</h3>
                        {report.feedback_generator.professor_score_override != null && (
                          <span className="ml-auto text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            Override Score: {report.feedback_generator.professor_score_override}/100
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {report.feedback_generator.professor_feedback}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Finalization status */}
                  <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border font-bold text-sm ${
                    report.feedback_generator.is_finalized
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                  }`}>
                    {report.feedback_generator.is_finalized
                      ? <><CheckBadgeIcon className="w-5 h-5" /> Evaluation Finalized {report.feedback_generator.finalized_at ? `on ${report.feedback_generator.finalized_at.slice(0, 10)}` : ''}</>
                      : <><ExclamationTriangleIcon className="w-5 h-5" /> Evaluation Pending Faculty Finalization</>
                    }
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Detail Table subcomponent ───────────────────────────────────────────────

const DetailTable = ({ data }) => {
  const entries = Object.entries(data)
    .filter(([, v]) => typeof v !== 'object' || v === null)
    .slice(0, 12);
  if (!entries.length) return null;

  const fmt = (v) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'number') return String(Math.round(v * 100) / 100);
    return String(v).slice(0, 200);
  };

  return (
    <div className="mt-4 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <table className="w-full text-xs">
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {entries.map(([k, v]) => (
            <tr key={k} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
              <td className="px-4 py-2.5 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-2/5 break-all">{k.replace(/_/g, ' ')}</td>
              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{fmt(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportModal;
