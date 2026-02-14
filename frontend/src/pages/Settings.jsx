import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Check, Moon, Monitor, Clock, Brain, Globe, Shield, LogOut } from 'lucide-react';

const SettingsSection = ({ title, description, children }) => (
  <div className="mb-8">
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </div>
    <div className="bg-slate-800/40 border border-white/[0.06] rounded-xl divide-y divide-white/[0.04] overflow-hidden">
      {children}
    </div>
  </div>
);

const SettingRow = ({ icon: Icon, label, description, rightElement }) => (
  <div className="px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
    <div className="flex items-center gap-3">
      <div className="p-1.5 bg-[#151922] rounded-lg text-slate-400">
        <Icon size={16} />
      </div>
      <div>
        <h4 className="text-[13px] font-medium text-white">{label}</h4>
        {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <div>{rightElement}</div>
  </div>
);

const Toggle = ({ active, onToggle }) => (
  <button
    onClick={() => onToggle(!active)}
    className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${active ? 'bg-emerald-500' : 'bg-slate-700'}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

const Select = ({ value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#151922] border border-white/[0.06] rounded-lg py-1.5 pl-2.5 pr-7 text-xs text-slate-300 outline-none focus:border-emerald-500/30 appearance-none cursor-pointer hover:bg-[#1a1f2e] transition-colors"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  </div>
);

const Settings = () => {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [desktopNotifs, setDesktopNotifs] = useState(false);
  const [theme, setTheme] = useState('System');
  const [language, setLanguage] = useState('English');
  const [focusDuration, setFocusDuration] = useState('45 min');
  const [autoSaver, setAutoSaver] = useState(true);

  return (
    <div className="max-w-3xl mx-auto py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-xl font-semibold text-white mb-1">Settings</h1>
        <p className="text-sm text-slate-500">Manage your workspace preferences and account.</p>
      </header>

      <SettingsSection title="General" description="Basic account and interface settings.">
        <SettingRow
          icon={User}
          label="Account Profile"
          description="Manage your personal information."
          rightElement={<button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">Edit</button>}
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
          description="Block notifications during Deep Work."
          rightElement={<div className="flex items-center gap-1.5 text-xs text-emerald-400"><Check size={12} /> Active</div>}
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

      <div className="flex justify-end pt-4 border-t border-white/[0.04]">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs font-medium">
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Settings;
