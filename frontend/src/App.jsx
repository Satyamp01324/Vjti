import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
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
import LandingPage from './pages/LandingPage';
import { supabase, enableAutoRefresh } from './supabaseClient';
import { Zap, Menu, Bell, LogOut, Settings as SettingsIcon, User, Search } from 'lucide-react';

const DashboardLayout = ({ theme, userRole, energyLevel, metrics, userName, userEmail, userId }) => {
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

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
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
                {userRole !== 'parent' && <ChatInput onSendMessage={handleSendMessage} onAnalysisComplete={updateDashboardFromAPI} userId={userId} />}
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
        <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 bg-[#0a0e1a]/90 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-white/5 rounded-lg text-slate-400"
            >
              <Menu size={18} />
            </button>
            <span className="text-sm font-semibold text-white tracking-tight">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <button className="p-2.5 hover:bg-white/[0.04] rounded-xl text-slate-400 hover:text-white transition-colors">
              <Search size={17} />
            </button>

            {/* Notifications */}
            <button className="p-2.5 relative hover:bg-white/[0.04] rounded-xl text-slate-400 hover:text-white transition-colors">
              <Bell size={17} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.8)]"></span>
            </button>

            {/* Profile */}
            <div className="relative ml-1">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white border border-white/10 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                  {initials}
                </div>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-56 bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/[0.06]">
                      <p className="text-sm font-semibold text-white truncate">{userName || 'User'}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{userEmail || ''}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[0.04] rounded-xl transition-colors"
                      >
                        <SettingsIcon size={14} /> Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
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

const App = () => {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState('student');
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [energyLevel, setEnergyLevel] = useState(72);
  const [metrics, setMetrics] = useState({
    stress: { value: 'Low', unit: 'Score', type: 'success' },
    anxiety: { value: 'Stable', unit: 'Score', type: 'success' },
    depression: { value: 'None', unit: 'Risk', type: 'success' },
    tone: { value: 'Calm', unit: 'Analysis', type: 'success' },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn("Supabase auth error:", error.message);

        const currentSession = data?.session || null;
        setSession(currentSession);

        if (currentSession?.user) {
          fetchUserProfile(currentSession.user.id);
          setUserEmail(currentSession.user.email);
        }
      } catch (err) {
        console.warn("Auth init error:", err.message);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    let subscription;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        // Reset user-specific data whenever auth state changes
        if (newSession?.user?.id !== session?.user?.id) {
          setEnergyLevel(72);
          setMetrics({
            stress: { value: 'Low', unit: 'Score', type: 'success' },
            anxiety: { value: 'Stable', unit: 'Score', type: 'success' },
            depression: { value: 'None', unit: 'Risk', type: 'success' },
            tone: { value: 'Calm', unit: 'Analysis', type: 'success' },
          });
        }
        setSession(newSession);
        if (newSession?.user) {
          fetchUserProfile(newSession.user.id);
          setUserEmail(newSession.user.email);
        }
      });
      subscription = data?.subscription;
    } catch (err) {
      console.warn("Auth state listener error:", err.message);
    }

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUserName(data.full_name || 'User');
        setUserRole(data.role || 'student');
        if (data.email) setUserEmail(data.email);
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    }
  };

  // Dashboard Data Listener (from ChatInput/Backend)
  useEffect(() => {
    const handleDashboardUpdate = (event) => {
      const data = event.detail;
      console.log('Dashboard update received:', data);

      // Update energy level
      if (data.energy_flow) {
        const newEnergy = data.energy_flow.energy_score || data.energy_flow.final_energy_score;
        if (newEnergy) setEnergyLevel(newEnergy);
      }

      // Extract classification levels from the correct location
      // Backend returns levels under energy_flow.classified_levels
      const levels = data.energy_flow?.classified_levels || {};
      // Also check direct analysis keys as fallback
      const analysis = data.analysis || {};

      const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

      const getStatusType = (level) => {
        switch (level?.toLowerCase()) {
          case 'low': case 'none': return 'success';
          case 'medium': case 'moderate': return 'warning';
          case 'high': return 'error';
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

      const stressVal = capitalize(levels.stress || analysis.stress_level || 'Low');
      const anxietyVal = capitalize(levels.anxiety || analysis.anxiety_level || 'Stable');
      const depressionVal = capitalize(levels.depression || analysis.depression_level || 'None');
      const toneVal = capitalize(levels.tone || analysis.tone || 'Calm');

      setMetrics({
        stress: { value: stressVal, unit: `Score: ${(analysis.stress || 0).toFixed?.(2) || '0.00'}`, type: getStatusType(stressVal) },
        anxiety: { value: anxietyVal, unit: `Score: ${(analysis.anxiety || 0).toFixed?.(2) || '0.00'}`, type: getStatusType(anxietyVal) },
        depression: { value: depressionVal, unit: `Score: ${(analysis.depression || 0).toFixed?.(2) || '0.00'}`, type: getStatusType(depressionVal) },
        tone: { value: toneVal, unit: 'Analysis', type: getToneType(toneVal) },
      });
    };

    window.addEventListener('dashboardUpdate', handleDashboardUpdate);
    return () => window.removeEventListener('dashboardUpdate', handleDashboardUpdate);
  }, [energyLevel]);


  // Handle login success — reset all user-specific state for clean session
  const handleLoginSuccess = (loginSession) => {
    // Reset dashboard state for fresh user
    setEnergyLevel(72);
    setMetrics({
      stress: { value: 'Low', unit: 'Score', type: 'success' },
      anxiety: { value: 'Stable', unit: 'Score', type: 'success' },
      depression: { value: 'None', unit: 'Risk', type: 'success' },
      tone: { value: 'Calm', unit: 'Analysis', type: 'success' },
    });
    setUserName('User');
    setUserEmail('');
    setSession(loginSession);
  };

  if (loading) {
    return <div className="h-screen w-screen bg-[#0a0e1a] flex items-center justify-center text-emerald-400">Loading NeuroMind...</div>;
  }

  const layoutProps = { theme: 'dark', userRole, energyLevel, metrics, userName, userEmail, userId: session?.user?.id || null };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/signup" element={<Signup />} />

      {/* Deep Work Mode - Standalone Page (accessible without auth, handles anonymous internally) */}
      <Route path="/deep-work" element={<DeepWorkMode />} />

      {/* Dashboard Routes with Layout */}
      <Route path="/dashboard" element={session ? <DashboardLayout {...layoutProps} /> : <Navigate to="/login" />} />
      <Route path="/tasks" element={session ? <DashboardLayout {...layoutProps} /> : <Navigate to="/login" />} />
      <Route path="/insights" element={session ? <DashboardLayout {...layoutProps} /> : <Navigate to="/login" />} />
      <Route path="/recovery" element={session ? <DashboardLayout {...layoutProps} /> : <Navigate to="/login" />} />
      <Route path="/settings" element={session ? <DashboardLayout {...layoutProps} /> : <Navigate to="/login" />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
