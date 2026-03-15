import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Loader2, Mail, User, Shield, Briefcase, Lock, UserPlus, FileSignature, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '../Common/ThemeToggle';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email format').required('Email is required'),
  username: yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
  full_name: yup.string().required('Full name is required'),
  password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
  confirm_password: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  role: yup.string().oneOf(['student', 'professor']).required('Role is required'),
  department: yup.string().optional()
});

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      role: 'student'
    }
  });

  const onSubmit = async (data) => {
    try {
      setApiError('');
      setSuccessMsg('');
      
      const userData = {
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        password: data.password,
        role: data.role,
        department: data.department
      };

      await registerUser(userData);
      setSuccessMsg('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-950 dark:to-cyan-950/20 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      {/* Theme Toggle Position on Auth Pages */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      {/* Decorative background shapes */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-l from-indigo-600 to-cyan-600 transform skew-y-6 origin-top-right -z-10 opacity-10"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-2xl px-8 py-10 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] sm:rounded-2xl border border-gray-100 dark:border-slate-800 backdrop-blur-sm relative z-10 my-8 transition-colors">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-50 dark:bg-cyan-900/20 mb-4 shadow-sm border border-cyan-100 dark:border-cyan-500/20">
            <UserPlus className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Join the ASPES platform to manage evaluations
          </p>
        </div>

        {apiError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/10 p-4 mb-6 border border-red-100 dark:border-red-900/20 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">{apiError}</h3>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl bg-emerald-50 p-4 mb-6 border border-emerald-200 flex items-start">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-emerald-800">{successMsg}</h3>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="email@university.edu"
                    className={`text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 block w-full pl-10 pr-3 py-2.5 border ${errors.email ? 'border-red-300 ring-2 ring-red-50 dark:ring-red-900/10' : 'border-gray-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/10 focus:border-indigo-500'} rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-slate-500 transition-all sm:text-sm`}
                  />
                </div>
                {errors.email && <p className="mt-1 ml-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                  </div>
                  <input
                    {...register('username')}
                    type="text"
                    placeholder="john_doe"
                    className={`text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 block w-full pl-10 pr-3 py-2.5 border ${errors.username ? 'border-red-300 ring-2 ring-red-50 dark:ring-red-900/10' : 'border-gray-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/10 focus:border-indigo-500'} rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-slate-500 transition-all sm:text-sm`}
                  />
                </div>
                {errors.username && <p className="mt-1 ml-1 text-xs text-red-500">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FileSignature className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                  </div>
                  <input
                    {...register('full_name')}
                    type="text"
                    placeholder="John Doe"
                    className={`text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 block w-full pl-10 pr-3 py-2.5 border ${errors.full_name ? 'border-red-300 ring-2 ring-red-50 dark:ring-red-900/10' : 'border-gray-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/10 focus:border-indigo-500'} rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-slate-500 transition-all sm:text-sm`}
                  />
                </div>
                {errors.full_name && <p className="mt-1 ml-1 text-xs text-red-500">{errors.full_name.message}</p>}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Role</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                    </div>
                    <select
                      {...register('role')}
                      className="text-gray-900 dark:text-white bg-white dark:bg-slate-800 block w-full pl-9 pr-6 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/10 focus:border-indigo-500 transition-all sm:text-sm cursor-pointer"
                    >
                      <option value="student">Student</option>
                      <option value="professor">Faculty</option>
                    </select>
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1 text-nowrap">Dept <span className="text-gray-400 font-normal">(Opt)</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                    </div>
                    <input
                      {...register('department')}
                      type="text"
                      className="text-gray-900 dark:text-white bg-white dark:bg-slate-800 block w-full pl-9 pr-2 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/10 focus:border-indigo-500 transition-all sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                  </div>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className={`text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 block w-full pl-10 pr-3 py-2.5 border ${errors.password ? 'border-red-300 ring-2 ring-red-50 dark:ring-red-900/10' : 'border-gray-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/10 focus:border-indigo-500'} rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-slate-500 transition-all sm:text-sm`}
                  />
                </div>
                {errors.password && <p className="mt-1 ml-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                  </div>
                  <input
                    {...register('confirm_password')}
                    type="password"
                    placeholder="••••••••"
                    className={`text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 block w-full pl-10 pr-3 py-2.5 border ${errors.confirm_password ? 'border-red-300 ring-2 ring-red-50 dark:ring-red-900/10' : 'border-gray-200 dark:border-slate-700 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/10 focus:border-indigo-500'} rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-slate-500 transition-all sm:text-sm`}
                  />
                </div>
                {errors.confirm_password && <p className="mt-1 ml-1 text-xs text-red-500">{errors.confirm_password.message}</p>}
              </div>

            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                Sign in instead
              </Link>
            </p>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex justify-center items-center py-3 px-8 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all duration-200 md:w-auto w-full"
            >
              {isSubmitting ? (
                 <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  Register
                  <UserPlus className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
