import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Check, Moon, Monitor, Clock, Brain, Globe, Shield, LogOut } from 'lucide-react';

const SettingsSection = ({ title, description, children }) => (
  <div className="mb-10">
    <div className="mb-4">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5 overflow-hidden">
      {children}
    </div>
  </div>
);

const SettingRow = ({ icon: Icon, label, description, rightElement }) => (
  <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
    <div className="flex items-center gap-4">
      <div className="p-2 bg-slate-800 rounded-lg text-slate-300">
        <Icon size={18} />
      </div>
      <div>
        <h4 className="text-sm font-medium text-white">{label}</h4>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
    </div>
    <div>{rightElement}</div>
  </div>
);

const Toggle = ({ active, onToggle }) => (
  <button 
    onClick={() => onToggle(!active)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${active ? 'bg-indigo-600' : 'bg-slate-700'}`}
  >
    <span 
      className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

const Select = ({ value, onChange, options }) => (
    <div className="relative">
        <select 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg py-1.5 pl-3 pr-8 text-sm text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
        >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
    </div>
)

const Settings = () => {
    // State
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [desktopNotifs, setDesktopNotifs] = useState(false);
    const [theme, setTheme] = useState('System');
    const [language, setLanguage] = useState('English');
    const [focusDuration, setFocusDuration] = useState('45 min');
    const [autoSaver, setAutoSaver] = useState(true);

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <header className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your workspace preferences and account settings.</p>
       </header>

       <SettingsSection title="General" description="Basic account and interface settings.">
          <SettingRow 
             icon={User} 
             label="Account Profile" 
             description="Manage your personal information."
             rightElement={<button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">Edit</button>} 
          />
          <SettingRow 
             icon={Globe} 
             label="Language" 
             rightElement={<Select value={language} onChange={setLanguage} options={['English', 'Spanish', 'French', 'German']} />}
          />
          <SettingRow 
             icon={Moon} 
             label="Appearance" 
             description="Customize the look and feel."
             rightElement={<Select value={theme} onChange={setTheme} options={['System', 'Dark', 'Light']} />}
          />
       </SettingsSection>

       <SettingsSection title="Cognitive & Focus" description="Tailor the AI to your working style.">
           <SettingRow 
             icon={Clock} 
             label="Deep Work Session Length" 
             description="Default duration for focus timers."
             rightElement={<Select value={focusDuration} onChange={setFocusDuration} options={['25 min', '45 min', '60 min', '90 min']} />}
           />
           <SettingRow 
             icon={Brain} 
             label="AI Coaching Mode" 
             description="Receive real-time productivity suggestions."
             rightElement={<Toggle active={autoSaver} onToggle={setAutoSaver} />}
           />
           <SettingRow 
             icon={Shield} 
             label="Distraction Shield" 
             description="Automatically block notifications during Deep Work."
             rightElement={<div className="flex items-center gap-2 text-sm text-emerald-400"><Check size={14} /> Active</div>}
           />
       </SettingsSection>

       <SettingsSection title="Notifications" description="Choose what you want to be notified about.">
           <SettingRow 
             icon={Bell} 
             label="Email Notifications" 
             description="Weekly summary and recovery alerts."
             rightElement={<Toggle active={emailNotifs} onToggle={setEmailNotifs} />}
           />
           <SettingRow 
             icon={Monitor} 
             label="Desktop Alerts" 
             description="Break reminders and meeting nudges."
             rightElement={<Toggle active={desktopNotifs} onToggle={setDesktopNotifs} />}
           />
       </SettingsSection>

       <div className="flex justify-end pt-6 border-t border-white/5">
           <button className="flex items-center gap-2 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-sm font-medium">
               <LogOut size={16} />
               Sign Out
           </button>
       </div>
    </div>
  );
};

export default Settings;

