import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/Common/SEO';
import { getHomePageStructuredData } from '../utils/structuredData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  ShieldCheck,
  FileCheck2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Users,
  Building2,
  ChevronDown,
  ArrowUpRight,
  ShieldAlert,
  Search,
  Sliders,
  Award,
  Lock,
  Scale,
  FileText,
  Clock,
  Layers,
  Zap,
  Menu,
  X
} from 'lucide-react';
import ThemeToggle from '../components/Common/ThemeToggle';
import useSmoothScroll from '../hooks/useSmoothScroll';

// ============================================================================
// Professional Framer Motion Ambient Background (Zero square elements)
// ============================================================================
const AmbientBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
    {/* Primary Dark Blue Fluid Mesh Orb */}
    <motion.div
      animate={{
        x: [0, 40, -30, 0],
        y: [0, -35, 20, 0],
        scale: [1, 1.1, 0.95, 1],
      }}
      transition={{
        duration: 22,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute -top-[10%] left-[8%] w-[46vw] h-[46vw] rounded-full bg-gradient-to-br from-[#1E3A8A]/18 via-[#2563EB]/10 to-transparent blur-[140px] dark:from-[#1E3A8A]/24 dark:via-[#3B82F6]/14"
    />

    {/* Secondary Crimson / Rose Red Fluid Mesh Orb */}
    <motion.div
      animate={{
        x: [0, -45, 30, 0],
        y: [0, 40, -30, 0],
        scale: [1, 0.95, 1.08, 1],
      }}
      transition={{
        duration: 26,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute top-[28%] -right-[6%] w-[42vw] h-[42vw] rounded-full bg-gradient-to-bl from-[#DC2626]/12 via-[#E11D48]/8 to-transparent blur-[140px] dark:from-[#EF4444]/15 dark:via-[#F43F5E]/10"
    />

    {/* Tertiary Warm Amber / Gold Yellow Fluid Mesh Orb */}
    <motion.div
      animate={{
        x: [0, 35, -40, 0],
        y: [0, -30, 35, 0],
        scale: [1, 1.06, 0.94, 1],
      }}
      transition={{
        duration: 30,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute top-[55%] -left-[8%] w-[44vw] h-[44vw] rounded-full bg-gradient-to-tr from-[#D97706]/12 via-[#F59E0B]/8 to-transparent blur-[145px] dark:from-[#FBBF24]/14 dark:via-[#D97706]/10"
    />

    {/* Quaternary Emerald Green Fluid Mesh Orb */}
    <motion.div
      animate={{
        x: [0, -30, 35, 0],
        y: [0, 35, -25, 0],
        scale: [1, 0.96, 1.06, 1],
      }}
      transition={{
        duration: 28,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute -bottom-[8%] right-[18%] w-[48vw] h-[48vw] rounded-full bg-gradient-to-tl from-[#059669]/14 via-[#10B981]/9 to-transparent blur-[150px] dark:from-[#10B981]/15 dark:via-[#059669]/10"
    />

    {/* Architectural Mathematical Micro-Grid Texture */}
    <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:36px_36px] opacity-25 dark:opacity-30" />
  </div>
);

// Continuous High-Density Enterprise Performance Ticker Metrics
const TICKER_METRICS = [
  {
    value: '< 15s',
    label: 'Turnaround Per Project',
    sub: 'Real-time parallel analysis',
    valueColor: 'text-[#1E3A8A] dark:text-sky-400',
    iconColor: 'text-[#1E3A8A] dark:text-sky-400',
    iconBg: 'bg-[#1E3A8A]/10 dark:bg-sky-500/15',
    icon: Clock,
  },
  {
    value: '6 Layers',
    label: 'Multi-Vector Neural Stack',
    sub: 'AST, NLP & ML evaluators',
    valueColor: 'text-rose-600 dark:text-rose-400',
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/15',
    icon: Layers,
  },
  {
    value: '99.4%',
    label: 'Grading Consistency',
    sub: 'Deterministic rubric scoring',
    valueColor: 'text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    icon: Sparkles,
  },
  {
    value: '0 Cases',
    label: 'False Accusation Safeguards',
    sub: 'Human-in-the-loop review',
    valueColor: 'text-emerald-600 dark:text-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    icon: ShieldCheck,
  },
  {
    value: '100%',
    label: 'ABET & NBA Audit Ready',
    sub: 'Immutable evaluation trails',
    valueColor: 'text-[#1E3A8A] dark:text-sky-400',
    iconColor: 'text-[#1E3A8A] dark:text-sky-400',
    iconBg: 'bg-[#1E3A8A]/10 dark:bg-sky-500/15',
    icon: CheckCircle2,
  },
  {
    value: '40K+',
    label: 'AST Syntax Nodes / Sec',
    sub: 'Ultra-low latency parser',
    valueColor: 'text-rose-600 dark:text-rose-400',
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/15',
    icon: Zap,
  },
  {
    value: 'Zero-Shot',
    label: 'Cross-Language Logic Matching',
    sub: 'Polyglot code comparison',
    valueColor: 'text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    icon: Code2,
  },
  {
    value: '256-Bit',
    label: 'Institutional Privacy & Security',
    sub: 'Air-gapped university vault',
    valueColor: 'text-emerald-600 dark:text-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    icon: Lock,
  },
];

const HomePage = () => {
  useSmoothScroll();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState('faculty');
  const [activeTab, setActiveTab] = useState('ast');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // 3-Role Journey Details
  const roleJourneys = {
    faculty: {
      id: 'faculty',
      title: 'Faculty Evaluation & Course Review Portal',
      badge: 'For Professors, Course Coordinators & Teaching Assistants',
      icon: Users,
      accentColor: 'blue',
      description:
        'Eliminate the 45-minute per-project manual grading bottleneck. Standardize rubric criteria, inspect cross-repository plagiarism matrices, review side-by-side AST code diffs, and approve university grades with full qualitative oversight.',
      steps: [
        {
          num: '01',
          title: 'Batch Ingestion & Cohort Setup',
          desc: 'Create course assignments, organize capstone student groups, and configure customized rubric weightings per project milestone.',
        },
        {
          num: '02',
          title: 'Autonomous Multi-Vector Audit',
          desc: 'Trigger concurrent 6-layer audits across student repositories to detect AST code smells, AI code patterns, and cross-repo plagiarism in seconds.',
        },
        {
          num: '03',
          title: 'Faculty Override & One-Click Endorsement',
          desc: 'Examine interactive diffs, adjust AI score recommendations with personal commentary, and sync finalized grades directly to your gradebook.',
        },
      ],
      previewMetrics: [
        { label: 'Grading Time Saved', val: '85% Faster', badge: 'Verified' },
        { label: 'Rubric Consistency', val: '99.4% Match', badge: 'Deterministic' },
        { label: 'False Accusations', val: '0 Reported', badge: 'Protected' },
      ],
    },
    student: {
      id: 'student',
      title: 'Student Diagnostic & Project Analytics Hub',
      badge: 'For Undergraduate & Postgraduate Engineering Students',
      icon: GraduationCap,
      accentColor: 'emerald',
      description:
        'Transform grading from a high-stakes punishment into an interactive learning journey. Access transparent pre-submission reports, line-by-line code smell diagnostics, and objective verification badges before final deadlines.',
      steps: [
        {
          num: '01',
          title: 'Pre-Submission Diagnostic Scan',
          desc: 'Submit repository links or zip bundles for instant AST compliance checks, test coverage metrics, and maintainability index scores.',
        },
        {
          num: '02',
          title: 'Report-to-Code Alignment Verification',
          desc: 'Identify discrepancies between project documentation claims and actual code endpoints to eliminate phantom features before faculty review.',
        },
        {
          num: '03',
          title: 'Actionable Mentorship Insights',
          desc: 'Receive non-punitive, pedagogical guidance highlighting exact line numbers, architectural antipatterns, and concrete refactoring suggestions.',
        },
      ],
      previewMetrics: [
        { label: 'Code Quality Lift', val: '+38% Avg', badge: 'Empirical' },
        { label: 'Documentation Parity', val: '100% Accurate', badge: 'AST Verified' },
        { label: 'Feedback Turnaround', val: '< 15 Seconds', badge: 'Instantaneous' },
      ],
    },
    admin: {
      id: 'admin',
      title: 'Department Administration & HOD Telemetry Hub',
      badge: 'For Heads of Department, Deans & Academic Directors',
      icon: Building2,
      accentColor: 'indigo',
      description:
        'Gain institution-wide observability over engineering project quality, faculty grading workloads, cohort integrity benchmarks, and automated ABET/NBA accreditation dossier generation.',
      steps: [
        {
          num: '01',
          title: 'Institution-Wide Governance',
          desc: 'Establish department-wide evaluation rubrics, define plagiarism sensitivity thresholds, and manage role-based access for hundreds of faculty members.',
        },
        {
          num: '02',
          title: 'Departmental Integrity Benchmarks',
          desc: 'Track cross-semester plagiarism patterns, AI code adoption rates, and curriculum bottleneck trends across all computer science sections.',
        },
        {
          num: '03',
          title: 'Accreditation Dossier Export',
          desc: 'Export tamper-evident evaluation records formatted for ABET, NBA, and institutional accreditation reviews in one click.',
        },
      ],
      previewMetrics: [
        { label: 'Active Departments', val: '8 Campus Units', badge: 'Connected' },
        { label: 'Evaluations YTD', val: '12,840 Projects', badge: 'Operational' },
        { label: 'Accreditation Audit', val: '100% Verified', badge: 'Tamper-Evident' },
      ],
    },
  };

  const currentRole = roleJourneys[activeRole];

  // FAQ Items
  const faqItems = [
    {
      q: 'How does ASPES detect AI-generated code from ChatGPT, Claude, and Copilot?',
      a: 'ASPES uses multi-vector token predictability, perplexity distribution, and burstiness analysis. Human programming shows natural, irregular problem-solving cadence and personalized naming conventions. Generative LLMs exhibit statistically flat, low-entropy token transitions. Combined with AST structural fingerprinting, ASPES distinguishes authentic human development from LLM synthesis.',
    },
    {
      q: 'What is "Report-to-Code Alignment" and what are "Phantom Features"?',
      a: 'Many students submit extensive documentation detailing features (e.g. "OAuth 2.0 Auth", "WebSocket Live Sync") that were never implemented in code. ASPES parses the PDF report with semantic NLP, extracts functional claims, and cross-checks them against actual AST routes, endpoints, and database models to uncover unimplemented or exaggerated claims.',
    },
    {
      q: 'Can professors customize the evaluation rubrics and override scores?',
      a: 'Absolutely. ASPES acts as an intelligent evaluation copilot, not a replacement for faculty judgment. Professors have full discretion in the Faculty Review Portal to adjust criteria weightings (e.g., 40% AST quality, 30% Plagiarism, 30% Documentation) and override any AI recommendation with qualitative commentary.',
    },
    {
      q: 'Is student source code and proprietary project data kept secure?',
      a: 'Yes. ASPES strictly adheres to academic confidentiality standards. Repositories are processed in ephemeral, isolated sandboxes and student data is never used to train public LLMs or external models. All access is governed by strict Role-Based Access Control (RBAC).',
    },
    {
      q: 'Which programming languages and project types does ASPES evaluate?',
      a: 'ASPES natively parses Abstract Syntax Trees for Python, JavaScript/TypeScript, Java, C/C++, and SQL, along with automated package manifest audits across full-stack web, mobile, machine learning, and systems software.',
    },
  ];

  return (
    <>
      <SEO
        title="ASPES – AI-Powered Academic Project Evaluation System"
        description="ASPES automates student code grading with AI: AST syntax audits, multi-vector AI code detection, plagiarism checks, and instant rubric feedback. Try live demo."
        canonicalPath="/"
        keywords="AI project evaluation system, automated code grading, AI plagiarism detection, AI-generated code detector, academic integrity tool, automated programming assignment grading, ASPES"
        schema={getHomePageStructuredData(faqItems)}
      />

      <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#5E60CE] selection:text-white transition-colors duration-500 overflow-x-hidden">
        {/* Living Ambient Motion Canvas (Zero square elements) */}
        <AmbientBackground />

        {/* ===================================================================== */}
        {/* HEADER / NAVIGATION BAR (RESPONSIVE ACROSS ALL DEVICES)                */}
        {/* ===================================================================== */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 dark:bg-[#0B0F19]/85 border-b border-slate-200/70 dark:border-slate-800/70 transition-all">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <picture>
                <source srcSet="/ASPESLight.webp" type="image/webp" />
                <img
                  src="/ASPESLight.png"
                  alt="ASPES - AI Smart Project Evaluation System"
                  width="180"
                  height="44"
                  fetchPriority="high"
                  className="h-9 sm:h-11 w-auto dark:hidden object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </picture>
              <picture>
                <source srcSet="/ASPESDark.webp" type="image/webp" />
                <img
                  src="/ASPESDark.png"
                  alt="ASPES - AI Smart Project Evaluation System"
                  width="180"
                  height="44"
                  fetchPriority="high"
                  className="h-9 sm:h-11 w-auto hidden dark:block object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </picture>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              <a
                href="#overview"
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors"
              >
                Overview
              </a>
              <a
                href="#journeys"
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors"
              >
                Role Portals
              </a>
              <a
                href="#pipeline"
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors"
              >
                6-Layer Engine
              </a>
              <a
                href="#comparison"
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors"
              >
                Comparison
              </a>
              <Link
                to="/how-it-works"
                className="text-sm font-semibold text-[#5E60CE] dark:text-[#7275E0] hover:text-[#4EA8DE] dark:hover:text-[#9A9CEE] flex items-center gap-1 transition-colors"
              >
                <span>AI Architecture</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href="#faq"
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors"
              >
                FAQ
              </a>
            </nav>

            {/* Right Action Cluster */}
            <div className="flex items-center gap-2 sm:gap-3.5">
              <ThemeToggle />

              {user ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#5E60CE] to-[#4EA8DE] hover:brightness-110 rounded-xl shadow-md shadow-[#5E60CE]/25 transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
                >
                  <span className="hidden xs:inline">Open</span>
                  <span>Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#5E60CE] to-[#4EA8DE] hover:brightness-110 rounded-xl shadow-md shadow-[#5E60CE]/25 transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-[#5E60CE] dark:text-[#7275E0]" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Drawer (Animated Slide-down) */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="lg:hidden border-t border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-2xl overflow-hidden shadow-2xl"
              >
                <div className="px-4 py-4 sm:px-6 space-y-3">
                  <nav className="flex flex-col space-y-1">
                    <a
                      href="#overview"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#5E60CE] transition-all flex items-center justify-between"
                    >
                      <span>Overview</span>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                    </a>
                    <a
                      href="#journeys"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#5E60CE] transition-all flex items-center justify-between"
                    >
                      <span>Role Portals (Faculty, Student, Admin)</span>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                    </a>
                    <a
                      href="#pipeline"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#5E60CE] transition-all flex items-center justify-between"
                    >
                      <span>6-Layer Neural Engine</span>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                    </a>
                    <a
                      href="#comparison"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#5E60CE] transition-all flex items-center justify-between"
                    >
                      <span>Comparison Benchmark</span>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                    </a>
                    <Link
                      to="/how-it-works"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-[#5E60CE] dark:text-[#7275E0] hover:bg-[#5E60CE]/10 transition-all flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span>AI Architecture Deep Dive</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#5E60CE]/15 text-[#5E60CE] dark:text-[#9A9CEE]">
                          Spec
                        </span>
                      </span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                    <a
                      href="#faq"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#5E60CE] transition-all flex items-center justify-between"
                    >
                      <span>Frequently Asked Questions</span>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                    </a>
                  </nav>

                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                    {user ? (
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full py-2.5 px-4 text-center rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#5E60CE] to-[#4EA8DE] shadow-md shadow-[#5E60CE]/25 block"
                      >
                        Open Dashboard Portal
                      </Link>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="py-2.5 px-3 text-center rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setMobileMenuOpen(false)}
                          className="py-2.5 px-3 text-center rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#5E60CE] to-[#4EA8DE] shadow-md shadow-[#5E60CE]/25"
                        >
                          Get Started
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ===================================================================== */}
        {/* HERO SECTION: ASYMMETRICAL, HIGH DENSITY & COMPACT STAGE             */}
        {/* ===================================================================== */}
        <main className="relative z-10">
          <section id="overview" className="relative pt-8 pb-4 sm:pt-12 sm:pb-6 lg:pt-14 lg:pb-8 overflow-hidden">
            <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
                
                {/* Left Column: Authoritative Editorial Copy */}
                <div className="lg:col-span-5 xl:col-span-6 space-y-4 sm:space-y-5 text-left">
                  {/* Status Chip */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#5E60CE]/10 dark:bg-[#5E60CE]/20 text-[#5E60CE] dark:text-[#9A9CEE] border border-[#5E60CE]/20 dark:border-[#5E60CE]/40 backdrop-blur-md shadow-xs max-w-full"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5E60CE] dark:text-[#7275E0] shrink-0" />
                    <span className="truncate">Autonomous Academic Integrity & Evaluation Infrastructure</span>
                  </motion.div>

                  {/* Single Primary H1 */}
                  <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-2xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] sm:leading-[1.12]"
                  >
                    AI Project Evaluation &{' '}
                    <span className="text-transparent bg-clip-text bg-[linear-gradient(to_right,#1E3A8A_0%,#DC2626_35%,#D97706_70%,#059669_100%)] dark:bg-[linear-gradient(to_right,#60A5FA_0%,#F87171_35%,#FBBF24_70%,#34D399_100%)]">
                      Automated Code Grading
                    </span>{' '}
                    System
                  </motion.h1>

                  {/* Value Proposition Subtitle */}
                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-xl"
                  >
                    Empower university professors, academic departments, and engineering students with 6-layer neural evaluations: deep AST syntax audits, multi-vector AI code detection, cross-repo plagiarism tracing, and automated rubric feedback in seconds.
                  </motion.p>

                  {/* Action CTAs */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 w-full sm:w-auto"
                  >
                    <Link
                      to={user ? "/dashboard" : "/login"}
                      className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#5E60CE] to-[#4EA8DE] hover:brightness-110 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-[#5E60CE]/30 hover:shadow-xl hover:shadow-[#5E60CE]/40 transition-all hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center justify-center gap-2"
                    >
                      <span>{user ? "Open Your Portal" : "Launch Live Demo"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/how-it-works"
                      className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-800 backdrop-blur-md transition-all hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Explore AI Engine</span>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                    </Link>
                  </motion.div>

                  {/* Trust Highlights */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-x-5 text-xs text-slate-500 dark:text-slate-400 font-medium"
                  >
                    <div className="flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Zero LLM Training on Student Code</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Deterministic Rubric Weighting</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>ABET & NBA Audit Ready</span>
                    </div>
                  </motion.div>
                </div>

                {/* Right Column: Live Interactive IDE Evaluation Console */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="lg:col-span-7 xl:col-span-6 w-full min-w-0"
                >
                  <div className="rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 shadow-[0_20px_50px_-15px_rgba(94,96,206,0.25)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
                    {/* IDE Window Title Bar */}
                    <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-950/90 border-b border-slate-800/90 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
                      {/* Left: Window Dots & Session/File Identifier */}
                      <div className="flex items-center gap-2 min-w-0 shrink">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90 inline-block shadow-[0_0_8px_rgba(244,63,94,0.35)]" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 inline-block shadow-[0_0_8px_rgba(245,158,11,0.35)]" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 inline-block shadow-[0_0_8px_rgba(16,185,129,0.35)]" />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate hidden xs:inline max-w-[90px] md:max-w-[130px] xl:max-w-none">
                          aspes-engine / eval_842
                        </span>
                      </div>

                      {/* Interactive Tab Switcher */}
                      <div className="flex items-center gap-1 bg-slate-900/95 p-1 rounded-xl border border-slate-800/90 shrink-0">
                        {[
                          { id: 'ast', label: 'AST Syntax', shortLabel: 'AST', icon: Code2 },
                          { id: 'ai', label: 'AI Detection', shortLabel: 'AI', icon: ShieldAlert },
                          { id: 'plag', label: 'Plagiarism', shortLabel: 'Plag', icon: Search },
                          { id: 'rubric', label: 'Rubric Score', shortLabel: 'Rubric', icon: Award },
                        ].map((tab) => {
                          const Icon = tab.icon;
                          const isSelected = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActiveTab(tab.id)}
                              className={`px-2 sm:px-2.5 xl:px-3 py-1 sm:py-1.5 rounded-lg text-[10.5px] sm:text-[11px] font-medium flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#5E60CE] to-[#4EA8DE] text-white font-semibold shadow-sm shadow-[#5E60CE]/30'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="sm:hidden whitespace-nowrap">{tab.shortLabel}</span>
                              <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* IDE Main Content Body */}
                    <div className="p-3.5 sm:p-5 md:p-6 font-mono text-xs sm:text-sm">
                      <AnimatePresence mode="wait">
                        {activeTab === 'ast' && (
                          <motion.div
                            key="ast"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3 sm:space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-400 border-b border-slate-800 pb-2 text-[11px] sm:text-xs">
                              <span className="truncate">src/controllers/auth_service.py</span>
                              <span className="text-emerald-400 text-[10px] sm:text-xs font-semibold shrink-0">AST Parse OK (18 Nodes)</span>
                            </div>
                            <div className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 sm:p-3 rounded-xl border border-slate-800/80 overflow-x-auto text-[11px] sm:text-xs md:text-sm">
                              <div><span className="text-purple-400">class</span> <span className="text-yellow-300">AuthenticationService</span>:</div>
                              <div className="pl-3 sm:pl-4"><span className="text-blue-400">def</span> <span className="text-emerald-400">verify_signature</span>(self, token: <span className="text-sky-300">str</span>):</div>
                              <div className="pl-6 sm:pl-8 text-slate-400"># AST Node: FunctionDef (depth: 2)</div>
                              <div className="pl-6 sm:pl-8"><span className="text-purple-400">if not</span> token: <span className="text-purple-400">raise</span> <span className="text-rose-400">InvalidTokenError</span>()</div>
                              <div className="pl-6 sm:pl-8"><span className="text-purple-400">return</span> jwt.decode(token, self.secret, algorithms=[<span className="text-emerald-300">&quot;HS256&quot;</span>])</div>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1 text-center">
                              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                                <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Cyclomatic</div>
                                <div className="text-emerald-400 font-bold text-xs sm:text-sm mt-0.5">2.4 (Low)</div>
                              </div>
                              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                                <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Maintainability</div>
                                <div className="text-sky-400 font-bold text-xs sm:text-sm mt-0.5">94 / 100</div>
                              </div>
                              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                                <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Dead Code</div>
                                <div className="text-emerald-400 font-bold text-xs sm:text-sm mt-0.5">0 Warnings</div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {activeTab === 'ai' && (
                          <motion.div
                            key="ai"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-400 border-b border-slate-800 pb-2 text-[11px] sm:text-xs">
                              <span className="truncate">Multi-Vector Token Predictability Analysis</span>
                              <span className="text-emerald-400 text-[10px] sm:text-xs font-semibold shrink-0">Verified Human Written</span>
                            </div>
                            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-300">Human Development Cadence:</span>
                                <span className="text-emerald-400 font-bold">94.2% (High Burstiness)</span>
                              </div>
                              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94.2%' }} />
                              </div>
                              <div className="flex justify-between items-center text-xs pt-1">
                                <span className="text-slate-400">LLM Generation Probability:</span>
                                <span className="text-slate-300 font-bold">5.8% (Negligible)</span>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-800/50 text-slate-300 text-xs leading-relaxed border border-slate-700/50">
                              <span className="text-sky-400 font-bold">Entropy Diagnosis:</span> Non-uniform variable naming, natural iterative edits, and typical human syntax pauses observed. No flat generative distribution detected.
                            </div>
                          </motion.div>
                        )}

                        {activeTab === 'plag' && (
                          <motion.div
                            key="plag"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3 sm:space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-400 border-b border-slate-800 pb-2 text-[11px] sm:text-xs">
                              <span className="truncate">Cross-Repository Semantic Subtree Matrix</span>
                              <span className="text-emerald-400 text-[10px] sm:text-xs font-semibold shrink-0">3,800 Cohort Repos Checked</span>
                            </div>
                            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-300">Global Structural Similarity:</span>
                                <span className="text-emerald-400 font-bold">0.8% (Original)</span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Subtree Isomorphism:</span>
                                <span className="text-slate-200">Zero duplicate subtrees</span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Token Cosine Overlap:</span>
                                <span className="text-slate-200">4.1% (Standard boilerplates)</span>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-800/50 text-slate-300 text-xs leading-relaxed border border-slate-700/50">
                              <span className="text-emerald-400 font-bold">Integrity Clearance:</span> Submission passes all academic originality requirements. No match found against peer submissions or public GitHub solutions.
                            </div>
                          </motion.div>
                        )}

                        {activeTab === 'rubric' && (
                          <motion.div
                            key="rubric"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-400 border-b border-slate-800 pb-2 text-[11px] sm:text-xs">
                              <span className="truncate">Automated Weighted Marking Scheme</span>
                              <span className="text-[#5E60CE] dark:text-[#7275E0] font-bold text-[11px] sm:text-xs shrink-0">Grade A (95/100)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                                <div className="text-slate-400">AST Code Quality (30%)</div>
                                <div className="text-emerald-400 font-bold mt-0.5">28.5 / 30</div>
                              </div>
                              <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                                <div className="text-slate-400">Logic & Resilience (35%)</div>
                                <div className="text-emerald-400 font-bold mt-0.5">34.0 / 35</div>
                              </div>
                              <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                                <div className="text-slate-400">Report Alignment (20%)</div>
                                <div className="text-emerald-400 font-bold mt-0.5">18.0 / 20</div>
                              </div>
                              <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                                <div className="text-slate-400">Originality Index (15%)</div>
                                <div className="text-emerald-400 font-bold mt-0.5">14.5 / 15</div>
                              </div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 text-xs">
                              Faculty Action: Rubric endorsed. Ready to commit to university SIS/LMS gradebook.
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* INSTITUTIONAL PERFORMANCE TICKER (CONTINUOUS MARQUEE)                  */}
          {/* ===================================================================== */}
          <section className="py-2.5 sm:py-3 border-y border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md relative overflow-hidden select-none">
            {/* Edge Feather Gradient Masks */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#FAF9F6] dark:from-[#0F1117] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#FAF9F6] dark:from-[#0F1117] to-transparent z-10" />

            <div className="marquee-track flex items-center gap-3 sm:gap-4 py-0.5">
              {[...TICKER_METRICS, ...TICKER_METRICS].map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-300 shrink-0 group cursor-default"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor} transition-transform group-hover:scale-110`}>
                      <ItemIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold text-sm sm:text-base tracking-tight ${item.valueColor}`}>
                          {item.value}
                        </span>
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[9.5px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {item.sub}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ===================================================================== */}
          {/* THREE ROLE ECOSYSTEMS: DETAILED JOURNEY PORTALS                       */}
          {/* ===================================================================== */}
          <section id="journeys" className="mt-14 sm:mt-18">
            <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-6">
                <span className="text-[11px] font-mono font-bold text-[#5E60CE] dark:text-[#7275E0] uppercase tracking-widest">
                  Ecosystem Architecture
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                  Tailored Workflows for Every Academic Role
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Select a persona below to explore how ASPES transforms evaluation, mentoring, and administrative governance.
                </p>

                {/* Role Switcher Tabs (Fully Responsive) */}
                <div className="mt-4 inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner max-w-full overflow-x-auto">
                  {[
                    { id: 'faculty', label: 'Faculty & Evaluators', shortLabel: 'Faculty', icon: Users },
                    { id: 'student', label: 'Engineering Students', shortLabel: 'Students', icon: GraduationCap },
                    { id: 'admin', label: 'Department Administration', shortLabel: 'Admin', icon: Building2 },
                  ].map((role) => {
                    const Icon = role.icon;
                    const isSelected = activeRole === role.id;
                    return (
                      <button
                        key={role.id}
                        onClick={() => setActiveRole(role.id)}
                        className={`px-2.5 sm:px-4.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#5E60CE] to-[#4EA8DE] text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="sm:hidden">{role.shortLabel}</span>
                        <span className="hidden sm:inline">{role.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Role Content Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentRole.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.28 }}
                  className="rounded-2xl p-4 sm:p-5 lg:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md max-w-6xl 2xl:max-w-7xl mx-auto"
                >
                  <div className="grid lg:grid-cols-12 gap-5 lg:gap-7 items-center">
                    {/* Left: Role Explanation & Steps */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#5E60CE]/10 dark:bg-[#5E60CE]/20 text-[#5E60CE] dark:text-[#9A9CEE]">
                        {currentRole.badge}
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {currentRole.title}
                      </h3>

                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                        {currentRole.description}
                      </p>

                      {/* 3 Step Sequence */}
                      <div className="space-y-2 pt-0.5">
                        {currentRole.steps.map((st) => (
                          <div
                            key={st.num}
                            className="flex items-start gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs"
                          >
                            <span className="text-[11px] font-mono font-extrabold text-[#5E60CE] dark:text-[#7275E0] bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
                              {st.num}
                            </span>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {st.title}
                              </div>
                              <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                                {st.desc}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Role Telemetry & Visual Preview */}
                    <div className="lg:col-span-5 space-y-3">
                      <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800/90 shadow-lg space-y-3">
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                          <span className="text-xs font-mono text-slate-400">Portal Telemetry & Validation</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        </div>

                        <div className="space-y-2">
                          {currentRole.previewMetrics.map((pm, idx) => (
                            <div key={idx} className="p-2 sm:p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-between">
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{pm.label}</div>
                                <div className="text-sm sm:text-base font-bold text-white mt-0.5 font-mono">{pm.val}</div>
                              </div>
                              <span className="text-[11px] font-semibold text-[#5E60CE] dark:text-[#7275E0] bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-800/40">
                                {pm.badge}
                              </span>
                            </div>
                          ))}
                        </div>

                        <Link
                          to={user ? "/dashboard" : "/login"}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#5E60CE] to-[#4EA8DE] hover:brightness-110 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#5E60CE]/25 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <span>Explore This Role</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* THE 6-LAYER NEURAL EVALUATION ENGINE                                  */}
          {/* ===================================================================== */}
          <section id="pipeline" className="mt-14 sm:mt-18 py-8 sm:py-10 bg-slate-50/60 dark:bg-slate-950/60 border-y border-slate-200/80 dark:border-slate-800/80">
            <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-6">
                <span className="text-[11px] font-mono font-bold text-[#5E60CE] dark:text-[#7275E0] uppercase tracking-widest">
                  Neural Architecture
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                  The Deterministic 6-Layer Pipeline
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Each repository undergoes an immutable multi-vector evaluation pipeline designed to eliminate grading bias and identify academic misconduct.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5 max-w-6xl 2xl:max-w-7xl mx-auto">
                {[
                  {
                    num: 'Layer 01',
                    title: 'Neural AST & Complexity',
                    icon: Code2,
                    math: 'M = E - N + 2P (McCabe)',
                    desc: 'Compiles raw source code into language-level Abstract Syntax Trees to audit branch complexity, modularity, and unhandled exception paths.',
                  },
                  {
                    num: 'Layer 02',
                    title: 'Multi-Vector AI Code Detection',
                    icon: ShieldAlert,
                    math: 'PPL(W) = exp(-1/N * Σ ln P(w_i))',
                    desc: 'Evaluates token perplexity distribution and coding burstiness to distinguish authentic human problem solving from LLM synthetic output.',
                  },
                  {
                    num: 'Layer 03',
                    title: 'Semantic Plagiarism Matrix',
                    icon: Search,
                    math: 'Cosine Sim(u, v) = (u · v) / (||u|| ||v||)',
                    desc: 'Cross-analyzes AST subtrees and token fingerprints against historical cohort submissions to flag paraphrased or variable-renamed copying.',
                  },
                  {
                    num: 'Layer 04',
                    title: 'Report-to-Code Alignment',
                    icon: FileCheck2,
                    math: 'Jaccard S(C_code, C_report) = |C_c ∩ C_r| / |C_c ∪ C_r|',
                    desc: 'Parses student PDF documentation and cross-verifies functional claims against actual routes, models, and endpoints to expose phantom features.',
                  },
                  {
                    num: 'Layer 05',
                    title: 'Dynamic Weighted Rubric Engine',
                    icon: Sliders,
                    math: 'Score = Σ (Weight_i * Mark_i)',
                    desc: 'Calculates standardized marks mapped to course-specific rubric criteria, ensuring 100% deterministic grading parity across faculty sections.',
                  },
                  {
                    num: 'Layer 06',
                    title: 'Actionable Pedagogical Feedback',
                    icon: Award,
                    math: 'Grounded in AST Node Line References',
                    desc: 'Synthesizes empathetic, non-punitive mentorship reports with exact line numbers and refactoring snippets ready for faculty endorsement.',
                  },
                ].map((layer, idx) => {
                  const Icon = layer.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono font-bold text-[#5E60CE] dark:text-[#7275E0] bg-[#5E60CE]/10 dark:bg-[#5E60CE]/20 px-2 py-0.5 rounded-md border border-[#5E60CE]/20 dark:border-[#5E60CE]/40">
                            {layer.num}
                          </span>
                          <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#5E60CE] dark:text-[#7275E0]">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                          {layer.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-normal">
                          {layer.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10.5px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold mr-1.5">Basis:</span>
                        <span>{layer.math}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 sm:mt-6 text-center">
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#5E60CE] dark:text-[#7275E0] font-semibold text-xs sm:text-sm border border-slate-200 dark:border-slate-800 shadow-xs transition-all hover:-translate-y-0.5"
                >
                  <span>View Full Mathematical Formulations & Architecture</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* COMPARISON MATRIX: MANUAL EVALUATION VS ASPES AUTONOMOUS PIPELINE    */}
          {/* ===================================================================== */}
          <section id="comparison" className="mt-14 sm:mt-18">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-6">
                <span className="text-[11px] font-mono font-bold text-[#5E60CE] dark:text-[#7275E0] uppercase tracking-widest">
                  Empirical Benchmark
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                  Traditional Review vs ASPES Autonomous Pipeline
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  See how an automated, multi-vector architecture transforms speed, objectivity, and academic rigor.
                </p>
              </div>

              {/* Mobile Swipe Hint */}
              <div className="flex items-center justify-end text-[11px] text-slate-500 dark:text-slate-400 sm:hidden mb-2 px-1 gap-1">
                <span>Swipe horizontally to compare</span>
                <span>→</span>
              </div>

              <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm min-w-[560px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
                        <th className="py-3 sm:py-3.5 px-4 sm:px-6 min-w-[150px]">Evaluation Dimension</th>
                        <th className="py-3 sm:py-3.5 px-4 sm:px-6 text-slate-500 dark:text-slate-400 min-w-[160px]">Manual Faculty Review</th>
                        <th className="py-3 sm:py-3.5 px-4 sm:px-6 text-[#5E60CE] dark:text-[#7275E0] min-w-[180px]">ASPES Autonomous System</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                      <tr>
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-slate-900 dark:text-white">Grading Turnaround</td>
                        <td className="py-3.5 px-5 sm:px-6 text-slate-500">30–60 minutes per student submission</td>
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400">&lt; 15 seconds full multi-vector audit</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-slate-900 dark:text-white">Grading Consistency</td>
                        <td className="py-3.5 px-5 sm:px-6 text-slate-500">Vulnerable to evaluator fatigue and grader bias</td>
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400">100% deterministic mathematical rubric compliance</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-slate-900 dark:text-white">AI-Generated Code Detection</td>
                        <td className="py-3.5 px-5 sm:px-6 text-slate-500">Unreliable subjective estimation</td>
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400">Multi-vector token perplexity & burstiness curve analysis</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-slate-900 dark:text-white">Plagiarism Scope</td>
                        <td className="py-3.5 px-5 sm:px-6 text-slate-500">Limited to grader recall within the same section</td>
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400">Semantic AST subtree matching across 10,000+ historical repositories</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-slate-900 dark:text-white">Phantom Feature Detection</td>
                        <td className="py-3.5 px-5 sm:px-6 text-slate-500">Rarely discovered due to time constraints</td>
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400">Automated NLP PDF claim vs AST code endpoint cross-referencing</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-slate-900 dark:text-white">Accreditation Audit Dossier</td>
                        <td className="py-3.5 px-5 sm:px-6 text-slate-500">Weeks of manual paperwork compilation</td>
                        <td className="py-3.5 px-5 sm:px-6 font-semibold text-emerald-600 dark:text-emerald-400">Instant one-click ABET/NBA tamper-evident report generation</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* ACADEMIC GOVERNANCE, ETHICS & PRIVACY                                 */}
          {/* ===================================================================== */}
          <section className="mt-14 sm:mt-18 py-8 sm:py-10 bg-slate-50/60 dark:bg-slate-950/60 border-y border-slate-200/80 dark:border-slate-800/80">
            <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-6">
                <span className="text-[11px] font-mono font-bold text-[#5E60CE] dark:text-[#7275E0] uppercase tracking-widest">
                  Academic Governance
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                  Built for Ethical, Human-Centered Evaluation
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  ASPES is designed to assist faculty rather than replace them, protecting student rights and academic freedom.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="p-4 sm:p-5 lg:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-xl bg-[#5E60CE]/10 dark:bg-[#5E60CE]/20 flex items-center justify-center text-[#5E60CE] dark:text-[#7275E0] mb-4">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Zero Student Retention
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Student code is evaluated inside ephemeral sandboxes and is never fed into public foundation models or shared outside your university.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Human-in-the-Loop Veto
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    The AI engine serves as an evaluator copilot. Professors retain final authority to modify rubric marks, adjust weights, and add qualitative remarks.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Pedagogical Coaching
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Evaluations provide actionable feedback citing exact line numbers and refactoring snippets, encouraging iterative improvement rather than punishment.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Accreditation Ready
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Evaluation logs produce cryptographic, tamper-evident audit trails ready for ABET, NBA, and institutional quality assurance inspections.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* FREQUENTLY ASKED QUESTIONS ACCORDION                                 */}
          {/* ===================================================================== */}
          <section id="faq" className="mt-14 sm:mt-18">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-5 sm:mb-6">
                <span className="text-[11px] font-mono font-bold text-[#5E60CE] dark:text-[#7275E0] uppercase tracking-widest">
                  Frequently Answered
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                  Questions & Operational Details
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Detailed technical answers on evaluation accuracy, student security, and faculty controls.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {faqItems.map((item, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden transition-all shadow-sm"
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full px-5 py-4 sm:px-6 sm:py-5 text-left flex items-start sm:items-center justify-between gap-3 sm:gap-4 font-bold text-slate-900 dark:text-white hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors"
                      >
                        <span className="text-xs sm:text-sm md:text-base leading-snug sm:leading-normal pr-2">{item.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 mt-0.5 sm:mt-0 flex-shrink-0 transition-transform duration-300 text-slate-400 ${
                            isOpen ? 'rotate-180 text-[#5E60CE] dark:text-[#7275E0]' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-3.5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* FINAL HIGH-IMPACT CONVERSION BANNER                                   */}
          {/* ===================================================================== */}
          <section className="mt-14 sm:mt-18 max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl p-5 sm:p-8 bg-gradient-to-r from-[#5E60CE] via-[#5390D9] to-[#4EA8DE] text-white shadow-xl shadow-[#5E60CE]/20 overflow-hidden text-center">
              <div className="relative z-10 max-w-2xl mx-auto space-y-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-white backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Immediate Departmental Deployment</span>
                </span>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                  Modernize Your University&apos;s Project Evaluation Infrastructure
                </h2>

                <p className="text-xs sm:text-sm md:text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
                  Join leading engineering institutions using ASPES to save thousands of grading hours while upholding the highest standards of academic integrity.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4">
                  <Link
                    to={user ? "/dashboard" : "/login"}
                    className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-white text-[#5E60CE] hover:bg-slate-50 font-bold text-xs sm:text-sm shadow-lg transition-all hover:-translate-y-0.5 text-center"
                  >
                    {user ? "Open Your Dashboard" : "Launch Live Demo"}
                  </Link>
                  <Link
                    to="/how-it-works"
                    className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all hover:-translate-y-0.5 text-center"
                  >
                    Review AI Architecture
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ===================================================================== */}
        {/* INSTITUTIONAL FOOTER                                                  */}
        {/* ===================================================================== */}
        <footer className="mt-14 sm:mt-18 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0B0F19]/70 backdrop-blur-xl py-8 sm:py-10 transition-all">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
              <div className="md:col-span-2 space-y-3">
                <Link to="/" className="inline-block">
                  <picture>
                    <source srcSet="/ASPESLight.webp" type="image/webp" />
                    <img
                      src="/ASPESLight.png"
                      alt="ASPES - AI Smart Project Evaluation System"
                      width="150"
                      height="36"
                      loading="lazy"
                      decoding="async"
                      className="h-9 w-auto dark:hidden object-contain"
                    />
                  </picture>
                  <picture>
                    <source srcSet="/ASPESDark.webp" type="image/webp" />
                    <img
                      src="/ASPESDark.png"
                      alt="ASPES - AI Smart Project Evaluation System"
                      width="150"
                      height="36"
                      loading="lazy"
                      decoding="async"
                      className="h-9 w-auto hidden dark:block object-contain"
                    />
                  </picture>
                </Link>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                  ASPES is an autonomous academic evaluation system designed for university computer science and engineering coursework. Combining 6-layer neural inspection with human-in-the-loop faculty control.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  Architecture & Portals
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <li><Link to="/how-it-works" className="hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors">6-Layer AI Pipeline</Link></li>
                  <li><a href="#journeys" className="hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors">Faculty Portal</a></li>
                  <li><a href="#journeys" className="hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors">Student Diagnostic Hub</a></li>
                  <li><a href="#journeys" className="hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors">Admin Telemetry</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  Academic Governance
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <li><span className="text-slate-500">Zero Code Retention Policy</span></li>
                  <li><span className="text-slate-500">FERPA / Academic Privacy</span></li>
                  <li><span className="text-slate-500">Deterministic Marking Engine</span></li>
                  <li><span className="text-slate-500">ABET & NBA Dossier Ready</span></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
              <div>
                © {new Date().getFullYear()} ASPES (AI Smart Project Evaluation System). All rights reserved.
              </div>
              <div className="flex items-center gap-4">
                <span>System Status: <span className="text-emerald-500 font-semibold font-mono">100% Operational</span></span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
