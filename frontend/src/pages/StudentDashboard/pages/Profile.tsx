import React, { useState, useEffect, useRef } from 'react';
import avatarImage from '@/assets/avatar.png';
import { useProfile } from '../hooks/useProfile';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { logoutAndRedirect } from '@/utils/session';

export function Profile() {
  const { data, isLoading, updateProfile, isUpdating, updatePhoto, isUploading } = useProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    if (data?.user) {
      setFullName(data.user.fullName);
      setEmail(data.user.email);
      setPhone(data.user.phone || '');
      setSkills(data.user.skills || []);
      setTheme(data.user.theme as 'light' | 'dark' || 'dark');
      setLanguage(data.user.language || 'English');
    }
  }, [data]);

  const handleSaveChanges = async () => {
    try {
      await updateProfile({
        phone,
        skills,
        theme,
        language
      });
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "There was an error saving your changes.",
      });
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image smaller than 2MB.",
        });
        return;
      }
      try {
        await updatePhoto(file);
        toast({
          title: "Photo Updated",
          description: "Your profile photo has been updated.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Failed to upload the photo.",
        });
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      if (!skills.includes(newSkill.trim())) {
        setSkills([...skills, newSkill.trim()]);
      }
      setNewSkill('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-orange-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-16">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-gray-500 mt-1 font-medium text-[0.9rem]">Manage your profile and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLUMN 1 — Profile & Skills */}
        <div className="flex flex-col gap-6">
          {/* Card 1 — Profile Details */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <label className="block text-[0.7rem] text-gray-400 font-extrabold uppercase tracking-widest mb-6 px-0.5">Profile Details</label>

            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative group">
                  <img 
                    src={data?.user.profilePhotoUrl || avatarImage} 
                    alt={fullName} 
                    className="w-[80px] h-[80px] rounded-full object-cover border-4 border-gray-50 shadow-sm" 
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <i className="fas fa-camera text-white"></i>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoChange}
                  />
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-800 text-white text-[0.65rem] font-bold rounded-lg px-3 py-1.5 mt-3 hover:bg-black transition-colors uppercase tracking-wider"
                >
                  Change
                </button>
                <p className="text-[0.6rem] text-gray-400 mt-2 font-medium">Max size: 2MB</p>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                <div>
                  <label className="block text-[0.7rem] text-gray-500 font-bold mb-1.5 px-0.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    readOnly
                    className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all shadow-sm text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] text-gray-500 font-bold mb-1.5 px-0.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all shadow-sm text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] text-gray-500 font-bold mb-1.5 px-0.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-orange-primary outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSaveChanges}
              disabled={isUpdating}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-extrabold rounded-xl py-3.5 text-sm transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <i className="fas fa-save text-xs opacity-70"></i>}
              Save Changes
            </button>
          </div>

          {/* Card 2 — Learning Preferences */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <label className="block text-[0.7rem] text-gray-400 font-extrabold uppercase tracking-widest mb-4 px-0.5">Learning Preferences</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {skills.map(skill => (
                <span key={skill} className="bg-gray-100 text-gray-700 text-[0.7rem] font-bold rounded-full px-4 py-1.5 flex items-center gap-2 border border-gray-200 group hover:border-orange-primary/30 transition-colors">
                  {skill}
                  <i
                    onClick={() => removeSkill(skill)}
                    className="fas fa-times text-gray-400 hover:text-red-500 cursor-pointer text-[0.6rem] transition-colors"
                  ></i>
                </span>
              ))}
            </div>
            <div className="relative group">
              <input
                type="text"
                placeholder="Add new skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleAddSkill}
                className="w-full border border-gray-200 rounded-xl px-10 py-3 text-sm font-medium focus:border-orange-primary outline-none transition-all shadow-inner bg-gray-50 group-hover:bg-white"
              />
              <i className="fas fa-plus absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs group-hover:text-orange-primary transition-colors"></i>
            </div>
          </div>
        </div>

        {/* COLUMN 2 — System & Account */}
        <div className="flex flex-col gap-6">
          {/* Card 1 — System Preferences */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <label className="block text-[0.7rem] text-gray-400 font-extrabold uppercase tracking-widest mb-6 px-0.5">System Preferences</label>

            <div className="flex items-center justify-between">
              <span className="text-[0.85rem] font-bold text-gray-600">Theme mode</span>
              <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[0.7rem] font-extrabold transition-all ${theme === 'light' ? 'bg-white text-dark-text shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <i className="fas fa-sun text-[0.6rem]"></i> Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[0.7rem] font-extrabold transition-all ${theme === 'dark' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <i className="fas fa-moon text-[0.6rem]"></i> Dark
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 — Account Actions */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <label className="block text-[0.7rem] text-gray-400 font-extrabold uppercase tracking-widest mb-6 px-0.5">Account Actions</label>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => logoutAndRedirect('/')}
                className="w-full bg-red-50 text-[#F87171] border border-red-100 rounded-xl py-3 text-sm font-bold transition-all hover:bg-red-100 flex items-center justify-center gap-2"
              >
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
