import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sprout, Droplets, Sun, Sparkles, Moon, Award } from 'lucide-react';
import { recordGardenAction } from '../api';

/**
 * ForgivingGarden Component (FEAT-E2)
 *
 * Streak gamification that NEVER wilts:
 * - Growth stages based on accumulated XP (Seed -> Grove)
 * - Labeled as "Days Tended" (never "Current Streak")
 * - If user is away, it enters gentle hibernation (never dies or resets to zero)
 * - Returning users greeted with "Welcome back, we saved your spot"
 * - Rest and micro-steps water the garden
 */
export default function ForgivingGarden({
  garden,
  userId,
  onGardenUpdate,
  className = '',
}) {
  const [isWatering, setIsWatering] = useState(false);

  const stage = garden?.current_stage || 'seed';
  const stageLabel = garden?.stage_label || 'Tiny Seed';
  const stageEmoji = garden?.stage_emoji || '🌱';
  const totalXp = garden?.total_xp || 0;
  const daysTended = garden?.days_tended || 0;
  const waterCount = garden?.water_count || 0;
  const isHibernating = garden?.is_hibernating || false;
  const welcomeBack = garden?.welcome_back_message || '';

  // Stages array for progress tracking
  const stages = [
    { name: 'Seed', minXp: 0, nextXp: 30, emoji: '🌱' },
    { name: 'Sprout', minXp: 30, nextXp: 100, emoji: '🌿' },
    { name: 'Sapling', minXp: 100, nextXp: 250, emoji: '🪴' },
    { name: 'Budding', minXp: 250, nextXp: 500, emoji: '🌺' },
    { name: 'Blooming', minXp: 500, nextXp: 1000, emoji: '🌸' },
    { name: 'Tree', minXp: 1000, nextXp: 2500, emoji: '🌳' },
    { name: 'Grove', minXp: 2500, nextXp: 5000, emoji: '🌲' },
  ];

  const currentStageInfo = stages.find((s) => s.name.toLowerCase() === stage.toLowerCase()) || stages[0];
  const nextStageXp = currentStageInfo.nextXp;
  const progressPercent = Math.min(
    100,
    Math.max(5, ((totalXp - currentStageInfo.minXp) / (nextStageXp - currentStageInfo.minXp)) * 100)
  );

  const handleWater = async () => {
    setIsWatering(true);
    try {
      const res = await recordGardenAction(userId, 'rest');
      if (res && res.garden && onGardenUpdate) {
        onGardenUpdate(res.garden);
      }
    } catch (err) {
      console.error('Failed to water garden:', err);
    } finally {
      setTimeout(() => setIsWatering(false), 800);
    }
  };

  return (
    <div
      className={`relative bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950/90 border border-emerald-500/20 rounded-2xl p-5 backdrop-blur-xl shadow-xl overflow-hidden ${className}`}
    >
      {/* Background glow */}
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Welcome back / hibernation banner */}
      {welcomeBack && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{welcomeBack}</span>
        </div>
      )}

      {isHibernating && !welcomeBack && (
        <div className="mb-4 p-3 rounded-xl bg-slate-800/80 border border-white/10 text-xs text-slate-300 flex items-center gap-2">
          <Moon className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span>Resting in gentle hibernation. Your progress is completely safe.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">The Forgiving Garden</h3>
            <span className="text-[11px] text-emerald-400 font-medium">
              Streak that never wilts
            </span>
          </div>
        </div>

        {/* Days Tended Pill (Zero-shame label) */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <Award className="w-3.5 h-3.5" />
          <span>{daysTended} Days Tended</span>
        </div>
      </div>

      {/* Plant Visual Centerpiece */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-4">
          {/* Animated Plant SVG Display */}
          <motion.div
            animate={isWatering ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.6 }}
            className="w-20 h-20 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-4xl shadow-inner relative group select-none"
          >
            <span>{stageEmoji}</span>
            {isWatering && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -top-2 text-sky-400"
              >
                <Droplets className="w-4 h-4 animate-bounce" />
              </motion.div>
            )}
          </motion.div>

          {/* Stage Details */}
          <div>
            <div className="text-lg font-bold text-white">{stageLabel}</div>
            <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                {totalXp} XP
              </span>
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-sky-400" />
                {waterCount} waters
              </span>
            </div>
          </div>
        </div>

        {/* Water / Tend Action Button */}
        <button
          onClick={handleWater}
          disabled={isWatering}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 transition-all shadow-sm active:scale-95"
          title="Take a restful breath and tend the plant"
        >
          <Droplets className={`w-3.5 h-3.5 ${isWatering ? 'animate-spin text-sky-300' : 'text-sky-400'}`} />
          <span>{isWatering ? 'Watering...' : 'Water Garden'}</span>
        </button>
      </div>

      {/* Progress Bar to Next Growth Stage */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span>Growth to next stage</span>
          <span className="font-mono text-emerald-300">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
