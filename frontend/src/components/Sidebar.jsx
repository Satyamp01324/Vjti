import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, CheckSquare, Brain, Focus, Moon, Settings, Menu, Zap, LogOut } from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, activeTab, setActiveTab }) => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Tasks', icon: CheckSquare },
    { name: 'Cognitive Insights', icon: Brain },
    { name: 'Deep Work Mode', icon: Focus },
    { name: 'Recovery Cycles', icon: Moon },
  ];

  return (
    <motion.div 
      initial={false}
      animate={{ width: isOpen ? 260 : 80 }}
      className={`h-screen bg-slate-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col p-4 z-50 overflow-hidden flex-shrink-0 relative transition-all duration-300`}
    >
      {/* Logo Area */}
      <div className="flex items-center justify-start gap-3 mb-8 h-10 w-full">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <AnimatePresence mode='wait'>
          {isOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-bold tracking-tight text-white whitespace-nowrap overflow-hidden"
            >
              NeuroPilot
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      
      {/* Toggle Button - Only visible when sidebar is open to collapse it, OR always visible? 
          User complained about 2 buttons. 
          Let's put the toggle button absolute positioned or cleaner. 
          Actually, common pattern: Sidebar has collapse button. Header triggers mobile open. 
          For this layout (always visible sidebar), let's keep a chevron toggle.
      */}
      <button 
          onClick={toggleSidebar}
          className="absolute top-6 right-4 p-1 rounded-md hover:bg-white/5 text-slate-400 z-50"
      >
          {isOpen ? <Menu className="w-5 h-5" /> : null} {/* Only show inside when open? No, if closed we can't click it easily if it disappears. */}
      </button>

      {/* Nav Items */}
      <nav className="flex-1 space-y-2 mt-4">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveTab(item.name)}
            className={`
              relative flex items-center w-full p-3 rounded-xl transition-all duration-200 group overflow-hidden
              ${activeTab === item.name ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
            `}
          >
            {activeTab === item.name && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-emerald-500/10 rounded-xl"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            <item.icon className={`w-5 h-5 relative z-10 flex-shrink-0 ${activeTab === item.name ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}`} />
            
            <AnimatePresence>
              {isOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-3 font-medium text-sm relative z-10 whitespace-nowrap overflow-hidden"
                >
                  {item.name}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Hover Glow */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-emerald-500/10 to-transparent" />
          </button>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="mt-auto pt-4 border-t border-white/5 w-full">
        <div className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} gap-3 overflow-hidden`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 relative flex-shrink-0">
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-medium text-white truncate">User Name</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <AnimatePresence>
          {isOpen && (
            <motion.button 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mt-4 text-xs text-slate-500 hover:text-white transition-colors w-full p-2 rounded-lg hover:bg-white/5"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Sidebar;
