import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { projectService } from '../../services/projectService';
import StatCard from './StatCard';
import { FolderIcon, ClockIcon, CheckCircleIcon, ChartBarIcon, ArrowUpOnSquareIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getMyProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageScore = (projList) => {
    const evaluated = projList.filter(p => ['evaluated', 'published'].includes(p.status.toLowerCase()));
    if (evaluated.length === 0) return 0;

    const total = evaluated.reduce((acc, p) => acc + (p.evaluation?.total_score || 0), 0);
    return Math.round(total / evaluated.length) || 'N/A';
  };

  const stats = {
    total: projects.length,
    pending: projects.filter(p => ['submitted', 'under_evaluation'].includes(p.status.toLowerCase())).length,
    evaluated: projects.filter(p => ['evaluated', 'published'].includes(p.status.toLowerCase())).length,
    avgScore: calculateAverageScore(projects)
  };

  const statusColorMap = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    submitted: 'bg-amber-50 text-amber-700 border-amber-200',
    under_evaluation: 'bg-blue-50 text-blue-700 border-blue-200',
    evaluated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    published: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    returned: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  if (loading) {
    return <div className="p-6 flex justify-center items-center h-[calc(100vh-4rem)]"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>;
  }

  return (
    <div className="p-5 sm:p-6 lg:p-8 space-y-6 flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-950 min-h-screen animate-fade-in relative z-0">
      
      {/* Absolute Decorative Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 dark:bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10 translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-200/20 dark:bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10 -translate-x-1/3 translate-y-1/3"></div>

      {/* Main Header Card */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}! <span className="animate-pulse-slow">👋</span>
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">Track your project evaluations and feedback below.</p>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all z-10"
        >
          <ArrowUpOnSquareIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Upload Project
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 z-10 relative">
        <StatCard
          title="Total Projects"
          value={stats.total}
          icon={<FolderIcon className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={<ClockIcon className="w-6 h-6" />}
          color="amber"
          trend={stats.pending > 0 ? "up" : null}
          trendValue="Queue"
        />
        <StatCard
          title="Successfully Scored"
          value={stats.evaluated}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          color="emerald"
        />
        <StatCard
          title="Global Average"
          value={stats.avgScore}
          icon={<SparklesIcon className="w-6 h-6" />}
          color="indigo"
        />
      </div>

      {/* Recent Projects Table Container */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 z-10">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Recent Activity Stream</h3>
          <Link to="/projects" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline underline-offset-4 transition-all">View all</Link>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 pl-12 pr-12 text-center text-slate-500 bg-slate-50/50">
            <div className="mx-auto w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4">
               <FolderIcon className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-base font-bold text-slate-700">No active projects.</p>
            <p className="text-sm mt-1 text-slate-500">Upload your very first project to get going!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Project Overview</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Timeline</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Phase</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">AI Score</th>
                  <th scope="col" className="relative px-5 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
                {projects.slice(0, 5).map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                          <span className="text-indigo-700 dark:text-indigo-400 font-bold text-base">{project.title.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{project.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{project.course_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {project.submitted_at ? format(new Date(project.submitted_at), 'MMM dd, yyyy') : 'Draft'}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-[11px] leading-4 font-bold rounded-md border ${statusColorMap[project.status.toLowerCase()] || statusColorMap.draft}`}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                       {project.evaluation?.total_score ? (
                         <span className={`text-sm font-extrabold ${project.evaluation.total_score >= 80 ? 'text-emerald-600' : project.evaluation.total_score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                           {project.evaluation.total_score.toFixed(1)} <span className="text-xs text-slate-400 font-medium">/ 100</span>
                         </span>
                      ) : (
                        <span className="text-sm text-slate-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center px-4 py-1.5 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all"
                      >
                        Inspect details
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

export default StudentDashboard;
