import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

const StatCounter = ({ value, label, suffix = "", prefix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = parseFloat(value);
        const duration = 2000;
        const incrementTime = 20;
        const step = end / (duration / incrementTime);

        const maxDigits = value.toString().split('.')[1]?.length || 0;

        const timer = setInterval(() => {
            start += step;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Number(start.toFixed(maxDigits)));
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <div className="flex flex-col">
            <div className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-1">
                {prefix}{count}{suffix}
            </div>
            <div className="text-sm uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
        </div>
    );
};

export const AnalyticsPreview = () => {
    return (
        <section className="relative z-20 py-40 px-6 bg-[#0F172A] border-y border-white/[0.05]">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">

                <div className="flex-1 space-y-10 order-2 lg:order-1">
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6"
                        >
                            Absolute Signal. <br />
                            <span className="text-violet-400">Zero Noise.</span>
                        </motion.h2>
                        <p className="text-lg text-slate-400 font-light leading-relaxed max-w-lg">
                            Visualize your metabolic velocity over time.
                            Real-time cognitive insights to diagnose burnout vectors before they impact performance.
                        </p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 gap-8"
                    >
                        <StatCounter value={84} label="Energy Score" suffix="%" />
                        <StatCounter value={12} label="Burnout Risk" suffix="%" />
                        <StatCounter value={3.5} label="Focus Index" suffix="x" />
                        <StatCounter value={98} label="Tasks Synced" />
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex-1 order-1 lg:order-2 w-full max-w-xl bg-slate-900 rounded-[2rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden"
                >
                    {/* Animated SVG Graph */}
                    <div className="absolute -inset-10 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 blur-2xl pointer-events-none"></div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="text-white font-medium">Cognitive Output</div>
                            <div className="text-emerald-400 text-sm bg-emerald-500/10 px-3 py-1 rounded-full">+24% Flow State</div>
                        </div>

                        <div className="w-full h-48 relative flex items-end">
                            <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                <motion.path
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    whileInView={{ pathLength: 1, opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                    d="M0,50 Q10,20 20,40 T40,20 T60,30 T80,10 T100,20"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="0.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#6366F1" />
                                        <stop offset="100%" stopColor="#A855F7" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Dot Indicators */}
                            <motion.circle
                                initial={{ opacity: 0, scale: 0 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 1.5 }}
                                className="absolute right-[0%] top-[40%] w-3 h-3 bg-white rounded-full shadow-[0_0_10px_#A855F7] -translate-y-1.5"
                            />
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};
