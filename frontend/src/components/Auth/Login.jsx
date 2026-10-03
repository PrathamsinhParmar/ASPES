import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import ThemeToggle from '../Common/ThemeToggle';

const schema = yup.object().shape({
  username: yup.string().required('Email or Username is required'),
  password: yup.string().required('Password is required'),
});

// 3D Glass Isometric Cube with 6 faces (GPU & Compositor Optimized)
const Floating3DCube = ({ size = 72, color = 'indigo' }) => {
  const half = size / 2;
  const isIndigo = color === 'indigo';
  const faceStyle = `absolute inset-0 rounded-xl border ${
    isIndigo
      ? 'border-indigo-400/45 dark:border-indigo-400/35 bg-gradient-to-br from-indigo-500/30 via-indigo-600/20 to-violet-600/35'
      : 'border-cyan-400/45 dark:border-cyan-400/35 bg-gradient-to-br from-cyan-500/30 via-blue-600/20 to-indigo-600/35'
  }`;

  return (
    <div
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
      }}
      className="relative will-change-transform [backface-visibility:hidden]"
    >
      <div className={faceStyle} style={{ transform: `translateZ(${half}px)` }} />
      <div className={faceStyle} style={{ transform: `rotateY(180deg) translateZ(${half}px)` }} />
      <div className={faceStyle} style={{ transform: `rotateY(90deg) translateZ(${half}px)` }} />
      <div className={faceStyle} style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }} />
      <div className={faceStyle} style={{ transform: `rotateX(90deg) translateZ(${half}px)` }} />
      <div className={faceStyle} style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }} />
    </div>
  );
};

// 3D Floating Diamond / Prism (GPU & Compositor Optimized)
const Floating3DDiamond = ({ size = 62 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
      }}
      className="relative will-change-transform [backface-visibility:hidden]"
    >
      <div
        className="absolute inset-0 rounded-2xl border border-violet-400/45 dark:border-violet-400/35 bg-gradient-to-tr from-violet-500/35 to-fuchsia-500/30"
        style={{ transform: 'rotateX(45deg) rotateY(45deg) translateZ(12px)' }}
      />
      <div
        className="absolute inset-0 rounded-2xl border border-indigo-400/40 dark:border-indigo-400/30 bg-gradient-to-bl from-indigo-500/30 to-cyan-500/30"
        style={{ transform: 'rotateX(-45deg) rotateY(-45deg) translateZ(-12px)' }}
      />
    </div>
  );
};

// 3D Floating Orbital Holographic Rings (GPU & Compositor Optimized)
const Floating3DRing = ({ size = 84 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
      }}
      className="relative flex items-center justify-center will-change-transform [backface-visibility:hidden]"
    >
      <div
        className="w-full h-full rounded-full border-2 border-indigo-400/55 dark:border-indigo-400/45 bg-gradient-to-br from-indigo-500/20 to-transparent"
        style={{ transform: 'rotateX(65deg)' }}
      />
      <div
        className="absolute w-2/3 h-2/3 rounded-full border border-violet-400/50 dark:border-violet-400/40"
        style={{ transform: 'rotateX(-65deg)' }}
      />
    </div>
  );
};

// 3D Glass Polyhedral Gem (GPU & Compositor Optimized)
const Floating3DGem = ({ size = 66 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
      }}
      className="relative will-change-transform [backface-visibility:hidden]"
    >
      <div
        className="absolute inset-0 rounded-2xl border border-emerald-400/45 dark:border-emerald-400/35 bg-gradient-to-tr from-emerald-500/30 via-teal-500/25 to-indigo-500/30"
        style={{ transform: 'rotateX(55deg) rotateY(35deg) translateZ(14px)' }}
      />
      <div
        className="absolute inset-0 rounded-2xl border border-teal-400/40 dark:border-teal-400/30 bg-gradient-to-bl from-teal-500/25 to-indigo-600/30"
        style={{ transform: 'rotateX(-55deg) rotateY(-35deg) translateZ(-14px)' }}
      />
    </div>
  );
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      setApiError('');
      await login(data.username, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 relative font-sans transition-colors duration-500 perspective-[1200px] px-4 py-2 sm:py-4">
      {/* Dynamic Background Mesh Grids & Ambient Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.10] dark:opacity-[0.14] pointer-events-none" />

      {/* Atmospheric Spatial Radial Glows (Zero-cost Hardware Accelerated Gradients) */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.14)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.14)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Theme Toggle Position */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
        <ThemeToggle />
      </div>

      {/* ========================================================================= */}
      {/* LEFT SIDE 3D FLOATING ELEMENTS (ASCENDING FROM BOTTOM TO UPPER SIDE)      */}
      {/* ========================================================================= */}
      <div className="absolute inset-y-0 left-0 w-1/4 sm:w-1/3 xl:w-[28%] pointer-events-none overflow-hidden z-10 hidden sm:block">
        {/* Shape 1: Large Isometric Indigo Cube */}
        <motion.div
          className="absolute left-[8%] will-change-transform"
          initial={{ y: '115vh', rotateX: 20, rotateY: 30, rotateZ: 10, opacity: 0 }}
          animate={{
            y: ['115vh', '-25vh'],
            rotateX: [20, 200, 380],
            rotateY: [30, 210, 390],
            rotateZ: [10, 100, 190],
            opacity: [0, 0.9, 0.9, 0],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: 'linear',
            delay: 0,
          }}
        >
          <Floating3DCube size={74} color="indigo" />
        </motion.div>

        {/* Shape 2: Diamond Prism */}
        <motion.div
          className="absolute left-[24%] will-change-transform"
          initial={{ y: '115vh', rotateX: -30, rotateY: 45, opacity: 0 }}
          animate={{
            y: ['115vh', '-25vh'],
            rotateX: [-30, 150, 330],
            rotateY: [45, 225, 405],
            opacity: [0, 0.85, 0.85, 0],
          }}
          transition={{
            duration: 12.5,
            repeat: Infinity,
            ease: 'linear',
            delay: 2.5,
          }}
        >
          <Floating3DDiamond size={64} />
        </motion.div>

        {/* Shape 3: Orbital Holographic Ring */}
        <motion.div
          className="absolute left-[14%] will-change-transform"
          initial={{ y: '115vh', rotateX: 60, rotateZ: 25, opacity: 0 }}
          animate={{
            y: ['115vh', '-25vh'],
            rotateX: [60, 240, 420],
            rotateZ: [25, 180, 385],
            opacity: [0, 0.85, 0.85, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
            delay: 5,
          }}
        >
          <Floating3DRing size={86} />
        </motion.div>

        {/* Shape 4: Polyhedral Gem */}
        <motion.div
          className="absolute left-[33%] will-change-transform"
          initial={{ y: '115vh', rotateX: 55, rotateY: 35, opacity: 0 }}
          animate={{
            y: ['115vh', '-25vh'],
            rotateX: [55, 235, 415],
            rotateY: [35, 215, 395],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: 13,
            repeat: Infinity,
            ease: 'linear',
            delay: 1.5,
          }}
        >
          <Floating3DGem size={66} />
        </motion.div>

        {/* Shape 5: Medium Cyan Cube */}
        <motion.div
          className="absolute left-[18%] will-change-transform"
          initial={{ y: '115vh', rotateX: 45, rotateY: -30, opacity: 0 }}
          animate={{
            y: ['115vh', '-25vh'],
            rotateX: [45, 225, 405],
            rotateY: [-30, -210, -390],
            opacity: [0, 0.85, 0.85, 0],
          }}
          transition={{
            duration: 11.5,
            repeat: Infinity,
            ease: 'linear',
            delay: 7,
          }}
        >
          <Floating3DCube size={64} color="cyan" />
        </motion.div>

        {/* Shape 6: Compact Diamond */}
        <motion.div
          className="absolute left-[30%] will-change-transform"
          initial={{ y: '115vh', rotateX: -20, rotateY: 40, opacity: 0 }}
          animate={{
            y: ['115vh', '-25vh'],
            rotateX: [-20, 160, 340],
            rotateY: [40, 220, 400],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: 9.5,
            repeat: Infinity,
            ease: 'linear',
            delay: 4,
          }}
        >
          <Floating3DDiamond size={54} />
        </motion.div>

        {/* Anchored Weightless 3D Telemetry Preview Card (Desktop) */}
        <motion.div
          className="absolute top-1/2 left-[8%] -translate-y-1/2 hidden xl:block will-change-transform"
          style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
          animate={{
            y: [-12, 12, -12],
            rotateX: [16, 22, 16],
            rotateY: [-22, -16, -22],
            rotateZ: [4, 8, 4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-64 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">AI Engine Status</p>
                  <p className="text-[10px] text-slate-400 font-medium">Neural AST v3.2</p>
                </div>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Evaluation Accuracy</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">99.4%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full w-[99.4%] rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SIDE 3D FLOATING ELEMENTS (ASCENDING FROM BOTTOM TO UPPER SIDE)     */}
      {/* ========================================================================= */}
      <div className="absolute inset-y-0 right-0 w-1/4 sm:w-1/3 xl:w-[28%] pointer-events-none overflow-hidden z-10 hidden sm:block">
        {/* Shape 7: Large Cyan Cube */}
        <motion.div
          className="absolute right-[10%] will-change-transform"
          initial={{ y: '115vh', rotateX: 35, rotateY: -25, rotateZ: -10, opacity: 0 }}
          animate={{
            y: ['115vh', '-25vh'],
            rotateX: [35, 215, 395],
            rotateY: [-25, -205, -385],
            rotateZ: [-10, -90, -170],
            opacity: [0, 0.9, 0.9, 0],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: 'linear',
            delay: 1,
          }}
        >
          <Floating3DCube size={76} color="cyan" />
        </motion.div>

        {/* Shape 8: Diamond Prism */}
        <motion.div
          className="absolute right-[25%] will-change-transform"
          initial={{ y: '115vh', rotateX: 45, rotateY: -45, opacity: 0 }}
          animate={{
            y: ['115vh', '-25vh'],
            rotateX: [45, 225, 405],
            rotateY: [-45, -225, -405],
            opacity: [0, 0.85, 0.85, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
            delay: 3.5,
          }}
        >
          <Floating3DDiamond size={64} />
        </motion.div>

        {/* Shape 9: Orbital Holographic Ring */}
        <motion.div
          className="absolute right-[15%] will-change-transform"
          initial={{ y: '115vh', rotateX: -55, rotateZ: -30, opacity: 0 }}
          animate={{
            y: ['115vh', '-25vh'],
            rotateX: [-55, -235, -415],
            rotateZ: [-30, -190, -390],
            opacity: [0, 0.85, 0.85, 0],
          }}
          transition={{
            duration: 10.5,
            repeat: Infinity,
            ease: 'linear',
            delay: 6,
          }}
        >
          <Floating3DRing size={88} />
        </motion.div>

        {/* Shape 10: Polyhedral Gem */}
        <motion.div
          className="absolute right-[31%] will-change-transform"
          initial={{ y: '115vh', rotateX: -45, rotateY: 50, opacity: 0 }}
          animate={{
            y: ['115vh', '-25vh'],
            rotateX: [-45, 135, 315],
            rotateY: [50, 230, 410],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: 13.5,
            repeat: Infinity,
            ease: 'linear',
            delay: 2,
          }}
        >
          <Floating3DGem size={68} />
        </motion.div>

        {/* Shape 11: Medium Indigo Cube */}
        <motion.div
          className="absolute right-[19%] will-change-transform"
          initial={{ y: '115vh', rotateX: -30, rotateY: 40, opacity: 0 }}
          animate={{
            y: ['115vh', '-25vh'],
            rotateX: [-30, 150, 330],
            rotateY: [40, 220, 400],
            opacity: [0, 0.85, 0.85, 0],
          }}
          transition={{
            duration: 11.5,
            repeat: Infinity,
            ease: 'linear',
            delay: 8,
          }}
        >
          <Floating3DCube size={64} color="indigo" />
        </motion.div>

        {/* Shape 12: Compact Diamond */}
        <motion.div
          className="absolute right-[27%] will-change-transform"
          initial={{ y: '115vh', rotateX: 30, rotateY: -35, opacity: 0 }}
          animate={{
            y: ['115vh', '-25vh'],
            rotateX: [30, 210, 390],
            rotateY: [-35, -215, -395],
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
            delay: 4.5,
          }}
        >
          <Floating3DDiamond size={56} />
        </motion.div>

        {/* Anchored Weightless 3D Telemetry Preview Card (Desktop) */}
        <motion.div
          className="absolute top-1/2 right-[8%] -translate-y-1/2 hidden xl:block will-change-transform"
          style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
          animate={{
            y: [12, -12, 12],
            rotateX: [-16, -22, -16],
            rotateY: [22, 16, 22],
            rotateZ: [-4, -8, -4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-64 p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Audit Protocol</p>
                  <p className="text-[10px] text-slate-400 font-medium">Multi-Layer Guard</p>
                </div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>Real-time Plagiarism & AI Detection</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ========================================================================= */}
      {/* CENTRAL AUTHENTICATION CARD                                               */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] sm:max-w-[450px] mx-auto relative z-20 my-auto"
      >
        <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-9 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.12),0_10px_25px_-5px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)_inset] max-h-[calc(100dvh-1.5rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-all duration-300">
          {/* Subtle Top Accent Sheen */}
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          {/* Form Header with Theme-Adaptive Project Logos */}
          <div className="text-center mb-5 sm:mb-6">
            {/* Theme-Adaptive Logos */}
            <div className="flex justify-center mb-3 sm:mb-3.5">
              {/* Light Mode Logo */}
              <picture>
                <source srcSet="/ASPESLight.webp" type="image/webp" />
                <img
                  src="/ASPESLight.png"
                  alt="ASPES - AI Smart Project Evaluation System"
                  width="240"
                  height="58"
                  fetchPriority="high"
                  className="h-12 sm:h-14 md:h-15 w-auto max-w-[250px] sm:max-w-[275px] object-contain block dark:hidden select-none drop-shadow-xs"
                />
              </picture>
              {/* Dark Mode Logo */}
              <picture>
                <source srcSet="/ASPESDark.webp" type="image/webp" />
                <img
                  src="/ASPESDark.png"
                  alt="ASPES - AI Smart Project Evaluation System"
                  width="240"
                  height="58"
                  fetchPriority="high"
                  className="h-12 sm:h-14 md:h-15 w-auto max-w-[250px] sm:max-w-[275px] object-contain hidden dark:block select-none drop-shadow-xs"
                />
              </picture>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sign In to ASPES Academic Portal
            </h1>
            <p className="mt-1 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-normal">
              Sign in to continue to <span className="font-semibold text-slate-800 dark:text-slate-200">ASPES</span> Evaluation Portal
            </p>
          </div>

          {/* Error Banner */}
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 sm:p-3.5 mb-4 border border-rose-200/80 dark:border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium"
            >
              <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">{apiError}</div>
            </motion.div>
          )}

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Username / Email Input */}
            <div>
              <label className="block text-[11px] sm:text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email address or Username
              </label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                placeholder="e.g. pratham@university.edu"
                className={`w-full px-3.5 py-2.5 sm:py-3 bg-slate-50/80 dark:bg-slate-800/60 border ${
                  errors.username
                    ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500/20'
                    : 'border-slate-200/90 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20'
                } rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 transition-all shadow-2xs`}
              />
              {errors.username && (
                <p className="mt-1 text-[11px] font-medium text-rose-500">{errors.username.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] sm:text-[12px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className={`w-full pl-3.5 pr-10 py-2.5 sm:py-3 bg-slate-50/80 dark:bg-slate-800/60 border ${
                    errors.password
                      ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500/20'
                      : 'border-slate-200/90 dark:border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20'
                  } rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 transition-all shadow-2xs`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] font-medium text-rose-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-60 transition-all duration-200 group cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                )}
              </motion.button>
            </div>
          </form>

          {/* Form Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>Don&apos;t have an account? </span>
            <Link
              to="/register"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
            >
              Create an account
          </div>

          {/* Secondary Public Navigation */}
          <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              ← Back to Home
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link to="/how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              How It Works
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
