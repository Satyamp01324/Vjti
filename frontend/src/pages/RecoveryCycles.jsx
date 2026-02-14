import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Brain, 
  Battery, 
  Zap, 
  Clock, 
  AlertTriangle, 
  Check, 
  TrendingUp, 
  Coffee, 
  Wind, 
  BookOpen, 
  Sunrise,
  ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { GlassCard } from '../components/GlassCard';

// Dummy Data
const fatigueData = [
  { time: '08:00', load: 30, risk: 10 },
  { time: '10:00', load: 65, risk: 25 },
  { time: '12:00', load: 85, risk: 45 },
  { time: '14:00', load: 92, risk: 85 }, // Peak fatigue
  { time: '16:00', load: 60, risk: 50 },
  { time: '18:00', load: 45, risk: 30 },
];

const recoveryActivities = [
    { title: "Box Breathing", duration: "5 min", impact: "High", icon: Wind, color: "text-sky-400", bg: "bg-sky-500/10" },
    { title: "Light Stretch", duration: "10 min", impact: "Medium", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { title: "Nature Walk", duration: "20 min", impact: "High", icon: Sunrise, color: "text-amber-400", bg: "bg-amber-500/10" },
    { title: "Reflection Review", duration: "15 min", impact: "Medium", icon: BookOpen, color: "text-indigo-400", bg: "bg-indigo-500/10" },
];

// Components
const RecoveryMeter = ({ score }) => {
    const data = [{ name: 'Recovery', value: score, fill: score > 70 ? '#10B981' : score > 40 ? '#F59E0B' : '#EF4444' }];
    
    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
             <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
             <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                    innerRadius="80%" 
                    outerRadius="100%" 
                    barSize={10} 
                    data={data} 
                    startAngle={180} 
                    endAngle={0}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                </RadialBarChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                 <motion.span 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold text-white"
                 >
                     {score}%
                 </motion.span>
                 <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Recovery</span>
             </div>
        </div>
    );
};

const RecommendationCard = ({ title, desc, benefit, onApply }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="glass-card p-5 border-l-4 border-emerald-500 relative overflow-hidden group cursor-pointer"
        onClick={onApply}
    >
        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex justify-between items-start mb-2 relative z-10">
            <h4 className="font-semibold text-white">{title}</h4>
            <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400">
                <Zap size={14} />
            </div>
        </div>
        <p className="text-sm text-slate-400 mb-3 relative z-10">{desc}</p>
        <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium relative z-10">
            <TrendingUp size={12} />
            <span>+{benefit} Retention</span>
        </div>
    </motion.div>
);

const ActivityCard = ({ activity }) => (
    <motion.div 
        whileHover={{ scale: 1.02 }}
        className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
    >
        <div className={`p-3 rounded-xl ${activity.bg} ${activity.color}`}>
            <activity.icon size={20} />
        </div>
        <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">{activity.title}</h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Clock size={10} /> {activity.duration}</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{activity.impact} Impact</span>
            </div>
        </div>
        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
            <ArrowRight size={14} />
        </div>
    </motion.div>
);

const RecoveryCycles = () => {
    const [recoveryScore, setRecoveryScore] = useState(72);
    const [burnoutRisk, setBurnoutRisk] = useState(68);
    const [isApplied, setIsApplied] = useState(false);

    const handleApplyRecommendation = () => {
        setIsApplied(true);
        setTimeout(() => {
            setRecoveryScore(prev => Math.min(100, prev + 15));
            setBurnoutRisk(prev => Math.max(0, prev - 12));
            setIsApplied(false);
        }, 2000);
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
            
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Recovery Cycles</h1>
                <p className="text-slate-400 mt-2">Intelligent fatigue detection and cognitive restoration engine.</p>
            </header>

            {/* Top Grid: Hero Stats & Fatigue Graph */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Recovery Health Overview */}
                <GlassCard className="lg:col-span-1 p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 opacity-50"></div>
                    <div className="flex flex-col items-center z-10">
                        <RecoveryMeter score={recoveryScore} />
                        
                        <div className="grid grid-cols-3 gap-4 w-full mt-6 text-center">
                            <div>
                                <div className="text-2xl font-bold text-white">4.2h</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Deep Work</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-amber-400">3</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Fatigue Spikes</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-emerald-400">92%</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Sleep Qual</div>
                            </div>
                        </div>
                        
                        <div className="mt-6 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
                            <Brain size={12} />
                            Brain Resilience Stable
                        </div>
                    </div>
                </GlassCard>

                {/* 2. Fatigue Sequence Detection */}
                <GlassCard className="lg:col-span-2 p-6 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Fatigue Pattern Detected</h3>
                                <p className="text-xs text-slate-400">Real-time cognitive load analysis</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-rose-400 animate-pulse">
                            <AlertTriangle size={14} />
                            High Load Zone: 14:00 - 15:00
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={fatigueData}>
                                <defs>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#E2E8F0' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="load" 
                                    stroke="#F43F5E" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorLoad)" 
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="risk" 
                                    stroke="#6366F1" 
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    fill="none" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>

            {/* Middle Section: Recommendations & Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                 {/* 3. Recommendation Engine */}
                 <div className="space-y-4">
                     <h3 className="text-lg font-medium text-slate-200">AI Recovery Plan</h3>
                     <AnimatePresence>
                         {isApplied ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }} 
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center gap-3 h-32"
                            >
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                    <Check size={16} />
                                </div>
                                <span className="font-semibold">Schedule Optimized</span>
                            </motion.div>
                         ) : (
                             <>
                                <RecommendationCard 
                                    title="Active Reset" 
                                    desc="20 min light walk to clear adenosine buildup."
                                    benefit="23%"
                                    onApply={handleApplyRecommendation}
                                />
                                <RecommendationCard 
                                    title="Nsdr Protocol" 
                                    desc="10 min non-sleep deep rest session."
                                    benefit="18%"
                                    onApply={handleApplyRecommendation}
                                />
                             </>
                         )}
                     </AnimatePresence>
                 </div>

                 {/* 4. Cognitive Recharge Activities */}
                 <div className="lg:col-span-2 space-y-4">
                     <h3 className="text-lg font-medium text-slate-200">Suggested Micro-Breaks</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {recoveryActivities.map((activity, index) => (
                             <ActivityCard key={index} activity={activity} />
                         ))}
                     </div>
                 </div>
            </div>
            
            {/* Bottom Section: Burnout Risk & Reasoning */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 {/* 6. Burnout Risk Detector */}
                 <GlassCard className="lg:col-span-8 p-6 flex items-center justify-between gap-8">
                      <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">Burnout Risk Detector</h3>
                          <p className="text-slate-400 text-sm mb-4">Cumulative cognitive load is trending slightly high.</p>
                          
                          <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                              <motion.div 
                                  className={`absolute top-0 left-0 h-full ${burnoutRisk > 80 ? 'bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${burnoutRisk}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                              />
                          </div>
                          <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono">
                              <span>Safe Zone</span>
                              <span>Caution</span>
                              <span>Critical</span>
                          </div>
                      </div>
                      <div className="text-right">
                          <span className={`text-5xl font-bold ${burnoutRisk > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>{burnoutRisk}%</span>
                          <span className="block text-xs uppercase tracking-widest text-slate-500 mt-1">Saturation</span>
                      </div>
                 </GlassCard>

                 {/* 7. AI Reasoning Panel */}
                 <GlassCard className="lg:col-span-4 p-6 bg-indigo-500/5 border-indigo-500/10">
                      <div className="flex items-center gap-2 mb-4 text-indigo-400">
                          <Brain size={18} />
                          <h4 className="font-semibold">AI Insight</h4>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                          "Your focus duration averaged <span className="text-white font-semibold">52 mins</span> today. However, recovery intervals were skipped twice. To maintain peak neuroplasticity for the evening session, I recommend a <span className="text-indigo-300 border-b border-indigo-500/30">Standard Protocol Reset</span> immediately."
                      </p>
                 </GlassCard>
            </div>

        </div>
    );
};

export default RecoveryCycles;
