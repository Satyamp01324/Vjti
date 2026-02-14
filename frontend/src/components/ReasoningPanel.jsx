import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, BrainCircuit, Activity, Zap, ShieldCheck } from 'lucide-react';

const ReasoningPanel = ({ isOpen, setOpen }) => {
  const reasoningSteps = [
    "Analyzing current cognitive load...",
    "User focus peaked at 10:00 AM.",
    "Scheduling recovery break at 2:00 PM.",
    "Optimizing for 90-min deep work cycle."
  ];
  const [visibleSteps, setVisibleSteps] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const timer = setInterval(() => {
        setVisibleSteps((prev) => {
          if (prev.length < reasoningSteps.length) {
            return [...prev, reasoningSteps[prev.length]];
          }
          clearInterval(timer);
          return prev;
        });
      }, 800);
      return () => clearInterval(timer);
    } else {
      setVisibleSteps([]);
    }
  }, [isOpen]);

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{
        width: isOpen ? 300 : 0,
        opacity: isOpen ? 1 : 0
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full overflow-hidden relative flex-shrink-0"
    >
      <div className="p-5 h-full flex flex-col w-[300px]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <BrainCircuit className="w-4 h-4" />
            AI Reasoning
          </h3>
          <button
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-white/5 rounded text-slate-500 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Reasoning Steps */}
        <div className="space-y-3 flex-1 overflow-y-auto">
          <AnimatePresence>
            {visibleSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-2.5 text-xs text-slate-300 relative"
              >
                <div className="absolute top-2.5 left-0 w-[2px] h-3 bg-emerald-500 rounded-r-full" />
                <p className="pl-2.5">{step}</p>
              </motion.div>
            ))}
          </AnimatePresence>

          {visibleSteps.length === reasoningSteps.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 pt-4 border-t border-white/[0.04]"
            >
              <h4 className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-3">Factors</h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.03] p-2.5 rounded-lg text-center border border-white/[0.04]">
                  <Activity size={14} className="text-amber-400 mx-auto mb-1" />
                  <span className="block text-lg font-bold text-white">72%</span>
                  <span className="text-[9px] text-slate-500">Fatigue</span>
                </div>
                <div className="bg-white/[0.03] p-2.5 rounded-lg text-center border border-white/[0.04]">
                  <Zap size={14} className="text-emerald-400 mx-auto mb-1" />
                  <span className="block text-lg font-bold text-white">High</span>
                  <span className="text-[9px] text-slate-500">Energy</span>
                </div>
              </div>

              <div className="mt-3 bg-emerald-500/[0.06] border border-emerald-500/15 p-2.5 rounded-lg flex items-start gap-2">
                <ShieldCheck className="text-emerald-400 flex-shrink-0 mt-0.5" size={14} />
                <div>
                  <h5 className="text-xs font-medium text-emerald-300">Optimized</h5>
                  <p className="text-[10px] text-emerald-500/80 mt-0.5">
                    Tasks reordered for peak circadian rhythm.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ReasoningPanel;
