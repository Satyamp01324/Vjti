import React from 'react';
import { Home, List, Zap, Shield, Moon, Settings as SettingsIcon, Menu, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar, activeTab, setActiveTab, userRole, userName, userEmail }) => {
  const location = useLocation();
  const activePath = location.pathname;

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'NM';

  let navItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Tasks', icon: List, path: '/tasks' },
    { name: 'Cognitive Insights', icon: Brain, path: '/insights' },
    { name: 'Deep Work Mode', icon: Shield, path: '/deep-work' },
    { name: 'Recovery Cycles', icon: Moon, path: '/recovery' },
    { name: 'Settings', icon: SettingsIcon, path: '/settings' },
  ];

  if (userRole === 'parent') {
    navItems = navItems.filter(item => ['Dashboard', 'Cognitive Insights', 'Recovery Cycles'].includes(item.name));
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? 240 : 68 }}
      className="h-screen bg-[#0a0e1a] border-r border-white/[0.06] flex flex-col z-50 overflow-hidden flex-shrink-0 relative transition-all duration-300 hidden md:flex"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06] shrink-0">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.15)]">
          <img
            src="/images/neuromind-logo.png"
            alt="NeuroMind"
            className="w-7 h-7 object-contain"
          />
        </div>
        <AnimatePresence mode='wait'>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-sm font-bold text-white whitespace-nowrap tracking-tight"
            >
              Neuro<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Mind</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-4 right-[-12px] w-6 h-6 bg-[#0a0e1a] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-500 hover:border-indigo-500 transition-all shadow-lg z-50"
      >
        {isOpen ? <div className="text-xs">&lt;</div> : <Menu size={12} />}
      </button>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.name || activePath === item.path;

          return (
            <Link
              to={item.path}
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className="block"
            >
              <div
                className={`
                  relative flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'text-white bg-indigo-500/10 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-y-0 left-0 w-[3px] bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <item.icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />

                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="ml-3 text-[13px] font-medium whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip when collapsed */}
                {!isOpen && (
                  <div className="fixed left-[76px] px-2.5 py-1.5 bg-[#1a1f2e] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60] border border-white/10 shadow-xl">
                    {item.name}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-white/[0.06] p-2 shrink-0">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer ${!isOpen && 'justify-center'}`}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0a0e1a]" />
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="text-[13px] font-medium text-white truncate max-w-[140px] leading-tight">{userName || 'User'}</p>
                <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{userEmail || 'No email'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
