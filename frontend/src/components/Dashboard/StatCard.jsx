import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';

const colorStyles = {
  indigo: {
    border: 'border-indigo-100/80 dark:border-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-700/60',
    iconBg: 'bg-gradient-to-br from-indigo-500/10 to-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40 shadow-inner',
    ambientGlow: 'bg-indigo-500/10',
  },
  green: {
    border: 'border-emerald-100/80 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700/60',
    iconBg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 shadow-inner',
    ambientGlow: 'bg-emerald-500/10',
  },
  purple: {
    border: 'border-purple-100/80 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700/60',
    iconBg: 'bg-gradient-to-br from-purple-500/10 to-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40 shadow-inner',
    ambientGlow: 'bg-purple-500/10',
  },
  red: {
    border: 'border-rose-100/80 dark:border-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700/60',
    iconBg: 'bg-gradient-to-br from-rose-500/10 to-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40 shadow-inner',
    ambientGlow: 'bg-rose-500/10',
  },
  blue: {
    border: 'border-blue-100/80 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700/60',
    iconBg: 'bg-gradient-to-br from-blue-500/10 to-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40 shadow-inner',
    ambientGlow: 'bg-blue-500/10',
  },
  amber: {
    border: 'border-amber-100/80 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700/60',
    iconBg: 'bg-gradient-to-br from-amber-500/10 to-amber-600/20 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40 shadow-inner',
    ambientGlow: 'bg-amber-500/10',
  },
};

const StatCard = ({ title, value, icon, trend, trendValue, subtitle, color = 'blue' }) => {
  const scheme = colorStyles[color] || colorStyles.blue;

  const renderTrendBadge = () => {
    if (!trend && !trendValue) return null;

    let badgeClass = 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700';
    let IconComponent = MinusIcon;

    if (trend === 'up') {
      badgeClass = 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/50';
      IconComponent = ArrowTrendingUpIcon;
    } else if (trend === 'down') {
      badgeClass = 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/50';
      IconComponent = ArrowTrendingDownIcon;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
        <IconComponent className="w-3.5 h-3.5" />
        <span>{trendValue}</span>
      </span>
    );
  };

  return (
    <div
      className={`group relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border ${scheme.border} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default flex flex-col justify-between min-h-[136px]`}
    >
      {/* Header: Title & Icon */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-3 rounded-lg ${scheme.iconBg} flex-shrink-0 transition-colors duration-200`}
        >
          {icon}
        </div>
      </div>

      {/* Value & Trend */}
      <div className="flex items-baseline justify-between gap-3 pt-3 relative z-10">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
        {renderTrendBadge()}
      </div>
    </div>
  );
};

export default StatCard;
