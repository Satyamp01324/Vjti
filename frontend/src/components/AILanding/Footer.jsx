import React from 'react';
import { motion } from 'framer-motion';
import { Brain, ArrowRight } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="relative bg-[#05070e] text-slate-400 py-20 px-6 border-t border-white/[0.02] overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 inset-x-0 h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">

                {/* Brand */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Brain size={16} className="text-white" />
                        </div>
                        <span className="font-semibold text-lg text-white">NeuroMind</span>
                    </div>
                    <p className="font-light max-w-sm leading-relaxed text-sm">
                        The first cognitive operating system designed for human bandwidth optimization, preventing burnout at a structural level.
                    </p>
                </div>

                {/* Links */}
                <div className="space-y-4">
                    <h4 className="text-white font-medium text-sm tracking-widest uppercase mb-6">Platform</h4>
                    <ul className="space-y-3 font-light text-sm">
                        <li className="hover:text-white transition-colors cursor-pointer">Science & Methodology</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Security Protocol</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Enterprise API</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Pricing Model</li>
                    </ul>
                </div>

                {/* Newsletter */}
                <div className="space-y-4">
                    <h4 className="text-white font-medium text-sm tracking-widest uppercase mb-6">Dispatch</h4>
                    <p className="font-light text-xs mb-4">A bi-weekly analysis of flow-states and neuro-productivity research.</p>
                    <div className="relative">
                        <input
                            type="email"
                            placeholder="name@company.com"
                            className="w-full bg-[#0a0e1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>

            </div>

            <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between text-xs font-light">
                <div>© 2026 NeuroMind. All rights reserved.</div>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                    <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
                </div>
            </div>
        </footer>
    );
};
