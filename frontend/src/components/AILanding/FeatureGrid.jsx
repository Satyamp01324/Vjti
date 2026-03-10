import React from 'react';
import { motion } from 'framer-motion';
import { Activity, BatteryCharging, BrainCircuit, CalendarClock, ShieldCheck, Zap } from 'lucide-react';

const features = [
    {
        icon: BrainCircuit,
        title: "Cognitive Bandwidth Mapping",
        desc: "Real-time analysis of your neural capacity to determine exact flow-state windows."
    },
    {
        icon: CalendarClock,
        title: "Predictive Scheduling",
        desc: "Tasks automatically shift based on cognitive fatigue, not rigid timelines."
    },
    {
        icon: BatteryCharging,
        title: "Burnout Prevention",
        desc: "Micro-recovery protocols injected precisely when mental exhaustion is detected."
    },
    {
        icon: Zap,
        title: "Energy Forecasting",
        desc: "Actionable foresight into your tomorrow, based on today's cognitive burn rate."
    },
    {
        icon: Activity,
        title: "Diagnostic Analytics",
        desc: "Deep visual insights into focus depth, distraction velocity, and stress vectors."
    },
    {
        icon: ShieldCheck,
        title: "Absolute Privacy",
        desc: "Your biological data never leaves the encrypted partition of your device."
    }
];

export const FeatureGrid = () => {
    return (
        <section className="relative z-20 py-40 px-6 bg-[#0a0e1a]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24 max-w-3xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6"
                    >
                        Intelligence, <span className="text-indigo-400">weaponized for focus.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-400 font-light"
                    >
                        We stripped away the archaic rules of productivity software and built a cognitive engine from the ground up.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-10%" }}
                            transition={{ delay: idx * 0.1, duration: 0.6, ease: "easeOut" }}
                            className="group relative p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-500 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-[#0F172A] border border-white/10 flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 group-hover:text-indigo-300 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                                    <feature.icon size={26} strokeWidth={1.5} />
                                </div>

                                <h3 className="text-xl font-medium text-white mb-3 tracking-wide">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed font-light text-base">{feature.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
