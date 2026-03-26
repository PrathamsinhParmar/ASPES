import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { projectService } from '../../services/projectService';
import { evaluationService } from '../../services/evaluationService';
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
    .required('Please select a programming language')
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
    defaultValues: { programming_language: 'python' }
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
        progress = 0;
        stepIdx = Math.min(stepIdx + 1, AI_STEPS.length - 1);
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
    
    if (isFaculty) {
      if (data.team_name) formData.append('team_name', data.team_name);
      if (selectedGroupId) formData.append('group_id', selectedGroupId);
      
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
    const overallPct = aiStatus === 'COMPLETED' ? 100 : Math.round(((currentStep / AI_STEPS.length) * 100) + (stepProgress / AI_STEPS.length));
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_50%)]"></div>
        <div className="w-full max-w-xl relative z-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 animate-pulse">
              <CpuChipIcon className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">AI Evaluation Engine</h2>
            <p className="text-slate-400 mt-2 text-sm font-medium">Deep analysis initiated. Do not close this session.</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-end mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Overall Analysis</span>
              <span className="text-3xl font-black text-indigo-400 tracking-tighter">{overallPct}%</span>
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
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in py-10 min-h-screen relative">
      {/* Dynamic Backgrounds */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px] -z-10"></div>

      <div className="space-y-12">

        {/* Top Section: Centered Header & Description */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Project <span className="text-indigo-600 dark:text-indigo-400">Submission</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
            Submit your source code and documentation for a multi-layered AI analysis,
            cross-plagiarism check, and modular evaluation.
          </p>
        </div>

        {/* Modern Horizontal Stepper */}
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-4">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm transition-all shadow-sm
                ${step > s ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                  step === s ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none ring-4 ring-indigo-50 dark:ring-indigo-500/10' :
                    'bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-700 border border-slate-100 dark:border-slate-800'}`}
              >
                {step > s ? <CheckCircleIcon className="w-5 h-5" /> : `0${s}`}
              </div>
              <div className={`hidden sm:block text-left ${step < s ? 'opacity-40' : ''}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-tight">Step {s}</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  {s === 1 ? 'Metadata' : s === 2 ? 'Artifacts' : 'Validation'}
                </p>
              </div>
              {s < 3 && <div className="hidden lg:block w-12 h-px bg-slate-200 dark:bg-slate-800 mx-2"></div>}
            </div>
          ))}
        </div>

        {/* Submission Form Area (Vertical & Centered) */}
        <div className="space-y-8 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">

            {step === 1 && (
              <div className="space-y-8">
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Project Title</label>
                    <input
                      {...register('title')}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-700/50 focus:border-indigo-500 rounded-xl transition-all outline-none text-sm font-semibold text-slate-800 dark:text-white"
                      placeholder="e.g. Distributed Task Orchestrator"
                    />
                    {errors.title && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase ml-1">{errors.title.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Contextual Summary</label>
                    <textarea
                      {...register('description')}
                      rows="4"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-700/50 focus:border-indigo-500 rounded-xl transition-all outline-none text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed"
                      placeholder="Describe architectural patterns, state management, and core logic flow..."
                    />
                  </div>

                  <div className="space-y-2 relative" ref={dropdownRef}>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Target Platform</label>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-200 transition-all text-sm font-bold text-slate-800 dark:text-white"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg grayscale group-hover:grayscale-0">{selectedLang.icon}</span>
                        {selectedLang.name}
                      </span>
                      <div className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-2 z-50 animate-fade-in overflow-hidden">
                        {languages.map((lang) => (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => { setValue('programming_language', lang.id); setIsDropdownOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all
                              ${formValues.programming_language === lang.id ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                          >
                            <span className="text-base">{lang.icon}</span>
                            {lang.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isFaculty && (
                    <>
                      <div className="my-8 border-t border-slate-200 dark:border-slate-700/50 pt-8" />
                      
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <UserGroupIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white leading-tight uppercase tracking-widest">Team Composition</h3>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Faculty Management Data</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Team Name (Optional)</label>
                            <input
                              {...register('team_name')}
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-700/50 focus:border-indigo-500 rounded-xl transition-all outline-none text-sm font-semibold text-slate-800 dark:text-white"
                              placeholder="e.g. Alpha Devs"
                            />
                          </div>

                          <div className="space-y-2 relative">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Assign to Group</label>
                            <select
                              value={selectedGroupId}
                              onChange={(e) => setSelectedGroupId(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-700/50 focus:border-indigo-500 rounded-xl transition-all outline-none text-sm font-semibold text-slate-800 dark:text-white appearance-none"
                            >
                              <option value="">-- No Group Assigned --</option>
                              {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block border-b border-slate-200 dark:border-slate-700/50 pb-2">Student Members</label>
                          {teamMembers.map((member, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-3">
                              <input
                                placeholder="Full Name"
                                value={member.name}
                                onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:border-indigo-500 rounded-xl outline-none text-sm font-medium dark:text-white"
                              />
                              <input
                                placeholder="Enrollment / ID"
                                value={member.enrollment}
                                onChange={(e) => updateTeamMember(index, 'enrollment', e.target.value)}
                                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:bg-white dark:focus:border-indigo-500 rounded-xl outline-none text-sm font-medium dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => removeTeamMember(index)}
                                disabled={teamMembers.length === 1}
                                className="p-3 text-rose-500 bg-rose-50 dark:bg-rose-900/10 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-30 self-stretch sm:self-auto flex items-center justify-center border border-rose-100 dark:border-rose-900/30"
                              >
                                <MinusCircleIcon className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={addTeamMember}
                              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-900/30"
                            >
                              <UserPlusIcon className="w-4 h-4" /> Add Team Member
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-3 bg-slate-900 dark:bg-indigo-600 text-white px-12 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300"
                  >
                    Select Artifacts <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">01. Code Registry</p>
                    <div {...getCodeRootProps()} className={`h-60 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all cursor-pointer bg-white/40 dark:bg-slate-900/40 backdrop-blur-md
                      ${isCodeDragActive ? 'border-indigo-500 bg-indigo-50/30' : codeFile ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-800/50'}`}>
                      <input {...getCodeInputProps()} />
                      {codeFile ? (
                        <div className="text-center group">
                          <DocumentIcon className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate px-4">{codeFile.name}</p>
                          <button onClick={(e) => { e.stopPropagation(); setCodeFile(null); }} className="mt-4 text-[9px] font-black text-rose-500 uppercase tracking-widest underline underline-offset-4 decoration-rose-200">Reset</button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <CloudArrowUpIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-xs font-bold text-slate-700 uppercase">Drop Source</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-1">ZIP, PY, JS, JAVA</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">02. Documentation</p>
                    <div {...getDocRootProps()} className={`h-60 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all cursor-pointer bg-white/40 dark:bg-slate-900/40 backdrop-blur-md
                      ${isDocDragActive ? 'border-indigo-500 bg-indigo-50/30' : docFile ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-800/50'}`}>
                      <input {...getDocInputProps()} />
                      {docFile ? (
                        <div className="text-center group">
                          <DocumentTextIcon className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate px-4">{docFile.name}</p>
                          <button onClick={(e) => { e.stopPropagation(); setDocFile(null); }} className="mt-4 text-[9px] font-black text-rose-500 uppercase tracking-widest underline underline-offset-4 decoration-rose-200">Reset</button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <DocumentTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-xs font-bold text-slate-700 uppercase">Drop Report</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-1">PDF, MD, TXT</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6">
                  <button onClick={prevStep} className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">Back to Meta</button>
                  <button
                    disabled={!codeFile || !docFile}
                    onClick={nextStep}
                    className="bg-indigo-600 text-white px-10 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:shadow-none"
                  >
                    Proceed to Review
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
                  <div className="relative z-10 space-y-8">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400">Final Verification</h3>

                    <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase">Project Title</p>
                        <p className="text-lg font-bold truncate leading-none">{formValues.title}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase">Target Runtime</p>
                        <p className="text-lg font-bold capitalize leading-none">{formValues.programming_language}</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-800 dark:border-slate-700">
                      <div className="flex items-center gap-4 bg-slate-800/50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-700/50">
                        <DocumentIcon className="w-6 h-6 text-indigo-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase">Source Registry</p>
                          <p className="text-xs font-bold truncate">{codeFile?.name}</p>
                        </div>
                        <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                        <DocumentTextIcon className="w-6 h-6 text-emerald-400" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase">Academic Documentation</p>
                          <p className="text-xs font-bold truncate">{docFile?.name}</p>
                        </div>
                        <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {uploading ? (
                  <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-2xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest">Bridging secure connection...</span>
                      <span className="text-2xl font-black">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-indigo-900/30 rounded-full h-1.5 backdrop-blur-sm overflow-hidden">
                      <div className="bg-white h-full transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.7)]" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button onClick={prevStep} className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm border border-slate-100 dark:border-slate-700 transition-all">Revise Input</button>
                    <button type="submit" id="confirm-execute-btn" className="flex-[2] py-4 bg-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">Analysis</button>
                  </div>
                )}
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectUpload;
