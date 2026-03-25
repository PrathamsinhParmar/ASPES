import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { ChartBarIcon, DocumentIcon, CodeBracketIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef(null);

  const fetchProject = async () => {
    try {
      const data = await projectService.getProject(id);
      setProject(data);

      // If evaluation is complete, navigate directly to results
      if (data.evaluation && data.evaluation.status === 'completed') {
        clearInterval(pollingRef.current);
        navigate(`/evaluations/${data.evaluation.id}`, { replace: true });
        return;
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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-gray-500 mt-2">{project.course_name}</p>
        </div>
        <div className={`px-4 py-1 rounded-full font-bold uppercase text-sm ${
          project.status === 'published' || project.status === 'evaluated'
            ? 'bg-green-100 text-green-700' 
            : project.status === 'under_evaluation'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {project.status.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-xl font-bold mb-4">Description</h3>
             <p className="text-gray-600 leading-relaxed">{project.description || "No description provided."}</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-xl font-bold mb-4">Assets</h3>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                   <div className="flex items-center gap-3">
                      <CodeBracketIcon className="w-6 h-6 text-gray-400" />
                      <span className="font-medium">Source Code Bundle</span>
                   </div>
                   <span className="text-sm text-gray-500">Stored Securely</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                   <div className="flex items-center gap-3">
                      <DocumentIcon className="w-6 h-6 text-gray-400" />
                      <span className="font-medium">Academic Report</span>
                   </div>
                   <span className="text-sm text-gray-500">Stored Securely</span>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           {project.evaluation && project.evaluation.status === 'completed' ? (
              <div className="bg-blue-600 p-8 rounded-2xl shadow-lg text-white">
                 <h3 className="text-lg font-bold mb-2">Evaluation Summary</h3>
                 <div className="text-5xl font-black mb-4">
                   {project.evaluation.total_score != null
                     ? Math.round(project.evaluation.total_score)
                     : '—'}
                   <span className="text-xl opacity-60">/100</span>
                 </div>
                 <Link 
                   to={`/evaluations/${project.evaluation.id}`}
                   className="block w-full text-center py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors"
                 >
                   View AI Layers
                 </Link>
              </div>
           ) : project.evaluation && project.evaluation.status === 'failed' ? (
              <div className="bg-red-50 p-8 rounded-2xl border border-red-200">
                 <h3 className="text-lg font-bold text-red-900 mb-2">Evaluation Failed</h3>
                 <p className="text-sm text-red-600 mb-4">The AI evaluation encountered an error. Please try resubmitting your project.</p>
                 <Link to="/projects/new" className="block w-full text-center py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors">
                   Resubmit
                 </Link>
              </div>
           ) : (
              /* Pending / Processing — with live polling indicator */
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700 text-white">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                   <h3 className="text-lg font-bold">AI Engine Running</h3>
                 </div>
                 <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                   The automated evaluation system is analysing your project. This page refreshes automatically every few seconds.
                 </p>

                 {/* Animated processing indicator */}
                 <div className="space-y-3">
                   {['Code Quality Analysis', 'AI Detection Scan', 'Plagiarism Check', 'Report Alignment'].map((step, i) => (
                     <div key={i} className="flex items-center gap-3">
                       <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                         i === 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-700'
                       }`}>
                         {i === 0 && <ArrowPathIcon className="w-3 h-3 text-white animate-spin" />}
                       </div>
                       <span className={`text-xs font-bold ${i === 0 ? 'text-blue-300' : 'text-gray-600'}`}>{step}</span>
                     </div>
                   ))}
                 </div>

                 <p className="mt-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                   Auto-refreshing... you&apos;ll be redirected automatically.
                 </p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
