import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn, Menu, X } from 'lucide-react';

export const Navbar = () => {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
        setIsScrolled(latest > 50);
    });

    const navLinks = [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'How It Works', href: '#how-it-works' },
    ];

    const scrollToSection = (href) => {
        const id = href.replace('#', '');
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        setMobileOpen(false);
    };

    return (
        <motion.nav
            variants={{
                visible: { y: 0 },
                hidden: { y: "-100%" },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className={`fixed top-0 inset-x-0 w-full z-[100] transition-all duration-300 pointer-events-auto ${isScrolled
                    ? 'bg-[#05070A]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
                    : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">

                {/* Left: Logo + Brand Name */}
                <div
                    onClick={() => navigate('/')}
                    className="cursor-pointer group flex items-center gap-3 shrink-0"
                >
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/20 transition-all duration-300 group-hover:scale-105 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                        <img
                            src="/images/neuromind-logo.png"
                            alt="NeuroMind"
                            className="w-8 h-8 object-contain"
                        />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white hidden sm:block">
                        Neuro<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Mind</span>
                    </span>
                </div>

                {/* Center: Nav Links (Desktop) */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link, i) => (
                        <button
                            key={i}
                            onClick={() => scrollToSection(link.href)}
                            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/[0.04] font-medium"
                        >
                            {link.label}
                        </button>
                    ))}
                </div>

                {/* Right: Login + Dashboard Buttons */}
                <div className="flex items-center gap-3 shrink-0">
                    <motion.button
                        onClick={() => navigate('/login')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="hidden sm:flex px-5 py-2 rounded-full text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200 items-center gap-2 hover:bg-white/[0.04]"
                    >
                        <LogIn size={15} />
                        Login
                    </motion.button>

                    <motion.button
                        onClick={() => navigate('/dashboard')}
                        whileHover={{ scale: 1.05, boxShadow: "0 0 30px -5px rgba(99,102,241,0.6)" }}
                        whileTap={{ scale: 0.95 }}
                        className="relative px-5 py-2.5 rounded-full overflow-hidden border border-indigo-500/30 group text-sm font-semibold text-indigo-300 tracking-wide bg-indigo-500/10 backdrop-blur-md transition-all shadow-lg"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                            Dashboard <ArrowRight size={14} />
                        </span>
                    </motion.button>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:hidden bg-[#05070A]/95 backdrop-blur-2xl border-t border-white/[0.06] px-6 pb-6 pt-2"
                >
                    {navLinks.map((link, i) => (
                        <button
                            key={i}
                            onClick={() => scrollToSection(link.href)}
                            className="block w-full text-left py-3 text-sm text-slate-400 hover:text-white transition-colors border-b border-white/[0.04] font-medium"
                        >
                            {link.label}
                        </button>
                    ))}
                    <button
                        onClick={() => { navigate('/login'); setMobileOpen(false); }}
                        className="block w-full text-left py-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium mt-2"
                    >
                        Login / Sign Up
                    </button>
                </motion.div>
            )}
        </motion.nav>
    );
};
