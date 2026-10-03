import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * useSmoothScroll
 * Activates butter-smooth momentum scrolling powered by Lenis on the mounting page.
 * Scoped to ensure proper RAF lifecycle, anchor smooth transitions, and complete teardown
 * when navigating away to administrative, student, or faculty dashboards.
 */
export default function useSmoothScroll(options = {}) {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.8,
      infinite: false,
      autoResize: true,
      ...options,
    });

    lenisRef.current = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Smoothly intercept in-page anchor links with sticky header offset
    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const targetId = anchor.getAttribute('href');
      if (targetId && targetId.length > 1 && targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          lenis.scrollTo(targetElement, {
            offset: -68,
            duration: 1.2,
          });
          // Update URL hash without jumping
          if (window.history.pushState) {
            window.history.pushState(null, '', targetId);
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    // Initial load hash scroll support
    if (window.location.hash) {
      const initialTarget = document.querySelector(window.location.hash);
      if (initialTarget) {
        setTimeout(() => {
          lenis.scrollTo(initialTarget, {
            offset: -68,
            duration: 1.2,
          });
        }, 180);
      }
    }

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      lenis.destroy();
      lenisRef.current = null;
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
      document.body.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return lenisRef;
}
