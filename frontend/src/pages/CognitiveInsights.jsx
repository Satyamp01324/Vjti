import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Activity, Brain, Clock, Zap, AlertTriangle, ChevronRight, TrendingUp } from 'lucide-react';

const data = [
  { time: '9am', energy: 85, focus: 90 },
  { time: '11am', energy: 95, focus: 85 },
  { time: '1pm', energy: 65, focus: 50 },
  { time: '3pm', energy: 75, focus: 70 },
  { time: '5pm', energy: 60, focus: 45 },
  { time: '7pm', energy: 40, focus: 30 },
];

const pieData = [
  { name: 'Deep Work', value: 45, color: '#10B981' },
  { name: 'Light Tasks', value: 30, color: '#F59E0B' },
  { name: 'Recovery', value: 15, color: '#3B82F6' },
  { name: 'Admin', value: 10, color: '#6366F1' },
];

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#6366F1'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-white/10 p-4 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-slate-300 mb-2 font-medium">{label}</p>
        <p className="text-emerald-400 text-sm font-bold flex items-center gap-2">
          <Zap size={14} fill="currentColor" />
          Energy: {payload[0].value}%
        </p>
        <p className="text-indigo-400 text-sm font-bold flex items-center gap-2">
          <Brain size={14} />
          Focus: {payload[1].value}%
        </p>
      </div>
    );
  }
  return null;
};

const CognitiveInsights = () => {
    const [burnoutRisk, setBurnoutRisk] = useState(15);

    useEffect(() => {
        // Simulate real-time monitoring
        const interval = setInterval(() => {
            setBurnoutRisk(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 5)));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-3">
                        <Brain className="text-emerald-500" size={32} />
                        Cognitive Analytics
                    </h2>
                    <p className="text-slate-400 mt-2">Real-time brain performance monitoring and predictive analysis.</p>
                </div>
                
                <div className="flex gap-3">
                     <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-400 font-medium">Live Sync Active</span>
                     </div>
                </div>
            </div>

            {/* Top Row Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline Graph */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-lg"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Activity size={20} className="text-emerald-400" />
                            Cognitive Energy Timeline
                        </h3>
                        <select className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1 text-sm text-slate-400 outline-none">
                            <option>Today</option>
                            <option>Yesterday</option>
                            <option>Last 7 Days</option>
                        </select>
                    </div>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                                <Area type="monotone" dataKey="energy" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorEnergy)" />
                                <Area type="monotone" dataKey="focus" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorFocus)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Burnout Meter */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col items-center justify-center"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertTriangle size={120} className="text-rose-500" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-6 w-full flex items-center gap-2 z-10">
                        <AlertTriangle size={20} className="text-rose-400" />
                        Burnout Risk
                    </h3>

                    <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                        {/* Outer pulsating ring */}
                        <motion.div 
                           animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
                           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                           className={`absolute inset-0 rounded-full ${burnoutRisk > 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        />
                        
                        <svg className="w-full h-full transform -rotate-90">
                           <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                           <motion.circle 
                              initial={{ strokeDashoffset: 553 }}
                              animate={{ strokeDashoffset: 553 - (553 * burnoutRisk) / 100 }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              cx="96" cy="96" r="88" fill="none" 
                              stroke={burnoutRisk > 70 ? '#F43F5E' : burnoutRisk > 40 ? '#F59E0B' : '#10B981'} 
                              strokeWidth="12" 
                              strokeLinecap="round" 
                              strokeDasharray="553"
                           />
                        </svg>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-white">{Math.round(burnoutRisk)}%</span>
                            <span className="text-xs text-slate-400 uppercase tracking-widest mt-1">Risk Level</span>
                        </div>
                    </div>

                    <p className="text-center text-sm text-slate-300 z-10">
                        {burnoutRisk > 70 ? "Critical levels detected. Schedule immediate recovery." : "Optimal functioning. Maintain current rhythm."}
                    </p>
                    
                    {burnoutRisk > 50 && (
                        <button className="mt-6 w-full py-2 bg-rose-500/20 border border-rose-500/50 text-rose-300 rounded-lg hover:bg-rose-500/30 transition-colors z-10 flex items-center justify-center gap-2">
                           <Clock size={16} />
                           Insert Recovery Cycle
                        </button>
                    )}
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Task Distribution */}
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-lg"
                 >
                     <h3 className="text-lg font-semibold text-white mb-6">Task Load Distribution</h3>
                     <div className="h-[250px] relative">
                         <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                 <Pie
                                     data={pieData}
                                     cx="50%"
                                     cy="50%"
                                     innerRadius={60}
                                     outerRadius={80}
                                     paddingAngle={5}
                                     dataKey="value"
                                 >
                                     {pieData.map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                                     ))}
                                 </Pie>
                                 <Tooltip />
                             </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="text-center">
                                 <span className="text-3xl font-bold text-white">4.5h</span>
                                 <span className="block text-xs text-slate-400">Deep Work</span>
                             </div>
                         </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 mt-4">
                         {pieData.map((item) => (
                             <div key={item.name} className="flex items-center gap-2">
                                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                 <span className="text-sm text-slate-300">{item.name}</span>
                             </div>
                         ))}
                     </div>
                 </motion.div>

                 {/* AI Analysis Panel */}
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-lg relative overflow-hidden"
                 >
                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                     
                     <div className="flex items-center gap-3 mb-6">
                         <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                             <Brain size={24} />
                         </div>
                         <div>
                             <h3 className="text-lg font-semibold text-white">Neural Pattern Analysis</h3>
                             <p className="text-xs text-slate-400">AI-generated insights based on last 48h activity</p>
                         </div>
                     </div>

                     <div className="space-y-4">
                         <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-colors">
                             <h4 className="text-emerald-400 text-sm font-semibold mb-2 flex items-center gap-2">
                                 <TrendingUp size={16} />
                                 Peak Performance Identifier
                             </h4>
                             <p className="text-slate-300 text-sm leading-relaxed">
                                 Your cognitive output peaks between <span className="text-white font-medium">9:30 AM</span> and <span className="text-white font-medium">11:15 AM</span>. 
                                 I recommend scheduling "Quarterly Review" tasks during this window tomorrow.
                             </p>
                         </div>

                         <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-colors">
                             <h4 className="text-amber-400 text-sm font-semibold mb-2 flex items-center gap-2">
                                 <AlertTriangle size={16} />
                                 Fatigue Warning Pattern
                             </h4>
                             <p className="text-slate-300 text-sm leading-relaxed">
                                 Detected a consistent energy dip at <span className="text-white font-medium">2:00 PM</span> followed by lowered focus scores. 
                                 Suggestion: Move "Email processing" to this slot and take a 15-min NSDR break at 1:45 PM.
                             </p>
                         </div>
                     </div>

                     <button className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                         View full detailed report <ChevronRight size={16} />
                     </button>
                 </motion.div>
            </div>
        </div>
    );
};

export default CognitiveInsights;
