import React, { useState } from 'react';
import { Home, List, Zap, Shield, Moon, Settings as SettingsIcon, Menu, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar, activeTab, setActiveTab, userRole }) => {
  const location = useLocation();
  const activePath = location.pathname;

  let navItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard', isNew: false },
    { name: 'Tasks', icon: List, path: '/tasks', isNew: false },
    { name: 'Cognitive Insights', icon: Brain, path: '/insights', isNew: true },
    { name: 'Deep Work Mode', icon: Shield, path: '/deep-work', isNew: false },
    { name: 'Recovery Cycles', icon: Moon, path: '/recovery', isNew: false },
    { name: 'Settings', icon: SettingsIcon, path: '/settings', isNew: false },
  ];

  if (userRole === 'parent') {
      navItems = navItems.filter(item => ['Dashboard', 'Cognitive Insights', 'Recovery Cycles'].includes(item.name));
  }

  return (
    <motion.div 
      initial={false}
      animate={{ width: isOpen ? 260 : 80 }}
      className={`h-screen bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col p-4 z-50 overflow-hidden flex-shrink-0 relative transition-all duration-300 hidden md:flex`}
    >
      {/* Logo Area */}
      <div className="flex items-center justify-start gap-3 mb-8 h-10 w-full relative">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Zap className="w-6 h-6 fill-white text-white" />
        </div>
        <AnimatePresence mode='wait'>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent font-sans tracking-tight">
                NeuroPilot
              </h1>
              <p className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase">AI Workspace</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Toggle Button */}
      <button 
          onClick={toggleSidebar}
          className="absolute top-6 right-[-12px] w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-500 hover:border-emerald-500 transition-all shadow-lg z-50"
      >
          {isOpen ? <div className="text-xs">&lt;</div> : <Menu size={12} />}
      </button>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 mt-4">
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
                  relative flex items-center w-full px-3 py-3 rounded-xl transition-all duration-300 group overflow-visible cursor-pointer
                  ${isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-bg"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent border-l-2 border-emerald-500 rounded-r-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <item.icon 
                  className={`w-5 h-5 relative z-10 flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-emerald-400 scale-110' : 'group-hover:scale-110'}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="ml-3 font-medium text-sm relative z-10 whitespace-nowrap overflow-hidden flex-1 flex items-center justify-between"
                    >
                      {item.name}
                      
                      {item.isNew && (
                         <span className="px-1.5 py-0.5 rounded bg-indigo-500 text-[9px] text-white font-bold ml-2 animate-pulse">
                            NEW
                         </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover Tooltip when collapsed */}
                {!isOpen && (
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-white/10 shadow-xl translate-x-2 group-hover:translate-x-0 hidden group-hover:block">
                        {item.name}
                    </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="mt-auto pt-4 border-t border-white/5 w-full">
        <div className={`p-2 rounded-xl bg-white/5 flex items-center gap-3 transition-all ${isOpen ? 'justify-start' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg border border-white/10 relative">
             JD
             <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>
          
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }} 
                animate={{ opacity: 1, width: 'auto' }} 
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-medium text-white truncate leading-tight">John Doe</p>
                <div className="flex items-center gap-1 mt-0.5">
                   <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                   <p className="text-[10px] text-emerald-400 font-medium tracking-wide">Brain Sync Active</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
