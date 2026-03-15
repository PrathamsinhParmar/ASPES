import React from 'react';

const StatCard = ({ title, value, icon, trend, trendValue, color = 'blue' }) => {
  const getTrendClasses = () => {
    if (trend === 'up') return 'text-green-600 dark:text-emerald-400 bg-green-100 dark:bg-emerald-900/10';
    if (trend === 'down') return 'text-red-600 dark:text-rose-400 bg-red-100 dark:bg-rose-900/10';
    return 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800';
  };

  const trendClasses = getTrendClasses();

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-xl shadow p-6 border border-gray-100 dark:border-slate-800 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-100 dark:hover:border-indigo-500/30 cursor-default">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 truncate mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <span className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium md:mt-2 lg:mt-0 ${trendClasses}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'} {trendValue}
            </span>
          )}
        </div>
      </div>
      <div className={`p-4 rounded-full bg-${color}-50 text-${color}-600 dark:bg-${color}-900/20 dark:text-${color}-400 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-${color}-100 dark:group-hover:bg-${color}-900/30`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
