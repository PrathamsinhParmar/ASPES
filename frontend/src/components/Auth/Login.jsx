import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Loader2, Mail, Lock, Sparkles } from 'lucide-react';
import ThemeToggle from '../Common/ThemeToggle';

const schema = yup.object().shape({
  username: yup.string().required('Email/Username is required'),
  password: yup.string().required('Password is required'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState('');
  
  const from = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20 relative overflow-hidden transition-colors duration-500">
      {/* Theme Toggle Position on Auth Pages */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      {/* Decorative background shapes */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-r from-blue-600 to-indigo-600 transform -skew-y-6 origin-top-left -z-10 opacity-10"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md px-8 py-10 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] sm:rounded-2xl border border-gray-100 dark:border-slate-800 backdrop-blur-sm mx-4 relative z-10 transition-colors">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/20 mb-4 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
            <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Sign in to continue to <span className="font-semibold text-indigo-600 dark:text-indigo-400">ASPES</span>
          </p>
        </div>

        {apiError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/10 p-4 mb-6 border border-red-100 dark:border-red-900/20 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">{apiError}</h3>
            </div>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Email address or Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 dark:text-slate-500" />
              </div>
              <input
                {...register('username')}
                type="text"
                placeholder="you@university.edu"
                className={`text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 block w-full pl-11 pr-3 py-3 border ${errors.username ? 'border-red-300 ring-4 ring-red-50 dark:ring-red-900/10' : 'border-gray-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/10 focus:border-indigo-500'} rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-slate-500 transition-all duration-200 ease-in-out sm:text-sm`}
              />
            </div>
            {errors.username && <p className="mt-1.5 ml-1 text-sm text-red-500">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 dark:text-slate-500" />
              </div>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={`text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 block w-full pl-11 pr-3 py-3 border ${errors.password ? 'border-red-300 ring-4 ring-red-50 dark:ring-red-900/10' : 'border-gray-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/10 focus:border-indigo-500'} rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-slate-500 transition-all duration-200 ease-in-out sm:text-sm`}
              />
            </div>
            {errors.password && <p className="mt-1.5 ml-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all duration-200"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <span className="flex items-center">
                  Sign in
                  <svg className="ml-2 -mr-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm">
          <p className="text-gray-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
