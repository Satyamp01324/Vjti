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

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1f2e] border border-white/10 p-3 rounded-lg shadow-xl">
                <p className="text-slate-300 text-xs mb-1.5 font-medium">{label}</p>
                <p className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                    <Zap size={12} fill="currentColor" /> Energy: {payload[0].value}%
                </p>
                <p className="text-indigo-400 text-xs font-semibold flex items-center gap-1.5 mt-1">
                    <Brain size={12} /> Focus: {payload[1].value}%
                </p>
            </div>
        );
    }
    return null;
};

const CognitiveInsights = () => {
    const [burnoutRisk, setBurnoutRisk] = useState(15);

    useEffect(() => {
        const interval = setInterval(() => {
            setBurnoutRisk(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 5)));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Brain className="text-emerald-400" size={22} />
                        Cognitive Analytics
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Real-time brain performance monitoring and analysis.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-emerald-400">Live Sync</span>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-slate-800/40 border border-white/[0.06] rounded-xl p-5"
                >
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Activity size={16} className="text-emerald-400" />
                            Energy Timeline
                        </h3>
                        <select className="bg-[#151922] border border-white/[0.06] rounded-lg px-2.5 py-1 text-xs text-slate-400 outline-none">
                            <option>Today</option>
                            <option>Yesterday</option>
                            <option>Last 7 Days</option>
                        </select>
                    </div>

                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
                                <Area type="monotone" dataKey="energy" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergy)" />
                                <Area type="monotone" dataKey="focus" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorFocus)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Burnout Meter */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 flex flex-col items-center justify-center"
                >
                    <h3 className="text-sm font-semibold text-white mb-5 w-full flex items-center gap-2">
                        <AlertTriangle size={16} className="text-rose-400" />
                        Burnout Risk
                    </h3>

                    <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                            <motion.circle
                                initial={{ strokeDashoffset: 452 }}
                                animate={{ strokeDashoffset: 452 - (452 * burnoutRisk) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                cx="80" cy="80" r="72" fill="none"
                                stroke={burnoutRisk > 70 ? '#F43F5E' : burnoutRisk > 40 ? '#F59E0B' : '#10B981'}
                                strokeWidth="8" strokeLinecap="round" strokeDasharray="452"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white">{Math.round(burnoutRisk)}%</span>
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Risk Level</span>
                        </div>
                    </div>

                    <p className="text-center text-xs text-slate-400">
                        {burnoutRisk > 70 ? "Critical levels. Schedule recovery." : "Optimal functioning."}
                    </p>

                    {burnoutRisk > 50 && (
                        <button className="mt-4 w-full py-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-500/15 transition-colors text-xs flex items-center justify-center gap-1.5">
                            <Clock size={12} /> Insert Recovery
                        </button>
                    )}
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-5"
                >
                    <h3 className="text-sm font-semibold text-white mb-5">Task Distribution</h3>
                    <div className="h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="text-2xl font-bold text-white">4.5h</span>
                                <span className="block text-[10px] text-slate-500">Deep Work</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {pieData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-xs text-slate-400">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* AI Analysis */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 relative overflow-hidden"
                >
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                            <Brain size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Neural Pattern Analysis</h3>
                            <p className="text-[10px] text-slate-500">AI insights from last 48h activity</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-emerald-500/20 transition-colors">
                            <h4 className="text-emerald-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                                <TrendingUp size={13} /> Peak Performance
                            </h4>
                            <p className="text-slate-300 text-xs leading-relaxed">
                                Your output peaks between <span className="text-white font-medium">9:30 AM</span> and <span className="text-white font-medium">11:15 AM</span>.
                                Schedule complex tasks during this window.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-amber-500/20 transition-colors">
                            <h4 className="text-amber-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                                <AlertTriangle size={13} /> Fatigue Pattern
                            </h4>
                            <p className="text-slate-300 text-xs leading-relaxed">
                                Consistent dip at <span className="text-white font-medium">2:00 PM</span>.
                                Move email processing here and take a 15-min break at 1:45 PM.
                            </p>
                        </div>
                    </div>

                    <button className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                        View detailed report <ChevronRight size={14} />
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default CognitiveInsights;
