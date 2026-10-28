import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Search, Bell, Clock, ChevronDown, Grid, Calendar,
  MessageSquare, FileText, Hexagon, Settings, HelpCircle, LogOut,
  ArrowRightLeft, Filter, Sliders, Check, MoreHorizontal, ArrowUpRight,
  ArrowDownRight, ShieldCheck, Sparkles, Brain, DollarSign, Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VertixDashboard = ({ userName = 'Code XR', userEmail = 'hello@codexr.studio', onLogout }) => {
  const navigate = useNavigate();

  // State
  const [activeNav, setActiveNav] = useState('Overview');
  const [activeSideIcon, setActiveSideIcon] = useState('grid');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [spendingLimit, setSpendingLimit] = useState(927.84);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [mode, setMode] = useState('vertix'); // 'vertix' or 'neuromind'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Drag Unlock State (for interactive testing)
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [dragProgress, setDragProgress] = useState(0);

  const navItems = ['Overview', 'Activity', 'Manage', 'Program', 'Account', 'Reports'];

  const wallets = [
    { id: 'usd', code: 'USD', flag: '🇺🇸', name: 'US Dollar', balance: '$10,580.56', active: true },
    { id: 'eur', code: 'EUR', flag: '🇩🇪', name: 'Euro', balance: '€22,184.87', active: true },
    { id: 'gbp', code: 'GBP', flag: '🇬🇧', name: 'British Pound', balance: '£3,301.56', active: false },
  ];

  const activities = [
    { id: 'INV_000076', activity: 'Mobile App Purchase', icon: '📱', color: 'bg-blue-500/10 text-blue-500', price: '$25,500', status: 'Completed', statusColor: 'text-emerald-500 bg-emerald-50', date: '17 Apr, 2026 03:45 PM' },
    { id: 'INV_000075', activity: 'Cognitive Model Inference', icon: '🧠', color: 'bg-indigo-500/10 text-indigo-500', price: '$1,200', status: 'Completed', statusColor: 'text-emerald-500 bg-emerald-50', date: '17 Apr, 2026 01:20 PM' },
    { id: 'INV_000074', activity: 'Cloud Workspace Subscription', icon: '☁️', color: 'bg-violet-500/10 text-violet-500', price: '$480', status: 'Completed', statusColor: 'text-emerald-500 bg-emerald-50', date: '16 Apr, 2026 08:15 PM' },
    { id: 'INV_000073', activity: 'Deep Work Session Analytics', icon: '⚡', color: 'bg-amber-500/10 text-amber-500', price: '$95', status: 'In Review', statusColor: 'text-amber-500 bg-amber-50', date: '16 Apr, 2026 11:30 AM' },
  ];

  const barChartData = [
    { month: 'Jan', bottom: 35, top: 25 },
    { month: 'Feb', bottom: 42, top: 38 },
    { month: 'Mar', bottom: 50, top: 45 },
    { month: 'Apr', bottom: 55, top: 40 },
    { month: 'May', bottom: 45, top: 30 },
    { month: 'Jun', bottom: 38, top: 20 },
    { month: 'Jul', bottom: 30, top: 15 },
    { month: 'Aug', bottom: 25, top: 10 },
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
          <div className="w-10 h-10 rounded-full bg-[#FF553E] flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_16px_rgba(255,85,62,0.35)] cursor-pointer" onClick={() => navigate('/dashboard')}>
            V
          </div>
          <span className="font-bold text-xl tracking-tight">Vertix</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF553E]/10 text-[#FF553E] font-semibold border border-[#FF553E]/20">
            3.0
          </span>
        </div>

        {/* Center Pill Navigation */}
        <nav className={`${pillBg} p-1.5 rounded-full flex items-center gap-1 shadow-inner max-w-2xl overflow-x-auto`}>
          {navItems.map((item) => {
            const isActive = activeNav === item;
            return (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
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
                <span className="relative z-10">{item}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools & User Profile */}
        <div className="flex items-center gap-3">
          {/* Search Button */}
          <button className={`w-9 h-9 rounded-full ${cardBg} border flex items-center justify-center hover:scale-105 transition-all text-slate-500 hover:text-black`}>
            <Search size={16} />
          </button>

          {/* Notifications */}
          <button className={`w-9 h-9 rounded-full ${cardBg} border flex items-center justify-center hover:scale-105 transition-all relative text-slate-500 hover:text-black`}>
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF553E] ring-2 ring-white" />
          </button>

          {/* History / Clock */}
          <button className={`w-9 h-9 rounded-full ${cardBg} border flex items-center justify-center hover:scale-105 transition-all text-slate-500 hover:text-black`}>
            <Clock size={16} />
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`${cardBg} border px-2.5 py-1.5 rounded-full flex items-center gap-2.5 hover:shadow-md transition-all`}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white">
                CX
              </div>
              <div className="text-left hidden sm:block leading-tight pr-1">
                <p className="text-xs font-bold">{userName || 'Code XR'}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{userEmail || 'hello@codexr.studio'}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Profile Menu Dropdown */}
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
                    <p className="text-[10px] text-slate-400">{userEmail}</p>
                  </div>
                  <button onClick={() => navigate('/settings')} className="w-full px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-black/5 text-slate-600 transition-colors">
                    <Settings size={14} /> Account Settings
                  </button>
                  <button onClick={() => navigate('/insights')} className="w-full px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-black/5 text-slate-600 transition-colors">
                    <Brain size={14} /> Cognitive Insights
                  </button>
                  <button onClick={onLogout} className="w-full px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-red-50 text-red-500 font-semibold transition-colors mt-1">
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
        {/* ─── LEFT FLOATING DOCK (Identical to Screenshot) ─── */}
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
              { id: 'grid', icon: Grid, label: 'Overview' },
              { id: 'calendar', icon: Calendar, label: 'Calendar' },
              { id: 'chat', icon: MessageSquare, label: 'Voice / Chat' },
              { id: 'notes', icon: FileText, label: 'Tasks' },
              { id: 'alerts', icon: Bell, label: 'Alerts' },
              { id: 'brain', icon: Hexagon, label: 'Neural Matrix' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map(({ id, icon: Icon, label }) => {
              const active = activeSideIcon === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveSideIcon(id)}
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

          {/* Bottom: Help & Logout */}
          <div className={`${cardBg} border p-1.5 rounded-full flex flex-col items-center gap-2 shadow-sm`}>
            <button className={`w-9 h-9 rounded-full flex items-center justify-center ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black'}`} title="Help">
              <HelpCircle size={17} />
            </button>
            <button onClick={onLogout} className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors" title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* ─── DASHBOARD GRID (Pixel-Match to Reference) ─── */}
        <main className="flex-1 space-y-6 max-w-[1500px]">
          {/* Greeting Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Good morning, {userName || 'Code XR'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Stay on top of your tasks, monitor progress, and track status.
              </p>
            </div>

            {/* Quick Demo Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode(mode === 'vertix' ? 'neuromind' : 'vertix')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  mode === 'neuromind'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Brain size={14} />
                <span>{mode === 'vertix' ? 'Switch to AI Cognitive Mode' : 'AI Cognitive Mode Active'}</span>
              </button>
            </div>
          </div>

          {/* Top Row: Total Balance Card | 4-Stats Grid | Total Income Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ─── CARD 1: TOTAL BALANCE (Col 4) ─── */}
            <div className={`lg:col-span-4 ${cardBg} border rounded-[2.2rem] p-6 space-y-5 flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {mode === 'vertix' ? 'Total Balance' : 'Cognitive Capacity'}
                  </span>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer">
                    <span>🇺🇸 USD</span>
                    <ChevronDown size={12} />
                  </div>
                </div>

                <div className="mt-3">
                  <h2 className="text-3xl font-extrabold tracking-tight">
                    {mode === 'vertix' ? '$553,359.89' : '82 / 100'}
                  </h2>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-semibold border border-emerald-100">
                    <ArrowUpRight size={13} />
                    <span>+5% than last month</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button className="flex-1 py-3 px-4 bg-[#15171C] hover:bg-black text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02]">
                  <ArrowRightLeft size={14} /> Transfer
                </button>
                <button className="flex-1 py-3 px-4 bg-[#F2F4F7] hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                  <ArrowRightLeft size={14} /> Request
                </button>
              </div>

              {/* Wallets Sub-Section */}
              <div className="pt-2 border-t border-black/[0.04]">
                <p className="text-[11px] font-semibold text-slate-500 mb-2.5">
                  Wallets <span className="text-slate-400 font-normal">| Total 5 wallets</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {wallets.map((w) => (
                    <div key={w.id} className="p-2.5 rounded-2xl bg-[#F7F8FA] border border-black/[0.03] text-left">
                      <div className="flex items-center gap-1 text-[11px] font-bold">
                        <span>{w.flag}</span>
                        <span className="text-slate-700">{w.code}</span>
                      </div>
                      <p className="text-xs font-bold mt-1 text-slate-900 truncate">{w.balance}</p>
                      <span className={`text-[9px] font-semibold block mt-1 ${w.active ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {w.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── CARD 2: 4-STATS 2X2 GRID (Col 4) ─── */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-4">
              {/* Stat 1: Total Earnings (Vibrant Coral/Orange Card!) */}
              <div className="rounded-[2.2rem] bg-gradient-to-br from-[#FF553E] to-[#FF6F52] text-white p-5 shadow-[0_16px_36px_rgba(255,85,62,0.3)] flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/90">
                    {mode === 'vertix' ? 'Total Earnings' : 'Focus Hours'}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Sparkles size={13} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold">{mode === 'vertix' ? '$719' : '4.2h'}</h3>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold">
                    ▲ 7% this month
                  </span>
                </div>
              </div>

              {/* Stat 2: Total Spending */}
              <div className={`${cardBg} border rounded-[2.2rem] p-5 flex flex-col justify-between min-h-[145px]`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {mode === 'vertix' ? 'Total Spending' : 'Energy Burn'}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <DollarSign size={13} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold">{mode === 'vertix' ? '$458' : '24%'}</h3>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 font-semibold">
                    ▼ 5% this month
                  </span>
                </div>
              </div>

              {/* Stat 3: Total Income */}
              <div className={`${cardBg} border rounded-[2.2rem] p-5 flex flex-col justify-between min-h-[145px]`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {mode === 'vertix' ? 'Total Income' : 'Tasks Done'}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <Wallet size={13} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold">{mode === 'vertix' ? '$590' : '8'}</h3>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
                    ▲ 8% this month
                  </span>
                </div>
              </div>

              {/* Stat 4: Total Revenue */}
              <div className={`${cardBg} border rounded-[2.2rem] p-5 flex flex-col justify-between min-h-[145px]`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {mode === 'vertix' ? 'Total Revenue' : 'Recovery'}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <TrendingUp size={13} />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold">{mode === 'vertix' ? '$365' : '92%'}</h3>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
                    ▲ 4% this month
                  </span>
                </div>
              </div>
            </div>

            {/* ─── CARD 3: TOTAL INCOME / PROFIT & LOSS BAR CHART (Col 4) ─── */}
            <div className={`lg:col-span-4 ${cardBg} border rounded-[2.2rem] p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Total Income</h3>
                  <p className="text-[10px] text-slate-400">View your income in a certain period of time</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 pt-1">
                <span>Profit and Loss</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-[#FF553E]" /> Profit
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-[#181A20]" /> Loss
                </span>
              </div>

              {/* Styled Chart Bars (Identical visual pattern to image) */}
              <div className="pt-2 h-44 flex items-end justify-between gap-2.5 px-2">
                {barChartData.map((d, i) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="w-full flex flex-col items-center gap-1 relative cursor-pointer">
                      {/* Top Bar (Coral with subtle texture/stripes) */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${d.top}%` }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="w-full rounded-md bg-[#FF553E] opacity-90 group-hover:opacity-100 transition-opacity"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.2) 3px, rgba(255,255,255,0.2) 6px)'
                        }}
                      />
                      {/* Bottom Bar (Black/Slate) */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${d.bottom}%` }}
                        transition={{ delay: i * 0.05 + 0.1, duration: 0.5 }}
                        className="w-full rounded-md bg-[#181A20]"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-black">
                      {d.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row: Monthly Spending Limit (Col 4) | Recent Activities Table (Col 8) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ─── CARD 4: MONTHLY SPENDING LIMIT (Col 4) ─── */}
            <div className={`lg:col-span-4 ${cardBg} border rounded-[2.2rem] p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  {mode === 'vertix' ? 'Monthly Spending Limit' : 'Daily Spoon Budget'}
                </h3>
                <span className="text-xs font-semibold text-slate-400">Settings</span>
              </div>

              {/* Progress Slider (Draggable & Interactive) */}
              <div className="space-y-2 pt-2">
                <div className="relative w-full h-3 rounded-full bg-slate-100 overflow-hidden cursor-pointer">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF553E] to-[#FF7A59]"
                    style={{ width: `${Math.min((spendingLimit / 5500) * 100, 100)}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="100"
                  max="5500"
                  step="50"
                  value={spendingLimit}
                  onChange={(e) => setSpendingLimit(parseFloat(e.target.value))}
                  className="w-full h-1 bg-transparent accent-[#FF553E] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-extrabold pt-1">
                <span className="text-[#FF553E]">${spendingLimit.toFixed(2)}</span>
                <span className="text-slate-400 font-semibold">$5,500.00</span>
              </div>
            </div>

            {/* ─── CARD 5: RECENT ACTIVITIES TABLE (Col 8) ─── */}
            <div className={`lg:col-span-8 ${cardBg} border rounded-[2.2rem] p-6 space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-800">Recent Activities</h3>
                <div className="flex items-center gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search"
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
                        {['All', 'Completed', 'In Review'].map((f) => (
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
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Activity</th>
                      <th className="py-2.5 px-3">Price</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Date</th>
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
                        <td className="py-3 px-3 font-bold text-slate-900">{row.price}</td>
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
    </div>
  );
};

export default VertixDashboard;
