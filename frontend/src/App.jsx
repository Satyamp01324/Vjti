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
import NeuralBackground from './components/NeuralBackground';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DeepWorkMode from './pages/DeepWorkMode';
import CognitiveInsights from './pages/CognitiveInsights';
import RecoveryCycles from './pages/RecoveryCycles';
import Settings from './pages/Settings';
import { Zap, Menu, Bell, LogOut, Settings as SettingsIcon, User, Search } from 'lucide-react';

const DashboardLayout = ({ theme, userRole, energyLevel, metrics, userName, userEmail }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isReasoningOpen, setReasoningOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  // Helper functions for status types
  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  const getStatusType = (level, mode = 'negative_is_bad') => {
    const isBad = mode === 'negative_is_bad';
    switch (level?.toLowerCase()) {
      case 'low': return isBad ? 'success' : 'error';
      case 'medium': return 'warning';
      case 'high': return isBad ? 'error' : 'success';
      case 'stable': return 'success';
      case 'none': return 'success';
      default: return 'success';
    }
  };

  const getToneType = (tone) => {
    switch (tone?.toLowerCase()) {
      case 'positive': return 'success';
      case 'neutral': return 'warning';
      case 'negative': return 'error';
      default: return 'success';
    }
  };

  const handleSendMessage = (msg) => {
    console.log("Message sent:", msg);
  };

  const updateDashboardFromAPI = (apiResponse) => {
    console.log("Updating dashboard from API response:", apiResponse);
    
    if (!apiResponse || apiResponse.status !== 'success') return;

    // This will be handled by the parent App component
    // We'll pass this up through a callback
    window.dispatchEvent(new CustomEvent('dashboardUpdate', { detail: apiResponse }));
  };

  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/tasks': return 'Task Manager';
      case '/insights': return 'Cognitive Insights';
      case '/recovery': return 'Recovery Cycles';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'NP';

  const handleSignOut = () => {
    setShowProfileMenu(false);
    navigate('/login');
  };

  const renderContent = () => {
    const path = location.pathname;

    switch (path) {
      case '/dashboard':
        return (
          <div className="max-w-[1400px] mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Welcome Banner */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {getGreeting()}, <span className="text-emerald-400">{userName || 'User'}</span>
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {userRole === 'parent' ? "Monitoring student's cognitive performance." : "Here's your cognitive performance overview for today."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-medium text-emerald-400">Live Sync</span>
                </div>
              </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Tone Analysis"
                value={metrics?.tone?.value || 'Neutral'}
                unit={metrics?.tone?.unit || 'No Data'}
                type={metrics?.tone?.type || 'success'}
                icon="focus"
              />
              <MetricCard
                title="Stress Level"
                value={metrics?.stress?.value || 'Low'}
                unit={metrics?.stress?.unit || 'Score'}
                type={metrics?.stress?.type || 'success'}
                icon="burnout"
              />
              <MetricCard
                title="Depression Risk"
                value={metrics?.depression?.value || 'None'}
                unit={metrics?.depression?.unit || 'Score'}
                type={metrics?.depression?.type || 'success'}
                icon="recovery"
              />
              <MetricCard
                title="Anxiety Level"
                value={metrics?.anxiety?.value || 'Stable'}
                unit={metrics?.anxiety?.unit || 'Score'}
                type={metrics?.anxiety?.type || 'success'}
                icon="risk"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Energy Gauge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-4 bg-slate-800/40 border border-white/[0.06] rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-visible min-h-[320px]"
              >
                <EnergyGauge energyLevel={energyLevel} />
              </motion.div>

              {/* Chat Input Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-8 flex flex-col justify-center min-h-[320px]"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-1">Neural Synchronization</h3>
                  <p className="text-slate-400 text-sm">
                    Your cognitive bandwidth is <span className="text-emerald-400 font-medium">{energyLevel}%</span>. Tell me what you need help with.
                  </p>
                </div>
                {userRole !== 'parent' && <ChatInput onSendMessage={handleSendMessage} onAnalysisComplete={updateDashboardFromAPI} />}
              </motion.div>
            </div>

            {/* Schedule + Reasoning Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '460px' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 h-full"
              >
                <SmartCalendar />
              </motion.div>

              <div className="hidden lg:block h-full">
                <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl h-full relative overflow-hidden">
                  <ReasoningPanel isOpen={isReasoningOpen} setOpen={setReasoningOpen} />
                </div>
              </div>
            </div>
          </div>
        );
      case '/tasks':
        if (userRole === 'parent') return <div className="p-8 text-center text-slate-400">Access Restricted</div>;
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto h-full flex flex-col"
          >
            <h2 className="text-2xl font-semibold mb-6 text-white">Task Management</h2>
            <div className="flex-1 bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 overflow-hidden">
              <SmartCalendar />
            </div>
          </motion.div>
        );
      case '/insights':
        return <CognitiveInsights />;
      case '/recovery':
        return <RecoveryCycles />;
      case '/settings':
        if (userRole === 'parent') return <div className="p-8 text-center text-slate-400">Access Restricted</div>;
        return <Settings />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>Module Under Construction</p>
          </div>
        );
    }
  }

  return (
    <div className="flex h-screen overflow-hidden relative bg-[#0a0e1a]">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
      />

      <main className="flex-1 relative z-10 flex flex-col h-full overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 bg-[#0d1117]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-white/5 rounded-lg text-slate-400"
            >
              <Menu size={18} />
            </button>
            <span className="text-sm font-medium text-slate-300">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
              <Search size={18} />
            </button>

            {/* Notifications */}
            <button className="p-2 relative hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                  {initials}
                </div>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-10 w-56 bg-[#1a1f2e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-white/5">
                      <p className="text-sm font-medium text-white truncate">{userName || 'User'}</p>
                      <p className="text-xs text-slate-400 truncate">{userEmail || ''}</p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <SettingsIcon size={14} /> Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide relative bg-[#0a0e1a]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

import LandingPage from './pages/LandingPage';
import { supabase } from './supabaseClient';

function App() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Real-time Data States
  const [energyLevel, setEnergyLevel] = useState(null);
  const [metrics, setMetrics] = useState({
    stress: { value: 'Low', unit: '0% Score', type: 'success' },
    anxiety: { value: 'Stable', unit: '0% Score', type: 'success' },
    depression: { value: 'None', unit: '0% Risk', type: 'success' },
    tone: { value: 'Neutral', unit: 'System Standby', type: 'success' },
    taskType: 'Medium'
  });

  useEffect(() => {
    // Check API health
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/health`);
        const data = await response.json();
        console.log('Backend health:', data);
      } catch (error) {
        console.error('Error connecting to backend:', error);
      }
    };
    checkApiHealth();

    // Listen for dashboard updates from ChatInput
    const handleDashboardUpdate = (event) => {
      console.log('Dashboard update event received:', event.detail);
      updateDashboard(event.detail);
    };
    window.addEventListener('dashboardUpdate', handleDashboardUpdate);

    // Fetch user profile from Supabase Auth
    const fetchUserProfile = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user) {
          // Try to get name from user_metadata first, then raw_user_meta_data
          const fullName = user.user_metadata?.full_name
            || user.user_metadata?.name
            || user.user_metadata?.display_name
            || user.email?.split('@')[0] // Fallback to email prefix
            || 'User';
          setUserName(fullName);
          setUserEmail(user.email || '');
          console.log('User profile loaded:', fullName);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    fetchUserProfile();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const fullName = session.user.user_metadata?.full_name
          || session.user.user_metadata?.name
          || session.user.user_metadata?.display_name
          || session.user.email?.split('@')[0]
          || 'User';
        setUserName(fullName);
        setUserEmail(session.user.email || '');
      }
    });

    document.documentElement.setAttribute('data-theme', theme);

    // Initial Data Fetch
    const fetchLatestSession = async () => {
      try {
        const { data, error } = await supabase
          .from('analysis_sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching initial session:', error);
        } else if (data) {
          updateDashboard(data);
        }
      } catch (err) {
        console.error('Unexpected error fetching session:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestSession();

    // Real-time Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analysis_sessions',
        },
        (payload) => {
          console.log('New analysis session received:', payload.new);
          updateDashboard(payload.new);
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('dashboardUpdate', handleDashboardUpdate);
      supabase.removeChannel(channel);
      subscription?.unsubscribe();
    };
  }, [theme]);

  const updateDashboard = (data) => {
    if (!data) return;

    console.log('Updating dashboard with data:', data);

    // Handle API response format (from ChatInput)
    if (data.energy_flow) {
      const analysis = data.analysis || {};
      const energyFlow = data.energy_flow || {};
      const levels = energyFlow.classified_levels || {};

      if (energyFlow.energy_score !== undefined) {
        setEnergyLevel(energyFlow.energy_score);
      }

      const formatScore = (score) => score ? `${(score * 100).toFixed(0)}%` : '0%';

      setMetrics({
        stress: {
          value: levels.stress ? capitalize(levels.stress) : 'Low',
          unit: `${formatScore(analysis.stress)} Score`,
          type: getStatusType(levels.stress, 'negative_is_bad')
        },
        anxiety: {
          value: levels.anxiety ? capitalize(levels.anxiety) : 'Stable',
          unit: `${formatScore(analysis.anxiety)} Score`,
          type: getStatusType(levels.anxiety, 'negative_is_bad')
        },
        depression: {
          value: levels.depression ? capitalize(levels.depression) : 'None',
          unit: `${formatScore(analysis.depression)} Risk`,
          type: getStatusType(levels.depression, 'negative_is_bad')
        },
        tone: {
          value: levels.tone ? capitalize(levels.tone) : 'Neutral',
          unit: data.input_text ? 'Text Analysis' : 'Voice Analysis',
          type: getToneType(levels.tone)
        },
        taskType: energyFlow.recommended_task_type || 'Medium'
      });
    } 
    // Handle Supabase database format (from real-time subscription)
    else {
      if (data.energy_score !== undefined) {
        setEnergyLevel(data.energy_score);
      }

      const formatScore = (score) => score ? `${(score * 100).toFixed(0)}%` : '0%';
      const getInputTypeLabel = (type) => type === 'voice' ? 'Voice Analysis' : 'Text Analysis';

      setMetrics({
        stress: {
          value: data.stress_level ? capitalize(data.stress_level) : 'Low',
          unit: `${formatScore(data.stress_score)} Score`,
          type: getStatusType(data.stress_level, 'negative_is_bad')
        },
        anxiety: {
          value: data.anxiety_level ? capitalize(data.anxiety_level) : 'Stable',
          unit: `${formatScore(data.anxiety_score)} Score`,
          type: getStatusType(data.anxiety_level, 'negative_is_bad')
        },
        depression: {
          value: data.depression_level ? capitalize(data.depression_level) : 'None',
          unit: `${formatScore(data.depression_score)} Risk`,
          type: getStatusType(data.depression_level, 'negative_is_bad')
        },
        tone: {
          value: data.tone ? capitalize(data.tone) : 'Neutral',
          unit: getInputTypeLabel(data.input_type),
          type: getToneType(data.tone)
        },
        taskType: data.recommended_task_type || 'Medium'
      });
    }
  };

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  const getStatusType = (level, mode = 'negative_is_bad') => {
    const isBad = mode === 'negative_is_bad';
    switch (level?.toLowerCase()) {
      case 'low': return isBad ? 'success' : 'error';
      case 'medium': return 'warning';
      case 'high': return isBad ? 'error' : 'success';
      case 'stable': return 'success';
      case 'none': return 'success';
      default: return 'success';
    }
  };

  const getToneType = (tone) => {
    switch (tone?.toLowerCase()) {
      case 'positive': return 'success';
      case 'neutral': return 'warning';
      case 'negative': return 'error';
      default: return 'success';
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0a0e1a] flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-4"
        >
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-400">Loading NeuroPilot...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <PWAInstallPrompt />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login setUserRole={setUserRole} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/deep-work" element={<DeepWorkMode />} />
        <Route path="/dashboard" element={<DashboardLayout theme={theme} userRole={userRole} energyLevel={energyLevel || 85} metrics={metrics} userName={userName} userEmail={userEmail} />} />
        <Route path="/recovery" element={<DashboardLayout theme={theme} userRole={userRole} energyLevel={energyLevel || 85} metrics={metrics} userName={userName} userEmail={userEmail} />} />
        <Route path="/insights" element={<DashboardLayout theme={theme} userRole={userRole} energyLevel={energyLevel || 85} metrics={metrics} userName={userName} userEmail={userEmail} />} />
        <Route path="/settings" element={<DashboardLayout theme={theme} userRole={userRole} energyLevel={energyLevel || 85} metrics={metrics} userName={userName} userEmail={userEmail} />} />
        <Route path="/tasks" element={<DashboardLayout theme={theme} userRole={userRole} energyLevel={energyLevel || 85} metrics={metrics} userName={userName} userEmail={userEmail} />} />
        <Route path="/*" element={<DashboardLayout theme={theme} userRole={userRole} energyLevel={energyLevel || 85} metrics={metrics} userName={userName} userEmail={userEmail} />} />
      </Routes>
    </>
  );
}

export default App;
