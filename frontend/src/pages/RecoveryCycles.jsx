import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Brain, Zap, Clock, AlertTriangle, Check, TrendingUp,
    Wind, BookOpen, Sunrise, ArrowRight, Heart, Coffee,
    BarChart3, Calendar, RefreshCw, ChevronDown,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, PolarAngleAxis,
    BarChart, Bar, Cell, CartesianGrid, Legend,
} from 'recharts';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const getUserId = () => {
    try {
        const raw = localStorage.getItem('sb-cjdfadtrbddoclodxtjh-auth-token');
        if (raw) return JSON.parse(raw)?.user?.id || 'anonymous';
    } catch { /* ignore */ }
    return 'anonymous';
};

// ─── Recovery Meter ───
const RecoveryMeter = ({ score, label = 'Recovery' }) => {
    const data = [{ name: label, value: score, fill: score > 70 ? '#10B981' : score > 40 ? '#F59E0B' : '#EF4444' }];
    return (
        <div className="relative w-40 h-40 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="80%" outerRadius="100%" barSize={8} data={data} startAngle={180} endAngle={0}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
                <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-bold text-white">
                    {score}%
                </motion.span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">{label}</span>
            </div>
        </div>
    );
};

// ─── Emotional Badge ───
const EmotionalBadge = ({ label, level }) => {
    const colors = {
        high: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    };
    return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors[level] || colors.low}`}>
            {label}: {level || 'low'}
        </span>
    );
};

// custom tooltip
const ChartTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div className="bg-[#1a1f2e] border border-white/10 p-3 rounded-lg shadow-xl text-xs">
                <p className="text-slate-300 font-medium mb-1">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>
                ))}
            </div>
        );
    }
    return null;
};

const RecoveryCycles = () => {
    const [todayStats, setTodayStats] = useState(null);
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [recoveryPlan, setRecoveryPlan] = useState(null);
    const [emotionalState, setEmotionalState] = useState(null);
    const [currentEnergy, setCurrentEnergy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('today'); // today, weekly
    const [isApplied, setIsApplied] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const uid = getUserId();
        try {
            const [todayRes, weeklyRes, recoveryRes] = await Promise.all([
                fetch(`${API}/api/study/stats/today/${uid}`).then(r => r.json()),
                fetch(`${API}/api/study/stats/weekly/${uid}`).then(r => r.json()),
                fetch(`${API}/api/study/recovery-plan/${uid}`).then(r => r.json()),
            ]);
            setTodayStats(todayRes);
            setWeeklyStats(weeklyRes);
            if (recoveryRes.status === 'success') {
                setRecoveryPlan(recoveryRes.recovery_plan);
                setEmotionalState(recoveryRes.emotional_state);
                setCurrentEnergy(recoveryRes.current_energy);
            }
        } catch (e) { console.error('Recovery fetch error:', e); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const totalFocusToday = todayStats?.total_focus_seconds || 0;
    const totalBreaksToday = todayStats?.total_break_seconds || 0;
    const sessionCount = todayStats?.session_count || 0;
    const pauseCount = todayStats?.total_pause_count || 0;
    const focusHours = (totalFocusToday / 3600).toFixed(1);
    const recoveryScore = recoveryPlan?.recovery_score || 0;

    // Build today session timeline for chart
    const sessionTimeline = (todayStats?.sessions || []).map((s, i) => ({
        name: `Session ${i + 1}`,
        focus: Math.round((s.focus_seconds || 0) / 60),
        breaks: Math.round((s.break_seconds || 0) / 60),
        pauses: s.pause_count || 0,
        energy: s.energy_at_start || 5,
    }));

    // Weekly data
    const weeklyData = (weeklyStats?.daily_breakdown || []).map(d => ({
        date: d.date?.slice(5) || '',
        focus: d.focus_minutes || 0,
        breaks: d.break_minutes || 0,
        sessions: d.sessions || 0,
        energy: d.avg_energy || 0,
    }));

    const handleApplyRecovery = () => {
        setIsApplied(true);
        setTimeout(() => setIsApplied(false), 3000);
    };

    return (
        <div className="max-w-[1400px] mx-auto pb-20 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Activity className="text-emerald-400" size={22} />
                        Recovery Cycles
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Pipeline 3 — Session monitoring, fatigue detection & cognitive restoration.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchData} className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="flex bg-slate-800/60 rounded-lg border border-white/[0.06] p-0.5">
                        {['today', 'weekly'].map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === t ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
                            >{t === 'today' ? 'Today' : 'This Week'}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Emotional Banner */}
            {emotionalState && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-4 flex flex-wrap items-center gap-3"
                >
                    <div className="flex items-center gap-2 mr-4">
                        <Heart size={16} className="text-rose-400" />
                        <span className="text-xs text-slate-400 font-medium">Current State:</span>
                    </div>
                    <EmotionalBadge label="Depression" level={emotionalState.depression} />
                    <EmotionalBadge label="Anxiety" level={emotionalState.anxiety} />
                    <EmotionalBadge label="Stress" level={emotionalState.stress} />
                    <span className="text-[10px] text-slate-500 ml-2">Tone: {emotionalState.tone || 'neutral'}</span>
                    {currentEnergy !== null && (
                        <span className={`text-[10px] ml-auto font-semibold px-2 py-0.5 rounded-full border ${currentEnergy >= 6 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                currentEnergy >= 3 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                    'text-rose-400 bg-rose-500/10 border-rose-500/20'
                            }`}>Energy: {currentEnergy}/10</span>
                    )}
                </motion.div>
            )}

            {/* Top Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Recovery Score + Today Summary */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden"
                >
                    <RecoveryMeter score={Math.max(0, 100 - recoveryScore)} label="Readiness" />
                    <div className="grid grid-cols-3 gap-4 w-full mt-5 text-center">
                        <div>
                            <div className="text-xl font-bold text-white">{focusHours}h</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Focus</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-amber-400">{sessionCount}</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Sessions</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-emerald-400">{pauseCount}</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Pauses</div>
                        </div>
                    </div>
                    <div className={`mt-4 px-3 py-1 rounded-full border text-[10px] font-medium flex items-center gap-1.5 ${recoveryScore > 70 ? 'bg-rose-500/10 border-rose-500/15 text-rose-400' :
                            recoveryScore > 40 ? 'bg-amber-500/10 border-amber-500/15 text-amber-400' :
                                'bg-emerald-500/10 border-emerald-500/15 text-emerald-400'
                        }`}>
                        <Brain size={11} />
                        {recoveryScore > 70 ? 'Recovery Needed' : recoveryScore > 40 ? 'Moderate Load' : 'Brain Resilience Stable'}
                    </div>
                </motion.div>

                {/* Chart */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 flex flex-col min-h-[300px]"
                >
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400"><BarChart3 size={16} /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">{activeTab === 'today' ? 'Session Timeline' : 'Weekly Overview'}</h3>
                                <p className="text-[10px] text-slate-500">{activeTab === 'today' ? 'Focus vs breaks per session' : 'Daily focus distribution'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[200px]">
                        {activeTab === 'today' ? (
                            sessionTimeline.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sessionTimeline} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="name" stroke="#334155" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#334155" fontSize={11} tickLine={false} axisLine={false} unit="min" />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Bar dataKey="focus" fill="#6366F1" radius={[4, 4, 0, 0]} name="Focus (min)" />
                                        <Bar dataKey="breaks" fill="#10B981" radius={[4, 4, 0, 0]} name="Breaks (min)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600 text-sm">No sessions today yet. Start a focus session!</div>
                            )
                        ) : (
                            weeklyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weeklyData}>
                                        <defs>
                                            <linearGradient id="colorFocusW" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorBreakW" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="date" stroke="#334155" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#334155" fontSize={11} tickLine={false} axisLine={false} unit="min" />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Area type="monotone" dataKey="focus" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorFocusW)" name="Focus (min)" />
                                        <Area type="monotone" dataKey="breaks" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorBreakW)" name="Breaks (min)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600 text-sm">No weekly data yet.</div>
                            )
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Middle Section: Recovery Plan + Session Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* AI Recovery Plan */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="space-y-3"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Brain size={14} className="text-indigo-400" /> AI Recovery Plan
                        </h3>
                        {recoveryPlan?.urgency && (
                            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${recoveryPlan.urgency === 'critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                                    recoveryPlan.urgency === 'high' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                }`}>{recoveryPlan.urgency.toUpperCase()}</span>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {isApplied ? (
                            <motion.div key="applied" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-300 flex items-center justify-center gap-2.5 h-32"
                            >
                                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white"><Check size={14} /></div>
                                <span className="font-medium text-sm">Recovery Plan Applied</span>
                            </motion.div>
                        ) : recoveryPlan?.activities ? (
                            <motion.div key="activities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                {recoveryPlan.activities.slice(0, 3).map((act, i) => {
                                    const iconMap = { physical: Activity, breathing: Wind, mental: Brain, social: Heart, creative: Zap };
                                    const Icon = iconMap[act.category] || Activity;
                                    return (
                                        <motion.div key={i} whileHover={{ y: -2 }} onClick={handleApplyRecovery}
                                            className="bg-slate-800/40 border border-white/[0.06] border-l-2 border-l-emerald-500 p-4 rounded-xl cursor-pointer hover:border-white/[0.1] transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Icon size={14} className="text-emerald-400" />
                                                    <h4 className="font-semibold text-white text-sm">{act.name}</h4>
                                                </div>
                                                <div className="p-1 rounded bg-emerald-500/15 text-emerald-400"><Zap size={12} /></div>
                                            </div>
                                            <p className="text-xs text-slate-400 mb-2">{act.description}</p>
                                            <div className="flex items-center gap-3 text-[10px]">
                                                <span className="text-slate-500 flex items-center gap-1"><Clock size={9} /> {act.duration_minutes}min</span>
                                                <span className={`px-1.5 py-0.5 rounded border ${act.impact === 'high' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                                        'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                                    }`}>{act.impact}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        ) : (
                            <div className="p-4 rounded-xl bg-slate-800/40 border border-white/[0.06] text-center text-slate-600 text-sm">
                                Complete a session to get AI recovery suggestions.
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Session Breakdown + Insights */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="lg:col-span-2 space-y-4"
                >
                    {/* Session List */}
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Calendar size={14} className="text-cyan-400" /> Today's Sessions
                    </h3>
                    {(todayStats?.sessions || []).length > 0 ? (
                        <div className="space-y-3">
                            {todayStats.sessions.map((s, i) => (
                                <motion.div key={s.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.05 }}
                                    className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-4 flex items-center gap-4"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                            s.status === 'active' ? 'bg-indigo-500/10 text-indigo-400' :
                                                'bg-slate-500/10 text-slate-400'
                                        }`}>
                                        {s.status === 'completed' ? <Check size={18} /> : <Clock size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-white truncate">{s.task_name || `Session ${i + 1}`}</h4>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                                            <span>{Math.round((s.focus_seconds || 0) / 60)}min focus</span>
                                            <span>{Math.round((s.break_seconds || 0) / 60)}min breaks</span>
                                            <span>{s.pause_count || 0} pauses</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {s.energy_at_start && (
                                            <div className="flex items-center gap-1 text-[10px]">
                                                <Zap size={10} className="text-amber-400" />
                                                <span className="text-slate-400">{s.energy_at_start}</span>
                                                {s.energy_at_end && (
                                                    <>
                                                        <ArrowRight size={10} className="text-slate-600" />
                                                        <span className={s.energy_at_end >= s.energy_at_start ? 'text-emerald-400' : 'text-rose-400'}>
                                                            {s.energy_at_end}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${s.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10' : 'text-indigo-400 bg-indigo-500/10'
                                            }`}>{s.status}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-6 text-center text-slate-600 text-sm">
                            No sessions today. Start a Deep Work session to see data here.
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Bottom: Burnout Risk + AI Insight */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Burnout Risk */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="lg:col-span-8 bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 flex items-center justify-between gap-6"
                >
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white mb-1">Burnout Risk Detector</h3>
                        <p className="text-slate-500 text-xs mb-3">Based on emotional state + session load.</p>
                        <div className="h-3 bg-[#151922] rounded-full overflow-hidden relative">
                            <motion.div
                                className={`absolute top-0 left-0 h-full rounded-full ${recoveryScore > 80 ? 'bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse' :
                                        recoveryScore > 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                                            'bg-gradient-to-r from-emerald-500 to-cyan-500'
                                    }`}
                                initial={{ width: 0 }} animate={{ width: `${recoveryScore}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </div>
                        <div className="flex justify-between mt-1.5 text-[10px] text-slate-600 font-mono">
                            <span>Safe</span><span>Caution</span><span>Critical</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-4xl font-bold ${recoveryScore > 70 ? 'text-rose-400' : recoveryScore > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {recoveryScore}%
                        </span>
                        <span className="block text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">Saturation</span>
                    </div>
                </motion.div>

                {/* AI Insight */}
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="lg:col-span-4 bg-indigo-500/[0.04] border border-indigo-500/10 rounded-xl p-5"
                >
                    <div className="flex items-center gap-1.5 mb-3 text-indigo-400">
                        <Brain size={16} />
                        <h4 className="text-sm font-semibold">AI Insight</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        {recoveryPlan?.emotional_insight ? (
                            <>{recoveryPlan.emotional_insight}</>
                        ) : (
                            <>Complete a focus session to receive personalized AI insights about your cognitive patterns.</>
                        )}
                    </p>
                    {recoveryPlan?.next_session_advice && (
                        <p className="text-xs text-emerald-300/80 leading-relaxed mt-3 pt-3 border-t border-white/[0.06]">
                            <Zap size={11} className="inline mr-1" />{recoveryPlan.next_session_advice}
                        </p>
                    )}
                </motion.div>
            </div>

            {/* Weekly Summary (if on weekly tab) */}
            {activeTab === 'weekly' && weeklyStats && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-5"
                >
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={14} className="text-emerald-400" /> Weekly Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Focus', value: `${weeklyStats.total_focus_hours || 0}h`, icon: Brain, color: 'text-indigo-400' },
                            { label: 'Sessions', value: weeklyStats.total_sessions || 0, icon: Calendar, color: 'text-cyan-400' },
                            { label: 'Avg Daily', value: `${weeklyStats.avg_daily_focus_minutes || 0}min`, icon: Clock, color: 'text-amber-400' },
                            { label: 'Best Day', value: weeklyStats.best_day?.slice(5) || '—', icon: TrendingUp, color: 'text-emerald-400' },
                        ].map((s, i) => (
                            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                                className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                            >
                                <s.icon size={16} className={`${s.color} mx-auto mb-1`} />
                                <div className="text-lg font-bold text-white">{s.value}</div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-widest">{s.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default RecoveryCycles;
