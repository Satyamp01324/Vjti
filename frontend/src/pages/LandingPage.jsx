import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { 
  Zap, 
  Brain, 
  Check, 
  ChevronDown, 
  ArrowRight, 
  Activity, 
  Clock, 
  Shield, 
  Users, 
  Play, 
  BarChart, 
  Calendar, 
  TrendingUp, 
  Battery, 
  Globe 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NeuralBrain from '../components/NeuralBrain';
import { GlassCard } from '../components/GlassCard';

// Section 1: Hero
const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center px-6">
        <NeuralBrain />
        
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1, delay: 0.2 }}
           className="relative z-10 max-w-5xl mx-auto space-y-8"
        >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md mb-6 animate-pulse-slow">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-semibold text-emerald-300 tracking-wider uppercase">NeuroPilot v2.0 Live</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
                Stop Scheduling Time.<br />
                <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">Start Scheduling Your Brain.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
                NeuroPilot analyzes your cognitive energy in real-time and schedules tasks when your brain is actually ready to perform them.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login')}
                    className="group relative px-8 py-4 bg-emerald-500 rounded-full text-white font-bold text-lg overflow-hidden shadow-[0_0_40px_-5px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_0_60px_-10px_rgba(16,185,129,0.5)]"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative flex items-center gap-2">
                        Enter NeuroPilot <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </span>
                </motion.button>

                <motion.button 
                    whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.5)' }}
                    whileTap={{ scale: 0.95 }}
                    className="group px-8 py-4 bg-white/5 border border-white/10 rounded-full text-white font-medium text-lg backdrop-blur-md transition-colors flex items-center gap-3 hover:bg-white/10"
                >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <Play size={14} fill="currentColor" className="ml-0.5" /> 
                    </div>
                    Watch Demo
                </motion.button>
            </div>
        </motion.div>

        <motion.div 
            animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 text-slate-500"
        >
            <ChevronDown size={32} />
        </motion.div>
    </section>
  );
};

// Section 2: The Problem
const ProblemSection = () => {
    return (
        <section className="py-32 px-6 bg-slate-950 relative overflow-hidden">
             <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="space-y-6"
                 >
                     <h2 className="text-4xl md:text-5xl font-bold leading-tight text-white">
                         You’re not lazy.<br />
                         <span className="text-rose-400">You’re cognitively overloaded.</span>
                     </h2>
                     <p className="text-lg text-slate-400 leading-relaxed">
                         Traditional calendars treat every hour the same. But your brain doesn't work that way. Pushing through fatigue creates "fake productivity" — movement without progress.
                     </p>
                     
                     <div className="grid grid-cols-2 gap-6 pt-6">
                         <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                             <div className="text-3xl font-bold text-rose-400 mb-1">40%</div>
                             <div className="text-sm text-slate-500 uppercase tracking-widest">Efficiency Loss</div>
                         </div>
                         <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                             <div className="text-3xl font-bold text-amber-400 mb-1">3.5h</div>
                             <div className="text-sm text-slate-500 uppercase tracking-widest">Wasted Daily</div>
                         </div>
                     </div>
                 </motion.div>

                 <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative aspect-square max-w-md mx-auto"
                 >
                      {/* Abstract visualization of overload */}
                      <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full animate-pulse-slow"></div>
                      <div className="relative z-10 grid gap-4">
                          {[1, 2, 3].map((i) => (
                              <motion.div 
                                 key={i}
                                 initial={{ x: 100, opacity: 0 }}
                                 whileInView={{ x: 0, opacity: 1 }}
                                 transition={{ delay: i * 0.2, type: "spring" }}
                                 className="glass-card p-4 border-l-4 border-rose-500 flex items-center justify-between"
                              >
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                                          <Clock size={18} />
                                      </div>
                                      <div>
                                          <div className="h-2 w-24 bg-slate-700 rounded mb-2"></div>
                                          <div className="h-2 w-16 bg-slate-800 rounded"></div>
                                      </div>
                                  </div>
                                  <div className="text-rose-400 font-bold text-sm">OVERDUE</div>
                              </motion.div>
                          ))}
                      </div>
                 </motion.div>
             </div>
        </section>
    );
};

// Section 3: Value Props
const ValueProps = () => {
    const cards = [
        { icon: Brain, title: "AI Cognitive Engine", desc: "NeuroPilot builds a digital twin of your brain's energy patterns to predict peak performance windows." },
        { icon: Calendar, title: "Smart Scheduling", desc: "Tasks are automatically slotted into your calendar based on difficulty and your current bandwidth." },
        { icon: Battery, title: "Recovery Cycles", desc: "Proactive break suggestions prevent burnout before it starts, keeping you in flow longer." },
    ];

    return (
        <section className="py-32 px-6 bg-slate-900 relative">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {cards.map((card, index) => (
                        <motion.div
                            key={index}
                            initial={{ y: 50, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            whileHover={{ y: -10, transition: { duration: 0.3 } }}
                            className="glass-card p-8 group cursor-default"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                                <card.icon size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">{card.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{card.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Section 4: Showcase Area
const Showcase = () => {
    return (
        <section className="py-24 px-6 bg-black relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black pointer-events-none"></div>
            
            <div className="max-w-7xl mx-auto relative z-10 text-center mb-16">
                 <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Enter Flow State. On Demand.</h2>
                 <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                     Experience a workspace that adapts to you, not the other way around.
                 </p>
            </div>

            <motion.div 
                initial={{ y: 100, opacity: 0, rotateX: 20 }}
                whileInView={{ y: 0, opacity: 1, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="max-w-6xl mx-auto relative perspective-1000"
            >
                {/* Mock Dashboard Overlay */}
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden group">
                     {/* Glow effect behind */}
                     <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-700"></div>
                     
                     <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center bg-grid-white/[0.05]">
                         <div className="text-center space-y-4">
                             <div className="w-24 h-24 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mx-auto"></div>
                             <div className="text-emerald-400 font-mono text-sm animate-pulse">SYSTEM SYNCHRONIZED</div>
                         </div>
                         
                         {/* Floating UI Elements Mockup */}
                         <motion.div 
                            animate={{ y: [-10, 10, -10] }} 
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-10 right-10 glass-card p-4 w-64 border-l-4 border-emerald-500"
                         >
                            <div className="text-xs text-slate-400 mb-1">Recovery Suggestion</div>
                            <div className="font-bold text-white">Take a 5 min walk</div>
                         </motion.div>

                         <motion.div 
                            animate={{ y: [10, -10, 10] }} 
                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-10 left-10 glass-card p-4 w-72"
                         >
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-xs text-slate-400 mb-1">Current Focus</div>
                                    <div className="font-bold text-white">Deep Work Session</div>
                                </div>
                                <div className="text-2xl font-mono text-emerald-400">45:00</div>
                            </div>
                         </motion.div>
                     </div>
                </div>
            </motion.div>
        </section>
    );
};

// Section 5: Features Grid
const FeaturesGrid = () => {
    const features = [
        "Real-Time Bandwidth", "Deep Work Mode", "Burnout Prevention", 
        "AI Reasoning", "Energy Forecasting", "Adaptive Scheduling"
    ];

    return (
        <section className="py-32 px-6 bg-slate-950">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div 
                            key={i}
                            initial={{ scale: 0.9, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.05, borderColor: 'rgba(16,185,129,0.5)' }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-8 flex items-center justify-center text-center h-48 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group"
                        >
                            <h3 className="text-xl font-bold text-slate-300 group-hover:text-white transition-colors">{feature}</h3>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CTA = () => {
    const navigate = useNavigate();
    return (
        <section className="py-32 px-6 bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center text-center">
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent pointer-events-none"></div>
            
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               className="relative z-10 max-w-4xl mx-auto space-y-10"
            >
                <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter">
                    Your Brain Is Not a To-Do List.<br/>
                    <span className="text-slate-500">It's a Biological System.</span>
                </h2>
                
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/login')}
                    className="px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-xl shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:shadow-[0_0_80px_rgba(255,255,255,0.5)] transition-all"
                >
                    Start Scheduling Smarter
                </motion.button>
            </motion.div>
        </section>
    )
}

const LandingPage = () => {
  return (
    <div className="font-sans text-slate-200 bg-slate-900 selection:bg-emerald-500/30 selection:text-emerald-200">
       <Hero />
       <ProblemSection />
       <ValueProps />
       <Showcase />
       <FeaturesGrid />
       <CTA />
       
       <footer className="py-12 border-t border-white/5 bg-black text-center text-slate-500 text-sm">
           <p>© 2024 NeuroPilot AI Inc. All systems operational.</p>
       </footer>
    </div>
  );
};

export default LandingPage;
