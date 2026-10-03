import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative mt-16 sm:mt-20 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-2xl text-slate-600 dark:text-slate-400 transition-all duration-300 overflow-hidden z-10">
      {/* Subtle Ambient Glass Glow at top edge */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#5E60CE]/30 dark:via-[#7275E0]/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-4 sm:pb-5">
        {/* Main Section: Left Brand Block separated from Right-Aligned Cluster */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12 mb-6 sm:mb-7">
          
          {/* Left Side: Brand, Identity & University Context */}
          <div className="w-full lg:max-w-xs xl:max-w-sm space-y-3.5 shrink-0">
            <Link to="/" className="inline-block group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5E60CE] rounded-lg">
              <picture>
                <source srcSet="/ASPESLight.webp" type="image/webp" />
                <img
                  src="/ASPESLight.png"
                  alt="ASPES - AI Smart Project Evaluation System"
                  width="170"
                  height="40"
                  loading="lazy"
                  decoding="async"
                  className="h-9 sm:h-10 w-auto dark:hidden object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </picture>
              <picture>
                <source srcSet="/ASPESDark.webp" type="image/webp" />
                <img
                  src="/ASPESDark.png"
                  alt="ASPES - AI Smart Project Evaluation System"
                  width="170"
                  height="40"
                  loading="lazy"
                  decoding="async"
                  className="h-9 sm:h-10 w-auto hidden dark:block object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </picture>
            </Link>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              ASPES is an autonomous academic evaluation system engineered for university computer science and engineering coursework. Combining 6-layer neural inspection with human-in-the-loop faculty control.
            </p>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5E60CE] dark:text-[#7275E0] shrink-0" />
                <span>Drs. Kiran &amp; Pallavi Patel Global University (KPGU)</span>
              </div>
            </div>
          </div>

          {/* Right Side: Architecture & Portals, Academic Governance, and System Telemetry with EXACT SAME GAP between all three */}
          <div className="flex flex-wrap lg:flex-nowrap items-start gap-8 lg:gap-10 xl:gap-12 shrink-0">
            
            {/* Component 1: Architecture & Portals */}
            <div className="space-y-2.5 shrink-0">
              <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider whitespace-nowrap">
                Architecture &amp; Portals
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors inline-flex items-center gap-1.5 group whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#5E60CE] transition-colors" />
                    Overview
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="text-slate-600 dark:text-slate-400 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors inline-flex items-center gap-1.5 group whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#5E60CE] transition-colors" />
                    6-Layer AI Pipeline
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors inline-flex items-center gap-1.5 group whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#5E60CE] transition-colors" />
                    Faculty Review Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors inline-flex items-center gap-1.5 group whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#5E60CE] transition-colors" />
                    Student Diagnostic Hub
                  </Link>
                </li>
              </ul>
            </div>

            {/* Component 2: Academic Governance & Standards */}
            <div className="space-y-2.5 shrink-0">
              <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider whitespace-nowrap">
                Academic Governance
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2 whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Deterministic Scoring</span>
                </li>
                <li className="flex items-center gap-2 whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Zero Code Retention</span>
                </li>
                <li className="flex items-center gap-2 whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>FERPA Data Protection</span>
                </li>
                <li className="flex items-center gap-2 whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>ABET &amp; NBA Compliant</span>
                </li>
              </ul>
            </div>

            {/* Component 3: Operational Status & Department Card */}
            <div className="space-y-2.5 shrink-0">
              <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider whitespace-nowrap">
                System Telemetry
              </h3>
              <div className="w-[230px] p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2 backdrop-blur-md">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Core Network</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    100% Operational
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                  Krishna School of Emerging Technology &amp; Applied Research, KPGU Vadodara.
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Institutional Summary Line: Reduced upper margin (mb-6 on grid above) and tight padding */}
        <div className="py-2.5 sm:py-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed text-center sm:text-left">
          <p>
            <strong className="text-slate-700 dark:text-slate-300 font-medium">ASPES — AI Smart Project Evaluation System</strong>.
            {' '}Developed at Drs. Kiran &amp; Pallavi Patel Global University (KPGU), Krishna School of Emerging Technology &amp; Applied Research.
          </p>
        </div>

        {/* Bottom Bar: Reduced upper margin (pt-3) & lower margin (pb-4 on parent) */}
        <div className="pt-3 sm:pt-3.5 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} ASPES Platform. All rights reserved.
          </div>

          {/* Design & Developed By Mention */}
          <div className="flex flex-wrap items-center justify-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <span>Designed &amp; Developed by</span>
            <a
              href="https://prathamrajput.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#5E60CE] dark:text-[#7275E0] hover:text-[#4EA8DE] dark:hover:text-[#9A9CEE] transition-colors inline-flex items-center gap-1 underline underline-offset-4 decoration-[#5E60CE]/40 hover:decoration-[#5E60CE] ml-0.5"
            >
              <span>Prathamsinh Parmar</span>
              <ExternalLink className="w-3 h-3 text-[#5E60CE] dark:text-[#7275E0] shrink-0" />
            </a>
          </div>

          {/* Quick Route Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
            <Link to="/" className="hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors">Home</Link>
            <Link to="/how-it-works" className="hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors">How It Works</Link>
            <Link to="/login" className="hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors">Register</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
