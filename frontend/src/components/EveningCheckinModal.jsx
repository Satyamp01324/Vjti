import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, X, Sparkles, Check, BatteryLow, BatteryCharging, BatteryMedium, Battery, Zap } from 'lucide-react';
import { submitEveningCheckin, skipEveningCheckin } from '../api';

/**
 * EveningCheckinModal Component (FEAT-E3)
 *
 * One-tap 10-second non-judgmental evening reflection:
 * - 5 calm energy levels (0=Empty to 4=Energized)
 * - Optional unpressured 1-line note ("Anything that drained you today?")
 * - Explicit "Skip" button with zero guilt and zero penalty
 * - Automatically feeds tomorrow's carryover recovery and waters the garden
 */
export default function EveningCheckinModal({
  isOpen,
  onClose,
  userId,
  onCheckinSuccess,
}) {
  const [selectedLevel, setSelectedLevel] = useState(2);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const levels = [
    { level: 0, label: 'Empty', icon: '🪫', desc: 'Completely spent — rest is priority.', color: 'border-rose-500/40 text-rose-300' },
    { level: 1, label: 'Low', icon: '🔋', desc: 'Running on fumes. Showing up counted.', color: 'border-amber-500/40 text-amber-300' },
    { level: 2, label: 'Steady', icon: '⚡', desc: 'Made it through at a sustainable pace.', color: 'border-sky-500/40 text-sky-300' },
    { level: 3, label: 'Good', icon: '✨', desc: 'Solid energy and good rhythm today.', color: 'border-emerald-500/40 text-emerald-300' },
    { level: 4, label: 'Energized', icon: '🌟', desc: 'High capacity — fully in your element.', color: 'border-violet-500/40 text-violet-300' },
  ];

  const handleSubmit = async (level = selectedLevel) => {
    setIsSubmitting(true);
    try {
      const res = await submitEveningCheckin(userId, level, note);
      setIsDone(true);
      if (onCheckinSuccess) onCheckinSuccess(res);
      setTimeout(() => {
        setIsDone(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to submit evening check-in:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await skipEveningCheckin(userId);
    } catch (err) {
      console.warn('Skip error:', err);
    } finally {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Evening Check-in</h3>
                <span className="text-[11px] text-slate-400">Takes 10 seconds — zero pressure</span>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              Skip
            </button>
          </div>

          {!isDone ? (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                How does your cognitive battery feel right now? Tap one to log:
              </p>

              {/* 5 Battery Level Cards */}
              <div className="grid grid-cols-5 gap-2">
                {levels.map((item) => {
                  const isSelected = selectedLevel === item.level;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setSelectedLevel(item.level)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all text-center select-none ${
                        isSelected
                          ? `bg-white/10 ${item.color} shadow-lg scale-105`
                          : 'bg-slate-800/50 border-white/5 text-slate-400 hover:border-white/15'
                      }`}
                    >
                      <span className="text-2xl mb-1">{item.icon}</span>
                      <span className="text-[10px] font-bold tracking-tight text-white">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Level Description */}
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-white/5 text-center text-xs text-slate-300">
                {levels[selectedLevel]?.desc}
              </div>

              {/* Optional 1-line note */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Optional note: Anything that drained you today?
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. 2hr traffic jam, noisy lab..."
                  className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Skip for today
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(selectedLevel)}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save & Water Garden'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Done State */
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Saved. Rest well tonight.</h4>
              <p className="text-xs text-emerald-300">+15 XP awarded to your garden 🌱</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
