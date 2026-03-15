import React, { useState, useEffect } from 'react';
import { projectService } from '../services/projectService';
import { Link } from 'react-router-dom';
import { FolderIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await projectService.getMyProjects();
        setProjects(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const statusColorMap = {
    draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    submitted: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
    under_evaluation: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30',
    evaluated: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30',
    published: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30',
    returned: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30'
  };

  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-8 animate-fade-in bg-slate-50/30 dark:bg-slate-950 min-h-screen relative overflow-hidden">
      
      {/* Decorative Background Glow */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-10">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Project Portfolio</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Overview of all your academic project submissions.</p>
        </div>
        <Link 
          to="/projects/new" 
          className="inline-flex items-center px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" /> New Project
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Synchronizing your projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-inner group">
           <FolderIcon className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4 group-hover:scale-110 group-hover:text-indigo-200 dark:group-hover:text-indigo-900 transition-all duration-500" />
           <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No projects archived yet.</p>
           <p className="text-sm mt-1 text-slate-500 dark:text-slate-500">Launch your first academic project to begin AI evaluation.</p>
           <Link to="/projects/new" className="mt-6 inline-flex items-center px-4 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
             Create Project
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {projects.map(p => (
            <Link 
              key={p.id} 
              to={`/projects/${p.id}`} 
              className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
               {/* Accent decoration */}
               <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/0 group-hover:bg-indigo-500 transition-all duration-300"></div>
                              <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 transform group-hover:rotate-6 transition-transform">
                    <FolderIcon className="w-6 h-6" />
                  </div>
                 <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${statusColorMap[p.status.toLowerCase()] || statusColorMap.draft}`}>
                   {p.status.replace('_', ' ')}
                 </span>
               </div>
                              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{p.course_name}</p>
                              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                     <div className="h-1.5 w-1.5 rounded-full bg-indigo-400"></div>
                     <span className="text-[11px] font-bold text-slate-500 dark:text-slate-500">View detailed metrics</span>
                  </div>
                  <PlusIcon className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
