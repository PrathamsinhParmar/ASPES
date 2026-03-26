import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';

import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  UserIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  TrashIcon,
  PencilSquareIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const API_BASE_URL = api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:8000';

// Validation schema for creating a new faculty account
const facultySchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  full_name: yup.string().required('Full name is required').min(2),
  department: yup.string().optional(),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'At least 8 characters'),
  confirm_password: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

// Validation schema for editing a faculty account
const editFacultySchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  full_name: yup.string().required('Full name is required').min(2),
  department: yup.string().optional(),
  password: yup.string().test('is-long', 'At least 8 characters', val => !val || val.length >= 8),
  confirm_password: yup.string().test('match', 'Passwords must match', function(val) {
    return !this.parent.password || val === this.parent.password;
  }),
  is_active: yup.boolean()
});

// ─── Create Faculty Modal ────────────────────────────────────────────────────
function CreateFacultyModal({ onClose, onCreated }) {
  const [apiError, setApiError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ resolver: yupResolver(facultySchema) });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setApiError('Photo must be less than 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/jpg'].includes(file.type)) {
      setApiError('Photo must be JPEG, PNG, or GIF');
      return;
    }
    setApiError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    try {
      setApiError('');
      const res = await api.post('/users/faculty', {
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        department: data.department || null,
        password: data.password,
        role: 'professor',
      });
      
      const newFaculty = res.data;
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        await api.post(`/users/faculty/${newFaculty.id}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      reset();
      onCreated();
    } catch (err) {
      setApiError(
        err.response?.data?.detail || 'Failed to create faculty account.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-indigo-600 to-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <UserPlusIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add Faculty Member</h2>
              <p className="text-xs text-indigo-200">Create a new faculty account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {apiError && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
            </div>
          )}

          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-800">
            <div className="relative">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900/30 shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-700">
                  <UserIcon className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                </div>
              )}
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              )}
            </div>
            <div>
              <input
                type="file"
                id="photo-upload"
                accept="image/jpeg, image/png, image/gif, image/jpg"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Upload Photo (Optional)
              </label>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Full Name
            </label>
            <input
              {...register('full_name')}
              type="text"
              placeholder="Dr. Jane Smith"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 placeholder-gray-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                errors.full_name
                  ? 'border-red-300 focus:ring-red-200 dark:focus:ring-red-900/20'
                  : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-400'
              }`}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Department
            </label>
            <input
              {...register('department')}
              type="text"
              placeholder="e.g. Computer Science"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 placeholder-gray-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                errors.department
                  ? 'border-red-300 focus:ring-red-200 dark:focus:ring-red-900/20'
                  : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-400'
              }`}
            />
            {errors.department && (
              <p className="mt-1 text-xs text-red-500">{errors.department.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="faculty@university.edu"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 placeholder-gray-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-300 focus:ring-red-200 dark:focus:ring-red-900/20'
                  : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-400'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
              Username
            </label>
            <input
              {...register('username')}
              type="text"
              placeholder="jane_smith"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 placeholder-gray-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
                errors.username
                  ? 'border-red-300 focus:ring-red-200 dark:focus:ring-red-900/20'
                  : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-400'
              }`}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
            )}
          </div>

          {/* Password row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-100 focus:border-indigo-400'
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Confirm
              </label>
              <input
                {...register('confirm_password')}
                type="password"
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 ${
                  errors.confirm_password
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-100 focus:border-indigo-400'
                }`}
              />
              {errors.confirm_password && (
                <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlusIcon className="w-4 h-4" />
              )}
              {isSubmitting ? 'Creating...' : 'Create Faculty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Faculty Modal ────────────────────────────────────────────────────
function EditFacultyModal({ faculty, onClose, onUpdated }) {
  const [apiError, setApiError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const existingPhotoUrl = faculty.profile_photo ? `${API_BASE_URL}${faculty.profile_photo}?v=${new Date(faculty.updated_at || Date.now()).getTime()}` : null;
  const [photoPreview, setPhotoPreview] = useState(existingPhotoUrl);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm({ 
    resolver: yupResolver(editFacultySchema),
    defaultValues: {
      email: faculty.email,
      username: faculty.username,
      full_name: faculty.full_name,
      department: faculty.department || '',
      password: '',
      confirm_password: '',
      is_active: faculty.is_active,
    }
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setApiError('Photo must be less than 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/jpg'].includes(file.type)) {
      setApiError('Photo must be JPEG, PNG, or GIF');
      return;
    }
    setApiError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setRemoveExistingPhoto(false);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (faculty.profile_photo) setRemoveExistingPhoto(true);
  };

  const onSubmit = async (data) => {
    try {
      setApiError('');
      const payload = {
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        department: data.department || null,
        is_active: data.is_active,
      };
      if (data.password) {
        payload.password = data.password;
      }
      
      await api.put(`/users/faculty/${faculty.id}`, payload);

      if (removeExistingPhoto && !photoFile) {
        await api.delete(`/users/faculty/${faculty.id}/photo`);
      }
      
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        await api.post(`/users/faculty/${faculty.id}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      onUpdated();
    } catch (err) {
      setApiError(
        err.response?.data?.detail || 'Failed to update faculty account.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-indigo-600 to-blue-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <PencilSquareIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Edit Faculty Member</h2>
              <p className="text-xs text-indigo-200">Modify existing details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {apiError && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{apiError}</p>
            </div>
          )}

          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-800">
            <div className="relative">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900/30 shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-700">
                  <UserIcon className="w-8 h-8 text-gray-400 dark:text-slate-500" />
                </div>
              )}
              {photoPreview && (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              )}
            </div>
            <div>
              <input
                type="file"
                id="edit-photo-upload"
                accept="image/jpeg, image/png, image/gif, image/jpg"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <label
                htmlFor="edit-photo-upload"
                className="cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Change Photo
              </label>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
            <input
              {...register('full_name')}
              type="text"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 placeholder-gray-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${errors.full_name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-100 focus:border-indigo-400'}`}
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Department</label>
            <input
              {...register('department')}
              type="text"
              placeholder="e.g. Computer Science"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 placeholder-gray-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${errors.department ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-100 focus:border-indigo-400'}`}
            />
            {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email Address</label>
            <input
              {...register('email')}
              type="email"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 placeholder-gray-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${errors.email ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-100 focus:border-indigo-400'}`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Username</label>
            <input
              {...register('username')}
              type="text"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 placeholder-gray-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${errors.username ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-100 focus:border-indigo-400'}`}
            />
            {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              {...register('is_active')}
              type="checkbox"
              id="is_active"
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-slate-300">Account Active</label>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-800 my-4" />
          <p className="text-xs text-gray-500 dark:text-slate-400 italic">Leave password fields blank if you do not wish to change the password.</p>

          {/* Password row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">New Password</label>
              <input
                {...register('password')}
                type="password"
                placeholder="Leave blank to keep"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 ${errors.password ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-100 focus:border-indigo-400'}`}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Confirm New</label>
              <input
                {...register('confirm_password')}
                type="password"
                placeholder="Leave blank to keep"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800/50 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 ${errors.confirm_password ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-100 focus:border-indigo-400'}`}
              />
              {errors.confirm_password && <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isDirty && !photoFile && !removeExistingPhoto)}
              className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <PencilSquareIcon className="w-4 h-4" />
              )}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteConfirmationModal({ onClose, onConfirm, isDeleting, facultyName }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Faculty Member</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            Are you sure you want to delete <strong>{facultyName}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Faculty List Page ────────────────────────────────────────────────────────
const FacultyListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(
    location.state?.openModal === true   // auto-open if Admin clicked "Add Faculty"
  );
  const [successMsg, setSuccessMsg] = useState('');
  const [facultyToDelete, setFacultyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [facultyToEdit, setFacultyToEdit] = useState(null);

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const fetchFaculty = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/users/faculty');
      setFacultyList(res.data);
    } catch (err) {
      setError('Failed to load faculty members. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const handleFacultyCreated = () => {
    setShowModal(false);
    setSuccessMsg('Faculty account created successfully!');
    fetchFaculty();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleEditClick = (e, faculty) => {
    e.stopPropagation();
    setFacultyToEdit(faculty);
  };

  const handleFacultyUpdated = () => {
    setFacultyToEdit(null);
    setSuccessMsg('Faculty account updated successfully!');
    fetchFaculty();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteClick = (e, faculty) => {
    e.stopPropagation();
    setFacultyToDelete(faculty);
  };

  const handleConfirmDelete = async () => {
    if (!facultyToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/faculty/${facultyToDelete.id}`);
      setSuccessMsg(`Faculty member ${facultyToDelete.full_name} deleted successfully!`);
      setFacultyToDelete(null);
      fetchFaculty();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete faculty member.');
      setFacultyToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = facultyList.filter(
    (f) =>
      f.full_name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in bg-gray-50 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            Faculty Members
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage faculty accounts. Click a member to view their dashboard.
          </p>
        </div>
        <button
          id="create-faculty-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <UserPlusIcon className="w-4 h-4" />
          Add Faculty
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          {successMsg}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search faculty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/30 focus:border-indigo-400 transition-all"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchFaculty}
            className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <AcademicCapIcon className="w-14 h-14 text-gray-300 dark:text-slate-700" />
          <p className="text-gray-900 dark:text-white font-semibold">
            {search ? 'No faculty match your search' : 'No faculty members yet'}
          </p>
          <p className="text-sm text-gray-400">
            {search
              ? 'Try a different search term.'
              : 'Click "Add Faculty" to create the first faculty account.'}
          </p>
        </div>
      ) : (
        <>
          {/* Stats bar */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-200 tabular-nums">
              {filtered.length}
            </span>
            {search ? 'result(s) found' : 'faculty member(s)'}
          </div>

          {/* Faculty cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((faculty) => (
              <div
                key={faculty.id}
                id={`faculty-card-${faculty.id}`}
                onClick={() => navigate(`/faculty/${faculty.id}/dashboard`)}
                className="group relative bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700/50 transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  {faculty.profile_photo ? (
                    <img
                      src={`${API_BASE_URL}${faculty.profile_photo}?v=${new Date(faculty.updated_at || Date.now()).getTime()}`}
                      alt={faculty.full_name}
                      className="w-12 h-12 rounded-xl object-cover shadow-md flex-shrink-0 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-indigo-500/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                      {faculty.full_name?.[0]?.toUpperCase() || 'F'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {faculty.full_name}
                      </p>
                      <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors flex-shrink-0 ml-2" />
                    </div>

                    <div className="mt-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span className="font-mono">{faculty.username}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 truncate">
                        <EnvelopeIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{faculty.email}</span>
                      </div>
                      {faculty.department && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 truncate">
                          <BriefcaseIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{faculty.department}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      faculty.is_active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        faculty.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}
                    />
                    {faculty.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 dark:text-slate-500">
                      Joined {faculty.created_at ? format(new Date(faculty.created_at), 'MMM yyyy') : '—'}
                    </span>
                    <button
                      onClick={(e) => handleEditClick(e, faculty)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                      title="Edit Faculty"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, faculty)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete Faculty"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Faculty Modal */}
      {showModal && (
        <CreateFacultyModal
          onClose={() => setShowModal(false)}
          onCreated={handleFacultyCreated}
        />
      )}

      {/* Edit Faculty Modal */}
      {facultyToEdit && (
        <EditFacultyModal
          faculty={facultyToEdit}
          onClose={() => setFacultyToEdit(null)}
          onUpdated={handleFacultyUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {facultyToDelete && (
        <DeleteConfirmationModal
          onClose={() => setFacultyToDelete(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          facultyName={facultyToDelete.full_name}
        />
      )}
    </div>
  );
};

export default FacultyListPage;
