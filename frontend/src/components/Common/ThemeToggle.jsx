import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center w-14 h-7 p-1 rounded-full bg-slate-200 dark:bg-slate-800 transition-colors duration-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 group"
      aria-label="Toggle Theme"
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {/* Background track icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <SunIcon className="w-3.5 h-3.5 text-slate-400 opacity-50 transition-opacity group-hover:opacity-80" />
        <MoonIcon className="w-3.5 h-3.5 text-slate-500 opacity-50 transition-opacity group-hover:opacity-80" />
      </div>

      {/* Sliding Toggle Head */}
      <motion.div
        className="z-10 w-5 h-5 flex items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-sm"
        animate={{
          x: theme === 'light' ? 0 : 28,
          rotate: theme === 'light' ? 0 : 360
        }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 30 
        }}
      >
        {theme === 'light' ? (
          <SunIcon className="w-3.5 h-3.5 text-amber-500" />
        ) : (
          <MoonIcon className="w-3.5 h-3.5 text-blue-400" />
        )}
      </motion.div>
      
      <span className="sr-only">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
    </button>
  );
};

export default ThemeToggle;
