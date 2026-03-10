import React, { useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { Navbar } from '../components/AILanding/Navbar';
import { BrainScrollEngine } from '../components/AILanding/BrainScrollEngine';
import { Footer } from '../components/AILanding/Footer';
import {
    Brain, Activity, BatteryCharging, Zap, ShieldCheck,
    Focus, Clock, ArrowRight, Check, MessageSquare, Sparkles,
    BarChart3, Shield, Smartphone
} from 'lucide-react';

// ─── Pricing / Business Plans ──────────────────────────────────────────────────
const PricingPlans = () => {
    const navigate = useNavigate();

    const plans = [
        {
            name: "NeuroMind Core",
            tagline: "The Complete Mental Wellness Engine",
            price: "Free",
            priceNote: "during beta",
            highlight: false,
            icon: Brain,
            gradient: "from-indigo-500/10 to-violet-500/10",
            hoverGradient: "group-hover:from-indigo-500/20 group-hover:to-violet-500/20",
            borderColor: "border-indigo-500/20 hover:border-indigo-500/50",
            glowColor: "rgba(99,102,241,0.5)",
            features: [
                "Real-time stress & anxiety monitoring",
                "AI-powered cognitive load analysis",
                "Smart task scheduling engine",
                "Deep Work Mode with Pomodoro",
                "Cognitive insights dashboard",
            ],
        },
        {
            name: "NeuroMind WhatsApp AI",
            tagline: "Your Pocket Mental Health Companion",
            price: "₹99",
            priceNote: "/month",
            highlight: true,
            icon: MessageSquare,
            gradient: "from-emerald-500/10 to-teal-500/10",
            hoverGradient: "group-hover:from-emerald-500/20 group-hover:to-teal-500/20",
            borderColor: "border-emerald-500/20 hover:border-emerald-500/50",
            glowColor: "rgba(16,185,129,0.5)",
            features: [
                "24/7 WhatsApp AI therapist",
                "Context-aware conversation routing",
                "Voice note mood analysis",
                "Daily mental health check-ins",
                "Emergency SOS escalation",
            ],
        },
    ];

    return (
        <section id="pricing" className="relative z-20 py-24 px-6 bg-[#05070A]">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-indigo-600/5 blur-[150px]"></div>
            </div>

            <div className="max-w-6xl mx-auto relative">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 max-w-2xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 backdrop-blur-md mb-6">
                        <Sparkles size={12} className="text-violet-400" />
                        <span className="text-[10px] font-semibold tracking-widest text-violet-300 uppercase">Choose Your Path</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-white mb-6">
                        Two powerful ways to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">protect your mind.</span>
                    </h2>
                    <p className="text-slate-400 font-light leading-relaxed">
                        Whether you prefer a full dashboard experience or a chat-first companion right in your pocket — NeuroMind has you covered.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {plans.map((plan, i) => {
                        // ReactBits style hover tracking
                        const mouseX = useMotionValue(0);
                        const mouseY = useMotionValue(0);

                        function handleMouseMove({ currentTarget, clientX, clientY }) {
                            const { left, top } = currentTarget.getBoundingClientRect();
                            mouseX.set(clientX - left);
                            mouseY.set(clientY - top);
                        }

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, ease: "easeOut" }}
                                onMouseMove={handleMouseMove}
                                className={`group relative p-8 md:p-10 rounded-[2rem] bg-white/[0.02] border ${plan.borderColor} transition-all duration-500 overflow-hidden backdrop-blur-xl shadow-2xl`}
                            >
                                {/* Spotlight hover effect */}
                                <motion.div
                                    className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-300 group-hover:opacity-100"
                                    style={{
                                        background: useMotionTemplate`
                                            radial-gradient(
                                                600px circle at ${mouseX}px ${mouseY}px,
                                                ${plan.glowColor},
                                                transparent 40%
                                            )
                                        `
                                    }}
                                />

                                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} ${plan.hoverGradient} transition-all duration-500 opacity-50`}></div>

                                {plan.highlight && (
                                    <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">
                                        Popular
                                    </div>
                                )}

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={`w-14 h-14 rounded-2xl bg-[#0a0e1a] border border-white/10 flex items-center justify-center ${plan.highlight ? 'text-emerald-400' : 'text-indigo-400'} group-hover:scale-110 transition-transform duration-300`}>
                                            <plan.icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                            <p className="text-sm text-slate-400 font-light">{plan.tagline}</p>
                                        </div>
                                    </div>

                                    <div className="mb-8 pb-8 border-b border-white/[0.06]">
                                        <span className="text-5xl font-light text-white">{plan.price}</span>
                                        <span className="text-sm text-slate-500 ml-2">{plan.priceNote}</span>
                                    </div>

                                    <ul className="space-y-4 mb-10">
                                        {plan.features.map((feature, j) => (
                                            <li key={j} className="flex items-start gap-3">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${plan.highlight ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                                    <Check size={12} />
                                                </div>
                                                <span className="text-sm text-slate-300 font-light">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className={`w-full py-4 rounded-xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group/btn ${plan.highlight
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                                            : 'bg-white text-[#0a0e1a] hover:bg-slate-100'
                                            }`}
                                    >
                                        <span className="relative z-10 flex items-center gap-2">Get Started <ArrowRight size={16} /></span>
                                        {/* Button shine effect */}
                                        <div className="absolute inset-0 -translate-x-full bg-white/20 skew-x-[30deg] group-hover/btn:animate-[shimmer_1s_forwards]"></div>
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

// ─── Features Section ──────────────────────────────────────────────────────────
const FeatureGrid = () => {
    const features = [
        { icon: Activity, title: "Mental Health Analysis", desc: "Real-time tracking of stress vectors and anxiety build-up." },
        { icon: BatteryCharging, title: "Energy Flow System", desc: "Maps your metabolic velocity to find absolute peak flow windows." },
        { icon: Brain, title: "Cognitive Scheduler", desc: "Fluidly routes tasks around energy deficits, preventing burnout." },
        { icon: Zap, title: "WhatsApp AI Assistant", desc: "Offload ideas directly into the engine, context-aware routing." },
        { icon: Focus, title: "Deep Work Mode", desc: "Shuts down environmental noise and implements Pomodoro routing." },
        { icon: Clock, title: "Recovery Cycles", desc: "Forces neurological cooldowns precisely when your capacity clips." },
    ];

    return (
        <section id="features" className="relative z-20 py-24 px-6 bg-[#05070A]">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 max-w-2xl mx-auto"
                >
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-white mb-6">Built for absolute <span className="text-indigo-400">precision.</span></h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => {
                        // Spotlight hover tracking
                        const mouseX = useMotionValue(0);
                        const mouseY = useMotionValue(0);

                        function handleMouseMove({ currentTarget, clientX, clientY }) {
                            const { left, top } = currentTarget.getBoundingClientRect();
                            mouseX.set(clientX - left);
                            mouseY.set(clientY - top);
                        }

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-10%" }}
                                transition={{ delay: i * 0.1, ease: "easeOut" }}
                                onMouseMove={handleMouseMove}
                                className="group relative p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:border-indigo-500/40 transition-all duration-300 overflow-hidden backdrop-blur-xl shadow-xl hover:-translate-y-2"
                            >
                                <motion.div
                                    className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-300 group-hover:opacity-100"
                                    style={{
                                        background: useMotionTemplate`
                                            radial-gradient(
                                                350px circle at ${mouseX}px ${mouseY}px,
                                                rgba(99,102,241,0.15),
                                                transparent 60%
                                            )
                                        `
                                    }}
                                />

                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-[#0a0e1a] border border-white/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-[0_0_15px_rgba(99,102,241,0)] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                        <feature.icon size={22} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{feature.title}</h3>
                                    <p className="text-slate-400 font-light leading-relaxed">{feature.desc}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

// ─── Dashboard Preview / Deep Work ─────────────────────────────────────────────
const DashboardPreview = () => {
    return (
        <section id="how-it-works" className="relative z-20 py-24 px-6 bg-[#030407] border-y border-white/[0.05]">
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10">

                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-2 border border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                        <Focus size={24} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-white">
                        Enter Deep Work Mode.
                    </h2>
                    <p className="text-lg text-slate-400 font-light leading-relaxed max-w-md">
                        The interface strips away noise. A minimal Pomodoro chronometer synchronizes with your streaks. We track your cognitive burn while you execute.
                    </p>

                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div className="space-y-2">
                            <div className="text-sm font-semibold tracking-widest uppercase text-indigo-400">Focus Streak</div>
                            <div className="text-4xl text-white font-light">14<span className="text-sm text-slate-500"> days</span></div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-semibold tracking-widest uppercase text-violet-400">Time Saved</div>
                            <div className="text-4xl text-white font-light">28<span className="text-sm text-slate-500"> hrs</span></div>
                        </div>
                    </div>
                </motion.div>

                {/* Glassmorphism Mock Dashboard */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative w-full aspect-square md:aspect-[4/3] rounded-[2rem] bg-slate-900 border border-white/10 shadow-[0_0_80px_rgba(30,27,75,0.6)] overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] to-[#1E1B4B] group-hover:scale-105 transition-transform duration-1000"></div>

                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-10 text-center">
                        <div className="w-56 h-56 rounded-full border border-indigo-500/20 flex flex-col items-center justify-center relative mb-8 shadow-[inset_0_0_40px_rgba(99,102,241,0.1)]">
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]">
                                <circle cx="112" cy="112" r="110" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
                                <motion.circle
                                    initial={{ strokeDashoffset: 691 }}
                                    whileInView={{ strokeDashoffset: 172 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
                                    cx="112" cy="112" r="110"
                                    stroke="#8B5CF6"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray="691"
                                />
                            </svg>
                            <span className="text-6xl font-light text-white font-mono tracking-wider drop-shadow-lg">25:00</span>
                            <span className="text-xs text-indigo-300 uppercase tracking-widest mt-3 font-semibold">Deep Work</span>
                        </div>

                        <div className="flex gap-4 w-full max-w-xs items-center">
                            <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: "30%" }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                    className="h-full bg-emerald-500"
                                ></motion.div>
                            </div>
                            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Anxiety</span>
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};

// ─── Final CTA ─────────────────────────────────────────────────────────────────
const FinalCTA = () => {
    const navigate = useNavigate();
    return (
        <section className="relative py-32 px-6 bg-[#05070A] flex flex-col items-center justify-center text-center overflow-hidden z-20">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#05070A] to-[#05070A] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative z-10 max-w-4xl mx-auto space-y-10"
            >
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                    <Brain size={28} />
                </div>

                <h2 className="text-5xl md:text-7xl font-semibold tracking-tighter text-white">
                    Enter Your Cognitive Dashboard.
                </h2>

                <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(99,102,241,0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard')}
                    className="relative px-10 py-5 bg-white rounded-full text-[#0a0e1a] font-bold text-lg overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all flex items-center gap-3 mx-auto mt-4 group"
                >
                    <span className="relative z-10 flex items-center gap-2">Initialize Environment <ArrowRight size={20} /></span>
                    <div className="absolute inset-0 -translate-x-full bg-indigo-100 skew-x-[30deg] group-hover:animate-[shimmer_1s_forwards]"></div>
                </motion.button>
            </motion.div>
        </section>
    );
};

// ─── Main Landing Page ─────────────────────────────────────────────────────────
const LandingPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="font-sans text-slate-200 bg-[#05070A] selection:bg-indigo-500/30 selection:text-white min-h-screen relative">
            <Navbar />

            {/* 1. Full Screen Brain Animation & Hero Overlay */}
            <BrainScrollEngine />

            {/* 2. Business / Pricing Plans */}
            <PricingPlans />

            {/* 3. Feature Grid */}
            <FeatureGrid />

            {/* 4. Deep Work Preview */}
            <DashboardPreview />

            {/* 5. Final CTA */}
            <FinalCTA />

            {/* 6. Footer */}
            <Footer />
        </div>
    );
};

export default LandingPage;
