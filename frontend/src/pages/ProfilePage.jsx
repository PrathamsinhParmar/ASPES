import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserCircleIcon, IdentificationIcon, BuildingOfficeIcon, 
  MapPinIcon, BriefcaseIcon, LinkIcon, PencilSquareIcon, 
  CheckIcon, XMarkIcon, GlobeAltIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const API_BASE_URL = api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:8000';

const ProfilePage = () => {
  const { user } = useAuth();
  
  // Profile State (Mocking extended data that could be wired to backend later)
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

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Save
  const handleSave = () => {
    // In a real app, you would make an API call here to update the user profile.
    setIsEditing(false);
  };

  // Handle Cancel
  const handleCancel = () => {
    // Revert to original user data or last saved state
    setIsEditing(false);
  };

  const InputField = ({ label, name, type = "text", icon: Icon, isTextArea = false }) => {
    const isLink = ['email', 'website', 'github'].includes(name);
    const value = profileData[name];
    
    let displayValue = value || <span className="text-slate-400 italic">Not specified</span>;
    
    if (!isEditing && value && isLink) {
      const href = name === 'email' ? `mailto:${value}` : (value.startsWith('http') ? value : `https://${value}`);
      displayValue = (
        <a href={href} target={name === 'email' ? '_self' : '_blank'} rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-all">
          {value}
        </a>
      );
    }

    return (
      <div className="col-span-1">
        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
        {isEditing ? (
          <div className="relative">
            {Icon && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
            )}
            {isTextArea ? (
              <textarea
                name={name}
                value={value}
                onChange={handleInputChange}
                rows="2"
                className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm p-2 text-slate-900 dark:text-white border transition-all"
              />
            ) : (
              <input
                type={type}
                name={name}
                value={value}
                onChange={handleInputChange}
                className={`block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm p-1.5 text-slate-900 dark:text-white border transition-all ${Icon ? 'pl-9' : ''}`}
              />
            )}
          </div>
        ) : (
          <div className="flex items-start gap-2.5 mt-0.5">
            {Icon && <Icon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
            <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm leading-relaxed">
              {displayValue}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in relative dark:bg-slate-950 min-h-screen">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-200/20 dark:bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3"></div>

      {/* Page Header */}
      <div className="flex justify-between items-end mb-8 z-10 relative">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Profile</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Manage your personal information and professional presence.</p>
        </div>
        
        {/* Edit / Save Actions */}
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button 
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 shadow-sm text-sm font-bold rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <XMarkIcon className="-ml-1 mr-2 h-4 w-4" /> Cancel
              </button>
              <button 
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-md shadow-indigo-500/20 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                <CheckIcon className="-ml-1 mr-2 h-4 w-4" /> Save Profile
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-slate-200 shadow-sm text-sm font-bold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <PencilSquareIcon className="-ml-1 mr-2 h-4 w-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden z-10 relative">
        {/* Cover Image */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-28 sm:h-32 relative transition-all duration-500">
           <div className="absolute inset-0 bg-white/10 pattern-grid-lg"></div>
           {/* Avatar */}
           <div className="absolute -bottom-10 left-6 sm:left-10 p-1 bg-white dark:bg-slate-800 rounded-full shadow-md">
             {user?.profile_photo ? (
               <div className="bg-slate-50 dark:bg-slate-900 rounded-full h-20 w-20 flex items-center justify-center overflow-hidden border border-indigo-50 dark:border-indigo-900/50">
                 <img src={`${API_BASE_URL}${user.profile_photo}?v=${new Date(user.updated_at || Date.now()).getTime()}`} alt={user.full_name} className="w-full h-full object-cover" />
               </div>
             ) : (
               <div className="bg-slate-50 dark:bg-slate-900 rounded-full h-20 w-20 flex items-center justify-center border border-indigo-50 dark:border-indigo-900/50">
                 <UserCircleIcon className="w-16 h-16 text-slate-300 dark:text-slate-700" />
               </div>
             )}
           </div>
        </div>

        {/* Profile Content Body */}
        <div className="pt-14 pb-8 px-6 sm:px-10">
           
           {/* Primary Identity */}
           <div className="mb-8">
             {isEditing ? (
               <div className="max-w-sm space-y-3">
                 <div>
                   <label className="sr-only">Full Name</label>
                   <input type="text" name="fullName" value={profileData.fullName} onChange={handleInputChange} className="block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xl font-bold py-1 px-3 border text-slate-900 dark:text-white" placeholder="Full Name" />
                 </div>
               </div>
             ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{profileData.fullName}</h2>
                  <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm mt-0.5">@{profileData.username}</p>
                </>
             )}
           </div>

           {/* Details Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
             
             {/* Left Column: Core Info & Bio */}
             <div className="lg:col-span-7 space-y-8">
                
                {/* About Section */}
                <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                  <InputField label="About & Bio" name="bio" isTextArea={true} />
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
                  <InputField label="Email Address" name="email" type="email" icon={IdentificationIcon} />
                  <InputField label="Role / Title" name="role" icon={BriefcaseIcon} />
                  <InputField label="Department" name="department" icon={BuildingOfficeIcon} />
                  <InputField label="Location" name="location" icon={MapPinIcon} />
                </div>
             </div>

             {/* Right Column: Skills & Socials */}
             <div className="lg:col-span-5 space-y-8">
                
                <div className="bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl p-6 border border-indigo-50 dark:border-indigo-900/30 flex flex-col gap-6">
                  <InputField label="Key Skills & Technologies" name="skills" icon={UserCircleIcon} isTextArea={isEditing} />
                  
                  <div className="h-px bg-indigo-100 dark:bg-indigo-900/50 w-full"></div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Web Presence</h3>
                    <InputField label="Portfolio Website" name="website" icon={GlobeAltIcon} />
                    <InputField label="GitHub Profile" name="github" icon={LinkIcon} />
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
