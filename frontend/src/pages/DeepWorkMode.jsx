import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Shield, ShieldOff, Brain, Music, Coffee, ArrowLeft } from 'lucide-react';
import NeuralBackground from '../components/NeuralBackground';

const DeepWorkMode = () => {
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(5400); // 90 minutes
    const [isActive, setIsActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isShieldActive, setIsShieldActive] = useState(true);
    const [sessionStatus, setSessionStatus] = useState('Focus'); // Focus, break

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(interval);
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const progress = ((5400 - timeLeft) / 5400) * 100;

    const [editMode, setEditMode] = useState(false);
    const [inputMinutes, setInputMinutes] = useState(90);

    const handleTimeEdit = () => {
        if (!isActive) {
            setEditMode(true);
            setInputMinutes(Math.floor(timeLeft / 60));
        }
    };

    const handleTimeSubmit = (e) => {
        e.preventDefault();
        setEditMode(false);
        setTimeLeft(inputMinutes * 60);
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-black text-white">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0">
                <NeuralBackground />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-80 pointer-events-none" />
            </div>

            {/* Back Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate('/dashboard')}
                className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
                <div className="p-2 rounded-full border border-white/10 bg-white/5 group-hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </div>
                <span className="text-sm font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">Back to Dashboard</span>
            </motion.button>


            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="relative z-10 w-full max-w-4xl flex flex-col items-center"
            >
                {/* Status Header */}
                <div className="flex items-center gap-4 mb-12">
                   <div className={`px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2 ${sessionStatus === 'Focus' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                       <Brain size={16} />
                       <span className="text-sm font-medium tracking-wide uppercase">{sessionStatus} Mode Active</span>
                   </div>
                   
                   <motion.div 
                       animate={{ opacity: [0.5, 1, 0.5] }}
                       transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                       className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-slate-400 text-sm flex items-center gap-2"
                   >
                       <Shield size={14} className={isShieldActive ? 'text-emerald-400' : 'text-rose-400'} />
                       Distractions Blocked
                   </motion.div>
                </div>

                {/* Main Timer Display */}
                <div className="relative mb-16 group">
                    {/* Outer Rings */}
                    <div className="absolute -inset-10 border border-white/5 rounded-full animate-spin-slow opacity-30" />
                    <div className="absolute -inset-20 border border-white/5 rounded-full animate-reverse-spin opacity-20" />
                    
                    {/* Progress Circle SVG */}
                    <svg className="w-96 h-96 -rotate-90">
                        <circle cx="192" cy="192" r="180" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
                        <motion.circle 
                            cx="192" cy="192" r="180" 
                            stroke="#6366F1" 
                            strokeWidth="8" 
                            fill="none" 
                            strokeLinecap="round"
                            strokeDasharray="1131"
                            strokeDashoffset={1131 - (1131 * progress) / 100}
                            initial={{ strokeDashoffset: 1131 }}
                            animate={{ strokeDashoffset: 1131 - (1131 * progress) / 100 }}
                            transition={{ duration: 1, ease: "linear" }}
                            style={{ filter: "drop-shadow(0 0 10px rgba(99,102,241,0.5))" }}
                        />
                    </svg>

                    {/* Timer Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {editMode ? (
                             <form onSubmit={handleTimeSubmit} className="flex flex-col items-center">
                                <input 
                                    type="number" 
                                    value={inputMinutes}
                                    onChange={(e) => setInputMinutes(e.target.value)}
                                    className="text-6xl font-mono font-bold bg-transparent text-white text-center w-48 focus:outline-none border-b-2 border-indigo-500 mb-2"
                                    autoFocus
                                    onBlur={handleTimeSubmit}
                                />
                                <span className="text-sm text-slate-400">minutes</span>
                             </form>
                        ) : (
                            <div onClick={handleTimeEdit} className="cursor-pointer text-center group-hover:scale-105 transition-transform">
                                <span className="text-8xl font-mono font-bold tracking-tighter bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent block">
                                    {formatTime(timeLeft)}
                                </span>
                                <span className="text-xs text-slate-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Click to Edit</span>
                            </div>
                        )}

                        <div className="mt-4 flex items-center gap-6">
                            <button 
                                onClick={() => setIsActive(!isActive)}
                                className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                            >
                                {isActive ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
                            </button>
                            <button 
                                onClick={() => { setIsActive(false); setTimeLeft(5400); }}
                                className="w-10 h-10 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Session Controls */}
                <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col items-center text-center cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => setIsMuted(!isMuted)}
                    >
                        {isMuted ? <VolumeX size={24} className="text-slate-400 mb-2" /> : <Volume2 size={24} className="text-emerald-400 mb-2" />}
                        <span className="text-sm font-medium text-slate-200">Focus Music</span>
                        <span className="text-xs text-slate-500 mt-1">{isMuted ? "Paused" : "Binaural Beats"}</span>
                    </motion.div>

                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col items-center text-center cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => setIsShieldActive(!isShieldActive)}
                    >
                        {isShieldActive ? <Shield size={24} className="text-indigo-400 mb-2" /> : <ShieldOff size={24} className="text-rose-400 mb-2" />}
                        <span className="text-sm font-medium text-slate-200">Shield Mode</span>
                        <span className="text-xs text-slate-500 mt-1">{isShieldActive ? "Notifications Off" : "Allow Interruptions"}</span>
                    </motion.div>

                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col items-center text-center cursor-pointer hover:bg-white/10 transition-colors"
                    >
                         <Coffee size={24} className="text-amber-400 mb-2" />
                         <span className="text-sm font-medium text-slate-200">Recovery</span>
                         <span className="text-xs text-slate-500 mt-1">Start 5min Break</span>
                    </motion.div>
                </div>

                {/* Active Task */}
                <div className="mt-12 text-center max-w-lg">
                    <p className="text-slate-500 text-sm uppercase tracking-widest mb-2">Current Objective</p>
                    <h2 className="text-xl font-medium text-white/90">
                        "Complete the graph theory implementation components for the backend system."
                    </h2>
                </div>
            </motion.div>
        </div>
    );
};

export default DeepWorkMode;
