import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck, Lock, Unlock, Zap } from 'lucide-react';

const DragToOpenGate = ({ onOpen, userName = 'Code XR' }) => {
  const [unlocked, setUnlocked] = useState(false);
  const trackRef = useRef(null);

  // Framer Motion motion value for smooth drag tracking
  const x = useMotionValue(0);

  // Transform x position to track opacity & progress width
  const trackWidth = 260; // Max drag distance
  const progressWidth = useTransform(x, [0, trackWidth], ['0%', '100%']);
  const textOpacity = useTransform(x, [0, trackWidth / 2], [1, 0]);

  const handleDragEnd = (event, info) => {
    if (info.offset.x >= trackWidth * 0.75) {
      triggerUnlock();
    }
  };

  const triggerUnlock = () => {
    setUnlocked(true);
    setTimeout(() => {
      onOpen();
    }, 450);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080A0F]/95 backdrop-blur-2xl"
    >
      {/* Background Soft Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#FF553E]/15 rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-500/15 rounded-full blur-[130px]" />
      </div>

      <motion.div
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: -30, opacity: 0, scale: 0.9 }}
        className="w-full max-w-md bg-white/[0.04] border border-white/[0.09] rounded-[2.5rem] p-8 text-center shadow-2xl relative z-10 backdrop-blur-xl"
      >
        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-6">
          <ShieldCheck size={14} />
          <span>Authentication Verified</span>
        </div>

        {/* Vertix Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#FF553E] to-[#FF7A59] mx-auto flex items-center justify-center text-white font-extrabold text-2xl shadow-[0_10px_30px_rgba(255,85,62,0.4)] mb-4">
          V
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">
          Welcome, {userName || 'Code XR'}
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
          Your personalized dashboard is ready. Drag the slider to enter.
        </p>

        {/* ─── INTERACTIVE DRAG SLIDER ─── */}
        <div className="mt-8 pt-2">
          <div
            ref={trackRef}
            className="relative w-full h-16 rounded-full bg-black/50 border border-white/10 p-1.5 flex items-center overflow-hidden shadow-inner cursor-pointer"
          >
            {/* Dynamic Progress Fill Following Drag */}
            <motion.div
              style={{ width: progressWidth }}
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#FF553E]/20 to-[#FF553E]/50 rounded-full"
            />

            {/* Glowing Text in Center */}
            <motion.p
              style={{ opacity: textOpacity }}
              className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-wider text-white/50 select-none pointer-events-none pl-6"
            >
              Drag to Open Dashboard ➔
            </motion.p>

            {/* Draggable Handle */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: trackWidth }}
              dragElastic={0.08}
              style={{ x }}
              onDragEnd={handleDragEnd}
              whileTap={{ scale: 1.05 }}
              className="relative z-10 w-13 h-13 rounded-full bg-gradient-to-r from-[#FF553E] to-[#FF704E] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(255,85,62,0.6)] cursor-grab active:cursor-grabbing ring-2 ring-white/20"
            >
              {unlocked ? (
                <Unlock size={20} className="text-white animate-pulse" />
              ) : (
                <ArrowRight size={20} className="text-white" />
              )}
            </motion.div>
          </div>
        </div>

        {/* Quick Instant Unlock Option */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={triggerUnlock}
            className="text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
          >
            <Zap size={12} className="text-amber-400" />
            <span>Instant Open (Click here to skip drag)</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DragToOpenGate;
