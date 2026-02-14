import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, BrainCircuit, Activity, Zap, ShieldCheck } from 'lucide-react';

const ReasoningPanel = ({ isOpen, setOpen }) => {
  const [reasoningSteps, setReasoningSteps] = useState([
    "Analyzing current cognitive load...",
    "User focus peaked at 10:00 AM.",
    "Scheduling recovery break at 2:00 PM.",
    "Optimizing for 90-min deep work cycle."
  ]);
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
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setVisibleSteps([]);
    }
  }, [isOpen]);

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ 
        width: isOpen ? 320 : 0, 
        opacity: isOpen ? 1 : 0 
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="h-full border-l border-white/5 bg-slate-900/50 backdrop-blur-xl overflow-hidden relative flex-shrink-0"
    >
      <div className="p-6 h-full flex flex-col w-[320px]"> {/* Fixed width inner container */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="flex items-center gap-2 font-semibold text-emerald-400">
            <BrainCircuit className="w-5 h-5" />
            AI Reasoning
          </h3>
          <button 
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dynamic Reasoning List */}
        <div className="space-y-4 flex-1 overflow-y-auto">
          <AnimatePresence>
            {visibleSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/5 rounded-xl p-3 text-sm text-slate-300 relative"
              >
                <div className="absolute top-3 left-0 w-1 h-4 bg-emerald-500 rounded-r-full" />
                <p className="pl-3">{step}</p>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {visibleSteps.length === reasoningSteps.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 pt-6 border-t border-white/5"
            >
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Cognitive Factors</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-lg text-center border border-white/5 hover:border-emerald-500/30 transition-colors">
                  <Activity size={16} className="text-amber-400 mx-auto mb-1" />
                  <span className="block text-xl font-bold text-white">72%</span>
                  <span className="text-[10px] text-slate-400">Fatigue Risk</span>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center border border-white/5 hover:border-emerald-500/30 transition-colors">
                  <Zap size={16} className="text-emerald-400 mx-auto mb-1" />
                  <span className="block text-xl font-bold text-white">High</span>
                  <span className="text-[10px] text-slate-400">Energy Zone</span>
                </div>
              </div>

              <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-3">
                <ShieldCheck className="text-emerald-400 flex-shrink-0" size={18} />
                <div>
                  <h5 className="text-sm font-medium text-emerald-300">Optimization applied</h5>
                  <p className="text-xs text-emerald-500/70 mt-1">
                    Tasks reordered to match circadian rhythm peak at 10am.
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
