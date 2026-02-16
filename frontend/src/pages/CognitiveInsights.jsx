import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from 'recharts';
import { Activity, Brain, Clock, Zap, AlertTriangle, ChevronRight, TrendingUp, Heart, RefreshCw, Coffee } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const getUserId = () => {
    try {
        const raw = localStorage.getItem('sb-cjdfadtrbddoclodxtjh-auth-token');
        if (raw) return JSON.parse(raw)?.user?.id || 'anonymous';
    } catch { /* ignore */ }
    return 'anonymous';
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1f2e] border border-white/10 p-3 rounded-lg shadow-xl">
                <p className="text-slate-300 text-xs mb-1.5 font-medium">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="text-xs font-semibold flex items-center gap-1.5 mt-1">
                        {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const CognitiveInsights = () => {
    const [todayStats, setTodayStats] = useState(null);
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [emotionalState, setEmotionalState] = useState(null);
    const [energyData, setEnergyData] = useState(null);
    const [burnoutRisk, setBurnoutRisk] = useState(15);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const uid = getUserId();
        try {
            const [todayR, weeklyR, emotionalR, energyR] = await Promise.all([
                fetch(`${API}/api/study/stats/today/${uid}`).then(r => r.json()),
                fetch(`${API}/api/study/stats/weekly/${uid}`).then(r => r.json()),
                fetch(`${API}/api/scheduler/emotional-state`).then(r => r.json()),
                fetch(`${API}/api/scheduler/energy`).then(r => r.json()),
            ]);
            setTodayStats(todayR);
            setWeeklyStats(weeklyR);
            if (emotionalR.status === 'success') setEmotionalState(emotionalR.emotional_state);
            if (energyR.status === 'success') setEnergyData(energyR);

            // Calculate burnout from real data
            const focusH = todayR.focus_hours || 0;
            const depScore = emotionalR.emotional_state?.depression_score || 0;
            const stressScore = emotionalR.emotional_state?.stress_score || 0;
            const calculated = Math.min(100, Math.round(focusH * 12 + depScore * 30 + stressScore * 25));
            setBurnoutRisk(calculated);
        } catch (e) { console.error('Insights fetch error:', e); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // Build energy timeline from sessions today
    const energyTimeline = (todayStats?.sessions || []).map((s, i) => ({
        name: s.task_name ? s.task_name.slice(0, 12) : `S${i + 1}`,
        energy: s.energy_at_start || 5,
        focus: Math.round((s.focus_seconds || 0) / 60),
    }));

    // Weekly distribution
    const weeklyData = (weeklyStats?.daily_breakdown || []).map(d => ({
        date: d.date?.slice(5) || '',
        focus: d.focus_minutes || 0,
        breaks: d.break_minutes || 0,
        energy: d.avg_energy || 0,
    }));

    // Task type distribution
    const totalFocus = todayStats?.total_focus_seconds || 0;
    const totalBreaks = todayStats?.total_break_seconds || 0;
    const totalPause = (todayStats?.total_pause_count || 0) * 60; // rough estimate
    const remaining = Math.max(0, 8 * 3600 - totalFocus - totalBreaks - totalPause);
    const pieData = [
        { name: 'Deep Focus', value: Math.round(totalFocus / 60) || 1, color: '#10B981' },
        { name: 'Breaks', value: Math.round(totalBreaks / 60) || 1, color: '#F59E0B' },
        { name: 'Recovery', value: Math.round(totalPause / 60) || 1, color: '#3B82F6' },
        { name: 'Available', value: Math.round(remaining / 60) || 1, color: '#6366F1' },
    ];
    const pieTotal = pieData.reduce((a, b) => a + b.value, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Brain className="text-emerald-400" size={22} />
                        Cognitive Analytics
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Real-time brain performance monitoring — Pipelines 1, 2 & 3.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-medium text-emerald-400">Live Sync</span>
                    </div>
                </div>
            </div>

            {/* Emotional State Banner */}
            {emotionalState && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-4 flex flex-wrap items-center gap-3"
                >
                    <div className="flex items-center gap-2 mr-4">
                        <Heart size={16} className="text-rose-400" />
                        <span className="text-xs text-slate-400 font-medium">Emotional State (DB):</span>
                    </div>
                    {['depression_level', 'anxiety_level', 'stress_level'].map(k => {
                        const val = emotionalState[k] || 'low';
                        const label = k.replace('_level', '');
                        const colors = { high: 'text-rose-400 bg-rose-500/10 border-rose-500/20', medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20', low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
                        return (
                            <span key={k} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors[val] || colors.low}`}>
                                {label}: {val}
                            </span>
                        );
                    })}
                    {energyData && (
                        <span className={`text-[10px] ml-auto font-semibold px-2 py-0.5 rounded-full border ${energyData.energy_level >= 6 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                energyData.energy_level >= 3 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                    'text-rose-400 bg-rose-500/10 border-rose-500/20'
                            }`}>⚡ Energy: {energyData.energy_level}/10 (penalty: {energyData.emotional_penalty})</span>
                    )}
                </motion.div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Weekly Focus Timeline */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-slate-800/40 border border-white/[0.06] rounded-xl p-5"
                >
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Activity size={16} className="text-emerald-400" /> Weekly Focus Timeline
                        </h3>
                    </div>
                    <div className="h-[260px] w-full">
                        {weeklyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
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
                                    <XAxis dataKey="date" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
                                    <Area type="monotone" dataKey="focus" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorFocus)" name="Focus (min)" />
                                    <Area type="monotone" dataKey="breaks" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergy)" name="Breaks (min)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                                Start study sessions to see your focus timeline.
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Burnout Meter */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 flex flex-col items-center justify-center"
                >
                    <h3 className="text-sm font-semibold text-white mb-5 w-full flex items-center gap-2">
                        <AlertTriangle size={16} className="text-rose-400" /> Burnout Risk
                    </h3>
                    <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                            <motion.circle
                                initial={{ strokeDashoffset: 452 }}
                                animate={{ strokeDashoffset: 452 - (452 * burnoutRisk) / 100 }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
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
                        {burnoutRisk > 70 ? 'Critical levels. Schedule recovery.' : burnoutRisk > 40 ? 'Moderate load. Consider a break.' : 'Optimal functioning.'}
                    </p>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Pie Chart */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-5"
                >
                    <h3 className="text-sm font-semibold text-white mb-5">Time Distribution</h3>
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
                                <span className="text-2xl font-bold text-white">{(totalFocus / 3600).toFixed(1)}h</span>
                                <span className="block text-[10px] text-slate-500">Focus</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {pieData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-xs text-slate-400">{item.name} ({item.value}min)</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Neural Pattern Analysis */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 relative overflow-hidden"
                >
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                            <Brain size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Neural Pattern Analysis</h3>
                            <p className="text-[10px] text-slate-500">AI insights from Pipeline 1 + 2 + 3</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Real insights based on emotional data */}
                        {emotionalState?.energy_score !== undefined && (
                            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-emerald-500/20 transition-colors">
                                <h4 className="text-emerald-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                                    <TrendingUp size={13} /> Energy Assessment
                                </h4>
                                <p className="text-slate-300 text-xs leading-relaxed">
                                    Your current energy score is <span className="text-white font-medium">{emotionalState.energy_score}/100</span>.
                                    {emotionalState.energy_score > 60 ? ' You are in a good state for complex tasks.' :
                                        emotionalState.energy_score > 30 ? ' Consider lighter tasks and take regular breaks.' :
                                            ' Rest is strongly recommended before deep work.'}
                                </p>
                            </div>
                        )}

                        {emotionalState?.depression_level === 'high' || emotionalState?.stress_level === 'high' ? (
                            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-amber-500/20 transition-colors">
                                <h4 className="text-amber-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                                    <AlertTriangle size={13} /> Emotional Load Detected
                                </h4>
                                <p className="text-slate-300 text-xs leading-relaxed">
                                    {emotionalState?.depression_level === 'high' && <>Depression indicators are elevated. </>}
                                    {emotionalState?.stress_level === 'high' && <>Stress levels are high. </>}
                                    The scheduler is automatically adjusting task difficulty and timing to support recovery.
                                </p>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-indigo-500/20 transition-colors">
                                <h4 className="text-indigo-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                                    <Brain size={13} /> Cognitive State
                                </h4>
                                <p className="text-slate-300 text-xs leading-relaxed">
                                    Emotional indicators are within normal range. Your cognitive capacity is at optimal levels for productive work sessions.
                                </p>
                            </div>
                        )}

                        <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-cyan-500/20 transition-colors">
                            <h4 className="text-cyan-400 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                                <Coffee size={13} /> Session Insight
                            </h4>
                            <p className="text-slate-300 text-xs leading-relaxed">
                                {todayStats?.session_count > 0
                                    ? <>You've completed <span className="text-white font-medium">{todayStats.session_count} session{todayStats.session_count > 1 ? 's' : ''}</span> with{' '}
                                        <span className="text-white font-medium">{todayStats.focus_hours}h</span> of focus time and{' '}
                                        <span className="text-white font-medium">{todayStats.total_pause_count}</span> pauses today.</>
                                    : <>No sessions recorded today. Start a Deep Work session to track your cognitive performance.</>
                                }
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CognitiveInsights;
