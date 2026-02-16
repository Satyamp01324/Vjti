import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Play, Pause, RotateCcw, Square, Coffee, Brain, ArrowLeft,
    Zap, TrendingUp, Clock, Activity, Wind, Heart, Shield,
    CheckCircle2, BarChart3, AlertCircle, Timer, X
} from 'lucide-react';
import NeuralBackground from '../components/NeuralBackground';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const DeepWorkMode = () => {
    const navigate = useNavigate();

    // Session state
    const [sessionId, setSessionId] = useState(null);
    const [sessionStatus, setSessionStatus] = useState('idle'); // idle, active, paused, break, completed
    const [taskName, setTaskName] = useState('Focus Session');
    const [editingTask, setEditingTask] = useState(false);

    // Timer state
    const [elapsed, setElapsed] = useState(0);
    const [plannedDuration, setPlannedDuration] = useState(90 * 60);
    const [editMode, setEditMode] = useState(false);
    const [inputMinutes, setInputMinutes] = useState(90);

    // Break Modal state
    const [showBreakModal, setShowBreakModal] = useState(false);
    const [customBreakMinutes, setCustomBreakMinutes] = useState(5);

    // Feature Toggles (UI)
    const [focusMusic, setFocusMusic] = useState(false);
    const [shieldMode, setShieldMode] = useState(true);

    // Session stats (live)
    const [focusSeconds, setFocusSeconds] = useState(0);
    const [breakSeconds, setBreakSeconds] = useState(0);
    const [pauseCount, setPauseCount] = useState(0);
    const [breaksTaken, setBreaksTaken] = useState(0);
    const [breakType, setBreakType] = useState('short');
    const [breakTimeLeft, setBreakTimeLeft] = useState(0);
    const [pauseLog, setPauseLog] = useState([]); // Array of timestamps

    // Emotional context
    const [emotionalState, setEmotionalState] = useState(null);
    const [energyLevel, setEnergyLevel] = useState(null);
    const [recommendation, setRecommendation] = useState('');

    // Recovery plan (after session)
    const [recoveryPlan, setRecoveryPlan] = useState(null);
    const [sessionStats, setSessionStats] = useState(null);
    const [emotionalBefore, setEmotionalBefore] = useState(null);
    const [emotionalAfter, setEmotionalAfter] = useState(null);

    // Loading
    const [loading, setLoading] = useState(false);

    const timerRef = useRef(null);
    const breakTimerRef = useRef(null);

    // Get user ID from Supabase
    const getUserId = () => {
        try {
            const raw = localStorage.getItem('sb-cjdfadtrbddoclodxtjh-auth-token');
            if (raw) { return JSON.parse(raw)?.user?.id || 'anonymous'; }
        } catch { /* ignore */ }
        return 'anonymous';
    };

    // ── Initialization ──
    useEffect(() => {
        const fetchCurrentSession = async () => {
            const userId = getUserId();
            if (userId === 'anonymous') return;

            try {
                const data = await apiCall(`/api/study/current/${userId}`);
                if (data && data.status === 'success' && data.session) {
                    const s = data.session;
                    console.log("Restoring session:", s);

                    setSessionId(s.id);
                    setSessionStatus(s.session_status); // active, paused, break
                    setTaskName(s.task_name || 'Focus Session');
                    setPlannedDuration((s.planned_duration || 90) * 60);

                    // Restore times
                    // Note: 'total_seconds' includes total elapsed time since start
                    // 'focus_seconds' and 'break_seconds' are the accumulated buckets
                    setFocusSeconds(s.focus_seconds);
                    setBreakSeconds(s.break_seconds);
                    setPauseCount(s.pause_count);
                    setBreaksTaken(s.breaks_taken);
                    setEmotionalState(s.emotional_state);
                    setEnergyLevel(s.energy_at_start);

                    // Calculate elapsed based on focus/break time or total duration?
                    // The UI 'elapsed' usually tracks total duration of the session 
                    // OR specifically focus time depending on design.
                    // Looking at lines 107 (progress) -> elapsed / plannedDuration.
                    // And line 75 (timer) -> setElapsed(p => p+1).
                    // In active state, elapsed increases.
                    // We should probably set elapsed to total_seconds or focus_seconds?
                    // If plannedDuration is 'Focus Duration', then elapsed should be focus_seconds.
                    // Let's assume elapsed = focus_seconds for progress tracking if that's the goal.
                    // BUT line 614 shows "Total Session: {formatTime(elapsed)}" which implies total time.
                    // However, progress bar usually tracks focus time vs planned focus time.
                    // Let's set elapsed to s.total_seconds (time since start) for now, 
                    // but if the user wants 'focus time' progress, we might need to adjust.
                    // Actually, looking at line 108: focusRatio implies elapsed is total duration.
                    setElapsed(s.total_seconds);

                    // If break, set break timer
                    if (s.session_status === 'break') {
                        // We don't have remaining break time from backend easily unless we store 'break_start_time' and 'planned_break_duration'
                        // The backend 'start_break' returns suggested_duration. 
                        // We might just have to default or try to infer.
                        // For now, set a default remaining or 0.
                        setBreakTimeLeft(0);
                    }
                }
            } catch (e) {
                console.error("Failed to restore session:", e);
            }
        };
        fetchCurrentSession();
    }, []);

    // ── Timer Logic ──
    useEffect(() => {
        if (sessionStatus === 'active') {
            timerRef.current = setInterval(() => {
                setElapsed(p => p + 1);
                setFocusSeconds(p => p + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [sessionStatus]);

    // Break countdown
    useEffect(() => {
        if (sessionStatus === 'break' && breakTimeLeft > 0) {
            breakTimerRef.current = setInterval(() => {
                setBreakTimeLeft(p => {
                    if (p <= 1) { clearInterval(breakTimerRef.current); return 0; }
                    return p - 1;
                });
                setBreakSeconds(p => p + 1);
                setElapsed(p => p + 1);
            }, 1000);
        } else {
            clearInterval(breakTimerRef.current);
        }
        return () => clearInterval(breakTimerRef.current);
    }, [sessionStatus, breakTimeLeft]);

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const progress = Math.min((elapsed / plannedDuration) * 100, 100);
    const focusRatio = elapsed > 0 ? ((focusSeconds / elapsed) * 100).toFixed(1) : '0.0';

    // ── API Calls ──
    const apiCall = async (path, method = 'GET', body = null) => {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        const r = await fetch(`${API}${path}`, opts);
        return r.json();
    };

    const handleStart = async () => {
        setLoading(true);
        try {
            const data = await apiCall('/api/study/start', 'POST', {
                user_id: getUserId(),
                task_name: taskName,
                duration_minutes: Math.floor(plannedDuration / 60),
            });
            if (data.status === 'success') {
                setSessionId(data.session_id);
                setSessionStatus('active');
                setEmotionalState(data.emotional_state);
                setEnergyLevel(data.energy_level);
                setRecommendation(data.recommendation);
                setEmotionalBefore(data.emotional_state);
                setElapsed(0); setFocusSeconds(0); setBreakSeconds(0);
                setPauseCount(0); setBreaksTaken(0);
                setRecoveryPlan(null); setSessionStats(null);
                setPauseLog([{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), elapsed: '00:00', message: 'Session Started' }]);
            }
        } catch (e) {
            console.error('Start error:', e);
            // Fallback: local-only session
            setSessionId('local-' + Date.now());
            setSessionStatus('active');
            setElapsed(0); setFocusSeconds(0); setBreakSeconds(0);
        }
        setLoading(false);
    };

    const handlePause = async () => {
        if (!sessionId) return;
        setSessionStatus('paused');
        setPauseCount(p => p + 1);
        setPauseLog(prev => [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), elapsed: formatTime(elapsed), message: 'Session Paused' }, ...prev]);
        try { await apiCall('/api/study/pause', 'POST', { session_id: sessionId }); } catch { }
    };

    const handleResume = async () => {
        if (!sessionId) return;
        setSessionStatus('active');
        setPauseLog(prev => [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), elapsed: formatTime(elapsed), message: 'Resumed Focus' }, ...prev]);
        try { await apiCall('/api/study/resume', 'POST', { session_id: sessionId }); } catch { }
    };

    const triggerBreakModal = () => {
        setShowBreakModal(true);
    };

    const handleBreakConfirm = async () => {
        if (!sessionId) return;
        const durationSec = customBreakMinutes * 60;
        setBreakType('custom');
        setBreakTimeLeft(durationSec);
        setBreaksTaken(p => p + 1);
        setSessionStatus('break');
        setShowBreakModal(false);
        setPauseLog(prev => [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), elapsed: formatTime(elapsed), message: 'Break Started' }, ...prev]);

        try {
            await apiCall('/api/study/break', 'POST', {
                session_id: sessionId,
                break_type: 'custom',
                custom_duration_seconds: durationSec
            });
        } catch { }
    };

    // Helper for preset breaks
    const handleQuickBreak = (min) => {
        setCustomBreakMinutes(min);
        // We call handleBreakConfirm inside a timeout or directly if we adapt the logic slightly,
        // but cleaner to just set state and call the API function directly with the value.
        // Let's call the API logic directly here.
        startBreakProcess(min);
    };

    const startBreakProcess = async (minutes) => {
        if (!sessionId) return;
        const durationSec = minutes * 60;
        setBreakType('custom');
        setBreakTimeLeft(durationSec);
        setBreaksTaken(p => p + 1);
        setSessionStatus('break');
        setShowBreakModal(false);
        setPauseLog(prev => [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), elapsed: formatTime(elapsed), message: 'Break Started' }, ...prev]);

        try {
            await apiCall('/api/study/break', 'POST', {
                session_id: sessionId,
                break_type: 'custom',
                custom_duration_seconds: durationSec
            });
        } catch { }
    };


    const handleEndBreak = async () => {
        if (!sessionId) return;
        setSessionStatus('active');
        setBreakTimeLeft(0);
        setPauseLog(prev => [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), elapsed: formatTime(elapsed), message: 'Break Ended' }, ...prev]);
        try { await apiCall('/api/study/end-break', 'POST', { session_id: sessionId }); } catch { }
    };

    const handleEnd = async () => {
        if (!sessionId) return;
        setLoading(true);
        try {
            const data = await apiCall('/api/study/end', 'POST', { session_id: sessionId });
            if (data.status === 'success') {
                setSessionStats(data.stats);
                setRecoveryPlan(data.recovery_plan);
                setEmotionalAfter(data.emotional_after);
                setSessionStatus('completed');
            }
        } catch (e) {
            console.error('End error:', e);
            setSessionStatus('completed');
            setSessionStats({
                total_duration_seconds: elapsed,
                focus_seconds: focusSeconds,
                break_seconds: breakSeconds,
                pause_count: pauseCount,
                breaks_taken: breaksTaken,
                focus_percentage: parseFloat(focusRatio),
            });
        }
        setLoading(false);
    };

    const handleReset = () => {
        setSessionId(null); setSessionStatus('idle');
        setElapsed(0); setFocusSeconds(0); setBreakSeconds(0);
        setPauseCount(0); setBreaksTaken(0);
        setRecoveryPlan(null); setSessionStats(null);
        setEmotionalBefore(null); setEmotionalAfter(null);
        setPauseLog([]);
    };

    const handleTimeEdit = () => { if (sessionStatus === 'idle') { setEditMode(true); setInputMinutes(Math.floor(plannedDuration / 60)); } };
    const handleTimeSubmit = (e) => { e.preventDefault(); setEditMode(false); setPlannedDuration(inputMinutes * 60); };

    const toggleFocusMusic = () => {
        const newState = !focusMusic;
        setFocusMusic(newState);
        if (sessionStatus === 'active' || sessionStatus === 'paused') {
            setPauseLog(prev => [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), elapsed: formatTime(elapsed), message: newState ? 'Music On' : 'Music Off' }, ...prev]);
        }
    };

    const toggleShieldMode = () => {
        const newState = !shieldMode;
        setShieldMode(newState);
        if (sessionStatus === 'active' || sessionStatus === 'paused') {
            setPauseLog(prev => [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), elapsed: formatTime(elapsed), message: newState ? 'Shield On' : 'Shield Off' }, ...prev]);
        }
    };

    // ── Render Helpers ──
    const getStatusColor = () => {
        if (sessionStatus === 'active') return 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30';
        if (sessionStatus === 'paused') return 'text-amber-300 bg-amber-500/20 border-amber-500/30';
        if (sessionStatus === 'break') return 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30';
        if (sessionStatus === 'completed') return 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30';
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    };

    const getStrokeColor = () => {
        if (sessionStatus === 'break') return '#10B981';
        if (sessionStatus === 'paused') return '#F59E0B';
        return '#6366F1';
    };

    // ── COMPLETED VIEW (Recovery Plan + Stats) ──
    if (sessionStatus === 'completed') {
        return (
            <div className="relative min-h-screen flex flex-col items-center p-6 overflow-hidden bg-black text-white">
                <div className="absolute inset-0 z-0">
                    <NeuralBackground />
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-80 pointer-events-none" />
                </div>

                <motion.button
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/dashboard')}
                    className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                    <div className="p-2 rounded-full border border-white/10 bg-white/5 group-hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </div>
                </motion.button>

                <div className="relative z-10 w-full max-w-5xl mt-16 space-y-6">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 mb-4">
                            <CheckCircle2 size={18} />
                            <span className="text-sm font-semibold">Session Complete</span>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{taskName}</h1>
                    </motion.div>

                    {/* Stats Grid */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        {[
                            { label: 'Focus Time', value: formatTime(sessionStats?.focus_seconds || focusSeconds), icon: Brain, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                            { label: 'Breaks', value: `${sessionStats?.breaks_taken || breaksTaken}`, icon: Coffee, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { label: 'Pauses', value: `${sessionStats?.pause_count || pauseCount}`, icon: Pause, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                            { label: 'Focus %', value: `${sessionStats?.focus_percentage || focusRatio}%`, icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                        ].map((stat, i) => (
                            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
                                className="bg-slate-800/60 border border-white/[0.06] rounded-xl p-4 text-center backdrop-blur-md"
                            >
                                <div className={`inline-flex p-2 rounded-lg ${stat.bg} ${stat.color} mb-2`}><stat.icon size={18} /></div>
                                <div className="text-2xl font-bold text-white">{stat.value}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Before → After Emotional State */}
                    {emotionalBefore && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-slate-800/60 border border-white/[0.06] rounded-xl p-5 backdrop-blur-md"
                        >
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Heart size={16} className="text-rose-400" /> Emotional State Comparison
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Before Session</div>
                                    {['depression', 'anxiety', 'stress'].map(k => (
                                        <div key={k} className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-slate-400 capitalize">{k}</span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${emotionalBefore?.[k] === 'high' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                                                emotionalBefore?.[k] === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                                    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                }`}>{emotionalBefore?.[k] || 'low'}</span>
                                        </div>
                                    ))}
                                    <div className="mt-2 text-xs text-slate-500">
                                        Energy: <span className="text-white font-semibold">{sessionStats?.energy_before || '?'}/10</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">After Session</div>
                                    {['depression', 'anxiety', 'stress'].map(k => (
                                        <div key={k} className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-slate-400 capitalize">{k}</span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${emotionalAfter?.[k] === 'high' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                                                emotionalAfter?.[k] === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                                    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                                }`}>{emotionalAfter?.[k] || 'low'}</span>
                                        </div>
                                    ))}
                                    <div className="mt-2 text-xs text-slate-500">
                                        Energy: <span className="text-white font-semibold">{sessionStats?.energy_after || '?'}/10</span>
                                        {sessionStats?.energy_change !== undefined && (
                                            <span className={`ml-2 ${sessionStats.energy_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                ({sessionStats.energy_change >= 0 ? '+' : ''}{sessionStats.energy_change})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* AI Recovery Plan */}
                    {recoveryPlan && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            className="bg-slate-800/60 border border-white/[0.06] rounded-xl p-5 backdrop-blur-md"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Brain size={16} className="text-indigo-400" /> AI Recovery Plan
                                </h3>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${recoveryPlan.urgency === 'critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                                    recoveryPlan.urgency === 'high' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                        'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                    }`}>
                                    {recoveryPlan.urgency?.toUpperCase()} PRIORITY
                                </span>
                            </div>

                            <p className="text-xs text-slate-300 mb-4">{recoveryPlan.summary}</p>

                            {/* Recovery Score Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>Recovery Need</span>
                                    <span>{recoveryPlan.recovery_score || 0}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${recoveryPlan.recovery_score || 0}%` }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${(recoveryPlan.recovery_score || 0) > 70 ? 'bg-gradient-to-r from-rose-500 to-amber-500' :
                                            (recoveryPlan.recovery_score || 0) > 40 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                                                'bg-gradient-to-r from-emerald-500 to-cyan-500'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Activities */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                {(recoveryPlan.activities || []).map((act, i) => {
                                    const iconMap = { physical: Activity, breathing: Wind, mental: Brain, social: Heart, creative: Zap };
                                    const Icon = iconMap[act.category] || Activity;
                                    const colorMap = { high: 'text-emerald-400 bg-emerald-500/10', medium: 'text-amber-400 bg-amber-500/10', low: 'text-blue-400 bg-blue-500/10' };
                                    return (
                                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                                            className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 flex items-start gap-3 hover:border-white/[0.1] transition-all cursor-pointer"
                                        >
                                            <div className={`p-2 rounded-lg ${colorMap[act.impact] || colorMap.medium}`}>
                                                <Icon size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-semibold text-white">{act.name}</h4>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{act.description}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[9px] text-slate-500 flex items-center gap-1"><Clock size={9} /> {act.duration_minutes}min</span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${colorMap[act.impact] || 'text-slate-400 bg-slate-500/10'}`}>{act.impact}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Insight & Advice */}
                            {recoveryPlan.emotional_insight && (
                                <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 mb-3">
                                    <p className="text-[11px] text-indigo-300 leading-relaxed">
                                        <Brain size={12} className="inline mr-1" /> {recoveryPlan.emotional_insight}
                                    </p>
                                </div>
                            )}
                            {recoveryPlan.next_session_advice && (
                                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                    <p className="text-[11px] text-emerald-300 leading-relaxed">
                                        <Zap size={12} className="inline mr-1" /> {recoveryPlan.next_session_advice}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex justify-center gap-4">
                        <button onClick={handleReset}
                            className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-all flex items-center gap-2"
                        >
                            <RotateCcw size={16} /> New Session
                        </button>
                        <button onClick={() => navigate('/recovery')}
                            className="px-6 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 transition-all flex items-center gap-2"
                        >
                            <BarChart3 size={16} /> View Analytics
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── MAIN TIMER VIEW ──
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-black text-white">
            <div className="absolute inset-0 z-0">
                <NeuralBackground />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-80 pointer-events-none" />
            </div>

            <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate('/dashboard')}
                className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
                <div className="p-2 rounded-full border border-white/10 bg-white/5 group-hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </div>
            </motion.button>

            {/* Break Modal */}
            <AnimatePresence>
                {showBreakModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Coffee className="text-amber-400" size={20} /> Take a Break
                                </h3>
                                <button onClick={() => setShowBreakModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <p className="text-sm text-slate-400">Choose a duration for your recovery break. This allows the system to adjust your next focus period.</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {[2, 5, 15].map(min => (
                                        <button key={min} onClick={() => startBreakProcess(min)}
                                            className="py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/50 transition-all text-sm font-medium"
                                        >
                                            {min} min
                                        </button>
                                    ))}
                                </div>
                                <div className="pt-2">
                                    <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Custom Duration (min)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number" value={customBreakMinutes} onChange={(e) => setCustomBreakMinutes(Math.max(1, parseInt(e.target.value) || 0))}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                                        />
                                        <button onClick={handleBreakConfirm}
                                            className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
                                        >
                                            Start
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
                className="relative z-10 w-full max-w-4xl flex flex-col items-center"
            >
                {/* Status Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className={`px-4 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 ${getStatusColor()}`}>
                        {sessionStatus === 'break' ? <Coffee size={16} /> : <Brain size={16} />}
                        <span className="text-sm font-medium tracking-wide uppercase">
                            {sessionStatus === 'idle' ? 'Ready' : sessionStatus === 'break' ? `${breakType} Break` : `${sessionStatus} Mode`}
                        </span>
                    </div>
                    {energyLevel !== null && (
                        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }}
                            className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-slate-400 text-sm flex items-center gap-2"
                        >
                            <Zap size={14} className={energyLevel >= 6 ? 'text-emerald-400' : energyLevel >= 3 ? 'text-amber-400' : 'text-rose-400'} />
                            Energy: {energyLevel}/10
                        </motion.div>
                    )}
                </div>

                {/* Task Name */}
                <div className="mb-6 text-center">
                    {editingTask ? (
                        <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)}
                            onBlur={() => setEditingTask(false)} onKeyDown={e => e.key === 'Enter' && setEditingTask(false)}
                            className="text-lg font-medium bg-transparent text-white text-center border-b border-indigo-500 outline-none px-4 py-1" autoFocus
                        />
                    ) : (
                        <h2 onClick={() => sessionStatus === 'idle' && setEditingTask(true)}
                            className={`text-lg font-medium text-white/80 ${sessionStatus === 'idle' ? 'cursor-pointer hover:text-white' : ''}`}
                        >
                            {taskName}
                            {sessionStatus === 'idle' && <span className="text-[10px] text-slate-600 block mt-1">Click to edit</span>}
                        </h2>
                    )}
                </div>

                {/* Timer Circle */}
                <div className="relative mb-12 group">
                    <div className="absolute -inset-10 border border-white/5 rounded-full animate-spin-slow opacity-30" />
                    <div className="absolute -inset-20 border border-white/5 rounded-full animate-reverse-spin opacity-20" />

                    <svg className="w-80 h-80 -rotate-90">
                        <circle cx="160" cy="160" r="148" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
                        <motion.circle cx="160" cy="160" r="148" stroke={getStrokeColor()} strokeWidth="8" fill="none"
                            strokeLinecap="round" strokeDasharray="930"
                            strokeDashoffset={(930 * progress) / 100}
                            animate={{ strokeDashoffset: (930 * progress) / 100 }}
                            transition={{ duration: 1, ease: 'linear' }}
                            style={{ filter: `drop-shadow(0 0 10px ${getStrokeColor()}50)` }}
                        />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {sessionStatus === 'break' ? (
                            <div className="text-center">
                                <span className="text-6xl font-mono font-bold text-emerald-400">{formatTime(breakTimeLeft)}</span>
                                <span className="block text-xs text-slate-500 mt-2">Break Remaining</span>
                                <span className="block text-xs text-slate-600 mt-1">Total Session: {formatTime(elapsed)}</span>
                            </div>
                        ) : editMode ? (
                            <form onSubmit={handleTimeSubmit} className="flex flex-col items-center">
                                <input type="number" value={inputMinutes} onChange={e => setInputMinutes(e.target.value)}
                                    className="text-5xl font-mono font-bold bg-transparent text-white text-center w-36 focus:outline-none border-b-2 border-indigo-500 mb-2"
                                    autoFocus onBlur={handleTimeSubmit}
                                />
                                <span className="text-sm text-slate-400">minutes</span>
                            </form>
                        ) : (
                            <div onClick={handleTimeEdit} className={`text-center ${sessionStatus === 'idle' ? 'cursor-pointer' : ''}`}>
                                <span className="text-7xl font-mono font-bold tracking-tighter bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent block">
                                    {formatTime(sessionStatus === 'idle' ? plannedDuration : Math.max(0, plannedDuration - elapsed))}
                                </span>
                                {sessionStatus === 'idle' && <span className="text-xs text-slate-500 mt-2 block">Click to Edit</span>}
                            </div>
                        )}

                        {/* Controls */}
                        <div className="mt-4 flex items-center gap-4">
                            {sessionStatus === 'idle' && (
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={handleStart} disabled={loading}
                                    className="w-14 h-14 rounded-full bg-indigo-500/30 hover:bg-indigo-500/50 flex items-center justify-center backdrop-blur-md transition-all border border-indigo-500/30"
                                >
                                    {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <Play size={24} fill="white" className="ml-1" />}
                                </motion.button>
                            )}
                            {sessionStatus === 'active' && (
                                <>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={handlePause}
                                        className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-md transition-all"
                                    ><Pause size={24} fill="white" /></motion.button>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={handleEnd}
                                        className="w-10 h-10 rounded-full border border-rose-500/30 hover:bg-rose-500/20 flex items-center justify-center text-rose-400 transition-all"
                                    ><Square size={18} /></motion.button>
                                </>
                            )}
                            {sessionStatus === 'paused' && (
                                <>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={handleResume}
                                        className="w-14 h-14 rounded-full bg-indigo-500/30 hover:bg-indigo-500/50 flex items-center justify-center backdrop-blur-md transition-all border border-indigo-500/30"
                                    ><Play size={24} fill="white" className="ml-1" /></motion.button>
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={handleEnd}
                                        className="w-10 h-10 rounded-full border border-rose-500/30 hover:bg-rose-500/20 flex items-center justify-center text-rose-400 transition-all"
                                    ><Square size={18} /></motion.button>
                                </>
                            )}
                            {sessionStatus === 'break' && (
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={handleEndBreak}
                                    className="w-14 h-14 rounded-full bg-emerald-500/30 hover:bg-emerald-500/50 flex items-center justify-center backdrop-blur-md transition-all border border-emerald-500/30"
                                ><Play size={24} fill="white" className="ml-1" /></motion.button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Session Activity Log */}
                {pauseLog.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="w-full max-w-sm mb-6 bg-slate-800/40 border border-white/10 rounded-lg p-3 overflow-hidden backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-2 mb-2 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                            <Activity size={12} /> Session Activity
                        </div>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-2">
                            {pauseLog.map((log, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] text-slate-300 border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                                    <span className="flex items-center gap-2">
                                        <span className="opacity-50 font-mono text-[10px]">{log.time}</span>
                                        <span>{log.message}</span>
                                    </span>
                                    <span className="text-emerald-500/80 font-mono text-[10px]">{log.elapsed}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Live Stats Bar */}
                {sessionStatus !== 'idle' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-4 gap-4 w-full max-w-2xl mb-8"
                    >
                        {[
                            { label: 'Focus', value: formatTime(focusSeconds), color: 'text-indigo-400' },
                            { label: 'Breaks', value: breaksTaken, color: 'text-emerald-400' },
                            { label: 'Pauses', value: pauseCount, color: 'text-amber-400' },
                            { label: 'Focus %', value: `${focusRatio}%`, color: 'text-cyan-400' },
                        ].map((s, i) => (
                            <div key={i} className="text-center">
                                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                                <div className="text-[9px] text-slate-600 uppercase tracking-widest">{s.label}</div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Bottom Controls Grid */}
                {(sessionStatus === 'active' || sessionStatus === 'paused') && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl px-4"
                    >
                        {/* Focus Music Toggle */}
                        <button onClick={toggleFocusMusic}
                            className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-3 group ${focusMusic
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            <div className={`p-2 rounded-full ${focusMusic ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                                {focusMusic ? <Activity size={20} /> : <Zap size={20} />}
                            </div>
                            <div className="text-center">
                                <span className={`block text-sm font-semibold ${focusMusic ? 'text-emerald-300' : 'text-slate-300'}`}>Focus Music</span>
                                <span className="block text-[10px] opacity-60 mt-0.5">{focusMusic ? 'Binaural Beats' : 'Off'}</span>
                            </div>
                        </button>

                        {/* Shield Mode Toggle */}
                        <button onClick={toggleShieldMode}
                            className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-3 group ${shieldMode
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            <div className={`p-2 rounded-full ${shieldMode ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                                <Shield size={20} />
                            </div>
                            <div className="text-center">
                                <span className={`block text-sm font-semibold ${shieldMode ? 'text-indigo-300' : 'text-slate-300'}`}>Shield Mode</span>
                                <span className="block text-[10px] opacity-60 mt-0.5">{shieldMode ? 'Notifications Off' : 'Standard'}</span>
                            </div>
                        </button>

                        {/* Recovery Button */}
                        <button onClick={triggerBreakModal}
                            className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 hover:border-amber-500/30 text-amber-400 transition-all flex flex-col items-center justify-center gap-3 group"
                        >
                            <div className="p-2 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                                <Coffee size={20} />
                            </div>
                            <div className="text-center">
                                <span className="block text-sm font-semibold text-amber-300">Recovery</span>
                                <span className="block text-[10px] opacity-60 mt-0.5">Start 5min Break</span>
                            </div>
                        </button>
                    </motion.div>
                )}

                {/* Emotional Context (shown during session) */}
                {emotionalState && sessionStatus !== 'idle' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                        className="mt-6 w-full max-w-2xl"
                    >
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Heart size={14} className="text-rose-400" />
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Emotional Context</span>
                            </div>
                            <div className="flex items-center gap-4 text-[11px]">
                                {['depression', 'anxiety', 'stress'].map(k => (
                                    <span key={k} className={`px-2 py-1 rounded-full border ${emotionalState?.[k] === 'high' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                                        emotionalState?.[k] === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                            'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                        }`}>{k}: {emotionalState?.[k] || 'low'}</span>
                                ))}
                            </div>
                            {recommendation && <p className="text-[10px] text-slate-500 mt-2">{recommendation}</p>}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default DeepWorkMode;
