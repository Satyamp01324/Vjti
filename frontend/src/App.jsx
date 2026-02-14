import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import EnergyGauge from './components/EnergyGauge';
import ChatInput from './components/ChatInput';
import VoiceButton from './components/VoiceButton';
import SmartCalendar from './components/SmartCalendar';
import ReasoningPanel from './components/ReasoningPanel';
import MetricCard from './components/MetricCard';
import DeepWorkToggle from './components/DeepWorkToggle';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { Zap, Menu, Bell, Sun, Moon } from 'lucide-react';

// Main Dashboard Layout Component
const DashboardLayout = ({ theme, toggleTheme }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isReasoningOpen, setReasoningOpen] = useState(true);
  const [energyLevel, setEnergyLevel] = useState(85);
  const [isDeepWork, setIsDeepWork] = useState(false);
  
  const handleSendMessage = (msg) => {
    setEnergyLevel(Math.min(100, energyLevel + 5));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
      case 'Cognitive Insights':
        return (
          <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Top Row: Energy & Chat */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="md:col-span-4 lg:col-span-3 glass-card flex flex-col items-center justify-center p-6 relative overflow-visible min-h-[300px]"
              >
                <EnergyGauge energyLevel={energyLevel} />
                <div className="absolute bottom-4 right-4">
                  <VoiceButton />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="md:col-span-8 lg:col-span-9 flex flex-col justify-center min-h-[300px]"
              >
                <div className="mb-8 text-center max-w-2xl mx-auto">
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-400 via-emerald-200 to-slate-400 bg-clip-text text-transparent">
                    Neural Synchronization Active
                  </h2>
                  <p className="text-slate-400">
                    Your cognitive bandwidth is <span className="text-emerald-400 font-semibold">{energyLevel}%</span>. Ready for complex problem solving.
                  </p>
                </div>
                <ChatInput onSendMessage={handleSendMessage} />
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <MetricCard title="Focus Streak" value="3.5h" unit="deep work" type="success" trend={12} icon="focus" />
              <MetricCard title="Burnout Risk" value="12%" unit="stable" type="success" trend={-5} icon="burnout" />
              <MetricCard title="Recovery Quality" value="94" unit="sleep score" type="success" trend={2} icon="recovery" />
              <MetricCard title="Cognitive Load" value="High" unit="peak performance" type="warning" trend={8} icon="risk" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2 h-full"
              >
                <SmartCalendar />
              </motion.div>
              
              <div className="hidden lg:block h-full">
                <div className="glass-card h-full relative overflow-hidden">
                   <ReasoningPanel isOpen={isReasoningOpen} setOpen={setReasoningOpen} />
                </div>
              </div>
            </div>
          </div>
        );
      case 'Tasks':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto h-full flex flex-col"
          >
             <h2 className="text-2xl font-bold mb-6 text-slate-200">Task Management Layer</h2>
             <div className="flex-1 glass-card p-6 overflow-hidden">
                <SmartCalendar />
             </div>
          </motion.div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <Zap size={48} className="mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-medium text-slate-200 mb-2">{activeTab}</h2>
              <p>Module initializing...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-700 ${isDeepWork ? 'grayscale bg-black' : ''}`}>
       {/* Deep Work Overlay */}
       <AnimatePresence>
            {isDeepWork && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-8"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="mb-8"
                >
                  <div className="w-32 h-32 rounded-full border-4 border-emerald-500/30 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin" style={{ animationDuration: '3s' }}></div>
                    <span className="text-4xl font-mono font-bold text-emerald-400">24:59</span>
                  </div>
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">Deep Work in Progress</h2>
                <p className="text-slate-400 mb-8 max-w-md">Notifications silenced. Neuro-ambient music active. Focus on the task at hand.</p>
                <DeepWorkToggle isDeepWork={isDeepWork} toggleDeepWork={() => setIsDeepWork(false)} />
              </motion.div>
            )}
       </AnimatePresence>

      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 relative z-10 flex flex-col h-full overflow-hidden transition-all duration-300">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-white/5 rounded-lg text-slate-400"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Hello, User</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-xs font-medium text-emerald-400">System Optimal</span>
            </div>
            
            <button onClick={toggleTheme} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="p-2 relative hover:bg-white/5 rounded-full text-slate-400 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20"></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide relative">
          {renderContent()}
        </div>

        {!isDeepWork && (
          <div className="fixed bottom-6 right-6 z-40">
            <DeepWorkToggle isDeepWork={isDeepWork} toggleDeepWork={() => setIsDeepWork(!isDeepWork)} />
          </div>
        )}
      </main>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Initial theme set
    document.documentElement.setAttribute('data-theme', theme);
    setTimeout(() => setLoading(false), 1500);
  }, [theme]);

  const toggleTheme = () => {
     setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="flex flex-col items-center gap-4 text-emerald-400"
        >
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-lg font-medium animate-pulse">Initializing NeuroPilot...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="bg-noise absolute inset-0 opacity-[0.03]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<DashboardLayout theme={theme} toggleTheme={toggleTheme} />} />
        {/* Redirect for Demo */}
        <Route path="*" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;
