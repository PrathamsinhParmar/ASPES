import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { flushSync } from 'react-dom';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const isTransitioningRef = useRef(false);

  const [theme, setTheme] = useState(() => {
    // 1. Check localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;

    // 2. Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // 3. Default to light
    return 'light';
  });

  // Helper to apply or remove 'dark' class on <html>
  const applyThemeToDOM = (nextTheme) => {
    const root = window.document.documentElement;
    if (nextTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Initial sync on mount
  useEffect(() => {
    applyThemeToDOM(theme);
    localStorage.setItem('theme', theme);
  }, []);

  const toggleTheme = (event) => {
    // Prevent overlapping rapid transitions
    if (isTransitioningRef.current) return;

    const nextTheme = theme === 'light' ? 'dark' : 'light';

    // 1. Native View Transitions API with synchronous React 18 flushSync (60 FPS Locked)
    if (
      typeof document !== 'undefined' &&
      document.startViewTransition &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      isTransitioningRef.current = true;

      // Calculate origin coordinates from the click event
      const x = event?.clientX ?? window.innerWidth / 2;
      const y = event?.clientY ?? window.innerHeight / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // flushSync ensures React re-renders the DOM synchronously BEFORE the snapshot is taken,
      // preventing main-thread React reconciliation from blocking the GPU animation.
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          applyThemeToDOM(nextTheme);
          setTheme(nextTheme);
        });
        localStorage.setItem('theme', nextTheme);
      });

      transition.ready
        .then(() => {
          const anim = document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 380,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );

          anim.finished.finally(() => {
            isTransitioningRef.current = false;
          });
        })
        .catch(() => {
          applyThemeToDOM(nextTheme);
          setTheme(nextTheme);
          localStorage.setItem('theme', nextTheme);
          isTransitioningRef.current = false;
        });

      transition.finished.finally(() => {
        isTransitioningRef.current = false;
      });

      return;
    }

    // 2. Scoped CSS fallback for browsers without View Transitions
    isTransitioningRef.current = true;
    const root = window.document.documentElement;
    root.classList.add('theme-transitioning');
    applyThemeToDOM(nextTheme);
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    setTimeout(() => {
      root.classList.remove('theme-transitioning');
      isTransitioningRef.current = false;
    }, 300);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
