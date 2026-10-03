import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/Common/SEO';
import { getHowItWorksStructuredData } from '../utils/structuredData';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  ShieldAlert,
  Search,
  FileCheck2,
  Calculator,
  MessageSquareCode,
  Layers,
  CheckCircle2,
  Terminal,
  GitBranch,
  Lock,
  Award,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import ThemeToggle from '../components/Common/ThemeToggle';
import useSmoothScroll from '../hooks/useSmoothScroll';

const HowItWorksPage = () => {
  useSmoothScroll();
  const [selectedModule, setSelectedModule] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const modules = [
    {
      id: 1,
      badge: 'Layer 1: Structural Static Analysis',
      title: 'Neural AST & Cyclomatic Complexity Engine',
      icon: Code2,
      accent: 'from-blue-600 to-indigo-600',
      shortDesc: 'Deep syntactic decomposition of student codebases into language-level Abstract Syntax Trees.',
      mathematics: 'M = E - N + 2P (McCabe Cyclomatic Metric) | MI = 171 - 5.2 ln(V) - 0.23(M) - 16.2 ln(LOC)',
      explanation:
        'Instead of surface-level regex or formatting checkers, ASPES compiles student source code into structured Abstract Syntax Trees (AST). The AST parser audits function modularity, maximum branch depth, exception handling resilience, and code smell anti-patterns (such as global state mutation and dead code execution paths).',
      features: [
        'Deterministic calculation of Cyclomatic Complexity and Halstead Volume',
        'Dead code detection and unhandled async exception discovery',
        'Structural compliance with PEP8, Airbnb JS, and clean architecture standards',
        'Language-agnostic AST normalization across Python, TypeScript, Java, and C++',
      ],
      sampleOutput: {
        file: 'services/auth_controller.py',
        metric: 'Cyclomatic Complexity: 4.1 (Low Risk)',
        status: 'Maintainability Index: 92/100',
        detail: 'AST Tree generated: 14 Nodes, 3 Functions, 0 broad Exception captures.',
      },
    },
    {
      id: 2,
      badge: 'Layer 2: Authorship Authenticity',
      title: 'Multi-Model AI Code Generation Discriminator',
      icon: ShieldAlert,
      accent: 'from-amber-600 to-orange-600',
      shortDesc: 'Mathematical perplexity and burstiness analysis to identify LLM-generated code.',
      mathematics: 'PPL(W) = exp(-1/N * Σ ln P(w_i | w_<i)) | Burstiness Index B = (σ - μ) / (σ + μ)',
      explanation:
        'Large Language Models (ChatGPT, Claude, GitHub Copilot) generate code characterized by low token perplexity and uniform burstiness distributions. In contrast, genuine student programming exhibits episodic problem-solving cadence, irregular refactoring comments, and creative variable selections. ASPES calculates token probability entropy to reliably flag synthesized code.',
      features: [
        'Perplexity analysis comparing code entropy against known LLM distributions',
        'Burstiness measurement across variable initialization and control structures',
        'Cross-validated discriminator trained across modern generative foundation models',
        'Confidence interval scoring to prevent false accusations against skilled students',
      ],
      sampleOutput: {
        file: 'core/algorithm.py',
        metric: 'AI Code Probability: 3.2% (Authentic)',
        status: 'Human Cadence Confirmed',
        detail: 'High burstiness entropy detected across control loops; verified manual implementation.',
      },
    },
    {
      id: 3,
      badge: 'Layer 3: Cross-Repository Originality',
      title: 'Semantic Vector Plagiarism Engine',
      icon: Search,
      accent: 'from-rose-600 to-red-600',
      shortDesc: 'Structural tokenization and cosine similarity immune to renamed variables and comment tampering.',
      mathematics: 'Sim(u, v) = (u · v) / (||u|| ||v||) over AST N-gram structural vector space',
      explanation:
        'Conventional plagiarism tools rely on exact string matching, easily tricked by renaming variables (e.g. `user_id` to `account_num`), reordering functions, or stripping comments. ASPES strips superficial syntax and maps the core logical AST vectors into a high-dimensional embedding space, cross-referencing against all historical submissions and peer repos.',
      features: [
        'AST isomorphic hashing invariant to variable renaming and function reordering',
        'Cross-repository cohort similarity matrix updated in real time',
        'Side-by-side syntax-highlighted structural diffs for professor verification',
        'Granular attribution matching identifying exact open-source repository sources',
      ],
      sampleOutput: {
        file: 'Entire Repository vs. 420 Cohort Submissions',
        metric: 'Similarity Index: 1.8% (Negligible)',
        status: 'Originality Verified',
        detail: 'Max peer similarity: 1.8% (common library boilerplate). No plagiarism detected.',
      },
    },
    {
      id: 4,
      badge: 'Layer 4: Documentation Integrity',
      title: 'Report-to-Code Alignment & Feature Realization',
      icon: FileCheck2,
      accent: 'from-cyan-600 to-teal-600',
      shortDesc: 'Semantic NLP auditing matching claimed PDF documentation against actual codebase implementations.',
      mathematics: 'Alignment Score = |Implemented Features ∩ Claimed Features| / |Claimed Features|',
      explanation:
        'Students frequently submit polished 50-page project documentation detailing capabilities (e.g., "Full JWT OAuth2 flow", "Stripe payment integration", "Redis caching") that were never actually implemented. ASPES parses the PDF report, extracts functional specifications, and correlates each claim against AST endpoints, database models, and function signatures.',
      features: [
        'Automated PDF report text and schema extraction via semantic NLP',
        'Detection of "Phantom Features" (documented in report but absent in code)',
        'Detection of "Shadow Features" (implemented in code but absent from documentation)',
        'Verification of architectural claims against actual database schemas and REST routes',
      ],
      sampleOutput: {
        file: 'Report: Capstone_Architecture.pdf vs. Codebase',
        metric: 'Feature Realization: 12 / 12 (100%)',
        status: '0 Phantom Features Flagged',
        detail: 'All claimed functional endpoints verified in `routes/api.py` and database models.',
      },
    },
    {
      id: 5,
      badge: 'Layer 5: Grade Synthesis',
      title: 'Multi-Criteria Comprehensive Rubric Scorer',
      icon: Calculator,
      accent: 'from-emerald-600 to-green-600',
      shortDesc: 'Weighted multi-dimensional normalization synthesizing university-grade scorecards.',
      mathematics: 'Grade = w_1·AST(30%) + w_2·Orig(25%) + w_3·Align(25%) + w_4·Resilience(20%)',
      explanation:
        'Grading large-scale computer science assignments across different teaching assistants causes massive score discrepancies. ASPES harmonizes AST quality, originality, report consistency, and testing resilience into a transparent, normalized grade rubric calibrated by the course instructor.',
      features: [
        'Customizable faculty rubric weights dynamically configurable in the Faculty Portal',
        'Deterministic, reproducible scoring guaranteeing zero bias between students',
        'Multi-axis competency radar charts mapping Student mastery vs cohort percentiles',
        'Export-ready grade cards conforming to university registrar formats',
      ],
      sampleOutput: {
        file: 'Final Assessment Scorecard',
        metric: 'Cumulative Score: 94.6 / 100 (Grade A)',
        status: 'Rubric Calibrated by Faculty',
        detail: 'AST Quality (28.4/30) + Originality (24.8/25) + Alignment (24.5/25) + Tests (16.9/20)',
      },
    },
    {
      id: 6,
      badge: 'Layer 6: Pedagogical Mentorship',
      title: 'Actionable Narrative Feedback & Remediation Synthesizer',
      icon: MessageSquareCode,
      accent: 'from-violet-600 to-purple-600',
      shortDesc: 'Citation-grounded pedagogical feedback with specific file, function, and line refactoring guidance.',
      mathematics: 'Context-conditioned generative synthesis with strict grounding constraints (zero hallucinations)',
      explanation:
        'Grades without feedback fail to teach. ASPES synthesizes automated evaluation outputs into narrative feedback with specific file line citations, refactoring recommendations, and guidance tailored to accelerate student software engineering skills.',
      features: [
        'Hallucination-free recommendations directly grounded in AST node citations',
        'Specific line-number references with sample code refactoring snippets',
        'Non-punitive educational tone designed to coach student growth',
        'Instant student review portal access with one-click faculty endorsement',
      ],
      sampleOutput: {
        file: 'Feedback Synthesis: Student Mentorship Report',
        metric: 'Actionable Insights: 4 Specific Recommendations',
        status: 'Ready for Student Review',
        detail: 'Refactor `db/session.py:42` connection pooling; add unit tests for `calculate_total` in `order.py:88`.',
      },
    },
  ];

  const currentMod = modules[selectedModule];

  return (
    <>
      <SEO
        title="How It Works – ASPES | 6-Layer AI Project Evaluation System"
        description="Explore how ASPES evaluates student code: 6-layer neural pipeline with AST parsing, multi-vector AI detection, cross-repo plagiarism checks, and rubric grading."
        canonicalPath="/how-it-works"
        keywords="how AI detects plagiarism in code, automated code grading architecture, AI project evaluation system, AST code analysis, AI code detector for students"
        schema={getHowItWorksStructuredData()}
      />

      <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-500 overflow-x-hidden">
        {/* Harmonic Ambient Background Glows (Dark Blue, Red, Yellow, Green) */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-[15%] left-[8%] w-[48vw] h-[48vw] rounded-full bg-gradient-to-br from-[#1E3A8A]/18 via-[#2563EB]/10 to-transparent blur-[140px] dark:from-[#1E3A8A]/24" />
          <div className="absolute top-[28%] -right-[8%] w-[44vw] h-[44vw] rounded-full bg-gradient-to-bl from-[#DC2626]/12 via-[#E11D48]/8 to-transparent blur-[140px] dark:from-[#EF4444]/15" />
          <div className="absolute top-[55%] -left-[8%] w-[44vw] h-[44vw] rounded-full bg-gradient-to-tr from-[#D97706]/12 via-[#F59E0B]/8 to-transparent blur-[140px] dark:from-[#FBBF24]/14" />
          <div className="absolute -bottom-[8%] right-[16%] w-[48vw] h-[48vw] rounded-full bg-gradient-to-tl from-[#059669]/14 via-[#10B981]/9 to-transparent blur-[145px] dark:from-[#10B981]/15" />
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-35" />
        </div>

        {/* ========================================================================= */}
        {/* NAVIGATION HEADER (RESPONSIVE ACROSS ALL DEVICES)                         */}
        {/* ========================================================================= */}
        <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/85 dark:bg-[#0B0F19]/85 border-b border-slate-200/70 dark:border-slate-800/70 transition-all">
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
                  className="h-9 sm:h-11 w-auto dark:hidden object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
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
                  className="h-9 sm:h-11 w-auto hidden dark:block object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
                />
              </picture>
            </Link>

            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link
                to="/"
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors"
              >
                Overview
              </Link>
              <a
                href="#pipeline"
                className="text-sm font-semibold text-[#5E60CE] dark:text-[#7275E0] transition-colors"
              >
                Pipeline Architecture
              </a>
              <a
                href="#modules"
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors"
              >
                6 AI Modules
              </a>
              <a
                href="#security"
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors"
              >
                Privacy & Governance
              </a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3.5">
              <ThemeToggle />
              <Link
                to="/login"
                className="hidden sm:inline-flex px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors whitespace-nowrap"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#5E60CE] to-[#4EA8DE] hover:brightness-110 rounded-xl shadow-md shadow-[#5E60CE]/25 transition-all hover:-translate-y-0.5 whitespace-nowrap"
              >
                Try ASPES
              </Link>

              {/* Mobile Menu Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
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
                className="md:hidden border-t border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-2xl overflow-hidden shadow-2xl"
              >
                <div className="px-4 py-4 sm:px-6 space-y-3">
                  <nav className="flex flex-col space-y-1">
                    <Link
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#5E60CE] transition-all flex items-center justify-between"
                    >
                      <span>Overview (Home)</span>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                    </Link>
                    <a
                      href="#pipeline"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#5E60CE] transition-all flex items-center justify-between"
                    >
                      <span>Pipeline Architecture</span>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                    </a>
                    <a
                      href="#modules"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#5E60CE] transition-all flex items-center justify-between"
                    >
                      <span>6 AI Evaluation Modules</span>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                    </a>
                    <a
                      href="#security"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#5E60CE] transition-all flex items-center justify-between"
                    >
                      <span>University Privacy & Security</span>
                      <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
                    </a>
                  </nav>

                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
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
                        Try ASPES
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ========================================================================= */}
        {/* HERO SECTION                                                              */}
        <main className="relative z-10">
          <section className="relative pt-8 pb-4 sm:pt-12 sm:pb-6 lg:pt-14 lg:pb-8">
            <div className="max-w-4xl 2xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#5E60CE]/10 dark:bg-[#5E60CE]/20 text-[#5E60CE] dark:text-[#9A9CEE] border border-[#5E60CE]/20 dark:border-[#5E60CE]/40 shadow-xs mb-3.5 backdrop-blur-md max-w-full"
              >
                <Layers className="w-3.5 h-3.5 text-[#5E60CE] dark:text-[#7275E0] shrink-0" />
                <span className="truncate">Deterministic 6-Stage Autonomous AI Engine</span>
              </motion.div>

              {/* Single Primary H1 */}
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-2xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] sm:leading-[1.12]"
              >
                How the ASPES AI Project{' '}
                <span className="text-transparent bg-clip-text bg-[linear-gradient(to_right,#1E3A8A_0%,#DC2626_35%,#D97706_70%,#059669_100%)] dark:bg-[linear-gradient(to_right,#60A5FA_0%,#F87171_35%,#FBBF24_70%,#34D399_100%)]">
                  Evaluation Engine
                </span>{' '}
                Works
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-2 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed"
              >
                An exhaustive, architectural breakdown of the mathematical models, AST parsers, transformer discriminators, and NLP cross-reference engines powering university-grade code evaluations.
              </motion.p>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* INTERACTIVE VISUAL PIPELINE SELECTOR                                      */}
          {/* ========================================================================= */}
          <section id="pipeline" className="mt-14 sm:mt-18 max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl p-4 sm:p-5 lg:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md">
              <div className="text-center mb-4 sm:mb-5">
                <span className="text-[11px] font-mono font-bold text-[#5E60CE] dark:text-[#7275E0] uppercase tracking-widest">
                  Live Architecture Stepper
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Sequential 6-Layer Evaluation Flow
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Click any stage to inspect its mathematical formulation, AST diagnostics, and output metrics.
                </p>
              </div>

              {/* Step Badges Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
                {modules.map((m, idx) => {
                  const Icon = m.icon;
                  const isSelected = selectedModule === idx;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModule(idx)}
                      className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#5E60CE] to-[#4EA8DE] text-white border-transparent shadow-md shadow-[#5E60CE]/25 scale-[1.02]'
                          : 'bg-slate-50/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/70 hover:border-[#5E60CE]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          L{m.id}
                        </span>
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#5E60CE] dark:text-[#7275E0]'}`} />
                      </div>
                      <div className="text-[10.5px] sm:text-[11px] font-bold leading-tight line-clamp-2">
                        {m.title}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Step Deep Dive Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMod.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.28 }}
                  className="mt-4 p-4 sm:p-5 lg:p-6 rounded-xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 w-full overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start justify-between w-full min-w-0">
                    <div className="w-full min-w-0 max-w-2xl">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#5E60CE]/10 dark:bg-[#5E60CE]/20 text-[#5E60CE] dark:text-[#9A9CEE] mb-2 max-w-full">
                        <span className="truncate">{currentMod.badge}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
                        {currentMod.title}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                        {currentMod.explanation}
                      </p>

                      <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-[#5E60CE] dark:text-[#7275E0] w-full max-w-full overflow-hidden">
                        <span className="font-bold uppercase text-slate-500 dark:text-slate-400 block mb-0.5 text-[10px]">
                          Mathematical Formulation:
                        </span>
                        <div className="break-words leading-relaxed text-[10.5px] sm:text-[11px]">{currentMod.mathematics}</div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                          Engine Capabilities:
                        </span>
                        {currentMod.features.map((f, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="break-words">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Diagnostic Sample Output Box */}
                    <div className="w-full lg:w-[320px] p-3.5 sm:p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-md font-mono text-[11px] space-y-2.5 shrink-0 max-w-full overflow-hidden">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="text-xs truncate">Layer Telemetry Sample</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold shrink-0">200 OK</span>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Target Analyzed:</div>
                        <div className="text-sky-300 font-bold truncate mt-0.5 text-xs">{currentMod.sampleOutput.file}</div>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase">Primary Metric:</div>
                        <div className="text-xs font-bold text-white mt-0.5 break-words">{currentMod.sampleOutput.metric}</div>
                        <div className="text-[10px] text-emerald-400 mt-0.5 break-words">{currentMod.sampleOutput.status}</div>
                      </div>

                      <div className="text-[10.5px] text-slate-400 leading-relaxed pt-0.5 break-words">
                        {currentMod.sampleOutput.detail}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* DEEP DIVE ACCORDION LIST OF ALL 6 AI MODULES                             */}
          {/* ========================================================================= */}
          <section id="modules" className="mt-14 sm:mt-18 max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#5E60CE]/10 dark:bg-[#5E60CE]/20 text-[#5E60CE] dark:text-[#9A9CEE] mb-1.5 border border-[#5E60CE]/20 dark:border-[#5E60CE]/40">
                Technical Blueprint
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                Detailed Analysis of All 6 Evaluation Modules
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Every component operates with mathematical transparency to ensure grading fairness, accuracy, and zero subjective guesswork.
              </p>
            </div>

            <div className="space-y-3.5 sm:space-y-4">
              {modules.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.id}
                    className="p-4 sm:p-5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-start">
                      <div className="w-9 h-9 rounded-xl bg-[#5E60CE]/10 dark:bg-[#5E60CE]/20 text-[#5E60CE] dark:text-[#7275E0] flex items-center justify-center flex-shrink-0 border border-[#5E60CE]/20 dark:border-[#5E60CE]/40 shadow-xs">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 w-full min-w-0">
                        <span className="text-[11px] font-mono font-extrabold text-[#5E60CE] dark:text-[#7275E0]">
                          {m.badge}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 break-words">
                          {m.title}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-normal break-words">
                          {m.explanation}
                        </p>

                        <div className="mt-2.5 p-2 sm:p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 text-[11px] font-mono text-slate-700 dark:text-slate-300 w-full max-w-full overflow-hidden">
                          <span className="font-bold text-[#5E60CE] dark:text-[#7275E0] mr-1.5">Equation:</span>
                          <span className="break-words leading-relaxed text-[10.5px] sm:text-[11px]">{m.mathematics}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2.5">
                          {m.features.map((item, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PRIVACY, SECURITY & ACCREDITATION STANDARDS                               */}
          {/* ========================================================================= */}
          <section id="security" className="mt-14 sm:mt-18 py-8 sm:py-10 bg-slate-50/60 dark:bg-slate-950/60 border-y border-slate-200/80 dark:border-slate-800/80">
            <div className="max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-1.5 border border-emerald-200/60 dark:border-emerald-800/60">
                  Data Governance
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                  University Privacy & Security Standards
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Built to satisfy the stringent compliance requirements of university IT departments, accreditation boards, and student privacy laws.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4.5">
                <div className="p-3.5 sm:p-4 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Zero External Model Training
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-normal">
                    Student code submissions and proprietary repository files are never used to train public LLMs or third-party artificial intelligence engines.
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="w-8 h-8 rounded-lg bg-[#5E60CE]/10 dark:bg-[#5E60CE]/20 text-[#5E60CE] dark:text-[#7275E0] flex items-center justify-center mb-2.5">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Ephemeral Sandboxed Execution
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-normal">
                    Code AST parsing and metric extractions are executed inside transient, isolated containers destroyed immediately following evaluation generation.
                  </p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 sm:col-span-2 md:col-span-1">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Tamper-Proof Audit Logging
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-normal">
                    All grade assessments and faculty overrides are cryptographically timestamped and logged, providing an audit trail for institutional accreditation.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* CALL TO ACTION                                                            */}
          {/* ========================================================================= */}
          <section className="mt-14 sm:mt-18 max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="rounded-2xl p-5 sm:p-8 bg-gradient-to-r from-[#5E60CE] via-[#5390D9] to-[#4EA8DE] text-white shadow-xl shadow-[#5E60CE]/20 relative overflow-hidden text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ready to Deploy the ASPES AI Pipeline?
              </h2>
              <p className="mt-2 text-xs sm:text-sm md:text-base text-blue-100 max-w-lg mx-auto leading-relaxed">
                Experience instantaneous AST code evaluation, report alignment audits, and automated rubric scoring today.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row justify-center gap-2.5 sm:gap-3">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-[#5E60CE] hover:bg-slate-50 font-bold text-xs sm:text-sm shadow-md transition-all hover:-translate-y-0.5 text-center"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all hover:-translate-y-0.5 text-center"
                >
                  Login to Portal
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* ========================================================================= */}
        {/* FOOTER                                                                    */}
        {/* ========================================================================= */}
        <footer className="mt-14 sm:mt-18 border-t border-slate-200/80 dark:border-slate-800/80 py-8 bg-white/70 dark:bg-[#0B0F19]/70 backdrop-blur-xl text-xs text-slate-500 dark:text-slate-400 relative z-10">
          <div className="max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <picture>
                <source srcSet="/ASPESLight.webp" type="image/webp" />
                <img
                  src="/ASPESLight.png"
                  alt="ASPES - AI Smart Project Evaluation System"
                  width="130"
                  height="32"
                  loading="lazy"
                  decoding="async"
                  className="h-8 w-auto dark:hidden object-contain"
                />
              </picture>
              <picture>
                <source srcSet="/ASPESDark.webp" type="image/webp" />
                <img
                  src="/ASPESDark.png"
                  alt="ASPES - AI Smart Project Evaluation System"
                  width="130"
                  height="32"
                  loading="lazy"
                  decoding="async"
                  className="h-8 w-auto hidden dark:block object-contain"
                />
              </picture>
              <span>© {new Date().getFullYear()} ASPES Platform. Academic AI Evaluation Infrastructure.</span>
            </div>

            <div className="flex gap-6 font-semibold">
              <Link to="/" className="hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors">Home</Link>
              <Link to="/login" className="hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-[#5E60CE] dark:hover:text-[#7275E0] transition-colors">Register</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HowItWorksPage;
