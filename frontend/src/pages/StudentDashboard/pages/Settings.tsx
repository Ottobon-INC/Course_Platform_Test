import React, { useState } from 'react';
import { SETTINGS_NOTIFICATION_LABELS } from '../constants/mockData';
import avatarImage from '@/assets/avatar.png';

export function Settings() {
  const [fullName, setFullName] = useState('Alex Johnson');
  const [email, setEmail] = useState('alex.johnson@example.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [skills, setSkills] = useState(['Frontend', 'React', 'UI/UX']);
  const [newSkill, setNewSkill] = useState('');
  const [notifications, setNotifications] = useState([true, true, true, true, true]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [twoFactor, setTwoFactor] = useState(true);
  const [language, setLanguage] = useState('English');

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

  const toggleNotification = (idx: number) => {
    const newNotes = [...notifications];
    newNotes[idx] = !newNotes[idx];
    setNotifications(newNotes);
  };

  return (
    <div className="animate-fade-in pb-16">
      {/* Page Header */}
      <div className="mb-8">
        <p className="text-gray-500 mt-1 font-medium text-[0.9rem]">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMN 1 — Profile & Skills */}
        <div className="flex flex-col gap-6">
          {/* Card 1 — Profile Settings */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <label className="block text-[0.7rem] text-gray-400 font-extrabold uppercase tracking-widest mb-6 px-0.5">Profile Settings</label>

            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative group">
                  <img src={avatarImage} alt="Alex" className="w-[80px] h-[80px] rounded-full object-cover border-4 border-gray-50 shadow-sm" />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <i className="fas fa-camera text-white"></i>
                  </div>
                </div>
                <button className="bg-gray-800 text-white text-[0.65rem] font-bold rounded-lg px-3 py-1.5 mt-3 hover:bg-black transition-colors uppercase tracking-wider">Change</button>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                <div>
                  <label className="block text-[0.7rem] text-gray-500 font-bold mb-1.5 px-0.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-orange-primary outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] text-gray-500 font-bold mb-1.5 px-0.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-orange-primary outline-none transition-all shadow-sm"
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

            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl py-3.5 text-sm transition-all transform hover:-translate-y-0.5 shadow-md flex items-center justify-center gap-2">
              <i className="fas fa-save text-xs opacity-70"></i> Save Changes
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

        {/* COLUMN 2 — Notifications & System */}
        <div className="flex flex-col gap-6">
          {/* Card 1 — Notifications */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <label className="block text-[0.7rem] text-gray-400 font-extrabold uppercase tracking-widest mb-6 px-0.5">Notifications</label>
            <div className="space-y-5">
              {SETTINGS_NOTIFICATION_LABELS.map((label, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <span className="text-[0.85rem] font-bold text-gray-600 group-hover:text-dark-text transition-colors">{label}</span>
                  <div
                    onClick={() => toggleNotification(idx)}
                    className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors border-2 shadow-inner ${notifications[idx] ? 'bg-orange-600 border-orange-600' : 'bg-gray-200 border-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-md transform transition-transform ${notifications[idx] ? 'translate-x-5' : 'translate-x-0'}`}></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2 — System Preferences */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <label className="block text-[0.7rem] text-gray-400 font-extrabold uppercase tracking-widest mb-6 px-0.5">System Preferences</label>

            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-50">
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

            <div>
              <label className="block text-[0.7rem] text-gray-500 font-bold mb-2.5 px-0.5">Language</label>
              <div className="relative group">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-11 border border-gray-200 rounded-xl px-4 py-1 text-sm font-medium bg-white appearance-none cursor-pointer focus:border-orange-primary outline-none transition-all shadow-sm"
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-xs pointer-events-none group-hover:text-orange-primary transition-colors"></i>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3 — Security & Account */}
        <div className="flex flex-col gap-6">
          {/* Card 1 — Security */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <label className="block text-[0.7rem] text-gray-400 font-extrabold uppercase tracking-widest mb-6 px-0.5">Security</label>

            <button className="w-full bg-[#4A7C7C] hover:bg-[#3D6B6B] text-white font-extrabold rounded-xl py-3 text-sm mb-6 transition-all shadow-sm">
              Change Password
            </button>

            <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-50">
              <span className="text-[0.85rem] font-bold text-gray-600 leading-tight">Two-Factor Authentication</span>
              <div
                onClick={() => setTwoFactor(!twoFactor)}
                className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors border-2 shadow-inner ${twoFactor ? 'bg-orange-600 border-orange-600' : 'bg-gray-200 border-gray-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-md transform transition-transform ${twoFactor ? 'translate-x-5' : 'translate-x-0'}`}></span>
              </div>
            </div>

            <div>
              <label className="block text-[0.85rem] font-extrabold text-dark-text mb-1 px-1">Active Sessions</label>
              <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest mb-5 px-1 leading-none">Device + Browser</p>

              <div className="space-y-4">
                {[
                  { device: 'MacBook Pro - Chrome', status: 'Active Now' },
                  { device: 'iPhone 15 - Safari', status: '2 hours ago' }
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm">
                        <i className={`fas ${session.device.includes('MacBook') ? 'fa-laptop' : 'fa-mobile-alt'} text-xs`}></i>
                      </div>
                      <div>
                        <p className="text-[0.75rem] font-extrabold text-dark-text">{session.device}</p>
                        <p className="text-[0.65rem] text-green-500 font-bold">{session.status}</p>
                      </div>
                    </div>
                    <span className="text-[0.7rem] font-bold text-orange-600 hover:underline cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">Logout</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2 — Danger Zone */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <label className="block text-[0.7rem] text-gray-400 font-extrabold uppercase tracking-widest mb-6 px-0.5">Account Actions</label>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <a href="https://learn.ottobon.in" className="border border-gray-200 rounded-xl py-2.5 text-[0.75rem] font-extrabold text-gray-600 hover:bg-gray-50 hover:text-dark-text transition-all text-center">Logout</a>
              <button className="border border-gray-200 rounded-xl py-2.5 text-[0.75rem] font-extrabold text-gray-600 hover:bg-gray-50 hover:text-dark-text transition-all">Reset All</button>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-exclamation-triangle text-orange-500 text-xs"></i>
                <span className="text-[0.65rem] font-extrabold text-orange-600 uppercase tracking-widest">Danger Zone</span>
              </div>
              <p className="text-[0.7rem] text-gray-500 font-medium leading-relaxed mb-4">
                Deleting your account will remove all progress and certificates permanently.
              </p>
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl py-3 text-[0.8rem] transition-all shadow-md">
                Delete Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
