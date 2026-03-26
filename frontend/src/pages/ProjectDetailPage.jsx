import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { ChartBarIcon, DocumentIcon, CodeBracketIcon, ArrowPathIcon, CheckCircleIcon, UserGroupIcon, IdentificationIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef(null);
  const { user } = useAuth();

  const [evalNotes, setEvalNotes] = useState('');
  const [evaluating, setEvaluating] = useState(false);

  const handleEvaluate = async () => {
    if (!window.confirm("Are you sure you want to confirm your evaluation? This will mark the project as 'Evaluated'.")) return;
    try {
      setEvaluating(true);
      const formData = new FormData();
      if (evalNotes) formData.append('faculty_comments', evalNotes);
      
      await projectService.evaluateProject(id, formData);
      toast.success("Project marked as Evaluated successfully!");
      fetchProject();
    } catch (err) {
      console.error(err);
      toast.error("Failed to evaluate project. Please try again.");
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

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto dark:text-white text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10">
        <div>
          <div className="flex flex-wrap items-center gap-3">
             <h1 className="text-3xl lg:text-4xl font-black dark:text-white text-slate-900 tracking-tight">
               {project.title}
             </h1>
             <div className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] tracking-widest ${
               project.status === 'published' || project.status === 'evaluated'
                 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                 : project.status === 'under_evaluation'
                 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                 : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
             }`}>
               {project.status.replace(/_/g, ' ')}
             </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {project.course_name}
          </p>
        </div>
        
        {project.team_name && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 px-4 py-2 rounded-2xl flex items-center gap-3">
             <div className="p-2 bg-indigo-500 rounded-lg text-white">
                <UserGroupIcon className="w-4 h-4" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest leading-none mb-1">Team</p>
                <p className="font-bold text-sm dark:text-indigo-200">{project.team_name}</p>
             </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-8 space-y-8">
           {/* Expandable Description Section */}
           <div className="bg-white dark:bg-[#161B22] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col transition-all">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 font-bold">
                    <ChartBarIcon className="w-5 h-5" />
                 </div>
                 <h3 className="text-xl font-black dark:text-slate-200 tracking-tight">Project Description</h3>
              </div>
              <p className="text-slate-600 dark:text-gray-400 text-base leading-relaxed whitespace-pre-wrap">{project.description || "No description provided."}</p>
           </div>

           {/* Collaborators Section */}
           {project.team_members && (
             <div className="bg-white dark:bg-[#161B22] p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <UserGroupIcon className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-bold dark:text-slate-200">Collaborators</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {(() => {
                    try {
                      const members = typeof project.team_members === 'string' ? JSON.parse(project.team_members) : project.team_members;
                      return members?.map((member, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all group">
                          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm group-hover:scale-110 transition-transform">
                            <IdentificationIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">{member.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{member.enrollment}</p>
                          </div>
                        </div>
                      ));
                    } catch(e) { return <p className="text-xs text-gray-400 dark:text-gray-500 italic">Unable to retrieve team metadata</p>; }
                  })()}
                </div>
             </div>
           )}

           {/* Read-Only Faculty Feedback Section for Students/Others */}
           {(project.status === 'evaluated' || project.status === 'published') && project.evaluation?.professor_feedback && user?.role !== 'faculty' && user?.role !== 'professor' && (
             <div className="bg-white dark:bg-[#161B22] p-8 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 transition-all">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <ClipboardDocumentCheckIcon className="w-5 h-5" />
                   </div>
                   <h3 className="text-xl font-black dark:text-slate-200 tracking-tight">Faculty Evaluation</h3>
                </div>
                

                <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Evaluator Notes</p>
                  <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed whitespace-pre-wrap">
                    {project.evaluation.professor_feedback}
                  </p>
                </div>
             </div>
           )}

           {/* Faculty Evaluation Section */}
           {(user?.role === 'faculty' || user?.role === 'professor') && project.status !== 'published' && (
             <div className="bg-white dark:bg-[#161B22] p-8 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <ClipboardDocumentCheckIcon className="w-5 h-5" />
                   </div>
                   <h3 className="text-xl font-black dark:text-slate-200 tracking-tight">Faculty Evaluation</h3>
                </div>
                
                {project.status === 'evaluated' ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <p className="text-emerald-700 dark:text-emerald-400 font-bold mb-2">Project Already Evaluated</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-500 mb-4">You have successfully evaluated this project. You can edit your notes and score below if needed.</p>
                  </div>
                ) : null}

                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Evaluation Notes & Comments</label>
                    <textarea 
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white min-h-[120px]"
                      placeholder="Add your feedback, notes, or remarks here..."
                      value={project.status === 'evaluated' && !evalNotes && project.evaluation?.professor_feedback ? project.evaluation.professor_feedback : evalNotes}
                      onChange={(e) => setEvalNotes(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <button 
                      onClick={handleEvaluate}
                      disabled={evaluating}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      {evaluating ? 'Processing...' : project.status === 'evaluated' ? 'Update Evaluation' : 'Mark as Evaluated'}
                    </button>
                  </div>
                </div>
             </div>
           )}
        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-4 space-y-6">
           {/* Evaluation Result / Action Area */}
           {project.evaluation && project.evaluation.status === 'completed' ? (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl shadow-blue-500/10 text-white relative overflow-hidden">
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-5 rounded-full"></div>
                 <h3 className="text-sm font-extrabold mb-6 uppercase tracking-[0.2em] opacity-80">Final Score</h3>
                 <div className="flex items-baseline gap-2 mb-8">
                   <span className="text-7xl font-black tracking-tighter">
                     {project.evaluation.total_score != null ? Math.round(project.evaluation.total_score) : '—'}
                   </span>
                   <span className="text-2xl font-bold opacity-40">/100</span>
                 </div>
                 <Link 
                   to={`/evaluations/${project.evaluation.id}`}
                   className="flex items-center justify-center gap-2 w-full py-4 bg-white text-blue-700 font-extrabold rounded-2xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl active:scale-95 group"
                 >
                   <span>View Analysis</span>
                   <ArrowPathIcon className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
                 </Link>
              </div>
           ) : project.evaluation && project.evaluation.status === 'failed' ? (
              <div className="bg-white dark:bg-[#161B22] p-8 rounded-3xl border border-red-100 dark:border-red-900/30 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <CheckCircleIcon className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-red-400 mb-2 tracking-tight">Analysis Failed</h3>
                 <p className="text-sm text-slate-500 dark:text-red-300/60 mb-8 max-w-[200px]">The AI engine encountered an obstacle parsing this submission.</p>
                 <Link to="/projects/new" className="group relative overflow-hidden flex items-center justify-center w-full py-4 rounded-2xl shadow-xl shadow-red-500/20 text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all duration-300 border border-red-400/20">
                   <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                   <span className="relative">Restart Analysis</span>
                 </Link>
              </div>
           ) : (
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-white shadow-2xl">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                    <h3 className="text-lg font-bold">AI Running</h3>
                 </div>
                 <p className="text-xs text-gray-400 mb-8 leading-relaxed opacity-70">
                   System is currently evaluating project files. Results update automatically.
                 </p>
                 <div className="space-y-4">
                   {['Core Analysis', 'Security Scan', 'Doc Review'].map((step, i) => (
                     <div key={i} className="flex items-center gap-3">
                       <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></div>
                       <span className={`text-[10px] font-bold ${i === 0 ? 'text-blue-300' : 'text-slate-600'}`}>{step}</span>
                     </div>
                   ))}
                 </div>
              </div>
           )}




           {/* Repositioned Resources Section */}
           <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                    <DocumentIcon className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold dark:text-slate-200">Resources</h3>
              </div>
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                    <div className="flex items-center gap-3">
                       <CodeBracketIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                       <span className="text-sm font-semibold dark:text-slate-300">Source Bundle</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-tighter">Secured</span>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                    <div className="flex items-center gap-3">
                       <DocumentIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                       <span className="text-sm font-semibold dark:text-slate-300">Technical Report</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-tighter">Secured</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
