import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Brain,
    Zap,
    Clock,
    AlertTriangle,
    Check,
    TrendingUp,
    Wind,
    BookOpen,
    Sunrise,
    ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const fatigueData = [
    { time: '08:00', load: 30, risk: 10 },
    { time: '10:00', load: 65, risk: 25 },
    { time: '12:00', load: 85, risk: 45 },
    { time: '14:00', load: 92, risk: 85 },
    { time: '16:00', load: 60, risk: 50 },
    { time: '18:00', load: 45, risk: 30 },
];

const recoveryActivities = [
    { title: "Box Breathing", duration: "5 min", impact: "High", icon: Wind, color: "text-sky-400", bg: "bg-sky-500/10" },
    { title: "Light Stretch", duration: "10 min", impact: "Medium", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { title: "Nature Walk", duration: "20 min", impact: "High", icon: Sunrise, color: "text-amber-400", bg: "bg-amber-500/10" },
    { title: "Reflection Review", duration: "15 min", impact: "Medium", icon: BookOpen, color: "text-indigo-400", bg: "bg-indigo-500/10" },
];

const RecoveryMeter = ({ score }) => {
    const data = [{ name: 'Recovery', value: score, fill: score > 70 ? '#10B981' : score > 40 ? '#F59E0B' : '#EF4444' }];

    return (
        <div className="relative w-44 h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    innerRadius="80%"
                    outerRadius="100%"
                    barSize={8}
                    data={data}
                    startAngle={180}
                    endAngle={0}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
                <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-bold text-white"
                >
                    {score}%
                </motion.span>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Recovery</span>
            </div>
        </div>
    );
};

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
        <div className="max-w-[1400px] mx-auto pb-20 space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Activity className="text-emerald-400" size={22} />
                    Recovery Cycles
                </h1>
                <p className="text-slate-500 text-sm mt-1">Intelligent fatigue detection and cognitive restoration.</p>
            </div>

            {/* Top Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Recovery Overview */}
                <div className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
                    <RecoveryMeter score={recoveryScore} />

                    <div className="grid grid-cols-3 gap-4 w-full mt-5 text-center">
                        <div>
                            <div className="text-xl font-bold text-white">4.2h</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Deep Work</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-amber-400">3</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Fatigue Spikes</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-emerald-400">92%</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Sleep Qual</div>
                        </div>
                    </div>

                    <div className="mt-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[10px] font-medium flex items-center gap-1.5">
                        <Brain size={11} />
                        Brain Resilience Stable
                    </div>
                </div>

                {/* Fatigue Chart */}
                <div className="lg:col-span-2 bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-400">
                                <Activity size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white">Fatigue Pattern</h3>
                                <p className="text-[10px] text-slate-500">Real-time cognitive load analysis</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-rose-400 animate-pulse">
                            <AlertTriangle size={12} />
                            High Load: 14:00–15:00
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={fatigueData}>
                                <defs>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" stroke="#334155" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#334155" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1f2e', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#E2E8F0' }}
                                />
                                <Area type="monotone" dataKey="load" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#colorLoad)" />
                                <Area type="monotone" dataKey="risk" stroke="#6366F1" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* AI Recovery Plan */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white">AI Recovery Plan</h3>
                    <AnimatePresence>
                        {isApplied ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-300 flex items-center justify-center gap-2.5 h-32"
                            >
                                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                    <Check size={14} />
                                </div>
                                <span className="font-medium text-sm">Schedule Optimized</span>
                            </motion.div>
                        ) : (
                            <>
                                {[
                                    { title: "Active Reset", desc: "20 min light walk to clear adenosine buildup.", benefit: "23%" },
                                    { title: "NSDR Protocol", desc: "10 min non-sleep deep rest session.", benefit: "18%" },
                                ].map((rec, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ y: -2 }}
                                        onClick={handleApplyRecommendation}
                                        className="bg-slate-800/40 border border-white/[0.06] border-l-2 border-l-emerald-500 p-4 rounded-xl cursor-pointer hover:border-white/[0.1] transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-1.5">
                                            <h4 className="font-semibold text-white text-sm">{rec.title}</h4>
                                            <div className="p-1 rounded bg-emerald-500/15 text-emerald-400">
                                                <Zap size={12} />
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-2">{rec.desc}</p>
                                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                                            <TrendingUp size={10} />
                                            +{rec.benefit} Retention
                                        </div>
                                    </motion.div>
                                ))}
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Micro-Breaks */}
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="text-sm font-semibold text-white">Suggested Micro-Breaks</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recoveryActivities.map((activity, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ x: 2 }}
                                className="bg-slate-800/40 border border-white/[0.06] rounded-xl p-3.5 flex items-center gap-3 cursor-pointer hover:border-white/[0.1] transition-all"
                            >
                                <div className={`p-2.5 rounded-lg ${activity.bg} ${activity.color}`}>
                                    <activity.icon size={18} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[13px] font-semibold text-white">{activity.title}</h4>
                                    <div className="flex items-center gap-2.5 mt-0.5 text-[10px] text-slate-500">
                                        <span className="flex items-center gap-1"><Clock size={9} /> {activity.duration}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.04] text-[9px]">{activity.impact}</span>
                                    </div>
                                </div>
                                <div className="w-7 h-7 rounded-full border border-white/[0.06] flex items-center justify-center text-slate-500 hover:bg-white/5 hover:text-white transition-colors">
                                    <ArrowRight size={12} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Burnout Risk */}
                <div className="lg:col-span-8 bg-slate-800/40 border border-white/[0.06] rounded-xl p-5 flex items-center justify-between gap-6">
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white mb-1">Burnout Risk Detector</h3>
                        <p className="text-slate-500 text-xs mb-3">Cumulative cognitive load trending.</p>

                        <div className="h-3 bg-[#151922] rounded-full overflow-hidden relative">
                            <motion.div
                                className={`absolute top-0 left-0 h-full rounded-full ${burnoutRisk > 80 ? 'bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${burnoutRisk}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                        <div className="flex justify-between mt-1.5 text-[10px] text-slate-600 font-mono">
                            <span>Safe</span>
                            <span>Caution</span>
                            <span>Critical</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-4xl font-bold ${burnoutRisk > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>{burnoutRisk}%</span>
                        <span className="block text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">Saturation</span>
                    </div>
                </div>

                {/* AI Insight */}
                <div className="lg:col-span-4 bg-indigo-500/[0.04] border border-indigo-500/10 rounded-xl p-5">
                    <div className="flex items-center gap-1.5 mb-3 text-indigo-400">
                        <Brain size={16} />
                        <h4 className="text-sm font-semibold">AI Insight</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        "Your focus averaged <span className="text-white font-semibold">52 mins</span> today. Recovery intervals were skipped twice. I recommend a <span className="text-indigo-300 border-b border-indigo-500/30">Standard Protocol Reset</span> immediately."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RecoveryCycles;
