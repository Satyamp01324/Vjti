import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Search, Bell, Clock, ChevronDown, Grid, Calendar,
  MessageSquare, FileText, Hexagon, Settings, HelpCircle, LogOut,
  ArrowRightLeft, Filter, Sliders, Check, MoreHorizontal, ArrowUpRight,
  ArrowDownRight, ShieldCheck, Sparkles, Brain, Zap, Coffee, BatteryCharging,
  TrendingUp, Activity, CheckCircle2, AlertCircle, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTodaySnapshot, getForecast, overrideSpoons, seedDemoProfile } from '../api';
import PulseGameModal from './PulseGameModal';
import DopamineMenuModal from './DopamineMenuModal';
import EveningCheckinModal from './EveningCheckinModal';

const VertixDashboard = ({
  userName = 'Code XR',
  userEmail = 'tester.neuropilot@example.com',
  energyLevel = 78,
  metrics = {},
  userId = 'demo_student',
  onLogout
}) => {
  const navigate = useNavigate();

  // State
  const [activeNav, setActiveNav] = useState('Overview');
  const [activeSideIcon, setActiveSideIcon] = useState('grid');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [spoons, setSpoons] = useState(8.4);
  const [energyScore, setEnergyScore] = useState(energyLevel || 78);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activePersona, setActivePersona] = useState('demo');
  const [personaLoading, setPersonaLoading] = useState(false);

  // Modals
  const [isPulseOpen, setIsPulseOpen] = useState(false);
  const [isDopamineOpen, setIsDopamineOpen] = useState(false);
  const [isEveningOpen, setIsEveningOpen] = useState(false);

  // Fetch real project data on mount or persona switch
  const fetchDashboardData = async () => {
    try {
      const snap = await getTodaySnapshot(userId || 'demo_student').catch(() => null);
      if (snap) {
        if (snap.live_spoons !== undefined) setSpoons(snap.live_spoons);
        else if (snap.prior_spoons !== undefined) setSpoons(snap.prior_spoons);
        if (snap.battery_score !== undefined) setEnergyScore(snap.battery_score);
      }
    } catch (e) {
      console.warn('Dashboard data fetch:', e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const handleSwitchPersona = async (persona) => {
    setActivePersona(persona);
    setPersonaLoading(true);
    try {
      await seedDemoProfile(persona, userId || 'demo_student');
      await fetchDashboardData();
    } catch (e) {
      console.warn('Persona seed error:', e);
    } finally {
      setPersonaLoading(false);
    }
  };

  const handleSpoonChange = async (val) => {
    const num = parseFloat(val);
    setSpoons(num);
    try {
      await overrideSpoons(userId || 'demo_student', num);
    } catch (err) {
      console.warn('Spoon override error:', err);
    }
  };

  const navItems = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Insights', path: '/insights' },
    { label: 'Recovery', path: '/recovery' },
    { label: 'Deep Work', path: '/deep-work' },
    { label: 'Settings', path: '/settings' },
  ];

  // Cognitive State Allocations (replacing fintech wallets)
  const cognitiveAllocations = [
    { id: 'focus', title: 'Deep Focus', icon: '🧠', spoons: `${(spoons * 0.45).toFixed(1)} Spoons`, status: 'Active', active: true },
    { id: 'transit', title: 'Campus/Commute', icon: '🚆', spoons: `${(spoons * 0.3).toFixed(1)} Spoons`, status: 'Scheduled', active: true },
    { id: 'reserve', title: 'Rest Reserve', icon: '🌱', spoons: `${(spoons * 0.25).toFixed(1)} Spoons`, status: 'Restored', active: false },
  ];

  // Real Project Activities (replacing mobile app purchases and invoices)
  const activities = [
    { id: 'SESS_108', activity: 'Machine Learning Deep Work Session', icon: '🧠', load: '-1.8 Spoons', status: 'Completed', statusColor: 'text-emerald-500 bg-emerald-50', date: 'Today 03:45 PM' },
    { id: 'SESS_107', activity: '20-Second Cognitive Pulse Probe', icon: '⚡', load: '+0.5 Spoons', status: 'Restored', statusColor: 'text-purple-500 bg-purple-50', date: 'Today 01:20 PM' },
    { id: 'SESS_106', activity: 'Transit Commute Decompression', icon: '🚆', load: '-0.8 Spoons', status: 'Completed', statusColor: 'text-emerald-500 bg-emerald-50', date: 'Today 11:30 AM' },
    { id: 'SESS_105', activity: 'Distributed Systems Seminar', icon: '📚', load: '-1.4 Spoons', status: 'Completed', statusColor: 'text-emerald-500 bg-emerald-50', date: 'Today 09:15 AM' },
    { id: 'SESS_104', activity: 'Evening Dopamine Reset & Walk', icon: '☕', load: '+1.2 Spoons', status: 'Restored', statusColor: 'text-purple-500 bg-purple-50', date: 'Yesterday 08:30 PM' },
    { id: 'SESS_103', activity: 'Database Architecture Sprint', icon: '⚙️', load: '-2.0 Spoons', status: 'In Review', statusColor: 'text-amber-500 bg-amber-50', date: 'Yesterday 04:00 PM' },
  ];

  // 7-Day Cognitive Weather & Capacity (Replacing Profit and Loss)
  const cognitiveForecast = [
    { day: 'Mon', capacity: 55, drain: 35 },
    { day: 'Tue', capacity: 60, drain: 45 },
    { day: 'Wed', capacity: 65, drain: 30 },
    { day: 'Thu', capacity: 50, drain: 42 },
    { day: 'Fri', capacity: 48, drain: 28 },
    { day: 'Sat', capacity: 70, drain: 15 },
    { day: 'Sun', capacity: 75, drain: 12 },
  ];

  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.activity.toLowerCase().includes(searchQuery.toLowerCase()) || a.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === 'All') return matchesSearch;
    return matchesSearch && a.status === selectedFilter;
  });

  // Theme colors
  const bgMain = isDarkMode ? 'bg-[#0B0E14] text-white' : 'bg-[#F2F4F7] text-[#1E2229]';
  const cardBg = isDarkMode ? 'bg-[#151922] border-[#222734] shadow-[0_10px_30px_rgba(0,0,0,0.4)]' : 'bg-white border-[#E9ECF2] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.04)]';
  const pillBg = isDarkMode ? 'bg-[#1D2230]' : 'bg-[#E7E9EE]';

  return (
    <div className={`min-h-screen ${bgMain} flex flex-col transition-colors duration-300 font-sans selection:bg-[#FF553E] selection:text-white`}>
      {/* ─── TOP APP HEADER ─── */}
      <header className="px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-[#FF553E] flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_16px_rgba(255,85,62,0.35)] cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight">Vertix</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF553E]/10 text-[#FF553E] font-semibold border border-[#FF553E]/20">
                Cognitive OS
              </span>
            </div>
          </div>
        </div>

        {/* Center Pill Navigation */}
        <nav className={`${pillBg} p-1.5 rounded-full flex items-center gap-1 shadow-inner max-w-2xl overflow-x-auto`}>
          {navItems.map((item) => {
            const isActive = activeNav === item.label;
            return (
              <button
                key={item.label}
                onClick={() => {
                  setActiveNav(item.label);
                  if (item.path !== '/dashboard') navigate(item.path);
                }}
                className={`relative px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="vertix-nav-pill"
                    className="absolute inset-0 bg-[#15171C] rounded-full shadow-md z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools & User Profile */}
        <div className="flex items-center gap-3">
          {/* Search Button */}
          <button
            onClick={() => navigate('/tasks')}
            className={`w-9 h-9 rounded-full ${cardBg} border flex items-center justify-center hover:scale-105 transition-all text-slate-500 hover:text-black`}
            title="Search Tasks"
          >
            <Search size={16} />
          </button>

          {/* Quick Evening Modal */}
          <button
            onClick={() => setIsEveningOpen(true)}
            className={`w-9 h-9 rounded-full ${cardBg} border flex items-center justify-center hover:scale-105 transition-all relative text-slate-500 hover:text-black`}
            title="Evening Check-in"
          >
            <Moon size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF553E] ring-2 ring-white" />
          </button>

          {/* History / Sessions */}
          <button
            onClick={() => navigate('/insights')}
            className={`w-9 h-9 rounded-full ${cardBg} border flex items-center justify-center hover:scale-105 transition-all text-slate-500 hover:text-black`}
            title="Cognitive Sessions History"
          >
            <Clock size={16} />
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`${cardBg} border px-2.5 py-1.5 rounded-full flex items-center gap-2.5 hover:shadow-md transition-all`}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF553E] to-orange-400 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white">
                {userName ? userName.slice(0, 2).toUpperCase() : 'CX'}
              </div>
              <div className="text-left hidden sm:block leading-tight pr-1">
                <p className="text-xs font-bold">{userName || 'Code XR'}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{userEmail || 'tester.neuropilot@example.com'}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 mt-2 w-52 ${cardBg} border rounded-2xl p-2 shadow-2xl z-50`}
                >
                  <div className="px-3 py-2 border-b border-black/[0.06] mb-1">
                    <p className="text-xs font-semibold">{userName || 'Code XR'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
                  </div>
                  <button onClick={() => { setShowProfileMenu(false); navigate('/settings'); }} className="w-full px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-black/5 text-slate-600 transition-colors">
                    <Settings size={14} /> Account Settings
                  </button>
                  <button onClick={() => { setShowProfileMenu(false); navigate('/insights'); }} className="w-full px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-black/5 text-slate-600 transition-colors">
                    <Brain size={14} /> Cognitive Insights
                  </button>
                  <button onClick={() => { setShowProfileMenu(false); onLogout(); }} className="w-full px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-red-50 text-red-500 font-semibold transition-colors mt-1">
                    <LogOut size={14} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT BODY ─── */}
      <div className="flex-1 px-6 pb-8 flex gap-6">
        {/* ─── LEFT FLOATING DOCK (Vertix Icon Rail) ─── */}
        <aside className="hidden md:flex flex-col items-center justify-between py-3 gap-6 w-14 shrink-0">
          {/* Top: Day/Night Mode Switch Pill */}
          <div className={`${cardBg} border p-1 rounded-full flex flex-col items-center gap-1 shadow-sm`}>
            <button
              onClick={() => setIsDarkMode(false)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                !isDarkMode ? 'bg-[#FF553E] text-white shadow-md' : 'text-slate-400 hover:text-black'
              }`}
              title="Light Theme"
            >
              <Sun size={17} />
            </button>
            <button
              onClick={() => setIsDarkMode(true)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isDarkMode ? 'bg-[#FF553E] text-white shadow-md' : 'text-slate-400 hover:text-black'
              }`}
              title="Dark Theme"
            >
              <Moon size={16} />
            </button>
          </div>

          {/* Middle: Floating App Icons Dock */}
          <div className={`${cardBg} border p-1.5 rounded-full flex flex-col items-center gap-2 shadow-sm`}>
            {[
              { id: 'grid', icon: Grid, label: 'Overview', action: () => navigate('/dashboard') },
              { id: 'tasks', icon: Calendar, label: 'Tasks & Planner', action: () => navigate('/tasks') },
              { id: 'deepwork', icon: Brain, label: 'Deep Work Mode', action: () => navigate('/deep-work') },
              { id: 'insights', icon: TrendingUp, label: 'Cognitive Insights', action: () => navigate('/insights') },
              { id: 'recovery', icon: Hexagon, label: 'Recovery Cycles', action: () => navigate('/recovery') },
              { id: 'settings', icon: Settings, label: 'Settings', action: () => navigate('/settings') },
            ].map(({ id, icon: Icon, label, action }) => {
              const active = activeSideIcon === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setActiveSideIcon(id);
                    action();
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all group relative ${
                    active
                      ? 'bg-[#15171C] text-white shadow-md'
                      : isDarkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-black/5'
                  }`}
                  title={label}
                >
                  <Icon size={17} />
                  <span className="absolute left-14 px-2 py-1 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom: Dopamine & Logout */}
          <div className={`${cardBg} border p-1.5 rounded-full flex flex-col items-center gap-2 shadow-sm`}>
            <button
              onClick={() => setIsDopamineOpen(true)}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${isDarkMode ? 'text-amber-400 hover:text-white' : 'text-amber-600 hover:text-black'}`}
              title="Dopamine Menu"
            >
              <Coffee size={17} />
            </button>
            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* ─── DASHBOARD GRID (Project Data with Vertix UI/UX) ─── */}
        <main className="flex-1 space-y-6 max-w-[1500px]">
          {/* Greeting Header & Persona Preset Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Good morning, {userName || 'Code XR'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Real-time cognitive battery, load-aware scheduling, and SpoonSense rhythm.
              </p>
            </div>

            {/* Persona Switcher for Hackathon Reviewers */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-full bg-white border border-slate-200 text-xs shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Preset:</span>
                <button
                  onClick={() => handleSwitchPersona('aarav')}
                  disabled={personaLoading}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activePersona === 'aarav'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-black'
                  }`}
                  title="Heavy commute: 4h transit -> 2.4 Spoons"
                >
                  🚆 Aarav (4h Transit)
                </button>
                <button
                  onClick={() => handleSwitchPersona('meera')}
                  disabled={personaLoading}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activePersona === 'meera'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-black'
                  }`}
                  title="Walk to campus: 20m walk -> 7.4 Spoons"
                >
                  🚶 Meera (Walk)
                </button>
              </div>

              {/* Deep Work Shortcut */}
              <button
                onClick={() => navigate('/deep-work')}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#15171C] text-white hover:bg-black transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Brain size={13} />
                <span>Deep Work</span>
              </button>
            </div>
          </div>

          {/* Top Row: Cognitive Energy Balance Card | 4-Stats Grid | 7-Day Cognitive Weather Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ─── CARD 1: COGNITIVE ENERGY BALANCE (Col 4) ─── */}
            <div className={`lg:col-span-4 ${cardBg} border rounded-[2.2rem] p-6 space-y-5 flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Cognitive Energy Balance
                  </span>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    <span>🧠 SpoonSense Matrix</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-extrabold tracking-tight">
                      {spoons.toFixed(1)} <span className="text-lg font-medium text-slate-400">/ 12.0</span>
                    </h2>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    Live Spoons Remaining ({energyScore}% Battery)
                  </p>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-2 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold border border-emerald-100">
                    <ArrowUpRight size={13} />
                    <span>+14% Optimal Cognitive Bandwidth</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Replaces Transfer / Request) */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPulseOpen(true)}
                  className="flex-1 py-3 px-4 bg-[#15171C] hover:bg-black text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <Zap size={14} className="text-[#FF553E]" /> 20s Pulse Probe
                </button>
                <button
                  onClick={() => setIsDopamineOpen(true)}
                  className="flex-1 py-3 px-4 bg-[#F2F4F7] hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Coffee size={14} className="text-amber-500" /> Dopamine Reset
                </button>
              </div>

              {/* Cognitive State Allocation (Replaces USD/EUR/GBP wallets) */}
              <div className="pt-2 border-t border-black/[0.04]">
                <p className="text-[11px] font-semibold text-slate-500 mb-2.5">
                  Cognitive Allocation <span className="text-slate-400 font-normal">| 3 Primary Modes</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {cognitiveAllocations.map((w) => (
                    <div key={w.id} className="p-2.5 rounded-2xl bg-[#F7F8FA] border border-black/[0.03] text-left">
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <span>{w.icon}</span>
                        <span className="text-slate-700 truncate">{w.title}</span>
                      </div>
                      <p className="text-xs font-bold mt-1 text-slate-900 truncate">{w.spoons}</p>
                      <span className={`text-[9px] font-semibold block mt-1 ${w.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {w.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── CARD 2: 4-STATS COGNITIVE METRICS GRID (Col 4) ─── */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-4">
              {/* Stat 1: Cognitive Battery (Coral Highlight Card) */}
              <div className="rounded-[2.2rem] bg-gradient-to-br from-[#FF553E] to-[#FF6F52] text-white p-5 shadow-[0_16px_36px_rgba(255,85,62,0.3)] flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/90">
                    Cognitive Battery
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Zap size={13} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold">{energyScore}%</h3>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold">
                    ▲ Peak Focus Window
                  </span>
                </div>
              </div>

              {/* Stat 2: Mental Stress */}
              <div className={`${cardBg} border rounded-[2.2rem] p-5 flex flex-col justify-between min-h-[145px]`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Mental Stress
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Brain size={13} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold">Low</h3>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
                    ▼ 0.18 Calm Baseline
                  </span>
                </div>
              </div>

              {/* Stat 3: Anxiety Index */}
              <div className={`${cardBg} border rounded-[2.2rem] p-5 flex flex-col justify-between min-h-[145px]`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Anxiety Index
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <ShieldCheck size={13} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold">Stable</h3>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
                    ● Equilibrium Zone
                  </span>
                </div>
              </div>

              {/* Stat 4: Recovery Index */}
              <div className={`${cardBg} border rounded-[2.2rem] p-5 flex flex-col justify-between min-h-[145px]`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Recovery Index
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Sparkles size={13} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold">85%</h3>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-semibold">
                    ▲ Micro-Rest Active
                  </span>
                </div>
              </div>
            </div>

            {/* ─── CARD 3: 7-DAY COGNITIVE FORECAST (Col 4) ─── */}
            <div className={`lg:col-span-4 ${cardBg} border rounded-[2.2rem] p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">7-Day Cognitive Forecast</h3>
                  <p className="text-[10px] text-slate-400">Energy capacity vs predicted cognitive load</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 pt-1">
                <span>Weekly Weather</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-[#FF553E]" /> Load / Drain
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-[#181A20]" /> Capacity
                </span>
              </div>

              {/* Styled Chart Bars (Coral crosshatch + dark charcoal) */}
              <div className="pt-2 h-44 flex items-end justify-between gap-2.5 px-2">
                {cognitiveForecast.map((d, i) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="w-full h-36 flex flex-col justify-end items-center gap-1.5 relative cursor-pointer">
                      {/* Top Bar (Coral with subtle stripes) */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${d.drain * 1.1}px` }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="w-full rounded-md bg-[#FF6954] shadow-sm group-hover:brightness-110 transition-all"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.25) 3px, rgba(255,255,255,0.25) 6px)'
                        }}
                        title={`Drain: ${d.drain}%`}
                      />
                      {/* Bottom Bar (Dark Slate Capacity) */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${d.capacity * 1.1}px` }}
                        transition={{ delay: i * 0.05 + 0.1, duration: 0.5 }}
                        className="w-full rounded-md bg-[#181A20] shadow-sm"
                        title={`Capacity: ${d.capacity}%`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-black">
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row: Daily Spoon Budget Slider (Col 4) | Recent Cognitive Activities Table (Col 8) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ─── CARD 4: DAILY SPOON CAPACITY OVERRIDE (Col 4) ─── */}
            <div className={`lg:col-span-4 ${cardBg} border rounded-[2.2rem] p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Daily Spoon Budget (FR-SP-04)
                  </h3>
                  <p className="text-[10px] text-slate-400">Interactive capacity adjustment</p>
                </div>
                <span className="text-xs font-semibold text-[#FF553E] bg-[#FF553E]/10 px-2 py-0.5 rounded-full">
                  Live Sync
                </span>
              </div>

              {/* Progress Slider (Draggable & Interactive) */}
              <div className="space-y-2 pt-2">
                <div className="relative w-full h-3 rounded-full bg-slate-100 overflow-hidden cursor-pointer">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF553E] to-[#FF7A59]"
                    style={{ width: `${Math.min((spoons / 12) * 100, 100)}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={spoons}
                  onChange={(e) => handleSpoonChange(e.target.value)}
                  className="w-full h-1 bg-transparent accent-[#FF553E] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-extrabold pt-1">
                <span className="text-[#FF553E]">{spoons.toFixed(1)} Spoons Active</span>
                <span className="text-slate-400 font-semibold">12.0 Spoons Daily Max</span>
              </div>
            </div>

            {/* ─── CARD 5: RECENT COGNITIVE SESSIONS & TASKS (Col 8) ─── */}
            <div className={`lg:col-span-8 ${cardBg} border rounded-[2.2rem] p-6 space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Recent Cognitive Sessions</h3>
                  <p className="text-[10px] text-slate-400">Logged deep work, transit decompression, and pulse probes</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search sessions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 border border-transparent focus:border-slate-300 focus:outline-none w-36 sm:w-48 transition-all"
                    />
                  </div>

                  {/* Filter */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                    >
                      <Filter size={12} />
                      <span>{selectedFilter === 'All' ? 'Filter' : selectedFilter}</span>
                    </button>
                    {showFilterMenu && (
                      <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border p-1 z-30">
                        {['All', 'Completed', 'Restored', 'In Review'].map((f) => (
                          <button
                            key={f}
                            onClick={() => { setSelectedFilter(f); setShowFilterMenu(false); }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-slate-100 font-medium"
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-medium border-b border-black/[0.04]">
                      <th className="py-2.5 px-3">Session ID</th>
                      <th className="py-2.5 px-3">Cognitive Activity</th>
                      <th className="py-2.5 px-3">Impact</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.02]">
                    {filteredActivities.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-800">{row.id}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs">
                              {row.icon}
                            </span>
                            <span className="font-semibold text-slate-700">{row.activity}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">{row.load}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${row.statusColor}`}>
                            • {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-medium">{row.date}</td>
                        <td className="py-3 px-3 text-right text-slate-400 hover:text-black cursor-pointer">
                          <MoreHorizontal size={15} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ─── REAL MODALS TRIGGERED FROM VERTIX UI ─── */}
      <PulseGameModal
        isOpen={isPulseOpen}
        onClose={() => setIsPulseOpen(false)}
        userId={userId || 'demo_student'}
        onGameCompleted={async (res) => {
          console.log('Pulse probe done:', res);
          setIsPulseOpen(false);
          await fetchDashboardData();
        }}
      />

      <DopamineMenuModal
        isOpen={isDopamineOpen}
        onClose={() => setIsDopamineOpen(false)}
        onActivitySelected={async (act) => {
          console.log('Dopamine activity chosen:', act);
          setIsDopamineOpen(false);
          await fetchDashboardData();
        }}
      />

      <EveningCheckinModal
        isOpen={isEveningOpen}
        onClose={() => setIsEveningOpen(false)}
        userId={userId || 'demo_student'}
        onCheckinCompleted={async (checkin) => {
          console.log('Evening checkin complete:', checkin);
          setIsEveningOpen(false);
          await fetchDashboardData();
        }}
      />
    </div>
  );
};

export default VertixDashboard;
