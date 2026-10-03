import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserCircleIcon, IdentificationIcon, BuildingOfficeIcon, 
  MapPinIcon, BriefcaseIcon, LinkIcon, PencilSquareIcon, 
  CheckIcon, XMarkIcon, GlobeAltIcon, AcademicCapIcon,
  CheckBadgeIcon, ArrowTopRightOnSquareIcon, EnvelopeIcon,
  SparklesIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

const API_BASE_URL = api.defaults.baseURL?.replace('/api/v1', '') ?? '';

const ProfilePage = () => {
  const { user } = useAuth();
  
  // Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.full_name || 'System User',
    username: user?.username || 'user',
    email: user?.email || '',
    role: user?.role || 'User',
    bio: 'Passionate about leveraging technology to solve complex problems and build scalable, user-centric solutions. Always learning and exploring new frameworks.',
    location: 'San Francisco, CA',
    department: user?.department || 'Computer Science',
    skills: 'React, Node.js, Python, System Design',
    website: 'https://portfolio.dev',
    github: 'github.com/developer'
  });

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        fullName: user.full_name || prev.fullName,
        username: user.username || prev.username,
        email: user.email || prev.email,
        role: user.role || prev.role,
        department: user.department || prev.department,
      }));
    }
  }, [user]);

  const isFaculty = user?.role?.toLowerCase() === 'professor' || user?.role?.toLowerCase() === 'faculty';
  const roleDisplay = isFaculty ? 'Faculty / Professor' : user?.role?.toLowerCase() === 'admin' ? 'System Administrator' : 'Student Scholar';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Profile preferences updated');
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Parse comma-separated skills into clean tags
  const skillTags = profileData.skills
    ? profileData.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans relative overflow-x-hidden animate-fade-in">
      {/* Antigravity Spatial Depth Ambient Glows */}
      <div className="absolute top-0 right-1/4 -translate-y-24 w-[480px] h-[480px] bg-gradient-to-br from-indigo-500/10 to-violet-500/5 dark:from-indigo-600/15 dark:to-purple-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-0 -translate-x-1/2 w-[380px] h-[380px] bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/5 rounded-full blur-[90px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-4.5 font-sans relative z-10">
        
        {/* Clean Page Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                My Profile
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{isFaculty ? 'Academic Faculty' : 'Student Scholar'}</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400">
              Manage your academic identity, departmental credentials, and research profile.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isEditing ? (
              <>
                <button 
                  onClick={handleCancel}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-xs"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button 
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg shadow-sm text-xs font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
              >
                <PencilSquareIcon className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Master Profile Identity & Telemetry Card */}
        <div className="relative rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden p-4 sm:p-5">
          {/* Subtle Top Ambient Sheen */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          {/* Primary Identity Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Avatar & Main Identity */}
            <div className="flex items-center gap-3.5 sm:gap-4.5">
              {/* Avatar with Live Status Indicator */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex-shrink-0">
                {user?.profile_photo ? (
                  <div className="w-full h-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                    <img 
                      src={`${API_BASE_URL}${user.profile_photo}?v=${new Date(user.updated_at || Date.now()).getTime()}`} 
                      alt={user.full_name} 
                      width="80"
                      height="80"
                      loading="lazy"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <UserCircleIcon className="w-10 h-10 stroke-1" />
                  </div>
                )}
                {/* Live Status Pulse */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" title="Active & Verified" />
              </div>

              {/* Name, Handle, Role, and Department Info */}
              <div className="space-y-1">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      name="fullName" 
                      value={profileData.fullName} 
                      onChange={handleInputChange} 
                      className="text-base sm:text-lg font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      placeholder="Full Name" 
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {profileData.fullName}
                    </h2>
                    <CheckBadgeIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" title="Verified Identity" />
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                      {roleDisplay}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold font-mono text-indigo-600 dark:text-indigo-400">
                    @{profileData.username}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <BuildingOfficeIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{profileData.department}</span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{profileData.location}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Badges on Right / Secondary Meta */}
            <div className="flex items-center sm:self-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Verified Identity</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Member</span>
              </span>
            </div>
          </div>

          {/* Clean Subtle Divider */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 my-3 sm:my-4" />

          {/* Quick Stats Telemetry Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
            {/* Designation */}
            <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Designation</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 block truncate max-w-[130px]">{profileData.role}</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/60 flex-shrink-0">
                <BriefcaseIcon className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Department */}
            <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Department</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 block truncate max-w-[130px]">{profileData.department}</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/60 flex-shrink-0">
                <BuildingOfficeIcon className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Location */}
            <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Campus Base</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 block truncate max-w-[130px]">{profileData.location}</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60 flex-shrink-0">
                <MapPinIcon className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Account Status */}
            <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">ASPES Portal</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">Online Sync</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-900/60 flex-shrink-0">
                <SparklesIcon className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid: Left Column & Right Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-4.5">
          
          {/* Left Column (7 cols): Bio & Academic Credentials */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-4.5">
            
            {/* About & Bio Card */}
            <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <IdentificationIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>About & Academic Bio</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">Statement</span>
              </div>

              {isEditing ? (
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                  placeholder="Tell students and colleagues about your background and interests..."
                />
              ) : (
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  {profileData.bio}
                </p>
              )}
            </div>

            {/* Academic Credentials & Department Grid */}
            <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <BriefcaseIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Contact & Departmental Record</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">Verified</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* Email */}
                <div className="p-3 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Email Address</span>
                    {isEditing ? (
                      <input 
                        type="email" 
                        name="email" 
                        value={profileData.email} 
                        onChange={handleInputChange} 
                        className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <a 
                        href={`mailto:${profileData.email}`} 
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5 block truncate"
                        title={profileData.email}
                      >
                        {profileData.email || '—'}
                      </a>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <EnvelopeIcon className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Role / Title */}
                <div className="p-3 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Role / Title</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="role" 
                        value={profileData.role} 
                        onChange={handleInputChange} 
                        className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 block truncate">
                        {profileData.role || '—'}
                      </span>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <BriefcaseIcon className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Department */}
                <div className="p-3 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Department</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="department" 
                        value={profileData.department} 
                        onChange={handleInputChange} 
                        className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 block truncate">
                        {profileData.department || '—'}
                      </span>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <BuildingOfficeIcon className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Campus Location */}
                <div className="p-3 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Campus Base</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        name="location" 
                        value={profileData.location} 
                        onChange={handleInputChange} 
                        className="w-full mt-1 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 block truncate">
                        {profileData.location || '—'}
                      </span>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (5 cols): Skills & Web Presence */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-4.5">
            
            {/* Key Skills & Technologies Card */}
            <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Key Skills & Stack</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">{skillTags.length} Skills</span>
              </div>

              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="skills"
                    value={profileData.skills}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Comma-separated: React, Python, Docker..."
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Separate skills with commas.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skillTags.map((skill, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Web Presence & Repositories Card */}
            <div className="relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <GlobeAltIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Scholarly & Web Presence</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">External</span>
              </div>

              <div className="space-y-2.5 pt-1">
                {/* Website */}
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Portfolio / Academic Website
                  </span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="website" 
                      value={profileData.website} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="https://yourwebsite.com"
                    />
                  ) : (
                    <a 
                      href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                          <GlobeAltIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {profileData.website}
                        </span>
                      </div>
                      <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 ml-1" />
                    </a>
                  )}
                </div>

                {/* GitHub */}
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    GitHub Profile
                  </span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="github" 
                      value={profileData.github} 
                      onChange={handleInputChange} 
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="github.com/yourhandle"
                    />
                  ) : (
                    <a 
                      href={profileData.github.startsWith('http') ? profileData.github : `https://${profileData.github}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg sm:rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {profileData.github}
                        </span>
                      </div>
                      <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
