import React from 'react';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  MinusIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

const colorStyles = {
  indigo: {
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/50 shadow-xs',
    glow: 'bg-indigo-500/10',
  },
  green: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/50 shadow-xs',
    glow: 'bg-emerald-500/10',
  },
  purple: {
    iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100/80 dark:border-purple-800/50 shadow-xs',
    glow: 'bg-purple-500/10',
  },
  red: {
    iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/80 dark:border-rose-800/50 shadow-xs',
    glow: 'bg-rose-500/10',
  },
  blue: {
    iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-800/50 shadow-xs',
    glow: 'bg-blue-500/10',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/50 shadow-xs',
    glow: 'bg-amber-500/10',
  },
};

const StatCard = ({ title, value, icon, trend, trendValue, subtitle, color = 'blue' }) => {
  const scheme = colorStyles[color] || colorStyles.blue;

  const renderTrendBadge = () => {
    if (!trend && !trendValue) return null;

    // Detect if this is an alert/high risk badge
    const isAlert = trend === 'alert' || 
      (trend === 'up' && color === 'red') || 
      (trendValue && /attention|flag|incident|risk/i.test(trendValue));

    let badgeClass = 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/60';
    let IconComponent = MinusIcon;

    if (isAlert) {
      badgeClass = 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-800/50';
      IconComponent = ExclamationTriangleIcon;
    } else if (trend === 'up') {
      badgeClass = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/50';
      IconComponent = ArrowTrendingUpIcon;
    } else if (trend === 'down') {
      badgeClass = 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-800/50';
      IconComponent = ArrowTrendingDownIcon;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeClass} shadow-2xs`}>
        <IconComponent className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{trendValue}</span>
      </span>
    );
  };

  return (
    <div
      className="group relative overflow-hidden bg-white dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_4px_20px_-2px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 transition-all duration-200 cursor-default flex flex-col justify-between"
    >
      {/* Subtle ambient accent glow on hover */}
      <div 
        className={`absolute -top-10 -right-10 w-20 h-20 rounded-full ${scheme.glow} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} 
      />

      {/* Header: Title & Icon */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
          {title}
        </p>
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${scheme.iconBg} flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5`}
        >
          {icon}
        </div>
      </div>

      {/* Main Metric Value & Trend / Badge */}
      <div className="flex items-baseline justify-between gap-2 pt-2 relative z-10">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
          {value}
        </span>
        {renderTrendBadge()}
      </div>

      {/* Optional contextual subtitle */}
      {subtitle && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 relative z-10 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default StatCard;
