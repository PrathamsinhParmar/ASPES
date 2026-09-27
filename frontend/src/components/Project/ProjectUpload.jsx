import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { projectService } from '../../services/projectService';
import { evaluationService } from '../../services/evaluationService';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/groupService';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  CpuChipIcon,
  SparklesIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserPlusIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline';
import { formatLanguageName } from '../../utils/languageFormatter';

/**
 * Validation Schema
 */
const schema = yup.object().shape({
  title: yup.string()
    .required('Project title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: yup.string(),
  programming_language: yup.string()
    .required('Please select a programming language'),
  live_link: yup.string()
    .test('is-url', 'Must be a valid URL (https://...)', value => !value || /^https?:\/\//.test(value)),
  github_repo_link: yup.string()
    .test('is-url', 'Must be a valid URL (https://...)', value => !value || /^https?:\/\//.test(value))
});

// AI processing steps shown on the animated processing screen
const AI_STEPS = [
  { id: 1, label: 'Uploading project files to secure storage', icon: CloudArrowUpIcon, duration: 15 },
  { id: 2, label: 'Running static code quality analysis', icon: CpuChipIcon, duration: 30 },
  { id: 3, label: 'Detecting AI-generated code signatures', icon: SparklesIcon, duration: 25 },
  { id: 4, label: 'Evaluating documentation coherence', icon: DocumentTextIcon, duration: 20 },
  { id: 5, label: 'Cross-checking plagiarism database', icon: ShieldCheckIcon, duration: 25 },
  { id: 6, label: 'Generating comprehensive AI feedback', icon: SparklesIcon, duration: 20 },
  { id: 7, label: 'Aggregating scores & finalising report', icon: CheckCircleIcon, duration: 15 },
];

const ProjectUpload = () => {
  const { user } = useAuth();
  const normRole = (user?.role || '').toString().trim().toUpperCase();
  const isFaculty = normRole === 'PROFESSOR' || normRole === 'FACULTY' || normRole === 'ADMIN';
  const urlParams = new URLSearchParams(window.location.search);
  const initialGroupId = urlParams.get('groupId') || '';

  const [step, setStep] = useState(1);
  const [codeFile, setCodeFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Faculty Specific State
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId);
  const [teamMembers, setTeamMembers] = useState([{ name: '', enrollment: '' }]);
  const [teamName, setTeamName] = useState('');

  // Faculty list (for student selection)
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [facultyListLoading, setFacultyListLoading] = useState(false);

  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // AI processing state
  const [processing, setProcessing] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [evaluationId, setEvaluationId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [aiStatus, setAiStatus] = useState('PENDING');

  const pollingRef = useRef(null);
  const stepTimerRef = useRef(null);

  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { programming_language: 'python' },
    shouldUnregister: false
  });

  const formValues = watch();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    if (isFaculty) {
      groupService.getGroups().then(data => setGroups(data)).catch(err => console.error(err));
    }

    // Fetch faculty list for all users (students need it for selection)
    // Using dedicated /faculty-list/ endpoint to avoid routing conflicts in /users/*
    setFacultyListLoading(true);
    api.get('/faculty-list')
      .then(res => {
        setFacultyList(res.data);
        if (res.data.length === 0) {
          toast.warn('No faculty members found. Please contact your administrator.');
        }
      })
      .catch(err => {
        console.error('Failed to load faculty list:', err);
        toast.error(`Could not load faculty list: ${err.message || 'Unknown error'}`);
      })
      .finally(() => setFacultyListLoading(false));

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, [isFaculty]);

  const addTeamMember = () => setTeamMembers([...teamMembers, { name: '', enrollment: '' }]);
  const removeTeamMember = (index) => setTeamMembers(teamMembers.filter((_, i) => i !== index));
  const updateTeamMember = (index, field, value) => {
    const newMembers = [...teamMembers];
    newMembers[index][field] = value;
    setTeamMembers(newMembers);
  };

  const languages = [
    { id: 'python', name: 'Python 3.x', icon: '🐍' },
    { id: 'javascript', name: 'JavaScript / Node.js', icon: 'js' },
    { id: 'java', name: 'Java SE', icon: '☕' },
    { id: 'cpp', name: 'C++ Standard', icon: '++' },
  ];

  const selectedLang = languages.find(l => l.id === formValues.programming_language) || languages[0];

  const startStepAnimation = () => {
    let stepIdx = 0;
    let progress = 0;
    const TICK_MS = 200;

    stepTimerRef.current = setInterval(() => {
      if (stepIdx >= AI_STEPS.length) {
        clearInterval(stepTimerRef.current);
        return;
      }
      const stepDurationTicks = (AI_STEPS[stepIdx].duration * 1000) / TICK_MS;
      progress += (100 / stepDurationTicks);
      if (progress >= 100) {
        if (stepIdx < AI_STEPS.length - 1) {
          progress = 0;
          stepIdx++;
        } else {
          progress = 100;
        }
      }
      setCurrentStep(stepIdx);
      setStepProgress(Math.min(Math.round(progress), 99));
    }, TICK_MS);
  };

  const startPolling = (projId) => {
    pollingRef.current = setInterval(async () => {
      try {
        const project = await projectService.getProject(projId);
        const evaluation = project.evaluation;
        if (!evaluation) return;
        setEvaluationId(evaluation.id);
        if (evaluation.status === 'completed') {
          clearInterval(pollingRef.current);
          clearInterval(stepTimerRef.current);
          setAiStatus('COMPLETED');
          setCurrentStep(AI_STEPS.length - 1);
          setStepProgress(100);
          await new Promise(res => setTimeout(res, 1500));
          navigate(`/evaluations/${evaluation.id}`);
        } else if (evaluation.status === 'failed') {
          clearInterval(pollingRef.current);
          clearInterval(stepTimerRef.current);
          setAiStatus('FAILED');
          toast.error('AI Evaluation failed. Please try resubmitting.');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);
  };

  const { getRootProps: getCodeRootProps, getInputProps: getCodeInputProps, isDragActive: isCodeDragActive } = useDropzone({
    accept: { 'application/zip': ['.zip'], 'text/x-python': ['.py'], 'text/javascript': ['.js', '.jsx'], 'text/x-java': ['.java'], 'text/x-c++src': ['.cpp', '.cc'] },
    maxFiles: 1, maxSize: 50 * 1024 * 1024,
    onDrop: (acceptedFiles) => { if (acceptedFiles?.length) setCodeFile(acceptedFiles[0]); }
  });

  const { getRootProps: getDocRootProps, getInputProps: getDocInputProps, isDragActive: isDocDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'text/markdown': ['.md'], 'text/plain': ['.txt'] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles) => { if (acceptedFiles?.length) setDocFile(acceptedFiles[0]); }
  });

  const onSubmit = async (data) => {
    if (!codeFile || !docFile) {
      toast.error('Please upload both code and documentation files');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('programming_language', data.programming_language);
    
    if (data.live_link) formData.append('live_link', data.live_link);
    if (data.github_repo_link) formData.append('github_repo_link', data.github_repo_link);
    
    if (isFaculty) {
      if (data.team_name) formData.append('team_name', data.team_name);
      if (selectedGroupId) formData.append('group_id', selectedGroupId);
      
      const validMembers = teamMembers.filter(m => m.name.trim() || m.enrollment.trim());
      if (validMembers.length > 0) {
        formData.append('team_members', JSON.stringify(validMembers));
      }
    } else {
      // Student submission
      if (!selectedFacultyId) {
        toast.error('Please select a faculty member to assign this project to.');
        setUploading(false);
        return;
      }
      formData.append('faculty_id', selectedFacultyId);
      if (teamName) formData.append('team_name', teamName);
      const validMembers = teamMembers.filter(m => m.name.trim() || m.enrollment.trim());
      if (validMembers.length > 0) {
        formData.append('team_members', JSON.stringify(validMembers));
      }
    }

    formData.append('code_file', codeFile);
    formData.append('doc_file', docFile);

    try {
      const response = await projectService.uploadProject(formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentValue = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentValue);
          }
        }
      });
      setProjectId(response.id);
      setUploading(false);
      setProcessing(true);
      setAiStatus('PROCESSING');
      startStepAnimation();
      startPolling(response.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Project submission failed.');
      setUploading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formValues.title || formValues.title.length < 3)) {
      toast.error('Please enter a valid project title'); return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  if (processing) {
    const stepWeight = 100 / AI_STEPS.length;
    const overallPct = aiStatus === 'COMPLETED'
      ? 100
      : Math.min(99, Math.round((currentStep * stepWeight) + (stepProgress / 100) * stepWeight));
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_50%)]"></div>
        <div className="w-full max-w-xl relative z-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 animate-pulse">
              <CpuChipIcon className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">AI Evaluation Engine</h2>
            <p className="text-slate-400 mt-2 text-sm font-medium">Deep analysis initiated. Do not close this session.</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Overall Analysis</span>
              <span className="text-3xl font-bold text-indigo-400 tracking-tighter">{overallPct}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${overallPct}%` }}></div>
            </div>
            <div className="mt-8 space-y-4">
              {AI_STEPS.map((s, idx) => {
                const isDone = idx < currentStep || aiStatus === 'COMPLETED';
                const isActive = idx === currentStep && aiStatus !== 'COMPLETED';
                return (
                  <div key={s.id} className={`flex items-center gap-4 transition-all ${isActive ? 'translate-x-2' : 'opacity-60'}`}>
                    <div className={`h-2 w-2 rounded-full ${isDone ? 'bg-emerald-400' : isActive ? 'bg-indigo-400 animate-ping' : 'bg-slate-700'}`}></div>
                    <p className={`text-xs font-bold leading-none ${isDone ? 'text-emerald-400' : isActive ? 'text-white' : 'text-slate-500'}`}>{s.label}</p>
                    {isActive && <div className="flex-1 h-px bg-slate-800 ml-4"></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in py-6 min-h-screen relative font-sans text-slate-900 dark:text-white">
      <div className="space-y-8">
        {/* Top Section: Header & Description */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Project <span className="text-indigo-600 dark:text-indigo-400">Submission</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
            Submit your source repository and documentation for automated AI code evaluation, documentation review, and plagiarism checks.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all shadow-xs
                ${step > s ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                  step === s ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-slate-700/80'}`}
              >
                {step > s ? <CheckCircleIcon className="w-4 h-4" /> : `0${s}`}
              </div>
              <div className={`hidden sm:block text-left ${step < s ? 'opacity-40' : ''}`}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Step {s}</p>
                <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                  {s === 1 ? 'Metadata' : s === 2 ? 'Artifacts' : 'Validation'}
                </p>
              </div>
              {s < 3 && <div className="hidden sm:block w-8 h-px bg-slate-200 dark:bg-slate-800 ml-2"></div>}
            </div>
          ))}
        </div>

        {/* Submission Form Area (Vertical & Centered) */}
        <div className="space-y-8 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit, (errs) => { console.error('Validation errors:', errs); toast.error('Validation failed. Check the fields in step 1 or 2.'); })} className="space-y-10">

            <div className={step === 1 ? 'block' : 'hidden'}>
              <div className="space-y-6">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_24px_rgba(0,0,0,0.35)] space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Project Title <span className="text-rose-500">*</span></label>
                    <input
                      {...register('title')}
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 rounded-lg transition-colors outline-none text-xs sm:text-sm font-medium text-slate-900 dark:text-white"
                      placeholder="e.g. Distributed Task Orchestrator"
                    />
                    {errors.title && <p className="text-rose-500 text-xs font-medium mt-1">{errors.title.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Contextual Summary</label>
                    <textarea
                      {...register('description')}
                      rows="3"
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 rounded-lg transition-colors outline-none text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-300 leading-relaxed resize-y"
                      placeholder="Describe architectural patterns, state management, and core logic flow..."
                    />
                  </div>

                  <div className="space-y-1.5 relative" ref={dropdownRef}>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Target Platform / Language</label>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-base">{selectedLang.icon}</span>
                        {formatLanguageName(selectedLang.name)}
                      </span>
                      <div className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200/80 dark:border-slate-700 p-1.5 z-50 animate-fade-in overflow-hidden">
                        {languages.map((lang) => (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => { setValue('programming_language', lang.id); setIsDropdownOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors
                              ${formValues.programming_language === lang.id ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                          >
                            <span className="text-sm">{lang.icon}</span>
                            {formatLanguageName(lang.name)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Project Links Section */}
                  <>
                    <div className="my-8 border-t border-slate-200 dark:border-slate-700/50 pt-8" />
                    
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight uppercase tracking-widest">Project Links</h3>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Optional URLs</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Live Link (Optional)</label>
                          <input
                            {...register('live_link')}
                            className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 rounded-lg transition-colors outline-none text-xs sm:text-sm font-medium text-slate-900 dark:text-white"
                            placeholder="https://your-project-live-url.com"
                          />
                          {errors.live_link && <p className="text-rose-500 text-xs font-medium mt-1">{errors.live_link.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">GitHub Repository Link</label>
                          <input
                            {...register('github_repo_link')}
                            className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 rounded-lg transition-colors outline-none text-xs sm:text-sm font-medium text-slate-900 dark:text-white"
                            placeholder="https://github.com/username/repo"
                          />
                          {errors.github_repo_link && <p className="text-rose-500 text-xs font-medium mt-1">{errors.github_repo_link.message}</p>}
                        </div>
                      </div>
                    </div>
                  </>

                  {/* Team & Faculty Section */}
                  <>
                    <div className="my-6 border-t border-slate-200/80 dark:border-slate-800 pt-6" />
                    
                    <div className="space-y-5">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                        <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          <UserGroupIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 dark:text-white leading-tight uppercase tracking-wider">Team Composition</h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Team Name (Optional)</label>
                          {isFaculty ? (
                            <input
                              {...register('team_name')}
                              className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 rounded-lg transition-colors outline-none text-xs sm:text-sm font-medium text-slate-900 dark:text-white"
                              placeholder="e.g. Alpha Devs"
                            />
                          ) : (
                            <input
                              value={teamName}
                              onChange={e => setTeamName(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 rounded-lg transition-colors outline-none text-xs sm:text-sm font-medium text-slate-900 dark:text-white"
                              placeholder="e.g. Alpha Devs"
                            />
                          )}
                        </div>

                        {isFaculty ? (
                          <div className="space-y-1.5 relative">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Assign to Group</label>
                            <select
                              value={selectedGroupId}
                              onChange={(e) => setSelectedGroupId(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 rounded-lg transition-colors outline-none text-xs sm:text-sm font-medium text-slate-900 dark:text-white appearance-none"
                            >
                              <option value="">-- No Group Assigned --</option>
                              {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-1.5 relative">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Assigned Faculty <span className="text-rose-500">*</span></label>
                            <select
                              value={selectedFacultyId}
                              onChange={(e) => setSelectedFacultyId(e.target.value)}
                              required
                              disabled={facultyListLoading}
                              className="w-full px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 rounded-lg transition-colors outline-none text-xs sm:text-sm font-medium text-slate-900 dark:text-white appearance-none disabled:opacity-60"
                            >
                              <option value="">
                                {facultyListLoading ? 'Loading faculty...' : facultyList.length === 0 ? '-- No faculty available --' : '-- Select a Faculty Member --'}
                              </option>
                              {facultyList.map(f => (
                                <option key={f.id} value={f.id}>{f.full_name}{f.department ? ` (${f.department})` : ''}</option>
                              ))}
                            </select>
                            {!facultyListLoading && facultyList.length === 0 && (
                              <p className="text-[10px] text-rose-500 font-semibold mt-1">⚠ No faculty found. Please contact administration.</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 pt-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Team Members</label>
                        {teamMembers.map((member, index) => (
                          <div key={index} className="flex flex-col sm:flex-row gap-2.5">
                            <input
                              placeholder="Full Name"
                              value={member.name}
                              onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                              className="flex-1 px-3.5 py-2 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:border-indigo-500 rounded-lg outline-none text-xs sm:text-sm text-slate-900 dark:text-white"
                            />
                            <input
                              placeholder="Enrollment / ID"
                              value={member.enrollment}
                              onChange={(e) => updateTeamMember(index, 'enrollment', e.target.value)}
                              className="flex-1 px-3.5 py-2 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:border-indigo-500 rounded-lg outline-none text-xs sm:text-sm text-slate-900 dark:text-white font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => removeTeamMember(index)}
                              disabled={teamMembers.length === 1}
                              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors disabled:opacity-30 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80"
                            >
                              <MinusCircleIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={addTeamMember}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-200/50 dark:border-indigo-800/50"
                          >
                            <UserPlusIcon className="w-3.5 h-3.5" /> Add Member
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
                  >
                    <span>Proceed to Artifacts</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className={step === 2 ? 'block' : 'hidden'}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">01. Source Code Repository</p>
                    <div {...getCodeRootProps()} className={`h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all cursor-pointer bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm
                      ${isCodeDragActive ? 'border-indigo-500 bg-indigo-50/20' : codeFile ? 'border-emerald-500/80 bg-emerald-500/5' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                      <input {...getCodeInputProps()} />
                      {codeFile ? (
                        <div className="text-center group">
                          <DocumentIcon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate px-3 max-w-[200px]">{codeFile.name}</p>
                          <button onClick={(e) => { e.stopPropagation(); setCodeFile(null); }} className="mt-2 text-[10px] font-bold text-rose-500 hover:underline uppercase tracking-wider">Change File</button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <CloudArrowUpIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Drop Source Code</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">ZIP, PY, JS, JAVA, TS, CPP</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">02. Academic Documentation</p>
                    <div {...getDocRootProps()} className={`h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all cursor-pointer bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm
                      ${isDocDragActive ? 'border-indigo-500 bg-indigo-50/20' : docFile ? 'border-emerald-500/80 bg-emerald-500/5' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                      <input {...getDocInputProps()} />
                      {docFile ? (
                        <div className="text-center group">
                          <DocumentTextIcon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate px-3 max-w-[200px]">{docFile.name}</p>
                          <button onClick={(e) => { e.stopPropagation(); setDocFile(null); }} className="mt-2 text-[10px] font-bold text-rose-500 hover:underline uppercase tracking-wider">Change File</button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <DocumentTextIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Drop Project Report</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">PDF, DOCX, MD, TXT</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button type="button" onClick={prevStep} className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                    Back to Meta
                  </button>
                  <button
                    type="button"
                    disabled={!codeFile || !docFile}
                    onClick={nextStep}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Proceed to Review</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className={step === 3 ? 'block' : 'hidden'}>
              <div className="space-y-6">
                <div className="bg-slate-900 rounded-xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-slate-800">
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Final Verification</h3>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Ready to process</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Project Title</p>
                        <p className="text-sm font-bold text-white truncate">{formValues.title}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Runtime</p>
                        <p className="text-sm font-bold text-white leading-none">
                          {formatLanguageName(formValues.programming_language)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                        <DocumentIcon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Source Code</p>
                          <p className="text-xs font-semibold text-slate-200 truncate">{codeFile?.name}</p>
                        </div>
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                        <DocumentTextIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Documentation</p>
                          <p className="text-xs font-semibold text-slate-200 truncate">{docFile?.name}</p>
                        </div>
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>

                {uploading ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">Uploading and dispatching to AI cluster...</span>
                      <span className="font-bold text-indigo-400">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center pt-2">
                    <button 
                      type="button" 
                      onClick={prevStep} 
                      className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Revise Input
                    </button>
                    <button 
                      type="submit" 
                      id="confirm-execute-btn" 
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
                    >
                      <span>Submit for AI Evaluation</span>
                      <CheckCircleIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectUpload;
